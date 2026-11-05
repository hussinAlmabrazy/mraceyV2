"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import { createOffice, updateLicense, impersonateOffice } from "@/app/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Search, KeyRound, Shield, Power, RotateCcw, UserRoundCog, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { formatDateAr } from "@/lib/format";
import { OFFICE_STATUS_LABELS } from "@/lib/constants";

type OfficeRow = {
  id: string; name: string; slug: string; status: string; city: string | null; managerName: string | null;
  email: string | null; phone: string | null; createdAt: Date;
  usersCount: number; customersCount: number; requestsCount: number; servicesCount: number; monthRequests: number;
  license: { id: string; key: string; status: string; endDate: Date | null; planName: string; planMaxUsers: number; planMaxReqs: number; daysLeft: number | null } | null;
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  SUSPENDED: "bg-rose-50 text-rose-700 border-rose-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

/** نموذج إنشاء المكتب — مكوّن مستقل حتى تُصفّر حالته عند إغلاق النافذة وفتحها مجدداً */
function CreateOfficeForm({ plans, onClose }: { plans: { id: string; name: string }[]; onClose: () => void }) {
  const [state, formAction] = useActionState(createOffice, undefined);
  const [copied, setCopied] = useState(false);
  // الحالة مشتقة مباشرة من نتيجة الـ action — لا حاجة لتخزينها في state وسيط
  const createdKey: string | null = (state as any)?.licenseKey ?? null;

  if (createdKey) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <p className="text-xs font-extrabold text-emerald-800 mb-2">✅ تم إنشاء المكتب وإرسال الدعوة</p>
          <p className="text-[11px] text-muted-foreground mb-3">مفتاح الترخيص (انسخه وأرسله للمكتب بوسيلة آمنة):</p>
          <div className="flex items-center justify-center gap-2">
            <code className="rounded-lg bg-white border px-4 py-2 text-sm font-extrabold nums tracking-wider" dir="ltr">{createdKey}</code>
            <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={async () => { await navigator.clipboard.writeText(createdKey); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <Button className="w-full font-bold" onClick={onClose}>تم — إغلاق</Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5 font-bold">{state.error}</p>}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold">اسم المكتب <span className="text-rose-500">*</span></label>
          <Input name="name" required placeholder="مثال: مكتب عدن للتخليص الجمركي" className="h-10 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">الرابط (slug) <span className="text-rose-500">*</span></label>
          <Input name="slug" required placeholder="aden-clearance" dir="ltr" className="h-10 text-xs nums" />
          <p className="text-[10px] text-muted-foreground">سيكون: /o/slug</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">نوع النشاط</label>
          <select name="activityType" defaultValue="CLEARANCE" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
            <option value="CLEARANCE">تخليص جمركي</option>
            <option value="TRAVEL">سفر وسياحة</option>
            <option value="BOTH">متعدد</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">بريد المسؤول <span className="text-rose-500">*</span></label>
          <Input name="email" type="email" required placeholder="manager@office.ye" dir="ltr" className="h-10 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">اسم المسؤول <span className="text-rose-500">*</span></label>
          <Input name="managerName" required className="h-10 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">الهاتف</label>
          <Input name="phone" dir="ltr" className="h-10 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">المدينة</label>
          <Input name="city" placeholder="عدن" className="h-10 text-xs" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">الباقة</label>
          <select name="planId" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">مدة الترخيص (يوم)</label>
          <Input name="durationDays" type="number" defaultValue={365} className="h-10 text-xs nums" dir="ltr" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        <Button type="submit" className="font-bold gap-1.5">
          <KeyRound className="h-4 w-4" /> إنشاء وتوليد المفتاح
        </Button>
      </DialogFooter>
    </form>
  );
}

export function OfficesManager({ offices, plans }: { offices: OfficeRow[]; plans: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Building2 className="h-6 w-6 text-primary" /> المكاتب والتراخيص</h1>
          <p className="text-sm text-muted-foreground mt-1">{offices.length} مكتب — التفعيل، التجديد، الإيقاف، والانتحال للدعم</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 font-bold"><Plus className="h-4 w-4" /> تسجيل مكتب جديد</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4.5 w-4.5 text-primary" /> تسجيل مكتب وتوليد مفتاح ترخيص</DialogTitle>
              <DialogDescription>تُرسل دعوة التفعيل بالبريد تتضمن المفتاح ورابط التفعيل — يُنشئ مدير المكتب كلمة مروره عند التفعيل</DialogDescription>
            </DialogHeader>
            <CreateOfficeForm plans={plans} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث */}
      <Card className="border-border/60">
        <CardContent className="p-3.5">
          <form method="get" className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="بحث: الاسم، الرابط، البريد، المسؤول" className="pr-8 h-9 text-xs" />
            </div>
            <select name="status" className="h-9 rounded-lg border border-input bg-card px-2 text-xs">
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="PENDING">بانتظار التفعيل</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="ARCHIVED">مؤرشف</option>
            </select>
            <Button type="submit" size="sm" className="h-9 text-xs font-bold">تصفية</Button>
          </form>
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right min-w-44">المكتب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right hidden md:table-cell">الباقة / الترخيص</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">الاستخدام</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">طلبات الشهر</TableHead>
                  <TableHead className="text-right min-w-36">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link href={`/admin/offices/${o.id}`} className="block min-w-0 group">
                        <p className="text-xs font-bold group-hover:text-primary transition-colors truncate max-w-44">{o.name}</p>
                        <p className="text-[10px] text-muted-foreground nums" dir="ltr">/o/{o.slug}</p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold ${STATUS_STYLES[o.status] || ""}`}>
                        {OFFICE_STATUS_LABELS[o.status] || o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {o.license ? (
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold">{o.license.planName}</p>
                          <p className="text-[10px] text-muted-foreground nums">
                            {o.license.endDate ? formatDateAr(o.license.endDate) : "غير مفعّل"}
                            {o.license.daysLeft != null && <span className={o.license.daysLeft <= 7 ? "text-rose-600 font-bold" : ""}> · {o.license.daysLeft} يوم</span>}
                          </p>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground nums">
                      {o.usersCount} موظف · {o.customersCount} عميل · {o.servicesCount} خدمة
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`text-xs nums font-bold ${o.license && o.monthRequests > o.license.planMaxReqs ? "text-rose-600" : ""}`}>
                        {o.monthRequests}
                        {o.license && <span className="text-muted-foreground text-[10px]"> / {o.license.planMaxReqs}</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="دخول بصفة انتحال للدعم">
                          <button onClick={() => startTransition(async () => {
                            const res = await impersonateOffice(o.id);
                            if (res && !res.ok) toast.error(res.error);
                          })}>
                            <UserRoundCog className="h-3.5 w-3.5 text-violet-600" />
                          </button>
                        </Button>
                        {o.license && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="تجديد سنة" disabled={pending}
                              onClick={() => startTransition(async () => {
                                const res = await updateLicense(o.license!.id, "renew", 365);
                                if (res.ok) toast.success(res.message);
                                else toast.error(res.error);
                              })}
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={o.status === "SUSPENDED" ? "إعادة التفعيل" : "إيقاف (يبقى التتبع للعملاء)"} disabled={pending}
                              onClick={() => startTransition(async () => {
                                const res = await updateLicense(o.license!.id, o.status === "SUSPENDED" ? "activate" : "suspend");
                                if (res.ok) toast.success(res.message);
                                else toast.error(res.error);
                              })}
                            >
                              <Power className={`h-3.5 w-3.5 ${o.status === "SUSPENDED" ? "text-muted-foreground" : "text-amber-600"}`} />
                            </Button>
                          </>
                        )}
                        <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0" title="الصفحة العامة">
                          <a href={`/o/${o.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {offices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">لا توجد مكاتب مطابقة</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
