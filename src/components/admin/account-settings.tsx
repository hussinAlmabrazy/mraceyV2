"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAdminEmail, changeAdminPassword } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/shared/password-field";
import { Mail, KeyRound, Loader2, ShieldCheck, CheckCircle2, Clock } from "lucide-react";

export function AccountSettings({
  email, name, lastLoginAt,
}: { email: string; name: string; lastLoginAt: string }) {
  const [pending, startTransition] = useTransition();
  const [currentEmail, setCurrentEmail] = useState(email);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> حساب مدير المنصة
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          بيانات الدخول الخاصة بك — أي تغيير يُسجَّل في سجل التدقيق ويُستخدم في تسجيل الدخول القادم
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* بيانات الحساب الحالية */}
        <div className="grid sm:grid-cols-3 gap-2.5">
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> البريد الحالي</p>
            <p className="text-xs font-extrabold break-all" dir="ltr">{currentEmail}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> الاسم</p>
            <p className="text-xs font-extrabold">{name}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> آخر دخول</p>
            <p className="text-xs font-extrabold">{lastLoginAt}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* ===== تغيير البريد الإلكتروني ===== */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              startTransition(async () => {
                const res = await updateAdminEmail(fd);
                if (res.ok) {
                  toast.success(res.message);
                  setCurrentEmail(String(fd.get("newEmail") || "").trim().toLowerCase());
                  form.reset();
                } else {
                  toast.error(res.error);
                }
              });
            }}
            className="space-y-3.5 rounded-xl border border-border/70 bg-card p-4"
          >
            <div>
              <h3 className="text-xs font-extrabold flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" /> تغيير البريد الإلكتروني
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">سيصبح البريد الجديد معرّف دخولك للمنصة</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newEmail" className="text-xs font-bold">البريد الإلكتروني الجديد <span className="text-rose-500">*</span></label>
              <Input id="newEmail" name="newEmail" type="email" dir="ltr" placeholder="admin@example.com" className="h-10 text-xs" required />
            </div>
            <PasswordField id="email-current-password" name="currentPassword" label="كلمة المرور الحالية (تأكيد)" autoComplete="current-password" />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="outline" className="font-bold gap-1.5 text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} تحديث البريد
              </Button>
            </div>
          </form>

          {/* ===== تغيير كلمة المرور ===== */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              startTransition(async () => {
                const res = await changeAdminPassword(fd);
                if (res.ok) {
                  toast.success(res.message);
                  form.reset();
                } else {
                  toast.error(res.error);
                }
              });
            }}
            className="space-y-3.5 rounded-xl border border-border/70 bg-card p-4"
          >
            <div>
              <h3 className="text-xs font-extrabold flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-600" /> تغيير كلمة المرور
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">8 أحرف على الأقل — يُنصح بمزج أحرف وأرقام ورموز</p>
            </div>
            <PasswordField id="currentPassword" name="currentPassword" label="كلمة المرور الحالية" autoComplete="current-password" />
            <PasswordField id="newPassword" name="newPassword" label="كلمة المرور الجديدة" placeholder="••••••••" autoComplete="new-password" />
            <PasswordField id="confirmPassword" name="confirmPassword" label="تأكيد كلمة المرور الجديدة" placeholder="••••••••" autoComplete="new-password" />
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="font-bold gap-1.5 text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />} تغيير كلمة المرور
              </Button>
            </div>
          </form>
        </div>

        <p className="text-[10px] text-muted-foreground border-t pt-3 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 shrink-0" />
          لأمانك: كل تغيير للبريد أو كلمة المرور يتطلب كلمة المرور الحالية ويُوثَّق في سجل التدقيق (ADMIN → سجل التدقيق) مع إخفاء القيم الحساسة.
        </p>
      </CardContent>
    </Card>
  );
}
