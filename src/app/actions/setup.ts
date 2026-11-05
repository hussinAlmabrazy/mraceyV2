"use server";

// ============================================================
// Server Actions للإعداد الأولي — /setup
// تعمل فقط عندما لا يوجد أي مستخدم في المنصة (حماية مزدوجة
// داخل كل أكشن) — بعد أول مدير تصبح معطلة نهائياً.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@libsql/client";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  executeDumpAgainst,
  ensureSchema,
  resolveSqlUrl,
  getSetupMode,
} from "@/lib/setup-restore";

function safeClose(client: ReturnType<typeof createClient>): void {
  try {
    const res = client.close() as unknown;
    if (res && typeof (res as Promise<void>).catch === "function") {
      (res as Promise<void>).catch(() => {});
    }
  } catch {
    /* أفضل-جهد */
  }
}

export type SetupState = { error?: string } | undefined;

const DB_DOWN_MSG =
  "لا يمكن الاتصال بقاعدة البيانات — تأكد من إضافة TURSO_DATABASE_URL و TURSO_AUTH_TOKEN في Vercel → Settings → Environment Variables ثم أعد النشر (Redeploy)";

/** استعادة كاملة من ملف dump.sql (مخطط + كل البيانات) */
export async function restoreFromDump(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  // حارس 1: المنصة يجب أن تكون بلا مستخدمين
  let mode: Awaited<ReturnType<typeof getSetupMode>>;
  try {
    mode = await getSetupMode();
  } catch {
    return { error: DB_DOWN_MSG };
  }
  if (mode === "dbdown") return { error: DB_DOWN_MSG };
  if (mode === "done") return { error: "المنصة مهيأة مسبقاً — لا يمكن تكرار الإعداد الأولي" };

  const file = formData.get("dump");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "يرجى اختيار ملف النسخة الاحتياطية dump.sql أولاً" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "حجم الملف كبير جداً — الحد الأقصى 5MB" };
  }

  const text = await file.text();
  if (!text.includes("CREATE TABLE")) {
    return {
      error:
        "الملف المختار لا يبدو نسخة احتياطية صحيحة — تأكد أنه الملف dump.sql الموجود داخل مجلد db في حزمة النشر",
    };
  }

  const conn = resolveSqlUrl();
  if (!conn) return { error: DB_DOWN_MSG };

  let result: { tables: number; statements: number };
  try {
    result = await executeDumpAgainst(conn.url, conn.authToken, text);
  } catch (e) {
    console.error("[setup] فشل تنفيذ النسخة الاحتياطية:", e);
    return {
      error:
        "فشل تنفيذ النسخة الاحتياطية — المحاولة تبدأ من حالة نظيفة تلقائياً، جرّب مرة أخرى وتأكد من ضبط متغيرات قاعدة البيانات في Vercel",
    };
  }

  // تحقق نهائي: يوجد مستخدمون فعلاً بعد الاستعادة
  try {
    const client = createClient({ url: conn.url, authToken: conn.authToken });
    const u = await client.execute('SELECT COUNT(*) AS n FROM "User"');
    safeClose(client);
    if (Number(u.rows[0]?.n ?? 0) === 0) {
      return { error: "تم تنفيذ الملف لكن لم يُستعد أي حساب — تأكد من رفع dump.sql الصحيح" };
    }
  } catch {
    return { error: "تمت الاستعادة لكن تعذر التحقق النهائي — جرّب تسجيل الدخول مباشرة" };
  }

  // سجل تدقيق (غير حرج — لا يفشل الإعداد إن تعذر)
  try {
    await db.auditLog.create({
      data: {
        actorType: "SYSTEM",
        actorName: "معالج الإعداد الأولي",
        action: "SETUP_RESTORE",
        entityType: "Platform",
        details: JSON.stringify({
          tables: result.tables,
          statements: result.statements,
          fileName: file.name,
        }),
      },
    });
  } catch {
    /* السجل أفضل-جهد */
  }

  redirect("/admin/login?setup=done");
}

/** بدء منصة فارغة: إنشاء المخطط + حساب مدير النظام الأول */
export async function createFirstAdmin(
  _prev: SetupState,
  formData: FormData
): Promise<SetupState> {
  // حارس 1: نفس شروط الاستعادة
  let mode: Awaited<ReturnType<typeof getSetupMode>>;
  try {
    mode = await getSetupMode();
  } catch {
    return { error: DB_DOWN_MSG };
  }
  if (mode === "dbdown") return { error: DB_DOWN_MSG };
  if (mode === "done") return { error: "المنصة مهيأة مسبقاً — لا يمكن تكرار الإعداد الأولي" };

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (!name || name.length < 2) return { error: "يرجى إدخال الاسم الكامل" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "البريد الإلكتروني غير صالح" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  if (password !== confirm) return { error: "كلمتا المرور غير متطابقتين" };

  // إنشاء المخطط إن لم يوجد (قاعدة سحابية فارغة تماماً)
  const conn = resolveSqlUrl();
  if (!conn) return { error: DB_DOWN_MSG };
  try {
    const client = createClient({ url: conn.url, authToken: conn.authToken });
    await ensureSchema(client);
    safeClose(client);
  } catch (e) {
    console.error("[setup] فشل إنشاء المخطط:", e);
    return { error: DB_DOWN_MSG };
  }

  try {
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return { error: "هذا البريد مستخدم مسبقاً" };

    await db.user.create({
      data: {
        name,
        email,
        role: "SUPER_ADMIN",
        passwordHash: await hashPassword(password),
        isActive: true,
      },
    });
    await db.auditLog.create({
      data: {
        actorType: "SUPER_ADMIN",
        actorName: name,
        action: "SETUP_ADMIN",
        entityType: "Platform",
        details: JSON.stringify({ email }),
      },
    });
  } catch (e) {
    console.error("[setup] فشل إنشاء المدير الأول:", e);
    return { error: "تعذر إنشاء الحساب — تحقق من اتصال قاعدة البيانات ثم جرّب مجدداً" };
  }

  redirect("/admin/login?setup=done");
}
