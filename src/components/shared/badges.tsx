import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_STYLES, DOC_STATUS_LABELS, DOC_STATUS_STYLES } from "@/lib/constants";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", STATUS_STYLES[status] || "bg-slate-100 text-slate-700 border-slate-200", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function DocStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", DOC_STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200", className)}>
      {DOC_STATUS_LABELS[status] || status}
    </span>
  );
}

export function PlainBadge({ children, tone = "slate", className }: { children: React.ReactNode; tone?: "slate" | "teal" | "amber" | "emerald" | "rose" | "violet" | "cyan" | "orange"; className?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    teal: "bg-teal-50 text-teal-800 border-teal-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
    violet: "bg-violet-50 text-violet-800 border-violet-200",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200",
    orange: "bg-orange-50 text-orange-800 border-orange-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}
