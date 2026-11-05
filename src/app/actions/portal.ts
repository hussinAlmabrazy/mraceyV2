"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCustomer, getCustomerSession, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, notifyStaff } from "@/lib/notify";
import { STATUS, CLIENT_CANCELLABLE } from "@/lib/constants";
import { nextRequestNumber, generateTrackingCode, formatMoney, formatDateAr } from "@/lib/business";
import { saveUpload } from "@/lib/files";

type ActionResult = { ok: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,17}$/;

// ============ حسابي (بوابة العميل): بيانات التواصل وكلمة المرور ============

/** تحديث بيانات التواصل (بريد/جوال/واتساب) — البريد أو الجوال هما معرّفا الدخول، يتطلب كلمة المرور الحالية */
export async function updateMyContact(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const newEmail = String(formData.get("newEmail") || "").trim().toLowerCase();
    const newPhone = String(formData.get("newPhone") || "").trim();
    const newWhatsapp = String(formData.get("newWhatsapp") || "").trim();
    const currentPassword = String(formData.get("currentPassword") || "");

    if (!newEmail && !newPhone) return { ok: false, error: "أدخل البريد الإلكتروني أو رقم الجوال على الأقل" };
    if (newEmail && !EMAIL_RE.test(newEmail)) return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" };
    if (newPhone && !PHONE_RE.test(newPhone)) return { ok: false, error: "صيغة رقم الجوال غير صحيحة" };
    if (!currentPassword) return { ok: false, error: "أدخل كلمة المرور الحالية للتأكيد" };

    const customer = await db.customer.findFirst({ where: { id: session.sub, officeId } });
    if (!customer) return { ok: false, error: "الحساب غير موجود" };
    if (!customer.passwordHash || !(await verifyPassword(currentPassword, customer.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    const email = newEmail || customer.email;
    const phone = newPhone || customer.phone;
    if (email === customer.email && phone === customer.phone && (newWhatsapp || customer.whatsapp) === customer.whatsapp) {
      return { ok: false, error: "لا توجد تغييرات لإجرائها" };
    }

    // التفرد داخل المكتب: البريد والجوال (معرّفا الدخول)
    if (email && email !== customer.email) {
      const dupEmail = await db.customer.findFirst({ where: { officeId, email, id: { not: customer.id } } });
      if (dupEmail) return { ok: false, error: "هذا البريد مستخدم مسبقاً لدى مكتب آخر لنفس العميل أو عميل آخر" };
    }
    if (phone && phone !== customer.phone) {
      const dupPhone = await db.customer.findFirst({ where: { officeId, phone, id: { not: customer.id } } });
      if (dupPhone) return { ok: false, error: "رقم الجوال مسجّل مسبقاً لعميل آخر لدى المكتب" };
    }

    await db.customer.update({
      where: { id: customer.id },
      data: {
        ...(email !== customer.email ? { email: email || null } : {}),
        ...(phone !== customer.phone ? { phone: phone || null } : {}),
        ...(newWhatsapp ? { whatsapp: newWhatsapp } : {}),
      },
    });
    await audit(
      { actorType: "CUSTOMER", actorId: session.sub, actorName: session.name },
      "UPDATE", "Customer", customer.id, officeId,
      { contactChanged: true, ...(email !== customer.email ? { emailFrom: customer.email, emailTo: email } : {}), ...(phone !== customer.phone ? { phoneChanged: true } : {}) }
    );
    revalidatePath(`/o/*/portal/account`);
    return { ok: true, message: "تم تحديث بيانات التواصل — استخدم الجديدة في تسجيل الدخول القادم" };
  } catch (e) {
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

/** تغيير كلمة مرور العميل — يتطلب الحالية + تأكيد الجديدة */
export async function changeMyPassword(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (!currentPassword || !newPassword || !confirmPassword) return { ok: false, error: "املأ جميع حقول كلمة المرور" };

    const customer = await db.customer.findFirst({ where: { id: session.sub, officeId } });
    if (!customer) return { ok: false, error: "الحساب غير موجود" };
    if (!customer.passwordHash || !(await verifyPassword(currentPassword, customer.passwordHash))) {
      return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
    }

    if (newPassword.length < 8) return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" };
    if (newPassword === currentPassword) return { ok: false, error: "كلمة المرور الجديدة مطابقة للحالية — اختر كلمة مختلفة" };
    if (newPassword !== confirmPassword) return { ok: false, error: "تأكيد كلمة المرور غير مطابق" };

    await db.customer.update({ where: { id: customer.id }, data: { passwordHash: await hashPassword(newPassword) } });
    await audit(
      { actorType: "CUSTOMER", actorId: session.sub, actorName: session.name },
      "UPDATE", "Customer", customer.id, officeId,
      { passwordChanged: true }
    );
    return { ok: true, message: "تم تغيير كلمة المرور بنجاح — استخدمها في تسجيل الدخول القادم" };
  } catch (e) {
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ تقديم طلب جديد (معالج بوابة العميل) ============
export async function submitRequest(_prev: any, formData: FormData): Promise<any> {
  try {
    const { session, officeId } = await requireCustomer();
    const officeSlugRow = await db.office.findUnique({ where: { id: officeId }, select: { slug: true, status: true } });
    if (!officeSlugRow || officeSlugRow.status !== "ACTIVE") {
      return { error: "المكتب لا يستقبل طلبات جديدة حالياً" };
    }
    const slug = officeSlugRow.slug;

    const serviceId = String(formData.get("serviceId") || "");
    const isDraft = formData.get("draft") === "1";
    const service = await db.service.findFirst({
      where: { id: serviceId, officeId, isActive: true },
      include: { requiredDocs: { orderBy: { sortOrder: "asc" } }, formFields: { orderBy: { sortOrder: "asc" } } },
    });
    if (!service) return { error: "الخدمة غير متاحة" };

    // الحقول الديناميكية
    const formDataValues: Record<string, string> = {};
    for (const f of service.formFields) {
      const val = String(formData.get(`field_${f.key}`) || "").trim();
      if (!isDraft && f.isRequired && !val) return { error: `الحقل «${f.label}» إلزامي` };
      if (val) formDataValues[f.key] = val;
    }

    // الملفات
    const files: { name: string; file: File; requiredDocId: string }[] = [];
    for (const d of service.requiredDocs) {
      const f = formData.get(`doc_${d.id}`) as File | null;
      if (f && f.size > 0) files.push({ name: d.name, file: f, requiredDocId: d.id });
      else if (!isDraft && d.isMandatory) {
        return { error: `المستند الإلزامي «${d.name}» مطلوب قبل الإرسال` };
      }
    }

    const requestNumber = await nextRequestNumber(officeId);
    const request = await db.request.create({
      data: {
        officeId,
        requestNumber,
        customerId: session.sub,
        serviceId,
        status: isDraft ? STATUS.DRAFT : STATUS.SUBMITTED,
        trackingCode: generateTrackingCode(),
        formData: JSON.stringify(formDataValues),
      },
    });

    for (const f of files) {
      try {
        const saved = await saveUpload(f.file, officeId, `requests/${request.id}`);
        await db.requestDocument.create({
          data: {
            requestId: request.id, officeId, requiredDocId: f.requiredDocId, name: f.name,
            fileName: saved.name, filePath: saved.path, fileSize: saved.size, mimeType: saved.mime,
            version: 1, status: "UPLOADED",
            uploadedByType: "CUSTOMER", uploadedByName: session.name,
          },
        });
      } catch (e) {
        console.error("FILE_UPLOAD_ERROR", e);
      }
    }

    if (!isDraft) {
      await db.requestStatusHistory.create({
        data: { requestId: request.id, toStatus: STATUS.SUBMITTED, note: "تم إرسال الطلب من بوابة العميل", actorType: "CUSTOMER", actorName: session.name },
      });
      // إشعار المكتب بطلب جديد
      await notifyStaff(officeId, "NEW_REQUEST", "طلب جديد وارد 📩", `طلب ${requestNumber} من العميل ${session.name} لخدمة ${service.name}.`, { requestId: request.id });
      await notify({
        officeId, requestId: request.id, event: "NEW_REQUEST",
        customer: { id: session.sub, name: session.name },
        variables: { request_number: requestNumber, client_name: session.name, service_name: service.name, track_link: `/track/${request.trackingCode}` },
        link: `/track/${request.trackingCode}`,
      });
    }

    await audit({ actorType: "CUSTOMER", actorId: session.sub, actorName: session.name }, "CREATE", "Request", request.id, officeId, { requestNumber, draft: isDraft });

    redirect(`/o/${slug}/portal/requests/${request.id}${isDraft ? "?draft=1" : "?created=1"}`);
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}

// ============ رفع مستند ناقص من العميل ============
export async function uploadClientDocument(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const req = await db.request.findFirst({
      where: { id: requestId, officeId, customerId: session.sub },
      include: { service: { select: { name: true } }, customer: true },
    });
    if (!req) return { ok: false, error: "الطلب غير موجود" };

    const file = formData.get("file") as File | null;
    const docId = String(formData.get("docId") || "");
    if (!file || file.size === 0) return { ok: false, error: "اختر الملف" };

    let name = String(formData.get("name") || "").trim();
    let requiredDocId: string | null = null;
    if (docId) {
      const doc = await db.requestDocument.findFirst({ where: { id: docId, requestId } });
      if (doc) { name = doc.name; requiredDocId = doc.requiredDocId; }
    }
    if (!name) return { ok: false, error: "اسم المستند مطلوب" };

    const saved = await saveUpload(file, officeId, `requests/${requestId}`);
    const version = (await db.requestDocument.count({ where: { requestId, name } })) + 1;
    await db.requestDocument.create({
      data: {
        requestId, officeId, requiredDocId, name,
        fileName: saved.name, filePath: saved.path, fileSize: saved.size, mimeType: saved.mime,
        version, status: "UPLOADED",
        uploadedByType: "CUSTOMER", uploadedByName: session.name,
      },
    });
    // إعادة الطلب للمراجعة إن كان بانتظار استكمال العميل
    if (req.status === STATUS.AWAITING_CLIENT) {
      await db.request.update({ where: { id: requestId }, data: { status: STATUS.UNDER_REVIEW } });
      await db.requestStatusHistory.create({
        data: { requestId, fromStatus: req.status, toStatus: STATUS.UNDER_REVIEW, note: `رفع العميل مستنداً: ${name} — عاد الطلب للمراجعة`, actorType: "CUSTOMER", actorName: session.name },
      });
      await notifyStaff(officeId, "NEW_REQUEST", "استكمال مستندات من العميل", `العميل ${session.name} رفع مستند «${name}» للطلب ${req.requestNumber} — جاهز لإعادة المراجعة.`, { requestId });
    }
    await audit({ actorType: "CUSTOMER", actorId: session.sub, actorName: session.name }, "UPLOAD", "RequestDocument", requestId, officeId, { name, version });
    revalidatePath(`/o/portal/requests/${requestId}`);
    return { ok: true, message: "تم رفع المستند وإشعار المكتب" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "فشل الرفع" };
  }
}

// ============ إلغاء الطلب قبل بدء التنفيذ ============
export async function cancelMyRequest(requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const req = await db.request.findFirst({
      where: { id: requestId, officeId, customerId: session.sub },
      include: { customer: true, service: { select: { name: true } } },
    });
    if (!req) return { ok: false, error: "الطلب غير موجود" };
    if (!CLIENT_CANCELLABLE.includes(req.status as any)) {
      return { ok: false, error: "لا يمكن إلغاء الطلب بعد بدء التنفيذ — تواصل مع المكتب" };
    }
    await db.request.update({ where: { id: requestId }, data: { status: STATUS.CANCELLED } });
    await db.requestStatusHistory.create({
      data: { requestId, fromStatus: req.status, toStatus: STATUS.CANCELLED, note: "ألغى العميل الطلب من البوابة", actorType: "CUSTOMER", actorName: session.name },
    });
    await notifyStaff(officeId, "NEW_REQUEST", "إلغاء طلب من العميل", `ألغى العميل ${session.name} الطلب ${req.requestNumber}.`, { requestId });
    await audit({ actorType: "CUSTOMER", actorId: session.sub, actorName: session.name }, "STATUS_CHANGE", "Request", requestId, officeId, { to: STATUS.CANCELLED });
    revalidatePath("/o/portal");
    return { ok: true, message: "تم إلغاء الطلب" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ تعليق العميل ============
export async function addClientComment(requestId: string, body: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const req = await db.request.findFirst({ where: { id: requestId, officeId, customerId: session.sub } });
    if (!req) return { ok: false, error: "الطلب غير موجود" };
    if (!body.trim()) return { ok: false, error: "اكتب رسالتك أولاً" };
    await db.comment.create({
      data: { requestId, officeId, authorType: "CUSTOMER", authorName: session.name, body: body.trim(), isInternal: false },
    });
    await notifyStaff(officeId, "NEW_REQUEST", "رسالة جديدة من عميل", `العميل ${session.name} علّق على الطلب ${req.requestNumber}: «${body.slice(0, 60)}»`, { requestId });
    revalidatePath(`/o/portal/requests/${requestId}`);
    return { ok: true, message: "تم إرسال رسالتك للمكتب" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ تقييم الخدمة بعد الإنجاز ============
export async function rateRequest(requestId: string, rating: number): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const req = await db.request.findFirst({ where: { id: requestId, officeId, customerId: session.sub } });
    if (!req) return { ok: false, error: "الطلب غير موجود" };
    if (![STATUS.READY, STATUS.COMPLETED, STATUS.DELIVERED].includes(req.status as string)) {
      return { ok: false, error: "التقييم متاح بعد إنجاز المعاملة" };
    }
    await db.request.update({ where: { id: requestId }, data: { rating } });
    await audit({ actorType: "CUSTOMER", actorId: session.sub, actorName: session.name }, "UPDATE", "Request", requestId, officeId, { rating });
    revalidatePath(`/o/portal/requests/${requestId}`);
    return { ok: true, message: "شكراً لتقييمك!" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إشعارات العميل ============
export async function markClientNotificationsRead(): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    await db.notification.updateMany({
      where: { officeId, recipientType: "CUSTOMER", customerId: session.sub, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/o/portal");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إرسال الطلب النهائي للمسودة ============
export async function submitDraft(requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireCustomer();
    const req = await db.request.findFirst({
      where: { id: requestId, officeId, customerId: session.sub, status: STATUS.DRAFT },
      include: { service: { include: { requiredDocs: true } }, customer: true },
    });
    if (!req) return { ok: false, error: "المسودة غير موجودة" };
    // التحقق من المستندات الإلزامية
    const docs = await db.requestDocument.findMany({ where: { requestId } });
    const docNames = new Set(docs.map((d) => d.name));
    for (const d of req.service.requiredDocs) {
      if (d.isMandatory && !docNames.has(d.name)) {
        return { ok: false, error: `المستند الإلزامي «${d.name}» مطلوب قبل الإرسال` };
      }
    }
    await db.request.update({ where: { id: requestId }, data: { status: STATUS.SUBMITTED } });
    await db.requestStatusHistory.create({
      data: { requestId, fromStatus: STATUS.DRAFT, toStatus: STATUS.SUBMITTED, note: "تم إرسال الطلب من بوابة العميل", actorType: "CUSTOMER", actorName: session.name },
    });
    await notifyStaff(officeId, "NEW_REQUEST", "طلب جديد وارد 📩", `طلب ${req.requestNumber} من العميل ${session.name} لخدمة ${req.service.name}.`, { requestId });
    await notify({
      officeId, requestId, event: "NEW_REQUEST",
      customer: { id: session.sub, name: session.name },
      variables: { request_number: req.requestNumber, client_name: session.name, service_name: req.service.name, track_link: `/track/${req.trackingCode}` },
      link: `/track/${req.trackingCode}`,
    });
    revalidatePath(`/o/portal/requests/${requestId}`);
    return { ok: true, message: "تم إرسال الطلب للمكتب" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
