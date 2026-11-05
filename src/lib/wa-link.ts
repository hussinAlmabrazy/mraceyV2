// ============ روابط واتساب wa.me — مجانية 100% بلا وسيط ============
// وحدة نقية (بدون استيراد قاعدة بيانات) — آمنة للاستخدام في مكوّنات العميل والخادم

/**
 * تنظيف رقم هاتف إلى الصيغة الدولية التي يتطلبها wa.me:
 * أرقام فقط، بدون + أو مسافات أو شرطات، مع بادئة رمز الدولة.
 *
 * أمثلة:
 *   "+967 77 123 4567" → "967771234567"
 *   "00967 77 123 4567" → "967771234567"
 *   "0771234567"        → "967771234567"  (رقم يمني محلي)
 *   "771234567"         → "967771234567"  (يمني بدون صفر)
 */
export function sanitizeWaPhone(input?: string | null): string | null {
  if (!input) return null;
  let d = input.replace(/\D/g, ""); // الأرقام فقط
  if (!d) return null;

  // بادئة الاتصال الدولية 00 → حذف الأصفار البادئة
  if (d.startsWith("00")) d = d.replace(/^0+/, "");

  // رقم يمني محلي 07xxxxxxxx أو 7xxxxxxxx → إضافة 967
  if (/^07\d{8}$/.test(d)) d = "967" + d.slice(1);
  else if (/^7\d{8}$/.test(d)) d = "967" + d;

  return d || null;
}

/** بناء رابط wa.me مع نص جاهز مُعبأ مسبقاً (قابل للتعديل قبل الإرسال في واتساب) */
export function waMeUrl(phone: string, text?: string): string {
  const p = phone.replace(/\D/g, "");
  return text && text.trim() !== ""
    ? `https://wa.me/${p}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${p}`;
}

/** اللون الرسمي الداكن لواتساب — للاستخدام في الأزرار */
export const WHATSAPP_COLOR = "#1DA851";
