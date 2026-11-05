import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";
import { loginStaff } from "@/app/actions/auth";
import { AuthForm } from "@/components/shared/auth-form";
import { Logo } from "@/components/shared/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export const metadata = { title: "دخول المكاتب" };

export default async function OfficeLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { expired } = await searchParams;
  const session = await getUserSession();
  if (session?.officeId) redirect("/office");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50/70 via-background to-background pattern-grid px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-3 text-sm text-muted-foreground">بوابة موظفي ومدراء المكاتب</p>
        </div>
        <Card className="shadow-xl shadow-teal-900/5 border-teal-100">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-extrabold">تسجيل دخول المكتب</CardTitle>
            <CardDescription>مدير المكتب، الموظف، المخلص الميداني، أو المحاسب</CardDescription>
          </CardHeader>
          <CardContent>
            {expired && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
                انتهت صلاحية الجلسة — سجّل دخولك مجدداً للمتابعة
              </div>
            )}
            <AuthForm
              action={loginStaff}
              submitLabel="دخول لوحة المكتب"
              fields={[
                { name: "email", label: "البريد الإلكتروني", type: "email", placeholder: "name@office.ye", dir: "ltr" },
                { name: "password", label: "كلمة المرور", type: "password", placeholder: "••••••••", dir: "ltr" },
              ]}
            />
            <div className="mt-3 text-center">
              <Button asChild variant="link" className="p-0 h-auto text-teal-700 font-bold text-xs">
                <Link href="/forgot-password">نسيت كلمة المرور؟</Link>
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-muted/60 border border-border/60 p-3 text-[11px] text-muted-foreground leading-relaxed space-y-1">
              <p className="font-bold text-foreground">حسابات المكتب التجريبي (red-sea):</p>
              <p><span className="nums" dir="ltr">admin@redsea-clearance.ye</span> / <span className="nums" dir="ltr">Office@2026</span> — مدير المكتب</p>
              <p><span className="nums" dir="ltr">sara@redsea-clearance.ye</span> / <span className="nums" dir="ltr">Staff@2026</span> — موظفة</p>
              <p><span className="nums" dir="ltr">broker@redsea-clearance.ye</span> / <span className="nums" dir="ltr">Broker@2026</span> — مخلص ميداني</p>
              <p><span className="nums" dir="ltr">accountant@redsea-clearance.ye</span> / <span className="nums" dir="ltr">Acc@2026</span> — محاسبة</p>
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>مكتب جديد؟</span>
              <Button asChild variant="link" className="p-0 h-auto text-teal-700 font-bold"><Link href="/activate">فعّل حسابك بمفتاح الترخيص</Link></Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Button asChild variant="link" className="p-0 h-auto"><Link href="/">الصفحة الرئيسية</Link></Button>
          <span className="text-border">|</span>
          <Button asChild variant="link" className="p-0 h-auto"><Link href="/admin/login">بوابة الإدارة</Link></Button>
        </div>
      </div>
    </div>
  );
}
