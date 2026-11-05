"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePlan, deletePlan } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Plus, Pencil, Trash2, Loader2, Users, HardDrive, MessageCircle, FileText } from "lucide-react";
import { formatMoney } from "@/lib/format";

type PlanRow = {
  id: string; name: string; description: string | null; maxUsers: number; maxStorageMb: number;
  maxMonthlyReqs: number; whatsappEnabled: boolean; priceMonthly: number; priceYearly: number;
  isDefault: boolean; officesCount: number;
};

export function PlansManager({ plans }: { plans: PlanRow[] }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ open: boolean; plan?: PlanRow }>({ open: false });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><CreditCard className="h-6 w-6 text-primary" /> الباقات والاشتراكات</h1>
          <p className="text-sm text-muted-foreground mt-1">حدود المستخدمين والتخزين والطلبات الشهرية وميزات الواتساب</p>
        </div>
        <Button size="sm" className="gap-1.5 font-bold" onClick={() => setDialog({ open: true })}>
          <Plus className="h-4 w-4" /> باقة جديدة
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <Card key={p.id} className={`border-border/60 flex flex-col ${p.isDefault ? "border-primary/40 ring-1 ring-primary/20" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold">{p.name}</CardTitle>
                {p.isDefault && <Badge variant="outline" className="text-[9px] font-bold bg-primary/10 text-primary border-primary/30">الافتراضية</Badge>}
              </div>
              {p.description && <CardDescription className="text-xs mt-1">{p.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="text-center py-2 border-y">
                <p className="text-2xl font-extrabold text-primary nums">{p.priceMonthly.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">ريال يمني / شهرياً · {formatMoney(p.priceYearly, "YER")} سنوياً</p>
              </div>
              <ul className="space-y-2 text-xs flex-1">
                <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-primary shrink-0" /> حتى <b className="nums">{p.maxUsers}</b> مستخدم</li>
                <li className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary shrink-0" /> حتى <b className="nums">{p.maxMonthlyReqs.toLocaleString()}</b> طلب شهرياً</li>
                <li className="flex items-center gap-2"><HardDrive className="h-3.5 w-3.5 text-primary shrink-0" /> <b className="nums">{(p.maxStorageMb / 1024).toFixed(1)}</b> جيجابايت تخزين</li>
                <li className="flex items-center gap-2">
                  <MessageCircle className={`h-3.5 w-3.5 shrink-0 ${p.whatsappEnabled ? "text-emerald-600" : "text-muted-foreground"}`} />
                  {p.whatsappEnabled ? <b>قناة واتساب خاصة بالمكتب</b> : <span className="text-muted-foreground">قناة المنصة المشتركة</span>}
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">· <b className="nums">{p.officesCount}</b> مكتب على هذه الباقة</li>
              </ul>
              <div className="flex items-center gap-1.5 pt-2 border-t">
                <Button size="sm" variant="outline" className="h-7 text-xs font-bold gap-1 flex-1" onClick={() => setDialog({ open: true, plan: p })}>
                  <Pencil className="h-3 w-3" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending || p.officesCount > 0}
                  title={p.officesCount > 0 ? "مرتبطة بمكاتب — لا يمكن حذفها" : "حذف"}
                  onClick={() => startTransition(async () => {
                    const res = await deletePlan(p.id);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* حوار الباقة */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, plan: o ? dialog.plan : undefined })}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.plan ? `تعديل الباقة: ${dialog.plan.name}` : "باقة جديدة"}</DialogTitle>
            <DialogDescription>حدود الاستخدام والميزات المتاحة للمكاتب على هذه الباقة</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await savePlan(fd);
                if (res.ok) { toast.success(res.message); setDialog({ open: false }); }
                else toast.error(res.error);
              });
            }}
            className="space-y-3"
          >
            {dialog.plan && <input type="hidden" name="id" value={dialog.plan.id} />}
            <div className="space-y-1.5">
              <label className="text-xs font-bold">اسم الباقة <span className="text-rose-500">*</span></label>
              <Input name="name" defaultValue={dialog.plan?.name || ""} required className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الوصف</label>
              <Input name="description" defaultValue={dialog.plan?.description || ""} className="h-10 text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">السعر الشهري</label>
                <Input name="priceMonthly" type="number" min="0" defaultValue={dialog.plan?.priceMonthly ?? 0} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">السعر السنوي</label>
                <Input name="priceYearly" type="number" min="0" defaultValue={dialog.plan?.priceYearly ?? 0} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">المستخدمون</label>
                <Input name="maxUsers" type="number" min="1" defaultValue={dialog.plan?.maxUsers ?? 5} className="h-10 text-xs nums" dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">طلبات/شهر</label>
                <Input name="maxMonthlyReqs" type="number" min="1" defaultValue={dialog.plan?.maxMonthlyReqs ?? 100} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">تخزين (ميجا)</label>
                <Input name="maxStorageMb" type="number" min="256" defaultValue={dialog.plan?.maxStorageMb ?? 2048} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg border p-2.5 w-full bg-emerald-50/40 border-emerald-200">
                  <input type="checkbox" name="whatsappEnabled" defaultChecked={dialog.plan?.whatsappEnabled} className="h-4 w-4 accent-teal-700" />
                  واتساب
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog({ open: false })}>إلغاء</Button>
              <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الباقة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
