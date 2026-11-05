// ============ قواعد العمل (خادم فقط): أيام العمل، الأرقام، العملات ============
import "server-only";
import crypto from "crypto";
import { db } from "@/lib/db";

export { formatMoney, formatDateAr, timeAgoAr } from "@/lib/format";

/** توليد رقم طلب تسلسلي لكل مكتب: SLG-2026-0001 */
export async function nextRequestNumber(officeId: string): Promise<string> {
  const office = await db.office.update({
    where: { id: officeId },
    data: { reqCounter: { increment: 1 } },
    select: { reqCounter: true, slug: true },
  });
  const year = new Date().getFullYear();
  const prefix = office.slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "REQ";
  return `${prefix}-${year}-${String(office.reqCounter).padStart(4, "0")}`;
}

/** رمز تتبع عام عشوائي غير قابل للتخمين */
export function generateTrackingCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

/** توليد مفتاح ترخيص فريد */
export function generateLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from(crypto.randomBytes(4)).map((b) => alphabet[b % alphabet.length]).join("");
  return `MRX-${part()}-${part()}-${part()}`;
}

/** حساب التاريخ المتوقع للإنجاز بأيام العمل (استثناء الجمعة/السبت والعطل الرسمية) */
export function addBusinessDays(from: Date, days: number, holidays: string[] = []): Date {
  const holidaySet = new Set(holidays);
  const d = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 5=الجمعة 6=السبت
    if (day === 5 || day === 6) continue;
    const iso = d.toISOString().slice(0, 10);
    if (holidaySet.has(iso)) continue;
    remaining--;
  }
  return d;
}

/** جلب سعر الصرف مقابل الريال اليمني لمكتب معين */
export async function getExchangeRate(officeId: string, currency: string): Promise<number> {
  if (currency === "YER") return 1;
  const rate = await db.exchangeRate.findUnique({
    where: { officeId_currency: { officeId, currency } },
  });
  return rate?.rate ?? (currency === "USD" ? 1590 : currency === "SAR" ? 424 : 1);
}
