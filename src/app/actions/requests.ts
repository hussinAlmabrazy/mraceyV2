"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficeUser, getUserSession, SessionError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, notifyStaff } from "@/lib/notify";
import { STATUS } from "@/lib/constants";
import { nextRequestNumber, generateTrackingCode, addBusinessDays, formatDateAr } from "@/lib/business";
import { saveUpload } from "@/lib/files";
import { Prisma } from "@prisma/client";

type ActionResult = { ok: boolean; error?: string; message?: string };

async function actor() {
  const { session, officeId } = await requireOfficeUser();
  return {
    session,
    officeId,
    auditActor: {
      actorType: session.role === "SUPER_ADMIN" ? ("SUPER_ADMIN" as const) : ("STAFF" as const),
      actorId: session.sub,
      actorName: session.name,
    },
  };
}

async function loadRequestContext(requestId: string) {
  const { session, officeId } = await requireOfficeUser();
  const req = await db.request.findFirst({
    where: { id: requestId, officeId },
    include: {
      customer: true,
      service: { include: { stages: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!req) throw new Error("الطلب غير موجود");
  // المخلص الميداني: الطلبات المسندة إليه فقط
  if (session.role === "BROKER" && req.assignedToId !== session.sub) {
    throw new Error("غير مصرح — الطلب غير مسند إليك");
  }
  return { session, officeId, req };
}

function baseVars(req: { requestNumber: string; customer: { name: string }; service: { name: string }; trackingCode: string }) {
  return {
    request_number: req.requestNumber,
    client_name: req.customer.name,
    service_name: req.service.name,
    track_link: `/track/${req.trackingCode}`,
  };
}

// ============ مراجعة المستندات ============
export async function reviewDocument(docId: string, status: string, note: string): Promise<ActionResult> {
  try {
    const { officeId, auditActor } = await actor();
    const doc = await db.requestDocument.findFirst({
      where: { id: docId, officeId },
      include: { request: { include: { customer: true, service: true } } },
    });
    if (!doc) return { ok: false, error: "المستند غير موجود" };
    if (!["APPROVED", "MISSING", "REJECTED", "UPLOADED"].includes(status)) return { ok: false, error: "حالة غير صالحة" };

    await db.requestDocument.update({
      where: { id: docId },
      data: { status, reviewNote: note || null, updatedAt: new Date() },
    });
    await audit(auditActor, "DOC_REVIEW", "RequestDocument", docId, officeId, { status, note });
    revalidatePath(`/office/requests/${doc.requestId}`);
    return { ok: true, message: "تم تحديث حالة المستند" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}

// ============ قرارات المراجعة: قبول / رفض / استكمال ============
export async function requestDecision(
  requestId: string,
  decision: "ACCEPTED" | "REJECTED" | "MISSING",
  opts: { reason?: string; deadline?: string; estimatedDays?: number; missingDocNames?: string[] }
): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    if (req.status !== STATUS.UNDER_REVIEW && req.status !== STATUS.SUBMITTED && req.status !== STATUS.AWAITING_CLIENT) {
      return { ok: false, error: "لا يمكن اتخاذ هذا القرار في الحالة الحالية" };
    }

    const now = new Date();
    let toStatus = STATUS.UNDER_REVIEW;
    let note = "";

    if (decision === "ACCEPTED") {
      toStatus = STATUS.ACCEPTED;
      const days = opts.estimatedDays ?? req.service.estimatedDays;
      const holidays = (await db.office.findUnique({ where: { id: officeId }, select: { holidays: true } }))?.holidays;
      const holidayList: string[] = holidays ? JSON.parse(holidays) : [];
      const expected = addBusinessDays(now, days, holidayList);
      await db.request.update({
        where: { id: requestId },
        data: { status: toStatus, acceptedAt: now, estimatedDays: days, expectedCompletion: expected },
      });
      note = `تم قبول الطلب — المدة المتوقعة ${days} يوم عمل`;
      await notify({
        officeId,
        requestId,
        event: "ACCEPTED",
        customer: req.customer,
        variables: {
          ...baseVars(req),
          estimated_days: String(days),
          expected_date: formatDateAr(expected),
        },
        link: `/track/${req.trackingCode}`,
      });
    } else if (decision === "REJECTED") {
      toStatus = STATUS.REJECTED;
      await db.request.update({
        where: { id: requestId },
        data: { status: toStatus, rejectedReason: opts.reason || "غير محدد" },
      });
      note = `رفض الطلب: ${opts.reason || ""}`;
      await notify({
        officeId,
        requestId,
        event: "REJECTED",
        customer: req.customer,
        variables: { ...baseVars(req), reason: opts.reason || "غير محدد" },
        link: `/track/${req.trackingCode}`,
      });
    } else {
      // استكمال نواقص
      toStatus = STATUS.AWAITING_CLIENT;
      const deadline = opts.deadline ? new Date(opts.deadline) : addBusinessDays(now, 3, []);
      const names = opts.missingDocNames || [];
      if (names.length === 0) return { ok: false, error: "حدد المستندات الناقصة" };
      // تعليم المستندات الناقصة
      for (const name of names) {
        const existing = await db.requestDocument.findFirst({ where: { requestId, name } });
        if (existing) {
          await db.requestDocument.update({ where: { id: existing.id }, data: { status: "MISSING", reviewNote: note || "مطلوب استكماله" } });
        } else {
          await db.requestDocument.create({
            data: { requestId, officeId, name, status: "MISSING", uploadedByType: "STAFF", uploadedByName: session.name },
          });
        }
      }
      await db.request.update({
        where: { id: requestId },
        data: { status: toStatus, missingDeadline: deadline },
      });
      note = `طلب استكمال: ${names.join("، ")}`;
      await notify({
        officeId,
        requestId,
        event: "MISSING_DOCS",
        customer: req.customer,
        variables: {
          ...baseVars(req),
          missing_docs: names.join("، "),
          deadline: formatDateAr(deadline),
        },
        link: `/track/${req.trackingCode}`,
      });
    }

    await db.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: req.status,
        toStatus,
        note,
        actorType: "STAFF",
        actorName: session.name,
      },
    });
    await audit(
      { actorType: "STAFF", actorId: session.sub, actorName: session.name },
      "STATUS_CHANGE", "Request", requestId, officeId,
      { from: req.status, to: toStatus, decision }
    );
    revalidatePath(`/office/requests/${requestId}`);
    revalidatePath("/office/requests");
    return { ok: true, message: "تم تنفيذ القرار" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}

// ============ بدء المراجعة ============
export async function startReview(requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    if (req.status !== STATUS.SUBMITTED) return { ok: false, error: "الحالة لا تسمح" };
    await db.request.update({ where: { id: requestId }, data: { status: STATUS.UNDER_REVIEW } });
    await db.requestStatusHistory.create({
      data: { requestId, fromStatus: req.status, toStatus: STATUS.UNDER_REVIEW, note: "بدء مراجعة الطلب", actorType: "STAFF", actorName: session.name },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "STATUS_CHANGE", "Request", requestId, officeId, { from: req.status, to: STATUS.UNDER_REVIEW });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ محرك الحالات: تغيير المرحلة/الحالة ============
export async function changeStage(
  requestId: string,
  opts: { stageId?: string | null; toStatus?: string; note?: string; isVisible?: boolean }
): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    const stages = req.service.stages;
    const stage = opts.stageId ? stages.find((s) => s.id === opts.stageId) : null;

    if (stage) {
      const isLast = stages[stages.length - 1]?.id === stage.id;
      const newStatus = isLast ? STATUS.COMPLETED : req.status === STATUS.ACCEPTED ? STATUS.IN_PROGRESS : req.status;
      const completedAt = isLast ? new Date() : req.completedAt;

      await db.request.update({
        where: { id: requestId },
        data: {
          currentStageId: stage.id,
          status: newStatus,
          completedAt,
          // إشعار الإنجاز مرة واحدة فقط (قاعدة العمل)
          completionNotified: isLast && !req.completionNotified ? new Date() : req.completionNotified,
        },
      });
      await db.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: req.status,
          toStatus: newStatus,
          stageId: stage.id,
          stageName: stage.name,
          note: opts.note || null,
          isVisible: opts.isVisible ?? stage.isVisibleToClient,
          actorType: "STAFF",
          actorName: session.name,
        },
      });
      // إشعار تغيير مرحلة (إن كانت مرئية)
      if (stage.isVisibleToClient) {
        await notify({
          officeId,
          requestId,
          event: "STAGE_CHANGE",
          customer: req.customer,
          variables: { ...baseVars(req), stage_name: stage.name },
          link: `/track/${req.trackingCode}`,
        });
      }
      // إشعار الإنجاز الإلزامي مرة واحدة
      if (isLast && !req.completionNotified) {
        await notify({
          officeId,
          requestId,
          event: "COMPLETED",
          customer: req.customer,
          variables: baseVars(req),
          link: `/track/${req.trackingCode}`,
        });
      }
    } else if (opts.toStatus) {
      // تغيير حالة عام (مثل التسليم/الإقفال)
      if (opts.toStatus === STATUS.DELIVERED && ![STATUS.READY, STATUS.COMPLETED].includes(req.status as string)) {
        return { ok: false, error: "الإقفال يتطلب اكتمال المعاملة أولاً" };
      }
      await db.request.update({
        where: { id: requestId },
        data: {
          status: opts.toStatus,
          ...(opts.toStatus === STATUS.DELIVERED ? { deliveredAt: new Date() } : {}),
        },
      });
      await db.requestStatusHistory.create({
        data: {
          requestId,
          fromStatus: req.status,
          toStatus: opts.toStatus,
          note: opts.note || null,
          isVisible: opts.isVisible ?? true,
          actorType: "STAFF",
          actorName: session.name,
        },
      });
    } else {
      return { ok: false, error: "حدد المرحلة أو الحالة" };
    }

    await audit(
      { actorType: "STAFF", actorId: session.sub, actorName: session.name },
      "STATUS_CHANGE", "Request", requestId, officeId,
      { stage: stage?.name || null, to: opts.toStatus || (stage ? "STAGE" : "") }
    );
    revalidatePath(`/office/requests/${requestId}`);
    revalidatePath("/office/requests");
    revalidatePath("/office");
    return { ok: true, message: "تم تحديث المرحلة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إسناد / إعادة إسناد ============
export async function assignRequest(requestId: string, userId: string | null): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    if (userId) {
      const target = await db.user.findFirst({ where: { id: userId, officeId, isActive: true } });
      if (!target) return { ok: false, error: "الموظف غير موجود في هذا المكتب" };
      await notifyStaff(officeId, "ASSIGNED", "تكليف بطلب جديد", `تم إسناد الطلب ${req.requestNumber} إليك — خدمة ${req.service.name}.`, {
        requestId,
        userIds: [target.id],
      });
    }
    await db.request.update({ where: { id: requestId }, data: { assignedToId: userId } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Request", requestId, officeId, { assignedTo: userId });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: userId ? "تم الإسناد" : "تم إلغاء الإسناد" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ التعليقات ============
export async function addComment(requestId: string, body: string, isInternal: boolean): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    if (!body.trim()) return { ok: false, error: "اكتب التعليق أولاً" };
    await db.comment.create({
      data: {
        requestId, officeId,
        authorType: "STAFF", authorName: session.name,
        body: body.trim(), isInternal,
      },
    });
    if (!isInternal) {
      await notify({
        officeId, requestId,
        event: "STAGE_CHANGE",
        customer: req.customer,
        variables: { ...baseVars(req), stage_name: "رسالة جديدة من المكتب" },
        link: `/track/${req.trackingCode}`,
      });
    }
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ المهام ============
export async function createTask(
  requestId: string | null,
  data: { title: string; note?: string; dueAt?: string; assigneeId?: string }
): Promise<ActionResult> {
  try {
    const { session, officeId } = await actor();
    if (!data.title.trim()) return { ok: false, error: "عنوان المهمة مطلوب" };
    if (requestId) {
      const req = await db.request.findFirst({ where: { id: requestId, officeId } });
      if (!req) return { ok: false, error: "الطلب غير موجود" };
    }
    await db.task.create({
      data: {
        officeId, requestId,
        title: data.title.trim(),
        note: data.note || null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        assigneeId: data.assigneeId || null,
        createdByName: session.name,
      },
    });
    if (data.assigneeId) {
      await notifyStaff(officeId, "ASSIGNED", "مهمة جديدة", `تم تكليفك بمهمة: ${data.title}`, { requestId, userIds: [data.assigneeId] });
    }
    revalidatePath(`/office/requests/${requestId || ""}`);
    revalidatePath("/office/tasks");
    return { ok: true, message: "تمت إضافة المهمة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function toggleTask(taskId: string, done: boolean): Promise<ActionResult> {
  try {
    const { officeId } = await actor();
    const task = await db.task.findFirst({ where: { id: taskId, officeId } });
    if (!task) return { ok: false, error: "المهمة غير موجودة" };
    await db.task.update({ where: { id: taskId }, data: { isDone: done, doneAt: done ? new Date() : null } });
    revalidatePath("/office/tasks");
    if (task.requestId) revalidatePath(`/office/requests/${task.requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ رفع مستند لطلب (موظف) ============
export async function uploadRequestDocument(
  requestId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    const file = formData.get("file") as File | null;
    const name = String(formData.get("name") || "").trim();
    const requiredDocId = String(formData.get("requiredDocId") || "") || null;
    if (!file || file.size === 0) return { ok: false, error: "اختر ملفاً" };
    if (!name) return { ok: false, error: "اسم المستند مطلوب" };

    const saved = await saveUpload(file, officeId, `requests/${requestId}`);
    // ترقيم الإصدارات
    const version = (await db.requestDocument.count({ where: { requestId, name } })) + 1;
    await db.requestDocument.create({
      data: {
        requestId, officeId, requiredDocId, name,
        fileName: saved.name, filePath: saved.path, fileSize: saved.size, mimeType: saved.mime,
        version, status: "UPLOADED",
        uploadedByType: "STAFF", uploadedByName: session.name,
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPLOAD", "RequestDocument", requestId, officeId, { name, version });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم رفع المستند" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "فشل الرفع" };
  }
}

// ============ إنشاء طلب نيابةً عن العميل (FR-OF-18) ============
export type OnBehalfState = { error?: string; ok?: boolean } | undefined;

export async function createOnBehalf(_prev: OnBehalfState, formData: FormData): Promise<OnBehalfState> {
  try {
    const { session, officeId } = await actor();
    const serviceId = String(formData.get("serviceId") || "");
    const customerId = String(formData.get("customerId") || "");
    const newCustomerName = String(formData.get("newCustomerName") || "").trim();
    const newCustomerPhone = String(formData.get("newCustomerPhone") || "").trim();
    const newCustomerWhatsapp = String(formData.get("newCustomerWhatsapp") || "").trim();
    const newCustomerEmail = String(formData.get("newCustomerEmail") || "").trim().toLowerCase();
    const note = String(formData.get("note") || "").trim();

    if (!serviceId) return { error: "اختر الخدمة" };

    const service = await db.service.findFirst({ where: { id: serviceId, officeId, isActive: true } });
    if (!service) return { error: "الخدمة غير موجودة" };

    // العميل: موجود أو جديد
    let customerIdFinal = customerId;
    if (!customerIdFinal) {
      if (!newCustomerName || (!newCustomerPhone && !newCustomerEmail)) {
        return { error: "بيانات العميل الجديد ناقصة (الاسم + الجوال أو البريد)" };
      }
      const dup = await db.customer.findFirst({
        where: { officeId, OR: [{ phone: newCustomerPhone }, ...(newCustomerEmail ? [{ email: newCustomerEmail }] : [])] },
      });
      if (dup) return { error: `يوجد عميل بنفس البيانات: ${dup.name} — اختره من القائمة` };
      const created = await db.customer.create({
        data: {
          officeId, name: newCustomerName,
          phone: newCustomerPhone || null,
          whatsapp: newCustomerWhatsapp || newCustomerPhone || null,
          email: newCustomerEmail || null,
          customerType: String(formData.get("newCustomerType") || "INDIVIDUAL"),
        },
      });
      customerIdFinal = created.id;
    }

    // بيانات الحقول الديناميكية
    const fields = await db.formField.findMany({ where: { serviceId }, orderBy: { sortOrder: "asc" } });
    const formDataValues: Record<string, string> = {};
    for (const f of fields) {
      const val = String(formData.get(`field_${f.key}`) || "").trim();
      if (f.isRequired && !val) return { error: `الحقل «${f.label}» إلزامي` };
      if (val) formDataValues[f.key] = val;
    }

    // الملفات
    const requiredDocs = await db.serviceRequiredDocument.findMany({ where: { serviceId }, orderBy: { sortOrder: "asc" } });
    const files: { name: string; file: File; requiredDocId: string | null }[] = [];
    for (const d of requiredDocs) {
      const f = formData.get(`doc_${d.id}`) as File | null;
      if (f && f.size > 0) files.push({ name: d.name, file: f, requiredDocId: d.id });
      else if (d.isMandatory) return { error: `المستند الإلزامي «${d.name}» مطلوب` };
    }
    const extraFile = formData.get("doc_extra") as File | null;
    if (extraFile && extraFile.size > 0) files.push({ name: String(formData.get("doc_extra_name") || "مستند إضافي"), file: extraFile, requiredDocId: null });

    const requestNumber = await nextRequestNumber(officeId);
    const customer = await db.customer.findUnique({ where: { id: customerIdFinal } });
    const request = await db.request.create({
      data: {
        officeId, requestNumber,
        customerId: customerIdFinal, serviceId,
        status: STATUS.SUBMITTED,
        trackingCode: generateTrackingCode(),
        formData: JSON.stringify(formDataValues),
        createdByStaffId: session.sub,
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
            uploadedByType: "STAFF", uploadedByName: session.name,
          },
        });
      } catch (e) {
        console.error("FILE_UPLOAD_ERROR", e);
      }
    }

    await db.requestStatusHistory.create({
      data: {
        requestId: request.id, toStatus: STATUS.SUBMITTED,
        note: note || "تم إدخال الطلب من المكتب نيابةً عن العميل",
        actorType: "STAFF", actorName: session.name,
      },
    });

    // إنشاء ملف شحنة تلقائياً لخدمات التخليص
    if (service.isClearance) {
      const bl = formDataValues["bl_number"];
      await db.shipment.create({
        data: {
          requestId: request.id, officeId,
          billOfLadingNo: bl || null,
          containerNos: formDataValues["container_no"] || null,
          importerName: customer?.name || null,
          originCountry: formDataValues["origin"] || null,
          arrivalDate: formDataValues["arrival_date"] ? new Date(formDataValues["arrival_date"]) : null,
          checklist: {
            create: requiredDocs.map((d, i) => ({ label: d.name, sortOrder: i })),
          },
        },
      });
    }

    // إشعار العميل برقم الطلب ورابط التتبع
    await notify({
      officeId, requestId: request.id,
      event: "NEW_REQUEST",
      customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone, whatsapp: customer.whatsapp, email: customer.email } : null,
      variables: {
        request_number: requestNumber,
        client_name: customer?.name || newCustomerName,
        service_name: service.name,
        track_link: `/track/${request.trackingCode}`,
      },
      link: `/track/${request.trackingCode}`,
    });
    await notifyStaff(officeId, "NEW_REQUEST", "طلب جديد (أُدخل من المكتب)", `طلب ${requestNumber} لخدمة ${service.name} — أدخله ${session.name} نيابةً عن ${customer?.name || newCustomerName}.`, { requestId: request.id });

    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "Request", request.id, officeId, { requestNumber, onBehalf: true, customer: customer?.name || newCustomerName });

    revalidatePath("/office/requests");
    // التحويل لصفحة الطلب
    const { redirect } = await import("next/navigation");
    redirect(`/office/requests/${request.id}?created=1`);
  } catch (e: any) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "خطأ غير متوقع" };
  }
}

// ============ تسليم/إقفال مع تسوية ============
export async function closeRequest(requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await loadRequestContext(requestId);
    if (![STATUS.READY, STATUS.COMPLETED].includes(req.status as string)) {
      return { ok: false, error: "الإقفال متاح فقط بعد الاكتمال" };
    }
    // التحقق من تسوية الحساب
    const totals = await db.costItem.aggregate({ where: { requestId }, _sum: { amountBase: true } });
    const paid = await db.payment.aggregate({ where: { requestId }, _sum: { amountBase: true } });
    const remaining = (totals._sum.amountBase || 0) - (paid._sum.amountBase || 0);
    if (remaining > 0.5) {
      return { ok: false, error: `لا يمكن الإقفال — المتبقي على العميل: ${Math.round(remaining).toLocaleString("ar-YE")} ر.ي` };
    }
    await db.request.update({ where: { id: requestId }, data: { status: STATUS.DELIVERED, deliveredAt: new Date() } });
    await db.requestStatusHistory.create({
      data: { requestId, fromStatus: req.status, toStatus: STATUS.DELIVERED, note: "تم الإقفال بعد تسوية الحساب", actorType: "STAFF", actorName: session.name },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "STATUS_CHANGE", "Request", requestId, officeId, { to: STATUS.DELIVERED });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم إقفال الطلب" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
