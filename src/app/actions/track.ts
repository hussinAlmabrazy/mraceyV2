"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/** التتبع برقم الطلب + رقم الجوال — يوجّه للرابط العشوائي بعد التحقق */
export async function trackByNumber(_prev: { error?: string } | undefined, formData: FormData): Promise<{ error?: string } | undefined> {
  const number = String(formData.get("number") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!number || !phone) return { error: "أدخل رقم الطلب ورقم الجوال المسجل" };

  // توحيد صيغة الجوال للمطابقة (آخر 9 أرقام)
  const normalize = (p: string) => p.replace(/[^0-9]/g, "").slice(-9);
  const phoneNorm = normalize(phone);

  const requests = await db.request.findMany({
    where: { requestNumber: number },
    include: { customer: { select: { phone: true, whatsapp: true } } },
  });
  const req = requests.find((r) => {
    const p = normalize(r.customer.phone || "") || normalize(r.customer.whatsapp || "");
    return p && p === phoneNorm;
  });
  if (!req) return { error: "لا يوجد طلب بهذه البيانات — تأكد من رقم الطلب ورقم الجوال" };

  redirect(`/track/${req.trackingCode}`);
}
