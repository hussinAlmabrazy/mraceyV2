// ============================================================
// الإعداد الأولي / استعادة قاعدة البيانات من نسخة dump.sql
// منطق نقي (بلا Next.js) — يُستخدم من Server Actions ومن
// سكربتات الاختبار على حد سواء.
//
// المساران:
// 1) استعادة كاملة من dump.sql (مخطط + بيانات) — /setup
// 2) مخطط فقط من SCHEMA_SQL ثم إنشاء مدير أول — /setup
// ============================================================
import { createClient, type Client } from "@libsql/client";
import { SCHEMA_SQL } from "@/lib/schema-sql";

/** ترتيب إدراج آمن للتبعيات (المرجعية أولاً) — الجداول غير المذكورة تُلحق بالنهاية */
const TABLE_ORDER = [
  "Plan", "Office", "HSCode", "User", "Customer",
  "ServiceCategory", "Service", "ServiceRequiredDocument", "ServiceStage", "FormField",
  "License", "Request", "RequestDocument", "RequestStatusHistory", "Comment", "Task",
  "Shipment", "ShipmentItem", "RegulatoryStep", "ChecklistItem",
  "CostItem", "Payment", "Invoice", "ExchangeRate",
  "NotificationTemplate", "Notification", "MessageLog",
  "AuditLog", "PasswordReset", "PlatformSetting",
];

/**
 * تقسيم نص SQL إلى عبارات منفصلة — ماسح حرفي دقيق يتتبع حالة
 * الاقتباس المفرد (مع تهريب '' المضاعف) حتى لا تنكسر القيم متعددة
 * الأسطر (قوالب الإشعارات مثلاً) ولا تُقسم العبارات على «;» داخل نصوص.
 */
export function parseDumpSql(text: string): string[] {
  // أسطر التعليقات الكاملة تُزال أولاً (تعليقات سطرية في صيغتنا)
  const cleaned = text
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n");

  const raw: string[] = [];
  let buf = "";
  let inStr = false;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    buf += ch;
    if (ch === "'") {
      if (inStr && cleaned[i + 1] === "'") {
        buf += cleaned[i + 1]; // تهريب '' — تبقى داخل النص
        i++;
        continue;
      }
      inStr = !inStr;
    } else if (ch === ";" && !inStr) {
      const stmt = buf.trim();
      if (stmt && stmt !== ";") raw.push(stmt);
      buf = "";
    }
  }
  if (buf.trim() && buf.trim() !== ";") raw.push(buf.trim());

  // استبعاد عبارات التحكم بالمعاملة/PRAGMA — لا معنى لها عبر HTTP دفعات
  return raw
    .map((s) => s.replace(/;+\s*$/, "").trim())
    .filter((s) => {
      if (!s) return false;
      if (/^PRAGMA\b/i.test(s)) return false;
      if (/^BEGIN(\s+TRANSACTION)?$/i.test(s)) return false;
      if (/^COMMIT$/i.test(s)) return false;
      return true;
    })
    .map((s) => s + ";");
}

/** أسماء الجداول من عبارات CREATE TABLE (بالأقواس أو بدونها) */
export function extractTables(statements: string[]): string[] {
  const names: string[] = [];
  for (const s of statements) {
    const m = s.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z_][\w]*)"?\s*\(/i);
    if (m && !names.includes(m[1])) names.push(m[1]);
  }
  return names;
}

/** ترتيب الجداول: TABLE_ORDER أولاً (تبعيات آمنة) ثم البقية بترتيبها */
function orderTables(names: string[]): string[] {
  const set = new Set(names);
  const ordered = TABLE_ORDER.filter((t) => set.has(t));
  for (const n of names) if (!ordered.includes(n)) ordered.push(n);
  return ordered;
}

/** حلّ اتصال SQL الخام: Turso السحابية أو الملف المحلي — null إن لا شيء مضبوط */
export function resolveSqlUrl(): { url: string; authToken?: string } | null {
  const turso = process.env.TURSO_DATABASE_URL?.trim();
  if (turso) return { url: turso, authToken: process.env.TURSO_AUTH_TOKEN };
  const local = process.env.DATABASE_URL?.trim();
  if (local) return { url: local };
  return null;
}

export type SetupMode = "wizard" | "done" | "dbdown";

/** إغلاق اتصال libsql بأمان — close() قد يعيد void أو Promise حسب النسخة */
function safeClose(client: Client): void {
  try {
    const res = client.close() as unknown;
    if (res && typeof (res as Promise<void>).catch === "function") {
      (res as Promise<void>).catch(() => {});
    }
  } catch {
    /* الإغلاق أفضل-جهد */
  }
}

/**
 * حالة المنصة بالنسبة للإعداد الأولي:
 *  wizard — لا مستخدمين بعد (قاعدة فارغة أو بلا مخطط) → عرض المعالج
 *  done   — يوجد مستخدمون → المنصة مهيأة (لا مكان للمعالج)
 *  dbdown — لا اتصال بقاعدة إطلاقاً (متغيرات البيئة ناقصة) → بطاقة إرشاد
 */
export async function getSetupMode(): Promise<SetupMode> {
  const conn = resolveSqlUrl();
  if (!conn) return "dbdown";
  let client: Client | null = null;
  try {
    client = createClient({ url: conn.url, authToken: conn.authToken });
    const r = await client.execute(
      "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='User'"
    );
    if (Number(r.rows[0]?.n ?? 0) === 0) return "wizard";
    const u = await client.execute('SELECT COUNT(*) AS n FROM "User"');
    return Number(u.rows[0]?.n ?? 0) > 0 ? "done" : "wizard";
  } catch {
    return "dbdown";
  } finally {
    if (client) safeClose(client);
  }
}

/** إنشاء المخطط (جداول + فهارس) إن لم يكن موجوداً — لخيار «بدء منصة فارغة» */
export async function ensureSchema(client: Client): Promise<boolean> {
  const r = await client.execute(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='User'"
  );
  if (Number(r.rows[0]?.n ?? 0) > 0) return false;
  for (const stmt of parseDumpSql(SCHEMA_SQL)) {
    await client.execute(stmt);
  }
  return true;
}

/**
 * تنفيذ نسخة dump.sql كاملة على اتصال قاعدة — قابلة للتكرار بأمان:
 * كل محاولة تبدأ نظيفة (DROP للجداول الموجودة في النسخة ثم إعادة الإنشاء).
 * الترتيب: CREATE (جداول/فهارس) ثم INSERTs بترتيب تبعي آمن.
 */
export async function executeDumpAgainst(
  url: string,
  authToken: string | undefined,
  text: string
): Promise<{ tables: number; statements: number }> {
  const statements = parseDumpSql(text);
  if (statements.length === 0) throw new Error("EMPTY_DUMP");
  if (!statements.some((s) => /^CREATE\s+TABLE\b/i.test(s))) {
    throw new Error("NOT_A_DUMP");
  }

  const client = createClient({ url, authToken });
  try {
    const tables = extractTables(statements);

    // تنظيف أي بقايا محاولة سابقة (فاشلة أو جزئية) — الاستعادة تعيد نفس النتيجة دائماً
    for (const t of [...orderTables(tables)].reverse()) {
      await client.execute(`DROP TABLE IF EXISTS "${t}"`);
    }

    // التقسيم: إنشاءات أولاً، ثم إدراجات مجمعة حسب الجدول
    const creates = statements.filter((s) => /^CREATE\s+/i.test(s));
    const insertsByTable = new Map<string, string[]>();
    const others: string[] = [];
    for (const s of statements) {
      if (/^CREATE\s+/i.test(s)) continue;
      const m = s.match(/^INSERT\s+INTO\s+"?([A-Za-z_][\w]*)"?\b/i);
      if (m) {
        if (!insertsByTable.has(m[1])) insertsByTable.set(m[1], []);
        insertsByTable.get(m[1])!.push(s);
      } else {
        others.push(s);
      }
    }

    const ordered: string[] = [...creates];
    for (const t of orderTables([...insertsByTable.keys()])) {
      ordered.push(...insertsByTable.get(t)!);
    }
    ordered.push(...others);

    // التنفيذ على دفعات — كل دفعة معاملة واحدة (ذرّية)
    const CHUNK = 80;
    for (let i = 0; i < ordered.length; i += CHUNK) {
      await client.batch(
        ordered.slice(i, i + CHUNK).map((sql) => ({ sql, args: [] })),
        "write"
      );
    }

    return { tables: tables.length, statements: ordered.length };
  } finally {
    safeClose(client);
  }
}
