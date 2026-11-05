import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";
import { getSetupMode } from "@/lib/setup-restore";
import { loginStaff } from "@/app/actions/auth";
import { AuthForm } from "@/components/shared/auth-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

export const metadata = { title: "دخول الإدارة" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { expired, setup } = await searchParams;
  const session = await getUserSession();
  if (session?.role === "SUPER_ADMIN") redirect("/admin");

  // منصة بلا حسابات بعد؟ → معالج الإعداد الأولي (أو بطاقة إرشاد إن لا قاعدة أصلاً)
  let mode: "wizard" | "done" | "dbdown" = "done";
  try {
    mode = await getSetupMode();
  } catch {
    mode = "done"; // لا نحجب صفحة الدخول لأي خطأ عابر
  }
  if (mode === "wizard") redirect("/setup");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/70 via-background to-background pattern-grid px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-muted-foreground">بوابة إدارة المنصة — للمشرفين فقط</p>
        </div>
        <Card className="shadow-xl shadow-teal-900/5 border-teal-100">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-extrabold">تسجيل دخول مدير النظام</CardTitle>
            <CardDescription>إدارة المكاتب والتراخيص والباقات والإعدادات العامة</CardDescription>
          </CardHeader>
          <CardContent>
            {setup === "done" && (
              <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-center text-xs font-bold text-teal-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                تم تجهيز المنصة بنجاح — سجّل الدخول ببياناتك المعتادة
              </div>
            )}
            {mode === "dbdown" && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                تعذّر الاتصال بقاعدة البيانات — أضف متغيرات Turso في Vercel ثم Redeploy
              </div>
            )}
            {expired && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
                انتهت صلاحية الجلسة — سجّل دخولك مجدداً للمتابعة
              </div>
            )}
            <AuthForm
              action={loginStaff}
              submitLabel="دخول لوحة الإدارة"
              fields={[
                { name: "email", label: "البريد الإلكتروني", type: "email", placeholder: "admin@marsaa.ye", dir: "ltr" },
                { name: "password", label: "كلمة المرور", type: "password", placeholder: "••••••••", dir: "ltr" },
              ]}
            />
            <div className="mt-3 text-center">
              <Button asChild variant="link" className="p-0 h-auto text-teal-700 font-bold text-xs">
                <Link href="/forgot-password">نسيت كلمة المرور؟</Link>
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-muted/60 border border-border/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <span className="flex items-center gap-1.5 font-bold text-foreground mb-1"><ShieldCheck className="h-3.5 w-3.5 text-teal-600" /> بيانات تجريبية</span>
              <span className="nums" dir="ltr">admin@marsaa.ye</span> / <span className="nums" dir="ltr">Admin@2026</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Button asChild variant="link" className="p-0 h-auto"><Link href="/">الصفحة الرئيسية</Link></Button>
          <span className="text-border">|</span>
          <Button asChild variant="link" className="p-0 h-auto"><Link href="/office/login">دخول المكاتب</Link></Button>
        </div>
      </div>
    </div>
  );
}
