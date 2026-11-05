"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireOfficeUser, SessionError } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { getExchangeRate, formatMoney, formatDateAr } from "@/lib/business";
import { saveUpload } from "@/lib/files";
import { can } from "@/lib/rbac";

type ActionResult = { ok: boolean; error?: string; message?: string };

// ============ بنود التكلفة ============
export async function addCostItem(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك صلاحية إدارة الحسابات" };
    const req = await db.request.findFirst({
      where: { id: requestId, officeId },
      include: { customer: true, service: { select: { name: true } } },
    });
    if (!req) return { ok: false, error: "الطلب غير موجود" };

    const label = String(formData.get("label") || "").trim();
    const amount = parseFloat(String(formData.get("amount") || "0"));
    const category = String(formData.get("category") || "OTHER");
    const currency = String(formData.get("currency") || "YER");
    const isOfficeFee = formData.get("isOfficeFee") === "on" || formData.get("isOfficeFee") === "true";
    if (!label || !amount || amount <= 0) return { ok: false, error: "البيان والمبلغ مطلوبان" };

    const rate = await getExchangeRate(officeId, currency);
    await db.costItem.create({
      data: {
        officeId, requestId,
        category, label, amount, currency,
        exchangeRate: rate,
        amountBase: amount * rate,
        isOfficeFee,
        note: String(formData.get("note") || "").trim() || null,
        createdByName: session.name,
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "CostItem", requestId, officeId, { label, amount, currency });
    revalidatePath(`/office/requests/${requestId}`);
    revalidatePath("/office/finance");
    return { ok: true, message: "تمت إضافة بند التكلفة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function deleteCostItem(itemId: string, requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك الصلاحية" };
    const item = await db.costItem.findFirst({ where: { id: itemId, officeId } });
    if (!item) return { ok: false, error: "غير موجود" };
    // لا حذف نهائي — أرشفة (قاعدة العمل): نكتفي بمنع الحذف بعد الفاتورة
    const invoiced = await db.invoice.findFirst({ where: { requestId: item.requestId, status: { in: ["SENT", "PAID"] } } });
    if (invoiced) return { ok: false, error: "لا يمكن حذف بند مرتبط بفاتورة صادرة" };
    await db.costItem.delete({ where: { id: itemId } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "DELETE", "CostItem", itemId, officeId, { archived: false, label: item.label });
    revalidatePath(`/office/requests/${requestId}`);
    return { ok: true, message: "تم حذف البند" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ دفعات العميل ============
export async function addPayment(formData: FormData): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك صلاحية إدارة الحسابات" };
    const customerId = String(formData.get("customerId") || "");
    const requestId = String(formData.get("requestId") || "") || null;
    const amount = parseFloat(String(formData.get("amount") || "0"));
    const currency = String(formData.get("currency") || "YER");
    const method = String(formData.get("method") || "CASH");
    if (!customerId || !amount || amount <= 0) return { ok: false, error: "العميل والمبلغ مطلوبان" };

    const customer = await db.customer.findFirst({ where: { id: customerId, officeId } });
    if (!customer) return { ok: false, error: "العميل غير موجود" };

    let attachmentPath: string | null = null;
    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      const saved = await saveUpload(file, officeId, `payments/${customerId}`);
      attachmentPath = saved.path;
    }

    const rate = await getExchangeRate(officeId, currency);
    const payment = await db.payment.create({
      data: {
        officeId, customerId, requestId,
        amount, currency, exchangeRate: rate, amountBase: amount * rate,
        method,
        reference: String(formData.get("reference") || "").trim() || null,
        note: String(formData.get("note") || "").trim() || null,
        attachmentPath,
        receivedByName: session.name,
      },
    });

    // إشعار استحقاق/سداد للعميل
    if (requestId) {
      const req = await db.request.findUnique({ where: { id: requestId }, include: { service: true } });
      if (req) {
        await notify({
          officeId, requestId,
          event: "PAYMENT_DUE",
          customer,
          variables: {
            request_number: req.requestNumber,
            client_name: customer.name,
            service_name: req.service.name,
            track_link: `/track/${req.trackingCode}`,
            remaining: formatMoney(amount, currency) + " (مسددة)",
          },
          link: `/track/${req.trackingCode}`,
        });
      }
    }

    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "PAYMENT", "Payment", payment.id, officeId, { amount, currency, customerId, requestId });
    revalidatePath(`/office/requests/${requestId || ""}`);
    revalidatePath("/office/finance");
    return { ok: true, message: "تم تسجيل الدفعة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ الفواتير ============
export async function createInvoice(requestId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك الصلاحية" };
    const req = await db.request.findFirst({
      where: { id: requestId, officeId },
      include: { costItems: true, customer: true },
    });
    if (!req) return { ok: false, error: "الطلب غير موجود" };
    if (req.costItems.length === 0) return { ok: false, error: "أضف بنود التكلفة أولاً" };

    const existing = await db.invoice.findFirst({ where: { requestId, status: { not: "CANCELLED" } } });
    if (existing) return { ok: false, error: `توجد فاتورة سابقة لهذا الطلب: ${existing.invoiceNumber}` };

    const year = new Date().getFullYear();
    const count = await db.invoice.count({ where: { officeId } });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, "0")}`;

    const items = req.costItems.map((c) => ({
      label: c.label,
      amount: c.amount,
      currency: c.currency,
      isOfficeFee: c.isOfficeFee,
      category: c.category,
    }));
    const totalBase = req.costItems.reduce((a, c) => a + c.amountBase, 0);

    const invoice = await db.invoice.create({
      data: {
        officeId, customerId: req.customerId, requestId,
        invoiceNumber,
        items: JSON.stringify(items),
        subtotal: totalBase,
        total: totalBase,
        currency: "YER",
        status: "SENT",
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 86400000),
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "Invoice", invoice.id, officeId, { invoiceNumber, total: totalBase });
    revalidatePath(`/office/requests/${requestId}`);
    revalidatePath("/office/invoices");
    return { ok: true, message: `تم إصدار الفاتورة ${invoiceNumber}` };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, status: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك الصلاحية" };
    const invoice = await db.invoice.findFirst({ where: { id: invoiceId, officeId } });
    if (!invoice) return { ok: false, error: "الفاتورة غير موجودة" };
    await db.invoice.update({ where: { id: invoiceId }, data: { status } });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "Invoice", invoiceId, officeId, { status });
    revalidatePath("/office/invoices");
    if (invoice.requestId) revalidatePath(`/office/requests/${invoice.requestId}`);
    return { ok: true, message: "تم تحديث حالة الفاتورة" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

// ============ كشف حساب (مشاركة) ============
export async function shareStatement(customerId: string): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    const customer = await db.customer.findFirst({ where: { id: customerId, officeId } });
    if (!customer) return { ok: false, error: "العميل غير موجود" };
    // حساب الرصيد
    const costs = await db.costItem.aggregate({
      where: { officeId, request: { customerId } },
      _sum: { amountBase: true },
    });
    const payments = await db.payment.aggregate({ where: { officeId, customerId }, _sum: { amountBase: true } });
    const remaining = (costs._sum.amountBase || 0) - (payments._sum.amountBase || 0);
    await notify({
      officeId,
      event: "PAYMENT_DUE",
      customer,
      variables: {
        client_name: customer.name,
        request_number: "—",
        service_name: "كشف حساب",
        track_link: "/o/portal",
        remaining: formatMoney(Math.abs(remaining), "YER") + (remaining > 0 ? " (متبقٍ)" : " (رصيد دائن)"),
      },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "CREATE", "Statement", customerId, officeId, { shared: true, remaining });
    return { ok: true, message: "تم إرسال كشف الحساب للعميل عبر الإشعارات" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}

export async function updateExchangeRate(currency: string, rate: number): Promise<ActionResult> {
  try {
    const { session, officeId } = await requireOfficeUser();
    if (!can(session.role, "finance.manage")) return { ok: false, error: "لا تملك الصلاحية" };
    if (rate <= 0) return { ok: false, error: "سعر الصرف غير صالح" };
    await db.exchangeRate.upsert({
      where: { officeId_currency: { officeId, currency } },
      update: { rate },
      create: { officeId, currency, rate },
    });
    await audit({ actorType: "STAFF", actorId: session.sub, actorName: session.name }, "UPDATE", "ExchangeRate", currency, officeId, { rate });
    revalidatePath("/office/finance");
    return { ok: true, message: "تم تحديث سعر الصرف" };
  } catch (e) {
    if (e instanceof SessionError) redirect("/office/login?expired=1");
    if ((e as any)?.digest?.startsWith("NEXT_REDIRECT")) throw e;
    return { ok: false, error: e instanceof Error ? e.message : "خطأ" };
  }
}
