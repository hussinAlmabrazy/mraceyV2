"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficeUser, SessionError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { can } from "@/lib/rbac";
import { SERVICE_TEMPLATES } from "@/lib/seed-data";

type ActionResult = { ok: boolean; error?: string; message?: string };

async function requireAdmin() {
  const { session, officeId } = await requireOfficeUser();
  if (!can(session.role, "services.manage") && session.role !== "OFFICE_ADMIN") {
    throw new Error("لا تملك صلاحية إدارة الكتالوج");
  }
  return { session, officeId };
}

// ============ التصنيفات ============
export async function saveCategory(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم التصنيف مطلوب" };
    if (id) {
      await db.serviceCategory.update({ where: { id, officeId }, data: { name } });
    } else {
      const count = await db.serviceCategory.count({ where: { officeId } });
      await db.serviceCategory.create({ data: { officeId, name, sortOrder: count } });
    }
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, id ? "UPDATE" : "CREATE", "ServiceCategory", id || name, officeId);
    revalidatePath("/office/services");
    return { ok: true, message: "تم حفظ التصنيف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireAdmin();
    const count = await db.service.count({ where: { categoryId: id, officeId } });
    if (count > 0) return { ok: false, error: `لا يمكن حذف تصنيف يحتوي ${count} خدمة` };
    await db.serviceCategory.delete({ where: { id, officeId } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "DELETE", "ServiceCategory", id, officeId);
    revalidatePath("/office/services");
    return { ok: true, message: "تم حذف التصنيف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الخدمات ============
export async function saveService(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم الخدمة مطلوب" };
    const priceRaw = String(formData.get("price") || "").trim();
    const priceLabel = String(formData.get("priceLabel") || "").trim();
    const data: any = {
      name,
      description: String(formData.get("description") || "").trim() || null,
      categoryId: String(formData.get("categoryId") || "") || null,
      price: priceRaw ? parseFloat(priceRaw) : null,
      priceLabel: priceRaw ? null : (priceLabel || "حسب الطلب"),
      currency: String(formData.get("currency") || "YER"),
      estimatedDays: parseInt(String(formData.get("estimatedDays") || "7")) || 7,
      isClearance: formData.get("isClearance") === "on",
      icon: String(formData.get("icon") || "").trim() || null,
    };
    let serviceId = id;
    if (id) {
      await db.service.update({ where: { id, officeId }, data });
    } else {
      const count = await db.service.count({ where: { officeId } });
      const created = await db.service.create({ data: { ...data, officeId, sortOrder: count } });
      serviceId = created.id;
    }
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, id ? "UPDATE" : "CREATE", "Service", serviceId, officeId, { name });
    revalidatePath("/office/services");
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم حفظ الخدمة", id: serviceId };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function toggleService(id: string, active: boolean): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    await db.service.update({ where: { id, officeId }, data: { isActive: active } });
    revalidatePath("/office/services");
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireAdmin();
    const count = await db.request.count({ where: { serviceId: id, officeId } });
    if (count > 0) {
      // لا حذف نهائي لخدمة لها طلبات — تعطيل فقط (قاعدة الأرشفة)
      await db.service.update({ where: { id, officeId }, data: { isActive: false } });
      revalidatePath("/office/services");
      return { ok: true, message: `الخدمة مرتبطة بـ ${count} طلب — تم تعطيلها بدلاً من الحذف` };
    }
    await db.service.delete({ where: { id, officeId } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "DELETE", "Service", id, officeId);
    revalidatePath("/office/services");
    return { ok: true, message: "تم حذف الخدمة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ المستندات المطلوبة للخدمة ============
export async function saveServiceDoc(serviceId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "الخدمة غير موجودة" };
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم المستند مطلوب" };
    const data = {
      name,
      description: String(formData.get("description") || "").trim() || null,
      isMandatory: formData.get("isMandatory") === "on",
      allowedFormats: String(formData.get("allowedFormats") || "PDF,JPG,PNG"),
      maxSizeMb: parseInt(String(formData.get("maxSizeMb") || "10")) || 10,
    };
    if (id) {
      await db.serviceRequiredDocument.update({ where: { id, serviceId }, data });
    } else {
      const count = await db.serviceRequiredDocument.count({ where: { serviceId } });
      await db.serviceRequiredDocument.create({ data: { ...data, serviceId, sortOrder: count } });
    }
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم حفظ المستند المطلوب" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteServiceDoc(docId: string, serviceId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "غير مصرح" };
    await db.serviceRequiredDocument.delete({ where: { id: docId, serviceId } });
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم الحذف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ مراحل التتبع ============
export async function saveServiceStage(serviceId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "الخدمة غير موجودة" };
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    if (!name) return { ok: false, error: "اسم المرحلة مطلوب" };
    const data = {
      name,
      isVisibleToClient: formData.get("isVisibleToClient") === "on",
      notifyClient: formData.get("notifyClient") === "on",
    };
    if (id) {
      await db.serviceStage.update({ where: { id, serviceId }, data });
    } else {
      const count = await db.serviceStage.count({ where: { serviceId } });
      await db.serviceStage.create({ data: { ...data, serviceId, sortOrder: count } });
    }
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم حفظ المرحلة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteServiceStage(stageId: string, serviceId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "غير مصرح" };
    await db.serviceStage.delete({ where: { id: stageId, serviceId } });
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم الحذف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function moveServiceStage(stageId: string, serviceId: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId }, include: { stages: { orderBy: { sortOrder: "asc" } } } });
    if (!svc) return { ok: false, error: "غير مصرح" };
    const idx = svc.stages.findIndex((s) => s.id === stageId);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || targetIdx < 0 || targetIdx >= svc.stages.length) return { ok: true };
    const current = svc.stages[idx];
    const target = svc.stages[targetIdx];
    await db.$transaction([
      db.serviceStage.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
      db.serviceStage.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } }),
    ]);
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ منشئ النماذج الديناميكي ============
export async function saveFormField(serviceId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "الخدمة غير موجودة" };
    const id = String(formData.get("id") || "");
    const label = String(formData.get("label") || "").trim();
    if (!label) return { ok: false, error: "عنوان الحقل مطلوب" };
    const key = String(formData.get("key") || "").trim() || `f_${Date.now()}`;
    const type = String(formData.get("type") || "TEXT");
    const data = {
      key, label, type,
      options: type === "SELECT" ? String(formData.get("options") || "").trim() : null,
      isRequired: formData.get("isRequired") === "on",
      placeholder: String(formData.get("placeholder") || "").trim() || null,
    };
    if (id) {
      await db.formField.update({ where: { id, serviceId }, data });
    } else {
      const count = await db.formField.count({ where: { serviceId } });
      await db.formField.create({ data: { ...data, serviceId, sortOrder: count } });
    }
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم حفظ الحقل" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteFormField(fieldId: string, serviceId: string): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId } });
    if (!svc) return { ok: false, error: "غير مصرح" };
    await db.formField.delete({ where: { id: fieldId, serviceId } });
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true, message: "تم الحذف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function moveFormField(fieldId: string, serviceId: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    const { officeId } = await requireAdmin();
    const svc = await db.service.findFirst({ where: { id: serviceId, officeId }, include: { formFields: { orderBy: { sortOrder: "asc" } } } });
    if (!svc) return { ok: false, error: "غير مصرح" };
    const idx = svc.formFields.findIndex((f) => f.id === fieldId);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || targetIdx < 0 || targetIdx >= svc.formFields.length) return { ok: true };
    const current = svc.formFields[idx];
    const target = svc.formFields[targetIdx];
    await db.$transaction([
      db.formField.update({ where: { id: current.id }, data: { sortOrder: target.sortOrder } }),
      db.formField.update({ where: { id: target.id }, data: { sortOrder: current.sortOrder } }),
    ]);
    revalidatePath(`/office/services/${serviceId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ نسخ من قالب جاهز (FR-OF-06) ============
export async function createFromTemplate(templateName: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireAdmin();
    const tpl = SERVICE_TEMPLATES.find((t) => t.name === templateName);
    if (!tpl) return { ok: false, error: "القالب غير موجود" };

    // التصنيف
    let category = await db.serviceCategory.findFirst({ where: { officeId, name: tpl.categoryName } });
    if (!category) {
      const count = await db.serviceCategory.count({ where: { officeId } });
      category = await db.serviceCategory.create({ data: { officeId, name: tpl.categoryName, sortOrder: count } });
    }

    const existing = await db.service.findFirst({ where: { officeId, name: tpl.name } });
    const finalName = existing ? `${tpl.name} (نسخة)` : tpl.name;

    const service = await db.service.create({
      data: {
        officeId,
        categoryId: category.id,
        name: finalName,
        description: tpl.description,
        icon: tpl.icon,
        price: tpl.price,
        priceLabel: tpl.priceLabel,
        estimatedDays: tpl.estimatedDays,
        isClearance: tpl.isClearance,
        requiredDocs: { create: tpl.requiredDocs.map((d, i) => ({ name: d.name, isMandatory: d.isMandatory, description: d.description, sortOrder: i })) },
        stages: { create: (tpl.stages || []).map((name, i) => ({ name, sortOrder: i, isVisibleToClient: true, notifyClient: i === (tpl.stages || []).length - 1 })) },
        formFields: { create: tpl.formFields.map((f, i) => ({ key: f.key, label: f.label, type: f.type, options: f.options, isRequired: f.isRequired, placeholder: f.placeholder, sortOrder: i })) },
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "Service", service.id, officeId, { fromTemplate: templateName });
    revalidatePath("/office/services");
    return { ok: true, message: `تم نسخ القالب: ${finalName}`, id: service.id };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
