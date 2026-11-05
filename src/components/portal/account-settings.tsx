"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMyContact, changeMyPassword } from "@/app/actions/portal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/shared/password-field";
import { Mail, Phone, KeyRound, Loader2, ShieldCheck, CheckCircle2, Clock, User } from "lucide-react";

export function ClientAccountSettings({
  email, phone, whatsapp, name, lastLoginAt,
}: {
  email: string; phone: string; whatsapp: string; name: string; lastLoginAt: string;
}) {
  const [pending, startTransition] = useTransition();
  const [contact, setContact] = useState({ email, phone });

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-extrabold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" /> حسابي
        </CardTitle>
        <CardDescription className="text-xs mt-1">
          بيانات دخولك لدى المكتب — الدخول بالبريد الإلكتروني أو رقم الجوال
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* بيانات الحساب الحالية */}
        <div className="grid sm:grid-cols-3 gap-2.5">
          <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> البريد الحالي</p>
            <p className="text-xs font-extrabold break-all" dir="ltr">{contact.email || "—"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> الجوال الحالي</p>
            <p className="text-xs font-extrabold" dir="ltr">{contact.phone || "—"}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-[10px] text-muted-foreground font-bold mb-1 flex items-center gap-1"><User className="h-3 w-3" /> الاسم وآخر دخول</p>
            <p className="text-xs font-extrabold truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground">{lastLoginAt}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* ===== تحديث بيانات التواصل ===== */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              startTransition(async () => {
                const res = await updateMyContact(fd);
                if (res.ok) {
                  toast.success(res.message);
                  setContact({
                    email: String(fd.get("newEmail") || "").trim().toLowerCase() || contact.email,
                    phone: String(fd.get("newPhone") || "").trim() || contact.phone,
                  });
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
                <Mail className="h-3.5 w-3.5 text-primary" /> تحديث بيانات التواصل
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">اترك الحقل فارغاً للاحتفاظ بالقيمة الحالية</p>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newEmail" className="text-xs font-bold">البريد الإلكتروني الجديد</label>
              <Input id="newEmail" name="newEmail" type="email" dir="ltr" placeholder={contact.email || "you@example.com"} className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newPhone" className="text-xs font-bold">رقم الجوال الجديد</label>
              <Input id="newPhone" name="newPhone" type="tel" dir="ltr" placeholder={contact.phone || "7xxxxxxxx"} className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newWhatsapp" className="text-xs font-bold">رقم واتساب (اختياري)</label>
              <Input id="newWhatsapp" name="newWhatsapp" type="tel" dir="ltr" placeholder={whatsapp || "7xxxxxxxx"} className="h-10 text-xs" />
            </div>
            <PasswordField id="contact-current-password" name="currentPassword" label="كلمة المرور الحالية (تأكيد)" autoComplete="current-password" />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="outline" className="font-bold gap-1.5 text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} تحديث البيانات
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
                const res = await changeMyPassword(fd);
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
          لأمانك: كل تغيير يتطلب كلمة المرور الحالية، والبريد/الجوال يجب أن يكون فريداً لدى المكتب — وتُوثَّق التغييرات في سجل التدقيق.
        </p>
      </CardContent>
    </Card>
  );
}
