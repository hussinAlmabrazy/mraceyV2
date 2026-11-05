"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficeUser, SessionError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveUpload } from "@/lib/files";

type ActionResult = { ok: boolean; error?: string; message?: string };

async function guardRequest(requestId: string) {
  const { session, officeId } = await requireOfficeUser();
  const req = await db.request.findFirst({ where: { id: requestId, officeId }, select: { id: true, requestNumber: true } });
  if (!req) throw new Error("الطلب غير موجود");
  return { session, officeId, req };
}

// ============ بيانات الشحنة ============
export async function updateShipment(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await guardRequest(requestId);
    const data: any = {};
    const str = (k: string) => String(formData.get(k) || "").trim();
    if (str("billOfLadingNo")) data.billOfLadingNo = str("billOfLadingNo");
    if (str("containerNos")) data.containerNos = str("containerNos");
    if (str("containerType")) data.containerType = str("containerType");
    if (str("supplierName")) data.supplierName = str("supplierName");
    data.importerName = str("importerName") || null;
    if (str("originCountry")) data.originCountry = str("originCountry");
    if (str("arrivalPort")) data.arrivalPort = str("arrivalPort");
    if (str("carrier")) data.carrier = str("carrier");
    if (str("arrivalDate")) data.arrivalDate = new Date(str("arrivalDate"));
    if (str("declarationNo")) data.declarationNo = str("declarationNo");
    if (str("goodsType")) data.goodsType = str("goodsType");
    if (str("weight")) data.weight = parseFloat(str("weight")) || null;
    if (str("packagesCount")) data.packagesCount = parseInt(str("packagesCount")) || null;
    if (str("value")) data.value = parseFloat(str("value")) || null;
    if (str("currency")) data.currency = str("currency");

    const existing = await db.shipment.findUnique({ where: { requestId } });
    if (existing) {
      await db.shipment.update({ where: { requestId }, data });
    } else {
      await db.shipment.create({ data: { requestId, officeId, ...data } });
    }
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Shipment", requestId, officeId, { requestNumber: req.requestNumber });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم حفظ بيانات الشحنة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ بنود البضاعة (HS Code) ============
export async function addShipmentItem(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await guardRequest(requestId);
    const shipment = await db.shipment.findUnique({ where: { requestId } });
    if (!shipment) return { ok: false, error: "أنشئ ملف الشحنة أولاً" };
    const description = String(formData.get("description") || "").trim();
    if (!description) return { ok: false, error: "وصف البند مطلوب" };
    const hsCodeId = String(formData.get("hsCodeId") || "") || null;
    const hsCodeText = String(formData.get("hsCodeText") || "").trim() || null;
    const value = parseFloat(String(formData.get("value") || "0")) || 0;
    const dutyRate = parseFloat(String(formData.get("dutyRate") || "0")) || 0;
    const salesTaxRate = parseFloat(String(formData.get("salesTaxRate") || "0")) || 0;

    await db.shipmentItem.create({
      data: {
        shipmentId: shipment.id,
        description,
        hsCodeId,
        hsCodeText,
        originCountry: String(formData.get("originCountry") || "").trim() || null,
        quantity: parseFloat(String(formData.get("quantity") || "0")) || null,
        unit: String(formData.get("unit") || "").trim() || null,
        weight: parseFloat(String(formData.get("weight") || "0")) || null,
        value,
        currency: String(formData.get("currency") || "USD"),
        dutyRate,
      },
    });
    // ملاحظة: salesTaxRate يُقرأ من جدول HS عند الحساب التقديري
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "ShipmentItem", shipment.id, officeId, { description, hsCodeText, requestNumber: req.requestNumber });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تمت إضافة البند" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteShipmentItem(itemId: string, requestId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    const item = await db.shipmentItem.findFirst({
      where: { id: itemId, shipment: { officeId, requestId } },
    });
    if (!item) return { ok: false, error: "البند غير موجود" };
    await db.shipmentItem.delete({ where: { id: itemId } });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم حذف البند" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ سجل الجهات الرقابية ============
export async function saveRegulatoryStep(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await guardRequest(requestId);
    const shipment = await db.shipment.findUnique({ where: { requestId } });
    if (!shipment) return { ok: false, error: "أنشئ ملف الشحنة أولاً" };
    const stepId = String(formData.get("stepId") || "");
    const title = String(formData.get("title") || "").trim();
    if (!title) return { ok: false, error: "عنوان الإجراء مطلوب" };
    const data: any = {
      type: String(formData.get("type") || "OTHER"),
      title,
      scheduledAt: String(formData.get("scheduledAt") || "") ? new Date(String(formData.get("scheduledAt"))) : null,
      result: String(formData.get("result") || "") || null,
      notes: String(formData.get("notes") || "").trim() || null,
      status: String(formData.get("result") || "") === "PASS" || String(formData.get("result") || "") === "ISSUE" ? "DONE" : "PENDING",
    };
    // مرفق (محضر/صورة)
    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      const saved = await saveUpload(file, officeId, `requests/${requestId}/steps`);
      data.attachmentPath = saved.path;
    }
    if (stepId) {
      await db.regulatoryStep.update({ where: { id: stepId }, data });
    } else {
      await db.regulatoryStep.create({ data: { shipmentId: shipment.id, ...data } });
    }
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, stepId ? "UPDATE" : "CREATE", "RegulatoryStep", stepId || shipment.id, officeId, { title, requestNumber: req.requestNumber });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم حفظ الإجراء" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteRegulatoryStep(stepId: string, requestId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    const step = await db.regulatoryStep.findFirst({ where: { id: stepId, shipment: { officeId, requestId } } });
    if (!step) return { ok: false, error: "غير موجود" };
    await db.regulatoryStep.delete({ where: { id: stepId } });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ قائمة التحقق ============
export async function toggleChecklistItem(itemId: string, done: boolean, requestId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    const item = await db.checklistItem.findFirst({ where: { id: itemId, shipment: { officeId, requestId } } });
    if (!item) return { ok: false, error: "غير موجود" };
    await db.checklistItem.update({ where: { id: itemId }, data: { isDone: done, doneAt: done ? new Date() : null } });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function addChecklistItem(requestId: string, label: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireOfficeUser();
    const shipment = await db.shipment.findUnique({ where: { requestId } });
    if (!shipment || shipment.officeId !== officeId) return { ok: false, error: "غير موجود" };
    const count = await db.checklistItem.count({ where: { shipmentId: shipment.id } });
    await db.checklistItem.create({ data: { shipmentId: shipment.id, label, sortOrder: count } });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ إذن الإفراج النهائي ============
export async function setReleasePermit(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId, req } = await guardRequest(requestId);
    const shipment = await db.shipment.findUnique({ where: { requestId } });
    if (!shipment) return { ok: false, error: "ملف الشحنة غير موجود" };
    const permitNo = String(formData.get("releasePermitNo") || "").trim();
    const permitDate = String(formData.get("releasePermitAt") || "");
    const file = formData.get("permitFile") as File | null;
    let attachmentPath: string | null = shipment.releasePermitPath;
    if (file && file.size > 0) {
      const saved = await saveUpload(file, officeId, `requests/${requestId}/permits`);
      attachmentPath = saved.path;
    }
    await db.shipment.update({
      where: { requestId },
      data: {
        releasePermitNo: permitNo || null,
        releasePermitAt: permitDate ? new Date(permitDate) : null,
        releasePermitPath: attachmentPath,
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Shipment", requestId, officeId, { releasePermitNo: permitNo, requestNumber: req.requestNumber });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم حفظ إذن الإفراج" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
