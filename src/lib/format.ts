// ============ دوال التنسيق العامة (تعمل في الخادم والعميل) ============
import { CURRENCIES } from "@/lib/constants";

/** عملة العرض بالتنسيق المحلي */
export function formatMoney(amount: number, currency: string): string {
  const cur = CURRENCIES[currency];
  const formatted = new Intl.NumberFormat("ar-YE-u-nu-latn", { maximumFractionDigits: 2 }).format(amount);
  return `${formatted} ${cur ? cur.symbol : currency}`;
}

export function formatDateAr(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat("ar-YE-u-nu-latn", {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function timeAgoAr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return formatDateAr(date);
}
