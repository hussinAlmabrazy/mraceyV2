"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Inbox, Clock, CheckCircle2, Wallet, AlertTriangle, TrendingUp, Landmark, Receipt,
  FileText, Users, Package, LayoutDashboard, Building2, Search, Bell, ClipboardList, Boxes, FileQuestion,
} from "lucide-react";

const ICONS: Record<string, any> = {
  inbox: Inbox, clock: Clock, check: CheckCircle2, wallet: Wallet, alert: AlertTriangle,
  trending: TrendingUp, landmark: Landmark, receipt: Receipt, file: FileText, users: Users,
  package: Package, dashboard: LayoutDashboard, building: Building2, search: Search,
  bell: Bell, clipboard: ClipboardList, boxes: Boxes, question: FileQuestion,
};

export function StatCard({
  title, value, sub, icon = "inbox", tone = "teal", className,
}: {
  title: string; value: string | number; sub?: string; icon?: string; tone?: "teal" | "amber" | "emerald" | "rose" | "violet" | "cyan"; className?: string;
}) {
  const Icon = ICONS[icon] || Inbox;
  const tones: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
  };
  return (
    <Card className={cn("border-border/60 shadow-sm hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight nums">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
        </div>
        <div className={cn("shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ icon = "inbox", title, description, action }: { icon?: string; title: string; description?: string; action?: React.ReactNode }) {
  const Icon = ICONS[icon] || Inbox;
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-bold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** أيقونة خدمة حسب الاسم المخزن */
export function ServiceIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const map: Record<string, string> = {
    container: "🏷️", package: "📦", "shield-check": "🛡️", route: "🚚",
    receipt: "🧾", "file-badge": "📋", plane: "✈️", hotel: "🏨", visa: "🛂", umrah: "🕋",
  };
  return <span className={cn("text-xl", className)}>{(icon && map[icon]) || "📄"}</span>;
}
