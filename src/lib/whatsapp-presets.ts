// ============ قوالب رسائل واتساب الجاهزة لزر «إبلاغ العميل» ============
// وحدة خادمية: تقرأ قوالب واتساب الفعّالة من قاعدة البيانات (قوالب المكتب
// تتقدم على القوالب العامة) وتعبّئها بمتغيرات الطلب الحالي — فيرسل الموظف
// الإشعار بضغطة واحدة عبر wa.me مجاناً دون أي مزود وسيط.

import { db } from "@/lib/db";
import { renderTemplate } from "@/lib/notify";

export type WaPreset = { event: string; label: string; text: string };

/** أحداث الإشعارات المناسبة للإرسال اليدوي للعميل — بترتيب رحلة الطلب */
const MANUAL_EVENTS: { event: string; label: string }[] = [
  { event: "NEW_REQUEST", label: "تأكيد استلام الطلب" },
  { event: "ACCEPTED", label: "إبلاغ بقبول الطلب" },
  { event: "MISSING_DOCS", label: "طلب مستندات ناقصة" },
  { event: "STAGE_CHANGE", label: "تحديث المرحلة الحالية" },
  { event: "PAYMENT_DUE", label: "تذكير بالمستحق المالي" },
  { event: "COMPLETED", label: "إبلاغ باكتمال المعاملة" },
  { event: "REJECTED", label: "إبلاغ بالرفض" },
];

/**
 * بناء رسائل واتساب الجاهزة لطلب معيّن:
 * - يجلب قوالب WHATSAPP الفعّالة (قالب المكتب أولاً ثم العام)
 * - يعبّئها بالمتغيرات (اسم العميل، رقم الطلب، رابط التتبع المطلق...)
 * - يضيف توقيع المكتب في نهاية كل رسالة
 */
export async function buildRequestWaPresets(opts: {
  officeId: string;
  vars: Record<string, string>;
  signature: string;
}): Promise<WaPreset[]> {
  const templates = await db.notificationTemplate.findMany({
    where: {
      OR: [{ officeId: opts.officeId }, { officeId: null }],
      channel: "WHATSAPP",
      isActive: true,
      event: { in: MANUAL_EVENTS.map((e) => e.event) },
    },
    orderBy: [{ officeId: "desc" }], // قالب المكتب يتقدم على العام
  });

  // قالب واحد لكل حدث (الأول حسب الترتيب أعلاه)
  const byEvent = new Map<string, (typeof templates)[number]>();
  for (const t of templates) {
    if (!byEvent.has(t.event)) byEvent.set(t.event, t);
  }

  const presets: WaPreset[] = [];
  for (const { event, label } of MANUAL_EVENTS) {
    const tpl = byEvent.get(event);
    if (!tpl) continue;
    const text = renderTemplate(tpl.body, opts.vars) + opts.signature;
    presets.push({ event, label, text });
  }
  return presets;
}
