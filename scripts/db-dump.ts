// ============================================================
// تفريغ قاعدة SQLite إلى ملف SQL (مخطط + بيانات)
// يستخدم مع Turso: turso db shell <db> < db/dump.sql
// أو كنسخة احتياطية دورية: bun scripts/db-dump.ts
// ============================================================
import { createClient } from '@libsql/client'

const DB_URL = process.env.DUMP_SOURCE || 'file:/home/z/my-project/db/custom.db'
const OUT = process.env.DUMP_TARGET || '/home/z/my-project/db/dump.sql'

const client = createClient({ url: DB_URL })

/** تهريب قيم SQL */
function sqlVal(v: unknown): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'number') return String(v)
  if (typeof v === 'bigint') return String(v)
  if (typeof v === 'boolean') return v ? '1' : '0'
  if (v instanceof Uint8Array || v instanceof ArrayBuffer) {
    const bytes = v instanceof Uint8Array ? v : new Uint8Array(v)
    return "X'" + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('') + "'"
  }
  if (v instanceof Date) return `'${v.toISOString()}'`
  // نص: تهريب علامة الاقتباس المفردة
  return `'${String(v).replace(/'/g, "''")}'`
}

async function main() {
  const lines: string[] = [
    '-- تفريغ قاعدة بيانات منصة مراسي (مخطط + بيانات)',
    '-- المصدر: db/custom.db — يُولّد عبر: bun scripts/db-dump.ts',
    'PRAGMA foreign_keys=OFF;',
    'BEGIN TRANSACTION;',
    '',
  ]

  // 1) الجداول والفهارس من sqlite_master
  const schemaRows = (await client.execute(
    "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name"
  )).rows

  const createStmts: string[] = []
  for (const r of schemaRows) {
    const sql = String(r.sql).trim().replace(/;$/, '')
    createStmts.push(sql + ';')
  }

  // 2) البيانات لكل جدول
  const tableNames = schemaRows
    .map((r) => String(r.name))
    .filter((n) => createStmts.some((s) => s.startsWith(`CREATE TABLE "${n}"`)))
    // ترتيب آمن: الجداول المرجعية أولاً ليسهل الاستيراد في أنظمة تفرض FK
    .sort()

  const dataStmts: string[] = []
  const counts: Record<string, number> = {}

  for (const t of tableNames) {
    const cols = (await client.execute(`PRAGMA table_info("${t}")`)).rows.map((r) => String(r.name))
    const rows = (await client.execute(`SELECT * FROM "${t}"`)).rows
    counts[t] = rows.length
    for (const row of rows) {
      const vals = cols.map((c) => sqlVal((row as Record<string, unknown>)[c]))
      dataStmts.push(`INSERT INTO "${t}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});`)
    }
  }

  lines.push(...createStmts, '', ...dataStmts, '', 'COMMIT;', '')

  await Bun.write(OUT, lines.join('\n'))

  const totalRows = Object.values(counts).reduce((a, b) => a + b, 0)
  console.log(`✅ تم التفريغ إلى ${OUT}`)
  console.log(`الجداول: ${tableNames.length} | إجمالي الصفوف: ${totalRows}`)
  for (const [t, c] of Object.entries(counts)) console.log(`  - ${t}: ${c}`)
}

main().catch((e) => {
  console.error('❌ فشل التفريغ:', e)
  process.exit(1)
})
