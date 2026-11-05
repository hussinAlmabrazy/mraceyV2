import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * إنشاء عميل Prisma حسب بيئة التشغيل:
 *
 * 1) الإنتاج السحابي (Vercel + Turso):
 *    عند ضبط TURSO_DATABASE_URL (libsql://...) يتم الاتصال عبر محول libSQL
 *    الرسمي من Prisma — قاعدة بيانات دائمة لا تُمسح مع كل نشر.
 *
 * 2) التطوير المحلي:
 *    الاتصال المباشر بملف SQLite عبر DATABASE_URL كما في السابق.
 *
 * نستخدم require() داخل الفرع الشرطي حتى لا تُحمَّل مكتبة libSQL
 * (برابطاتها الأصلية) إلا في وضع السحابة فقط.
 */
function createPrismaClient(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL

  if (tursoUrl && tursoUrl.trim() !== '') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require('@prisma/adapter-libsql') as typeof import('@prisma/adapter-libsql')

    // Prisma 6.19: المحول مصنع يستقبل إعدادات libsql مباشرة (وليس نسخة عميل)
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })

    return new PrismaClient({ adapter, log: ['error', 'warn'] })
  }

  // الوضع المحلي: ملف SQLite مباشر
  return new PrismaClient({ log: ['error', 'warn'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db