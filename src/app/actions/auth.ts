"use server";

import { redirect } from "next/navigation";
import { createHash, randomInt } from "crypto";
import { db } from "@/lib/db";
import { setUserSession, clearUserSession, verifyPassword, setCustomerSession, clearCustomerSession, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sanitizeWaPhone, waMeUrl } from "@/lib/wa-link";
import { DEFAULT_TEMPLATES } from "@/lib/seed-data";

export type LoginState = { error?: string } | undefined;

/** دخول موظفي المكاتب ومدير النظام (بريد واحد فريد عالمياً) */
export async function loginStaff(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" };

  const user = await db.user.findUnique({ where: { email }, include: { office: { select: { id: true, name: true, status: true, slug: true } } } });
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "بيانات الدخول غير صحيحة" };
  }
  if (!user.isActive) return { error: "الحساب معطّل — تواصل مع مدير مكتبك" };

  if (user.role === "SUPER_ADMIN") {
    await setUserSession({ sub: user.id, type: "USER", role: "SUPER_ADMIN", officeId: null, name: user.name });
    await audit({ actorType: "SUPER_ADMIN", actorId: user.id, actorName: user.name }, "LOGIN", "USER", user.id);
    redirect("/admin");
  }

  const office = user.office;
  if (!office) return { error: "لا يوجد مكتب مرتبط بالحساب" };
  if (office.status === "SUSPENDED") return { error: "ترخيص المكتب موقوف حالياً — تواصل مع إدارة المنصة" };
  if (office.status === "ARCHIVED" || office.status === "PENDING") return { error: "المكتب غير مفعّل بعد — فعّل الحساب بالمفتاح أولاً" };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await setUserSession({ sub: user.id, type: "USER", role: user.role, officeId: office.id, name: user.name });
  await audit({ actorType: "STAFF", actorId: user.id, actorName: user.name }, "LOGIN", "USER", user.id, office.id);
  redirect("/office");
}

export async function logoutStaff(): Promise<void> {
  const session = await getUserSessionSafe();
  if (session) {
    await audit(
      { actorType: session.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STAFF", actorId: session.sub, actorName: session.name },
      "LOGOUT", "USER", session.sub, session.officeId
    );
  }
  await clearUserSession();
  redirect("/");
}

async function getUserSessionSafe() {
  try {
    const { getUserSession } = await import("@/lib/auth");
    return await getUserSession();
  } catch {
    return null;
  }
}

/** تفعيل حساب المكتب بالمفتاح وإنشاء كلمة مرور المدير */
export async function activateOffice(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const key = String(formData.get("key") || "").trim().toUpperCase();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  if (!key || !email || !name || !password) return { error: "يرجى تعبئة جميع الحقول" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const license = await db.license.findUnique({ where: { key }, include: { office: true } });
  if (!license) return { error: "مفتاح التفعيل غير صحيح" };
  if (license.status === "REVOKED") return { error: "هذا المفتاح ملغى — تواصل مع إدارة المنصة" };
  if (license.status === "ACTIVE" && license.activatedAt) return { error: "هذا المفتاح مستخدم بالفعل" };

  const existingEmail = await db.user.findUnique({ where: { email } });
  if (existingEmail) return { error: "البريد الإلكتروني مستخدم مسبقاً" };

  const now = new Date();
  const endDate = new Date(now.getTime() + license.durationDays * 86400000);
  await db.$transaction(async (tx) => {
    const office = await tx.office.update({
      where: { id: license.officeId },
      data: { status: "ACTIVE", managerName: name, email },
    });
    await tx.license.update({
      where: { id: license.id },
      data: { status: "ACTIVE", startDate: now, endDate, activatedAt: now },
    });
    await tx.user.create({
      data: { officeId: office.id, email, name, role: "OFFICE_ADMIN", passwordHash: await hashPassword(password), isActive: true },
    });
    // قوالب الإشعارات الافتراضية للمكتب
    for (const t of DEFAULT_TEMPLATES) {
      const exists = await tx.notificationTemplate.findFirst({ where: { officeId: office.id, event: t.event, channel: t.channel } });
      if (!exists) {
        await tx.notificationTemplate.create({ data: { officeId: office.id, event: t.event, channel: t.channel, subject: t.subject, body: t.body } });
      }
    }
    // أسعار صرف افتراضية
    for (const cur of ["USD", "SAR"]) {
      await tx.exchangeRate.upsert({
        where: { officeId_currency: { officeId: office.id, currency: cur } },
        update: {},
        create: { officeId: office.id, currency: cur, rate: cur === "USD" ? 1590 : 424 },
      });
    }
    await tx.auditLog.create({
      data: { officeId: office.id, actorType: "STAFF", actorName: name, action: "LICENSE", entityType: "Office", entityId: office.id, details: JSON.stringify({ key, activated: true }) },
    });
  });

  // دخول مباشر بعد التفعيل
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    await setUserSession({ sub: user.id, type: "USER", role: "OFFICE_ADMIN", officeId: license.officeId, name });
    redirect("/office");
  }
  return { error: "حدث خطأ غير متوقع" };
}

/** تسجيل عميل جديد لدى مكتب محدد */
export async function registerCustomer(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "").trim();
  const customerType = String(formData.get("customerType") || "INDIVIDUAL");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim();
  const password = String(formData.get("password") || "");
  const address = String(formData.get("address") || "").trim();
  const taxNumber = String(formData.get("taxNumber") || "").trim();
  const crNumber = String(formData.get("crNumber") || "").trim();

  if (!name || !phone || !password) return { error: "الاسم ورقم الجوال وكلمة المرور حقول إلزامية" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };

  const office = await db.office.findUnique({ where: { slug } });
  if (!office || office.status !== "ACTIVE") return { error: "المكتب غير متاح للتسجيل حالياً" };

  const duplicate = await db.customer.findFirst({
    where: { officeId: office.id, OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (duplicate) return { error: "يوجد حساب بهذا الجوال أو البريد لدى هذا المكتب — سجّل الدخول" };

  const customer = await db.customer.create({
    data: {
      officeId: office.id, name, customerType, email: email || null, phone, whatsapp: whatsapp || phone,
      address: address || null, taxNumber: taxNumber || null, crNumber: crNumber || null,
      passwordHash: await hashPassword(password),
    },
  });
  await audit({ actorType: "CUSTOMER", actorId: customer.id, actorName: name }, "CREATE", "Customer", customer.id, office.id, { registered: true });
  await setCustomerSession({ sub: customer.id, type: "CUSTOMER", officeId: office.id, name });
  redirect(`/o/${slug}/portal`);
}

/** دخول العميل (بريد أو جوال + كلمة مرور) داخل نطاق المكتب */
export async function loginCustomer(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const slug = String(formData.get("slug") || "");
  const identifier = String(formData.get("identifier") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!identifier || !password) return { error: "يرجى إدخال البريد/الجوال وكلمة المرور" };

  const office = await db.office.findUnique({ where: { slug } });
  if (!office) return { error: "المكتب غير موجود" };

  const customer = await db.customer.findFirst({
    where: { officeId: office.id, OR: [{ email: identifier }, { phone: identifier }] },
  });
  if (!customer || !customer.passwordHash || !(await verifyPassword(password, customer.passwordHash))) {
    return { error: "بيانات الدخول غير صحيحة" };
  }
  await db.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
  await audit({ actorType: "CUSTOMER", actorId: customer.id, actorName: customer.name }, "LOGIN", "Customer", customer.id, office.id);
  await setCustomerSession({ sub: customer.id, type: "CUSTOMER", officeId: office.id, name: customer.name });
  redirect(`/o/${slug}/portal`);
}

export async function logoutCustomer(): Promise<void> {
  await clearCustomerSession();
  redirect("/");
}

// ============================================================
// ============ استعادة كلمة المرور (رمز تحقق OTP) ============
// ============================================================

export type ResetState = {
  error?: string;
  ok?: boolean;
  message?: string;
  /** انتقال إلى الخطوة الثانية */
  resetId?: string;
  /** معلومات التسليم المقنّعة للعرض */
  maskedEmail?: string;
  maskedPhone?: string;
  waPhone?: string | null;
  /** الرمز نفسه — يُعاد للعرض المباشر فقط حين لا يكون مخفياً بالإعداد */
  devCode?: string;
  loginHref?: string;
} | undefined;

const RESET_CODE_MINUTES = 15; // صلاحية الرمز
const RESET_MAX_ATTEMPTS = 5; // محاولات التحقق لكل رمز
const RESET_RATE_LIMIT = 3; // طلبات جديدة لكل ربع ساعة لكل حساب

/** إخفاء عرض الرمز على الشاشة في الإنتاج: RESET_CODE_HIDDEN=true */
function isCodeHidden(): boolean {
  return process.env.RESET_CODE_HIDDEN === "true";
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const masked = name.length <= 2 ? name[0] + "***" : name.slice(0, 2) + "***" + name.slice(-1);
  return `${masked}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 5) return "***";
  return `***${digits.slice(-4)}`;
}

/**
 * الخطوة 1 — طلب رمز الاستعادة:
 * يولّد رمزاً سداسياً (100000-999999) يُخزَّن مُعمّى SHA-256 مع صلاحية 15 دقيقة.
 * التسليم (لا يوجد مزود بريد مربوط):
 *   1) عرض مباشر على الشاشة (وضع تجريبي/ذاتي الاستضافة — يمكن إخفاؤه بـ RESET_CODE_HIDDEN=true)
 *   2) لطلبات العملاء: إشعار داخلي لموظفي المكتب مع رابط wa.me جاهز لإرسال الرمز للعميل
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const accountType = String(formData.get("accountType") || "USER") === "CUSTOMER" ? "CUSTOMER" : "USER";
  const slug = String(formData.get("slug") || "").trim();
  const identifierRaw = String(formData.get("identifier") || "").trim();
  const identifier = identifierRaw.toLowerCase();
  if (!identifier) {
    return { error: accountType === "CUSTOMER" ? "يرجى إدخال البريد الإلكتروني أو رقم الجوال" : "يرجى إدخال البريد الإلكتروني" };
  }

  let account: {
    id: string; name: string; email: string | null; phone: string | null; whatsapp: string | null;
    officeId: string | null; role?: string; isActive?: boolean;
  };

  if (accountType === "USER") {
    const user = await db.user.findUnique({
      where: { email: identifier },
      select: { id: true, name: true, email: true, phone: true, isActive: true, role: true, officeId: true },
    });
    if (!user || !user.isActive) return { error: "لا يوجد حساب نشط مرتبط بهذا البريد الإلكتروني" };
    account = { ...user, whatsapp: null };
  } else {
    if (!slug) return { error: "المكتب غير موجود" };
    const office = await db.office.findUnique({ where: { slug }, select: { id: true } });
    if (!office) return { error: "المكتب غير موجود" };

    // مطابقة بالبريد أو الجوال (كما في تسجيل الدخول) مع مطابقة مرنة بالأرقام
    let customer = await db.customer.findFirst({
      where: { officeId: office.id, OR: [{ email: identifier }, { phone: identifierRaw }] },
      select: { id: true, name: true, email: true, phone: true, whatsapp: true, officeId: true },
    });
    if (!customer) {
      const digits = identifierRaw.replace(/\D/g, "");
      if (digits) {
        const candidates = await db.customer.findMany({
          where: { officeId: office.id, phone: { not: null } },
          select: { id: true, name: true, email: true, phone: true, whatsapp: true, officeId: true },
        });
        customer = candidates.find((c) => (c.phone || "").replace(/\D/g, "") === digits) || null;
      }
    }
    if (!customer) return { error: "لا يوجد حساب عميل بهذا البريد أو الجوال لدى هذا المكتب" };
    account = customer;
  }

  const officeId = account.officeId;

  // حصر معدل الطلبات (3 طلبات لكل ربع ساعة لكل حساب)
  const since = new Date(Date.now() - RESET_CODE_MINUTES * 60 * 1000);
  const recent = await db.passwordReset.count({
    where: { accountType, accountId: account.id, createdAt: { gte: since } },
  });
  if (recent >= RESET_RATE_LIMIT) {
    return { error: "تم تجاوز الحد المسموح من طلبات الاستعادة — انتظر 15 دقيقة ثم أعد المحاولة" };
  }

  // تنظيف السجلات الأقدم من 24 ساعة (أرشيف بلا فائدة تشغيلية)
  await db.passwordReset.deleteMany({
    where: { accountType, accountId: account.id, createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
  });

  // توليد الرمز وتخزينه مُعمّى
  const code = String(randomInt(100000, 1000000));
  const row = await db.passwordReset.create({
    data: {
      accountType,
      accountId: account.id,
      officeId,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + RESET_CODE_MINUTES * 60 * 1000),
    },
  });

  const maskedEmail = account.email ? maskEmail(account.email) : undefined;
  const maskedPhone = account.phone ? maskPhone(account.phone) : undefined;
  const waPhone = sanitizeWaPhone(account.whatsapp || account.phone);

  // --- قناة التسليم عبر واتساب (wa.me) لطلبات العملاء ---
  // إشعار داخلي لموظفي المكتب مع رابط جاهز لإرسال الرمز للعميل بنقرة واحدة
  if (accountType === "CUSTOMER" && officeId && waPhone) {
    const text = `مرحباً ${account.name}،\nرمز استعادة كلمة المرور الخاص بك في منصة مراسي هو: ${code}\nالرمز صالح لمدة 15 دقيقة. إن لم تطلبه فتجاهل هذه الرسالة.`;
    const waUrl = waMeUrl(waPhone, text);
    const staffUsers = await db.user.findMany({
      where: { officeId, isActive: true, role: { in: ["OFFICE_ADMIN", "STAFF"] } },
      select: { id: true },
    });
    if (staffUsers.length) {
      await db.notification.createMany({
        data: staffUsers.map((u) => ({
          officeId,
          recipientType: "STAFF",
          userId: u.id,
          title: "طلب استعادة كلمة مرور",
          body: `طلب العميل ${account.name}${maskedPhone ? ` (${maskedPhone})` : ""} استعادة كلمة المرور. أرسل له الرمز عبر واتساب من الزر أدناه — الرمز صالح 15 دقيقة.`,
          link: waUrl,
        })),
      });
    }
    await db.messageLog.create({
      data: {
        officeId,
        channel: "WHATSAPP",
        recipient: account.phone || account.email || "غير متوفر",
        subject: "رمز استعادة كلمة مرور",
        body: text,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }

  await audit(
    { actorType: accountType === "USER" ? "STAFF" : "CUSTOMER", actorId: account.id, actorName: account.name },
    "PASSWORD_RESET_REQUEST",
    accountType === "USER" ? "User" : "Customer",
    account.id,
    officeId,
    { via: identifierRaw, codeHidden: isCodeHidden() }
  );

  return {
    resetId: row.id,
    maskedEmail,
    maskedPhone,
    waPhone,
    devCode: isCodeHidden() ? undefined : code,
  };
}

/** الخطوة 2 — التحقق من الرمز وتعيين كلمة المرور الجديدة */
export async function completePasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const resetId = String(formData.get("resetId") || "").trim();
  const code = String(formData.get("code") || "").replace(/\D/g, "");
  const password = String(formData.get("password") || "");
  const passwordConfirm = String(formData.get("passwordConfirm") || "");

  if (!resetId) return { error: "انتهت صلاحية الطلب — ابدأ الاستعادة من جديد" };
  if (code.length !== 6) return { error: "يرجى إدخال رمز التحقق المكوّن من 6 أرقام" };
  if (password.length < 8) return { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  if (password !== passwordConfirm) return { error: "كلمتا المرور غير متطابقتين" };

  const row = await db.passwordReset.findUnique({ where: { id: resetId } });
  if (!row || row.usedAt) return { error: "انتهت صلاحية هذا الطلب — ابدأ عملية الاستعادة من جديد" };
  if (row.expiresAt < new Date()) return { error: "انتهت صلاحية الرمز (15 دقيقة) — اطلب رمزاً جديداً" };
  if (row.attempts >= RESET_MAX_ATTEMPTS) {
    return { error: "تم تجاوز حد محاولات التحقق (5) — اطلب رمزاً جديداً" };
  }

  if (hashCode(code) !== row.codeHash) {
    const attempts = row.attempts + 1;
    await db.passwordReset.update({ where: { id: row.id }, data: { attempts } });
    const remaining = Math.max(0, RESET_MAX_ATTEMPTS - attempts);
    if (remaining === 0) return { error: "الرمز غير صحيح وتم تجاوز حد المحاولات — اطلب رمزاً جديداً" };
    return { error: `الرمز غير صحيح — تبقّى ${remaining === 1 ? "محاولة واحدة" : `${remaining} محاولات`}` };
  }

  // الرمز صحيح — تحديث كلمة المرور وإبطال كل رموز الحساب
  const passwordHash = await hashPassword(password);
  await db.passwordReset.updateMany({
    where: { accountType: row.accountType, accountId: row.accountId, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (row.accountType === "USER") {
    const user = await db.user.findUnique({
      where: { id: row.accountId },
      select: { id: true, name: true, role: true, officeId: true, isActive: true },
    });
    if (!user || !user.isActive) return { error: "الحساب غير متاح — تواصل مع الإدارة" };
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });
    await audit(
      { actorType: user.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "STAFF", actorId: user.id, actorName: user.name },
      "PASSWORD_RESET", "User", user.id, user.officeId, { via: "otp" }
    );
    return {
      ok: true,
      message: "تم تحديث كلمة المرور بنجاح — سجّل الدخول الآن بكلمة المرور الجديدة",
      loginHref: user.role === "SUPER_ADMIN" ? "/admin/login" : "/office/login",
    };
  }

  const customer = await db.customer.findUnique({
    where: { id: row.accountId },
    select: { id: true, name: true, officeId: true },
  });
  if (!customer) return { error: "الحساب غير متاح — تواصل مع المكتب" };
  await db.customer.update({ where: { id: customer.id }, data: { passwordHash } });
  const office = await db.office.findUnique({ where: { id: customer.officeId }, select: { slug: true } });
  await audit(
    { actorType: "CUSTOMER", actorId: customer.id, actorName: customer.name },
    "PASSWORD_RESET", "Customer", customer.id, customer.officeId, { via: "otp" }
  );
  return {
    ok: true,
    message: "تم تحديث كلمة المرور بنجاح — سجّل الدخول الآن بكلمة المرور الجديدة",
    loginHref: office ? `/o/${office.slug}/auth/login` : "/",
  };
}
