import Link from "next/link";
import { activateOffice } from "@/app/actions/auth";
import { AuthForm } from "@/components/shared/auth-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

export const metadata = { title: "تفعيل مكتب جديد" };

const steps = [
  { icon: Mail, title: "وصلتك رسالة الدعوة", desc: "من إدارة المنصة عبر البريد، تتضمن رابط التفعيل ومفتاح الترخيص." },
  { icon: KeyRound, title: "أدخل المفتاح وبياناتك", desc: "مفتاح الترخيص، بريدك، اسمك، وكلمة مرور جديدة لمدير المكتب." },
  { icon: ShieldCheck, title: "ابدأ إعداد مكتبك", desc: "أضف خدماتك وموظفيك وابدأ استقبال طلبات العملاء فوراً." },
];

export default function ActivatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/70 via-background to-background pattern-grid px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-4 text-2xl font-extrabold text-teal-950">تفعيل حساب مكتب جديد</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">فعّل اشتراك مكتبك بمفتاح الترخيص الذي وصلك من إدارة المنصة، وأنشئ كلمة مرور مدير المكتب</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-start">
          <Card className="shadow-xl shadow-teal-900/5 border-teal-100 md:sticky md:top-8">
            <CardHeader>
              <CardTitle className="text-lg font-extrabold">بيانات التفعيل</CardTitle>
              <CardDescription>تُنشأ جلسة مدير المكتب مباشرة بعد التفعيل</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm
                action={activateOffice}
                submitLabel="تفعيل المكتب والدخول"
                fields={[
                  { name: "key", label: "مفتاح الترخيص", placeholder: "MRX-XXXX-XXXX-XXXX", dir: "ltr", hint: "كما وصلك في رسالة الدعوة" },
                  { name: "email", label: "البريد الإلكتروني للمدير", type: "email", placeholder: "manager@office.ye", dir: "ltr" },
                  { name: "name", label: "اسم مدير المكتب", placeholder: "الاسم الكامل" },
                  { name: "password", label: "كلمة المرور", type: "password", placeholder: "8 أحرف على الأقل", dir: "ltr" },
                ]}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-4 flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="text-center text-xs text-muted-foreground">
              لم يصلك مفتاح؟ <Button asChild variant="link" className="p-0 h-auto text-teal-700 font-bold"><Link href="/admin/login">تواصل مع إدارة المنصة</Link></Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
