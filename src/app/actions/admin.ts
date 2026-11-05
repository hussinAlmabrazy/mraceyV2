"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSuperAdmin, setUserSession, SessionError, verifyPassword, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { generateLicenseKey } from "@/lib/business";
import { notify } from "@/lib/notify";
import { DEFAULT_TEMPLATES } from "@/lib/seed-data";

type ActionResult = { ok: boolean; error?: string; message?: string; licenseKey?: string };

// ============ إنشاء مكتب جديد + مفتاح ترخيص ============
export async function createOffice(_prev: any, formData: FormData): Promise<any> {
  try {
    const session = await requireSuperAdmin();
    const name = String(formData.get("name") || "").trim();
    const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const managerName = String(formData.get("managerName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const city = String(formData.get("city") || "").trim();
    const activityType = String(formData.get("activityType") || "CLEARANCE");
    const planId = String(formData.get("planId") || "");
    const durationDays = parseInt(String(formData.get("durationDays") || "365")) || 365;

    if (!name || !slug || !email || !managerName) return { error: "املأ الحقول الإلزامية: الاسم، الرابط، البريد، المسؤول" };

    const slugExists = await db.office.findUnique({ where: { slug } });
    if (slugExists) return { error: "الرابط مستخدم — اختر رابطاً آخر" };
    const emailExists = await db.user.findUnique({ where: { email } });
    if (emailExists) return { error: "البريد مستخدم مسبقاً في النظام" };

    const plan = planId ? await db.plan.findUnique({ where: { id: planId } }) : await db.plan.findFirst({ where: { isDefault: true } });

    const licenseKey = generateLicenseKey();
    const office = await db.office.create({
      data: {
        name, slug, email, managerName,
        phone: phone || null, city: city || null, activityType,
        status: "PENDING",
      },
    });
    await db.license.create({
      data: {
        officeId: office.id,
        key: licenseKey,
        planId: plan?.id,
        durationDays,
        status: "PENDING",
      },
    });
    // أسعار صرف افتراضية
    await db.exchangeRate.createMany({
      data: [
        { officeId: office.id, currency: "USD", rate: 1590 },
        { officeId: office.id, currency: "SAR", rate: 424 },
      ],
    });

    // "إرسال دعوة" عبر البريد — تسجيل في سجل الإرسال (محاكاة المزود)
    await db.messageLog.create({
      data: {
        officeId: office.id,
        channel: "EMAIL",
        recipient: email,
        subject: `دعوة تفعيل مكتب ${name} — منصة مراسي`,
        body: `السيد/ة ${managerName}،\n\nتم إنشاء حساب مكتبكم «${name}» على منصة مراسي.\n\nمفتاح التفعيل: ${licenseKey}\nرابط التفعيل: /activate\n\nيرجى الاحتفاظ بالمفتاح بسرّية وتفعيل الحساب خلال مدة صلاحية الترخيص (${durationDays} يوماً).\n\nمع التقدير،\nإدارة منصة مراسي`,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "CREATE", "Office", office.id, office.id, { name, slug, licenseKey, plan: plan?.name });
    revalidatePath("/admin/offices");
    revalidatePath("/admin");
    return { ok: true, message: `تم إنشاء المكتب وإرسال دعوة التفعيل إلى ${email}`, licenseKey };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}

// ============ إدارة ترخيص مكتب: تجديد/إيقاف/إلغاء/تفعيل ============
export async function updateLicense(licenseId: string, action: "renew" | "suspend" | "revoke" | "activate", days?: number): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const license = await db.license.findUnique({ where: { id: licenseId }, include: { office: true } });
    if (!license) return { ok: false, error: "الترخيص غير موجود" };

    const now = new Date();
    if (action === "renew") {
      const extra = days ?? 365;
      const base = license.endDate && license.endDate > now ? license.endDate : now;
      const newEnd = new Date(base.getTime() + extra * 86400000);
      await db.license.update({ where: { id: licenseId }, data: { endDate: newEnd, status: "ACTIVE" } });
      await db.office.update({ where: { id: license.officeId }, data: { status: "ACTIVE" } });
      await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "LICENSE", "License", licenseId, license.officeId, { action, extra });
    } else if (action === "suspend") {
      // إيقاف المكتب: يبقى التتبع وتحميل المستندات متاحين للعملاء (قاعدة العمل) — منع الطلبات الجديدة فقط عبر status
      await db.office.update({ where: { id: license.officeId }, data: { status: "SUSPENDED" } });
      await db.license.update({ where: { id: licenseId }, data: { status: "REVOKED" } });
      await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "LICENSE", "License", licenseId, license.officeId, { action });
    } else if (action === "revoke") {
      await db.license.update({ where: { id: licenseId }, data: { status: "REVOKED" } });
      await db.office.update({ where: { id: license.officeId }, data: { status: "ARCHIVED" } });
      await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "LICENSE", "License", licenseId, license.officeId, { action });
    } else if (action === "activate") {
      await db.license.update({ where: { id: licenseId }, data: { status: "ACTIVE", startDate: now, endDate: new Date(now.getTime() + (license.durationDays) * 86400000), activatedAt: license.activatedAt ?? now } });
      await db.office.update({ where: { id: license.officeId }, data: { status: "ACTIVE" } });
      await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "LICENSE", "License", licenseId, license.officeId, { action });
    }
    revalidatePath(`/admin/offices/${license.officeId}`);
    revalidatePath("/admin/offices");
    revalidatePath("/admin");
    return { ok: true, message: "تم تنفيذ العملية على الترخيص" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الانتحال لأغراض الدعم (FR-SA-05) ============
export async function impersonateOffice(officeId: string): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const office = await db.office.findUnique({ where: { id: officeId }, include: { users: true } });
    if (!office) return { ok: false, error: "المكتب غير موجود" };
    const admin = office.users.find((u) => u.role === "OFFICE_ADMIN" && u.isActive);
    if (!admin) return { ok: false, error: "لا يوجد مدير مكتب نشط — لا يمكن الانتحال" };

    await setUserSession({ sub: admin.id, type: "USER", role: "OFFICE_ADMIN", officeId: office.id, name: admin.name, impersonated: true });
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "IMPERSONATE", "Office", officeId, officeId, { target: admin.name });
    redirect("/office");
  } catch (e: any) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الباقات ============
export async function savePlan(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم الباقة مطلوب" };
    const data = {
      name,
      description: String(formData.get("description") || "").trim() || null,
      maxUsers: parseInt(String(formData.get("maxUsers") || "5")) || 5,
      maxStorageMb: parseInt(String(formData.get("maxStorageMb") || "2048")) || 2048,
      maxMonthlyReqs: parseInt(String(formData.get("maxMonthlyReqs") || "100")) || 100,
      whatsappEnabled: formData.get("whatsappEnabled") === "on",
      priceMonthly: parseFloat(String(formData.get("priceMonthly") || "0")) || 0,
      priceYearly: parseFloat(String(formData.get("priceYearly") || "0")) || 0,
    };
    if (id) {
      await db.plan.update({ where: { id }, data });
    } else {
      await db.plan.create({ data });
    }
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, id ? "UPDATE" : "CREATE", "Plan", id || name, null, data);
    revalidatePath("/admin/plans");
    return { ok: true, message: "تم حفظ الباقة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deletePlan(id: string): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const inUse = await db.license.count({ where: { planId: id } });
    if (inUse > 0) return { ok: false, error: `الباقة مرتبطة بـ ${inUse} ترخيص — لا يمكن حذفها` };
    await db.plan.delete({ where: { id } });
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "DELETE", "Plan", id);
    revalidatePath("/admin/plans");
    return { ok: true, message: "تم حذف الباقة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ جدول HS Code ============
export async function saveHsCode(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const id = String(formData.get("id") || "");
    const code = String(formData.get("code") || "").trim();
    const descriptionAr = String(formData.get("descriptionAr") || "").trim();
    if (!code || !descriptionAr) return { ok: false, error: "الرمز والوصف العربي مطلوبان" };
    const data = {
      code,
      descriptionAr,
      descriptionEn: String(formData.get("descriptionEn") || "").trim() || null,
      unit: String(formData.get("unit") || "").trim() || null,
      dutyRate: parseFloat(String(formData.get("dutyRate") || "0")) || 0,
      salesTaxRate: parseFloat(String(formData.get("salesTaxRate") || "0")) || 0,
      otherTaxRate: parseFloat(String(formData.get("otherTaxRate") || "0")) || 0,
    };
    if (id) {
      await db.hSCode.update({ where: { id }, data });
    } else {
      const exists = await db.hSCode.findUnique({ where: { code } });
      if (exists) return { ok: false, error: "الرمز موجود مسبقاً" };
      await db.hSCode.create({ data });
    }
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, id ? "UPDATE" : "CREATE", "HSCode", id || code, null, data);
    revalidatePath("/admin/hs-codes");
    return { ok: true, message: "تم حفظ الرمز" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteHsCode(id: string): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const used = await db.shipmentItem.count({ where: { hsCodeId: id } });
    if (used > 0) return { ok: false, error: "الرمز مستخدم في بنود شحنات — عطّله بدلاً من الحذف" };
    await db.hSCode.delete({ where: { id } });
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "DELETE", "HSCode", id);
    revalidatePath("/admin/hs-codes");
    return { ok: true, message: "تم الحذف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function toggleHsCode(id: string, active: boolean): Promise<ActionResult> {
  try {
    await requireSuperAdmin();
    await db.hSCode.update({ where: { id }, data: { isActive: active, updatedAt: new Date() } });
    revalidatePath("/admin/hs-codes");
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إعدادات عامة ============
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function savePlatformSettings(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const entries: [string, string][] = [
      ["platform_name", String(formData.get("platform_name") || "منصة مراسي")],
      ["platform_tagline", String(formData.get("platform_tagline") || "")],
      ["email_provider", String(formData.get("email_provider") || "")],
      ["whatsapp_provider", String(formData.get("whatsapp_provider") || "")],
      ["backup_daily", formData.get("backup_daily") === "on" ? "مفعّل" : "معطّل"],
    ];
    for (const [key, value] of entries) {
      await db.platformSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }
    await audit({ actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name }, "UPDATE", "PlatformSetting", "settings", null, { keys: entries.map((e) => e[0]) });
    revalidatePath("/admin/settings");
    return { ok: true, message: "تم حفظ الإعدادات العامة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إعدادات حساب مدير المنصة ============

/** تغيير بريد مدير المنصة الإلكتروني — يتطلب كلمة المرور الحالية للتأكيد */
export async function updateAdminEmail(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const newEmail = String(formData.get("newEmail") || "").trim().toLowerCase();
    const currentPassword = String(formData.get("currentPassword") || "");

    if (!newEmail || !currentPassword) return { ok: false, error: "أدخل البريد الجديد وكلمة المرور الحالية" };
    if (!EMAIL_RE.test(newEmail)) return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" };

    const user = await db.user.findUnique({ where: { id: session.sub } });
    if (!user || user.role !== "SUPER_ADMIN") return { ok: false, error: "حساب المدير غير موجود" };
    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }
    if (newEmail === user.email) return { ok: false, error: "البريد الجديد مطابق للبريد الحالي" };

    const exists = await db.user.findUnique({ where: { email: newEmail } });
    if (exists) return { ok: false, error: "هذا البريد مستخدم مسبقاً في النظام" };

    await db.user.update({ where: { id: user.id }, data: { email: newEmail } });
    await audit(
      { actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name },
      "UPDATE", "User", user.id, null,
      { emailChanged: true, from: user.email, to: newEmail }
    );
    revalidatePath("/admin/settings");
    return { ok: true, message: `تم تحديث البريد إلى ${newEmail} — استخدمه في تسجيل الدخول القادم` };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

/** تغيير كلمة مرور مدير المنصة — يتطلب كلمة المرور الحالية + تأكيد الجديدة */
export async function changeAdminPassword(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSuperAdmin();
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!currentPassword || !newPassword || !confirmPassword) return { ok: false, error: "املأ جميع حقول كلمة المرور" };

    const user = await db.user.findUnique({ where: { id: session.sub } });
    if (!user || user.role !== "SUPER_ADMIN") return { ok: false, error: "حساب المدير غير موجود" };
    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    if (newPassword.length < 8) return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" };
    if (newPassword === currentPassword) return { ok: false, error: "كلمة المرور الجديدة مطابقة للحالية — اختر كلمة مختلفة" };
    if (newPassword !== confirmPassword) return { ok: false, error: "تأكيد كلمة المرور غير مطابق" };

    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await audit(
      { actorType: "SUPER_ADMIN", actorId: session.sub, actorName: session.name },
      "UPDATE", "User", user.id, null,
      { passwordChanged: true }
    );
    return { ok: true, message: "تم تغيير كلمة المرور بنجاح — استخدمها في تسجيل الدخول القادم" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/admin/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
