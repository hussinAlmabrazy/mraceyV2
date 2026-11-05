"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficeUser, hashPassword, verifyPassword, SessionError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { notifyStaff } from "@/lib/notify";

type ActionResult = { ok: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============ حسابي: تغيير بريد/كلمة مرور المستخدم نفسه (كل الأدوار) ============

/** تغيير البريد الإلكتروني للمستخدم المسجّل دخوله — يتطلب كلمة المرور الحالية */
export async function updateMyEmail(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    const newEmail = String(formData.get("newEmail") || "").trim().toLowerCase();
    const currentPassword = String(formData.get("currentPassword") || "");

    if (!newEmail || !currentPassword) return { ok: false, error: "أدخل البريد الجديد وكلمة المرور الحالية" };
    if (!EMAIL_RE.test(newEmail)) return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" };

    const user = await db.user.findFirst({ where: { id: session.sub, officeId } });
    if (!user) return { ok: false, error: "الحساب غير موجود" };
    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }
    if (newEmail === user.email) return { ok: false, error: "البريد الجديد مطابق للبريد الحالي" };

    // البريد فريد عالمياً على مستوى المنصة (User.email @unique)
    const exists = await db.user.findFirst({ where: { email: newEmail, id: { not: user.id } } });
    if (exists) return { ok: false, error: "هذا البريد مستخدم مسبقاً في النظام" };

    await db.user.update({ where: { id: user.id }, data: { email: newEmail } });
    await audit(
      { actorType: "STAFF", actorId: session.sub, actorName: session.name },
      "UPDATE", "User", user.id, officeId,
      { emailChanged: true, from: user.email, to: newEmail, self: true }
    );
    revalidatePath("/office/account");
    return { ok: true, message: `تم تحديث البريد إلى ${newEmail} — استخدمه في تسجيل الدخول القادم` };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

/** تغيير كلمة المرور للمستخدم المسجّل دخوله — يتطلب الحالية + تأكيد الجديدة */
export async function changeMyPassword(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!currentPassword || !newPassword || !confirmPassword) return { ok: false, error: "املأ جميع حقول كلمة المرور" };

    const user = await db.user.findFirst({ where: { id: session.sub, officeId } });
    if (!user) return { ok: false, error: "الحساب غير موجود" };
    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    if (newPassword.length < 8) return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" };
    if (newPassword === currentPassword) return { ok: false, error: "كلمة المرور الجديدة مطابقة للحالية — اختر كلمة مختلفة" };
    if (newPassword !== confirmPassword) return { ok: false, error: "تأكيد كلمة المرور غير مطابق" };

    await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await audit(
      { actorType: "STAFF", actorId: session.sub, actorName: session.name },
      "UPDATE", "User", user.id, officeId,
      { passwordChanged: true, self: true }
    );
    return { ok: true, message: "تم تغيير كلمة المرور بنجاح — استخدمها في تسجيل الدخول القادم" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الموظفون ============
export async function saveStaff(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (session.role !== "OFFICE_ADMIN") return { ok: false, error: "لا تملك صلاحية إدارة الموظفين" };
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const role = String(formData.get("role") || "STAFF");
    const password = String(formData.get("password") || "");
    if (!name || !email) return { ok: false, error: "الاسم والبريد مطلوبان" };

    const existingEmail = await db.user.findFirst({ where: { email, ...(id ? { id: { not: id } } : {}) } });
    if (existingEmail) return { ok: false, error: "البريد مستخدم مسبقاً (يجب أن يكون فريداً على مستوى المنصة)" };

    if (id) {
      const target = await db.user.findFirst({ where: { id, officeId } });
      if (!target) return { ok: false, error: "الموظف غير موجود" };
      await db.user.update({
        where: { id },
        data: {
          name, email, phone: phone || null, role,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
      });
      await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "User", id, officeId, { name, role });
    } else {
      if (password.length < 8) return { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
      const user = await db.user.create({
        data: { officeId, name, email, phone: phone || null, role, passwordHash: await hashPassword(password), isActive: true, invitedBy: session.name },
      });
      await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "User", user.id, officeId, { name, role });
    }
    revalidatePath("/office/staff");
    return { ok: true, message: "تم حفظ الموظف" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function toggleStaff(userId: string, active: boolean): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (session.role !== "OFFICE_ADMIN") return { ok: false, error: "لا تملك الصلاحية" };
    if (userId === session.sub) return { ok: false, error: "لا يمكنك تعطيل حسابك" };
    const target = await db.user.findFirst({ where: { id: userId, officeId } });
    if (!target) return { ok: false, error: "الموظف غير موجود" };
    if (target.role === "OFFICE_ADMIN") {
      const admins = await db.user.count({ where: { officeId, role: "OFFICE_ADMIN", isActive: true } });
      if (admins <= 1) return { ok: false, error: "لا يمكن تعطيل مدير المكتب الوحيد" };
    }
    await db.user.update({ where: { id: userId }, data: { isActive: active } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "User", userId, officeId, { active });
    revalidatePath("/office/staff");
    return { ok: true, message: active ? "تم تفعيل الحساب" : "تم تعطيل الحساب" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ العملاء ============
export async function saveCustomer(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "customers.manage")) return { ok: false, error: "لا تملك الصلاحية" };
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم العميل مطلوب" };
    const data = {
      name,
      customerType: String(formData.get("customerType") || "INDIVIDUAL"),
      phone: String(formData.get("phone") || "").trim() || null,
      whatsapp: String(formData.get("whatsapp") || "").trim() || null,
      email: String(formData.get("email") || "").trim().toLowerCase() || null,
      address: String(formData.get("address") || "").trim() || null,
      taxNumber: String(formData.get("taxNumber") || "").trim() || null,
      crNumber: String(formData.get("crNumber") || "").trim() || null,
    };
    if (id) {
      const existing = await db.customer.findFirst({ where: { id, officeId } });
      if (!existing) return { ok: false, error: "العميل غير موجود" };
      await db.customer.update({ where: { id }, data });
      await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Customer", id, officeId, { name });
    } else {
      const dup = await db.customer.findFirst({
        where: { officeId, OR: [{ phone: data.phone || "___" }, { email: data.email || "___" }] },
      });
      if (dup) return { ok: false, error: "يوجد عميل بنفس الجوال أو البريد" };
      const created = await db.customer.create({ data: { ...data, officeId } });
      await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "Customer", created.id, officeId, { name });
    }
    revalidatePath("/office/customers");
    return { ok: true, message: "تم حفظ بيانات العميل" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إعدادات المكتب ============
export async function updateOfficeSettings(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (session.role !== "OFFICE_ADMIN") return { ok: false, error: "لا تملك صلاحية الإعدادات" };
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم المكتب مطلوب" };
    const holidaysRaw = String(formData.get("holidays") || "").trim();
    const holidays = holidaysRaw ? holidaysRaw.split(",").map((h) => h.trim()).filter(Boolean) : [];
    await db.office.update({
      where: { id: officeId },
      data: {
        name,
        phone: String(formData.get("phone") || "").trim() || null,
        whatsapp: String(formData.get("whatsapp") || "").trim() || null,
        email: String(formData.get("email") || "").trim().toLowerCase() || null,
        address: String(formData.get("address") || "").trim() || null,
        city: String(formData.get("city") || "").trim() || null,
        managerName: String(formData.get("managerName") || "").trim() || null,
        brandColor: String(formData.get("brandColor") || "#0F766E"),
        workingHours: String(formData.get("workingHours") || "").trim() || null,
        about: String(formData.get("about") || "").trim() || null,
        holidays: holidays.length ? JSON.stringify(holidays) : null,
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Office", officeId, officeId, { holidays: holidays.length });
    revalidatePath("/office/settings");
    revalidatePath("/o");
    return { ok: true, message: "تم حفظ الإعدادات" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function updateLogo(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (session.role !== "OFFICE_ADMIN") return { ok: false, error: "لا تملك الصلاحية" };
    const file = formData.get("logo") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "اختر ملف الشعار" };
    const { saveUpload } = await import("@/lib/files");
    const saved = await saveUpload(file, officeId, "branding");
    await db.office.update({ where: { id: officeId }, data: { logoPath: saved.path } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Office", officeId, officeId, { logo: true });
    revalidatePath("/office/settings");
    return { ok: true, message: "تم تحديث الشعار" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "فشل رفع الشعار" };
  }
}

// ============ قوالب الإشعارات ============
export async function saveTemplate(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (session.role !== "OFFICE_ADMIN" && session.role !== "STAFF") return { ok: false, error: "لا تملك الصلاحية" };
    const id = String(formData.get("id") || "");
    const body = String(formData.get("body") || "").trim();
    if (!body) return { ok: false, error: "نص القالب مطلوب" };
    await db.notificationTemplate.update({
      where: { id, officeId },
      data: {
        body,
        subject: String(formData.get("subject") || "").trim() || null,
        isActive: formData.get("isActive") === "on",
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "NotificationTemplate", id, officeId);
    revalidatePath("/office/notifications");
    return { ok: true, message: "تم حفظ القالب" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function toggleTemplate(id: string, active: boolean): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    await db.notificationTemplate.updateMany({ where: { id, officeId }, data: { isActive: active } });
    revalidatePath("/office/notifications");
    return { ok: true };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الإشعارات: تعليم كمقروء ============
export async function markNotificationsRead(ids?: string[]): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    await db.notification.updateMany({
      where: {
        officeId,
        recipientType: "STAFF",
        userId: session.sub,
        isRead: false,
        ...(ids?.length ? { id: { in: ids } } : {}),
      },
      data: { isRead: true },
    });
    revalidatePath("/office/notifications");
    revalidatePath("/office");
    return { ok: true };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function resendMessage(logId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    const log = await db.messageLog.findFirst({ where: { id: logId, officeId } });
    if (!log) return { ok: false, error: "الرسالة غير موجودة" };
    await db.messageLog.update({
      where: { id: logId },
      data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, error: null },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "MessageLog", logId, officeId, { resent: true });
    revalidatePath("/office/logs");
    return { ok: true, message: "أُعيد الإرسال (محاكاة المزود) — راجع سجل الإرسال" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// إشعار داخلي تجريبي للتحقق
export async function testNotifyStaff(): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    await notifyStaff(officeId, "TEST", "إشعار تجريبي", "هذا إشعار داخلي تجريبي للتأكد من عمل القناة ✅");
    revalidatePath("/office/notifications");
    return { ok: true, message: "أُرسل إشعار تجريبي لكل موظفي المكتب" };
  } catch (e) {
    // انتهاء الجلسة: تحويل تلقائي لصفحة الدخول بدل رسالة خطأ ميتة داخل النموذج
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
