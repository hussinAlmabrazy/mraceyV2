"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateLicense, impersonateOffice } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyRound, RotateCcw, Power, Archive, UserRoundCog, Users, FileText, Building2, Send, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { formatDateAr, timeAgoAr } from "@/lib/format";
import { OFFICE_STATUS_LABELS, LICENSE_STATUS_LABELS, ROLE_LABELS } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

export function OfficeDetail({
  office, licenses, users, stats,
}: {
  office: {
    id: string; name: string; slug: string; status: string; city: string | null;
    managerName: string | null; email: string | null; phone: string | null;
    activityType: string; createdAt: Date;
  };
  licenses: { id: string; key: string; status: string; planName: string; startDate: Date | null; endDate: Date | null; activatedAt: Date | null; durationDays: number }[];
  users: { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt: Date | null }[];
  stats: { requestsCount: number; customersCount: number; servicesCount: number; messageLogs: number; monthlyReqs: number };
}) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const activeLicense = licenses.find((l) => l.status === "ACTIVE") || licenses[0];

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-5">
      {/* الرأس */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold">{office.name}</h1>
            <Badge variant="outline" className={`text-[11px] font-bold ${STATUS_STYLES[office.status]}`}>{OFFICE_STATUS_LABELS[office.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {office.managerName} · {office.city || "—"} · مسجل منذ {formatDateAr(office.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs font-bold">
            <a href={`/o/${office.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /> الصفحة العامة</a>
          </Button>
          <Button
            size="sm" variant="outline"
            className="gap-1.5 text-xs font-bold border-violet-300 text-violet-700 hover:bg-violet-50"
            disabled={pending}
            onClick={() => startTransition(async () => {
              const res = await impersonateOffice(office.id);
              if (res && !res.ok) toast.error(res.error);
            })}
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserRoundCog className="h-3.5 w-3.5" />} دخول بصفة انتحال (دعم)
          </Button>
        </div>
      </div>

      {/* الإحصاءات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "إجمالي الطلبات", value: stats.requestsCount, icon: FileText },
          { label: "طلبات الشهر", value: stats.monthlyReqs, icon: FileText },
          { label: "العملاء", value: stats.customersCount, icon: Users },
          { label: "الخدمات", value: stats.servicesCount, icon: Building2 },
          { label: "رسائل مرسلة", value: stats.messageLogs, icon: Send },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-3.5 text-center">
              <p className="text-lg font-extrabold nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* التراخيص */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> التراخيص والمفاتيح</CardTitle>
          <CardDescription className="text-xs mt-1">تجديد، إيقاف (يبقى التتبع للعملاء)، أرشفة — كل عملية تُسجَّل في سجل التدقيق</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {licenses.map((l) => (
            <div key={l.id} className="rounded-xl border p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <code className="rounded-lg bg-muted border px-3 py-1.5 text-xs font-extrabold nums tracking-wide" dir="ltr">{l.key}</code>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyKey(l.key)}>
                    {copied === l.key ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Badge variant="outline" className={`text-[10px] font-bold ${l.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : l.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    {LICENSE_STATUS_LABELS[l.status]}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold bg-muted">{l.planName}</Badge>
                </div>
                <div className="text-[11px] text-muted-foreground nums">
                  {l.startDate ? `${formatDateAr(l.startDate)} → ${formatDateAr(l.endDate)}` : `مدة ${l.durationDays} يوم بعد التفعيل`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50" disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await updateLicense(l.id, "renew", 365);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> تجديد سنة
                </Button>
                {l.status !== "PENDING" && (
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8 text-amber-700 border-amber-300 hover:bg-amber-50" disabled={pending}
                    onClick={() => startTransition(async () => {
                      const res = await updateLicense(l.id, office.status === "SUSPENDED" ? "activate" : "suspend");
                      if (res.ok) toast.success(res.message);
                      else toast.error(res.error);
                    })}
                  >
                    <Power className="h-3.5 w-3.5" /> {office.status === "SUSPENDED" ? "إعادة التفعيل" : "إيقاف مؤقت"}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8 text-rose-700 border-rose-300 hover:bg-rose-50" disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await updateLicense(l.id, "revoke");
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  <Archive className="h-3.5 w-3.5" /> أرشفة نهائية
                </Button>
              </div>
            </div>
          ))}
          {licenses.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد تراخيص</p>}
        </CardContent>
      </Card>

      {/* المستخدمون */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> مستخدمو المكتب ({users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">البريد</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">آخر دخول</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-bold">{u.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs nums" dir="ltr">{u.email}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold bg-muted">{ROLE_LABELS[u.role] || u.role}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-[11px] text-muted-foreground">{u.lastLoginAt ? timeAgoAr(u.lastLoginAt) : "أبداً"}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-bold ${u.isActive ? "text-emerald-700" : "text-rose-600"}`}>
                        {u.isActive ? "نشط" : "معطّل"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
