"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveStaff, toggleStaff } from "@/app/actions/office";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserCog, Plus, Pencil, Power, Loader2, Shield, Users } from "lucide-react";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateAr, timeAgoAr } from "@/lib/format";

type StaffRow = { id: string; name: string; email: string; phone: string | null; role: string; isActive: boolean; lastLoginAt: Date | null; invitedBy: string | null };

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OFFICE_ADMIN: ["كل الصلاحيات: الخدمات، الطلبات، الموظفون، الحسابات، الإعدادات"],
  STAFF: ["إدارة الطلبات والعملاء", "مراجعة المستندات وتحديث الحالات", "إنشاء طلبات نيابة عن العملاء", "عرض المالية والتقارير"],
  BROKER: ["الطلبات المسندة إليه فقط", "تحديث مراحل التنفيذ الميداني", "ملف الشحنة الجمركية", "لا يرى البيانات المالية إطلاقاً"],
  ACCOUNTANT: ["بنود التكلفة والدفعات والفواتير", "كشوف الحساب والذمم", "أسعار الصرف والتقارير المالية"],
};

export function StaffManager({ currentUserId, staff, plan }: { currentUserId: string; staff: StaffRow[]; plan: { name: string; maxUsers: number } }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ open: boolean; user?: StaffRow }>({ open: false });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><UserCog className="h-6 w-6 text-primary" /> الموظفون والصلاحيات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {staff.length} مستخدم · الباقة {plan.name} (حتى {plan.maxUsers} مستخدم)
          </p>
        </div>
        <Button size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setDialog({ open: true })} disabled={staff.length >= plan.maxUsers}>
          <Plus className="h-4 w-4" /> موظف جديد
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {staff.map((u) => (
          <Card key={u.id} className={`border-border/60 ${!u.isActive ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 border flex items-center justify-center text-primary font-extrabold shrink-0">
                    {u.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold truncate">{u.name}</p>
                      {u.id === currentUserId && <Badge variant="outline" className="text-[9px] bg-primary/5">أنت</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground nums" dir="ltr">{u.email}</p>
                    <Badge variant="outline" className="mt-1.5 text-[10px] font-bold bg-muted">{ROLE_LABELS[u.role] || u.role}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="تعديل" onClick={() => setDialog({ open: true, user: u })}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {u.id !== currentUserId && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={u.isActive ? "تعطيل" : "تفعيل"} disabled={pending}
                      onClick={() => startTransition(async () => {
                        const res = await toggleStaff(u.id, !u.isActive);
                        if (res.ok) toast.success(res.message);
                        else toast.error(res.error);
                      })}
                    >
                      <Power className={`h-3.5 w-3.5 ${u.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                    </Button>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {ROLE_PERMISSIONS[u.role]?.[0]}
                  {u.lastLoginAt ? ` · آخر دخول: ${timeAgoAr(u.lastLoginAt)}` : " · لم يسجل الدخول بعد"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* دليل الأدوار */}
      <Card className="border-border/60 bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> دليل الأدوار (RBAC)</CardTitle>
          <CardDescription className="text-xs">صلاحيات دقيقة قابلة للتخصيص — المخلص الميداني لا يرى إلا المعاملات المسندة إليه ولا يرى البيانات المالية</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="rounded-xl border bg-card p-3">
              <p className="text-xs font-extrabold text-primary">{ROLE_LABELS[role]}</p>
              <ul className="mt-2 space-y-1">
                {perms.map((p) => (
                  <li key={p} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* حوار الموظف */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, user: o ? dialog.user : undefined })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-4.5 w-4.5 text-primary" /> {dialog.user ? "تعديل موظف" : "موظف جديد"}</DialogTitle>
            <DialogDescription>حدّد الدور بعناية — تُطبَّق الصلاحيات فوراً</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await saveStaff(fd);
                if (res.ok) { toast.success(res.message); setDialog({ open: false }); }
                else toast.error(res.error);
              });
            }}
            className="space-y-3"
          >
            {dialog.user && <input type="hidden" name="id" value={dialog.user.id} />}
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الاسم <span className="text-rose-500">*</span></label>
              <Input name="name" defaultValue={dialog.user?.name || ""} required className="h-10 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">البريد (فريد) <span className="text-rose-500">*</span></label>
                <Input name="email" type="email" defaultValue={dialog.user?.email || ""} required dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الجوال</label>
                <Input name="phone" defaultValue={dialog.user?.phone || ""} dir="ltr" className="h-10 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الدور</label>
              <select name="role" defaultValue={dialog.user?.role || "STAFF"} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                <option value="STAFF">موظف / مراجع</option>
                <option value="BROKER">مخلص ميداني</option>
                <option value="ACCOUNTANT">محاسب</option>
                <option value="OFFICE_ADMIN">مدير المكتب</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">
                كلمة المرور {dialog.user ? "(اتركها فارغة للإبقاء على الحالية)" : <span className="text-rose-500">*</span>}
              </label>
              <Input name="password" type="password" placeholder="8 أحرف على الأقل" dir="ltr" className="h-10 text-xs" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog({ open: false })}>إلغاء</Button>
              <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الموظف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
