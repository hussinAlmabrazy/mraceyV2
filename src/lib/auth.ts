// ============ نظام المصادقة والجلسات (JWT) ============
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "marsaa-fixed-dev-secret-2026");
const SESSION_DAYS = 7;

/** خطأ انتهاء/غياب الجلسة — برسالة عربية واضحة بدل الرمز الخام */
export class SessionError extends Error {
  constructor(message = "انتهت صلاحية الجلسة — يرجى تسجيل الخروج ثم الدخول مجدداً") {
    super(message);
    this.name = "SessionError";
  }
}

export type UserSession = {
  sub: string;
  type: "USER";
  role: string;
  officeId: string | null;
  name: string;
  impersonated?: boolean;
};

export type CustomerSession = {
  sub: string;
  type: "CUSTOMER";
  officeId: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signSession(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret);
}

async function readToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** سمات كوكي الجلسة — تتكيف مع سياق الطلب:
 *  عبر HTTPS (نطاق المعاينة/الإنتاج): SameSite=None + Secure + Partitioned حتى تُرفق الجلسة
 *  مع طلبات Server Actions في كل السياقات (تبويب مباشر أو عرض مضمّن iframe) — كوكي Lax
 *  لا يُرفق مع تلك الطلبات في السياقات العابرة للمواقع، وهذا كان سبب فشل النماذج
 *  مع "UNAUTHORIZED" بينما الصفحات تُحمّل سليمة.
 *  ملاحظة: x-forwarded-proto يصل "http" دائماً من بوابة التوجيه، لذا نكتشف HTTPS من Origin.
 *  محلياً عبر http نُبقي Lax القياسي.
 */
async function sessionCookieOptions() {
  const h = await headers();
  const origin = (h.get("origin") || h.get("referer") || "").trim();
  if (origin.startsWith("https://")) {
    return {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      partitioned: true,
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      path: "/",
    };
  }
  return {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  };
}

// ---------- جلسات الموظفين ومدير النظام ----------
export async function setUserSession(session: UserSession): Promise<void> {
  const token = await signSession({ ...session });
  const jar = await cookies();
  jar.set("plat_session", token, await sessionCookieOptions());
}

export async function getUserSession(): Promise<UserSession | null> {
  const jar = await cookies();
  const token = jar.get("plat_session")?.value;
  if (!token) return null;
  const payload = await readToken(token);
  if (!payload || payload.type !== "USER") return null;
  return {
    sub: payload.sub as string,
    type: "USER",
    role: payload.role as string,
    officeId: payload.officeId as string | null,
    name: payload.name as string,
    impersonated: payload.impersonated as boolean | undefined,
  };
}

export async function clearUserSession(): Promise<void> {
  const jar = await cookies();
  // الحذف يجب أن يحمل نفس سمات الإنشاء (Secure/SameSite=None/Partitioned عبر HTTPS)
  // — jar.delete() يرسل Set-Cookie مجرداً من السمات فلا يمسّ الكوكي المقسّم (CHIPS)
  // ويبقى المستخدم مسجلاً للدخول رغم "نجاح" الخروج
  const opts = await sessionCookieOptions();
  jar.set("plat_session", "", { ...opts, maxAge: 0, expires: new Date(0) });
}

// ---------- جلسات العملاء ----------
export async function setCustomerSession(session: CustomerSession): Promise<void> {
  const token = await signSession({ ...session });
  const jar = await cookies();
  jar.set("client_session", token, await sessionCookieOptions());
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const jar = await cookies();
  const token = jar.get("client_session")?.value;
  if (!token) return null;
  const payload = await readToken(token);
  if (!payload || payload.type !== "CUSTOMER") return null;
  return {
    sub: payload.sub as string,
    type: "CUSTOMER",
    officeId: payload.officeId as string,
    name: payload.name as string,
  };
}

export async function clearCustomerSession(): Promise<void> {
  const jar = await cookies();
  // نفس قاعدة الحذف أعلاه — نفس السمات التي أُنشئ بها الكوكي
  const opts = await sessionCookieOptions();
  jar.set("client_session", "", { ...opts, maxAge: 0, expires: new Date(0) });
}

// ---------- حراس الوصول ----------
/** تشخيص موحّد: يميز بين «الكوكي لم يُرسل من المتصفح» و«الرمز موجود لكن التحقق فشل» */
function logAuthFailure(guard: string, cookieName: string, hasCookie: boolean) {
  console.warn(
    `[auth] ${guard}: ${
      hasCookie
        ? "token present but FAILED verification (secret mismatch or corrupt)"
        : "cookie NOT sent by browser (SameSite/cross-site context?)"
    } [cookie=${cookieName}]`
  );
}

export async function requireSuperAdmin(): Promise<UserSession> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get("plat_session")?.value);
  const session = await getUserSession();
  if (!session) {
    logAuthFailure("requireSuperAdmin", "plat_session", hasCookie);
    throw new SessionError();
  }
  if (session.role !== "SUPER_ADMIN") {
    console.warn(`[auth] requireSuperAdmin: role=${session.role} is not SUPER_ADMIN`);
    throw new SessionError("هذه العملية تتطلب صلاحية مدير المنصة — سجّل الدخول بحساب المدير");
  }
  return session;
}

/** جلسة موظف مكتب (أي دور داخل المكتب) مع عزل المستأجر */
export async function requireOfficeUser(): Promise<{ session: UserSession; officeId: string }> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get("plat_session")?.value);
  const session = await getUserSession();
  if (!session) {
    logAuthFailure("requireOfficeUser", "plat_session", hasCookie);
    throw new SessionError();
  }
  if (!session.officeId || session.role === "SUPER_ADMIN") {
    throw new SessionError("هذه العملية مخصصة لموظفي المكتب — استخدم حساب مكتبك");
  }
  // التحقق من أن المكتب نشط
  const office = await db.office.findUnique({ where: { id: session.officeId }, select: { status: true } });
  if (!office || office.status === "SUSPENDED" || office.status === "ARCHIVED") {
    throw new Error("OFFICE_SUSPENDED");
  }
  return { session, officeId: session.officeId };
}

export async function requireCustomer(officeSlug?: string): Promise<{ session: CustomerSession; officeId: string }> {
  const jar = await cookies();
  const hasCookie = Boolean(jar.get("client_session")?.value);
  const session = await getCustomerSession();
  if (!session) {
    logAuthFailure("requireCustomer", "client_session", hasCookie);
    throw new SessionError("انتهت جلسة العميل — يرجى تسجيل الدخول مجدداً");
  }
  if (officeSlug) {
    const office = await db.office.findUnique({ where: { slug: officeSlug }, select: { id: true } });
    if (!office || office.id !== session.officeId) throw new SessionError("انتهت جلسة العميل — يرجى تسجيل الدخول مجدداً");
  }
  return { session, officeId: session.officeId };
}
