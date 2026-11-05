"use client";

// ============================================================
// واجهة معالج الإعداد الأولي — بطاقتان:
// (أ) استعادة البيانات من dump.sql  ← المسار الموصى به
// (ب) بدء منصة فارغة بإنشاء مدير أول
// ============================================================

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Upload, FileText, Database, UserPlus, Info } from "lucide-react";
import { restoreFromDump, createFirstAdmin, type SetupState } from "@/app/actions/setup";

function SubmitButton({ label, variant = "default" }: { label: string; variant?: "default" | "outline" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className="w-full font-bold gap-2 h-11" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

function ErrorBox({ state }: { state: SetupState }) {
  if (!state?.error) return null;
  return (
    <Alert variant="destructive" className="py-2.5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-xs font-medium">{state.error}</AlertDescription>
    </Alert>
  );
}

/** بطاقة الاستعادة — رفع ملف dump.sql */
function RestoreCard() {
  const [state, formAction] = useActionState(restoreFromDump, undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  return (
    <Card className="shadow-xl shadow-teal-900/5 border-teal-200">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Database className="h-4.5 w-4.5" />
          </span>
          <div>
            <CardTitle className="text-lg font-extrabold">استعادة بياناتك كاملة</CardTitle>
            <CardDescription className="mt-1">المسار الموصى به — مكاتبك ومستخدموك وطلباتك تعود كما كانت</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <ErrorBox state={state} />

          <div className="space-y-1.5">
            <Label className="text-xs font-bold">ملف النسخة الاحتياطية (dump.sql)</Label>
            <input
              ref={inputRef}
              type="file"
              name="dump"
              accept=".sql,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFileName(f?.name ?? null);
                setFileSize(f?.size ?? null);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-400 transition-colors px-4 py-5 text-center cursor-pointer"
            >
              <Upload className="mx-auto h-6 w-6 text-teal-600 mb-1.5" />
              {fileName ? (
                <span className="flex items-center justify-center gap-2 text-sm font-bold text-teal-800">
                  <FileText className="h-4 w-4" />
                  {fileName}
                  {fileSize != null && (
                    <span className="text-xs font-normal text-teal-600 nums" dir="ltr">
                      {(fileSize / 1024).toFixed(0)} KB
                    </span>
                  )}
                </span>
              ) : (
                <span className="block text-sm font-bold text-teal-800">اضغط لاختيار ملف dump.sql</span>
              )}
              <span className="mt-1 block text-[11px] text-muted-foreground">
                من مجلد <span className="font-bold nums" dir="ltr">db</span> داخل حزمة النشر التي نزّلتها
              </span>
            </button>
          </div>

          <SubmitButton label="استعادة البيانات الآن" />
        </form>

        <div className="mt-4 rounded-lg bg-muted/60 border border-border/60 p-3 text-[11px] text-muted-foreground leading-relaxed">
          <span className="flex items-center gap-1.5 font-bold text-foreground mb-1">
            <Info className="h-3.5 w-3.5 text-teal-600" /> من أين أحصل على الملف؟
          </span>
          فك ضغط <span className="font-bold nums" dir="ltr">marsaa-platform-deploy.zip</span> في جهازك → افتح مجلد
          <span className="font-bold nums" dir="ltr"> db</span> → ستجد الملف
          <span className="font-bold nums" dir="ltr"> dump.sql</span> — ارفعه هنا وستعود كل بياناتك (المكاتب،
          المستخدمون، الخدمات، الطلبات، العملاء) ثم سجّل الدخول ببياناتك المعتادة.
        </div>
      </CardContent>
    </Card>
  );
}

/** بطاقة البدء بمنصة فارغة — إنشاء مدير أول */
function FreshCard() {
  const [state, formAction] = useActionState(createFirstAdmin, undefined);

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UserPlus className="h-4.5 w-4.5" />
          </span>
          <div>
            <CardTitle className="text-base font-extrabold">أو: ابدأ بمنصة فارغة</CardTitle>
            <CardDescription className="mt-1">منصة جديدة بلا بيانات — تنشئ المكاتب لاحقاً من لوحة الإدارة</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3.5">
          <ErrorBox state={state} />

          <div className="grid sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="setup-name" className="text-xs font-bold">الاسم الكامل</Label>
              <Input id="setup-name" name="name" className="h-11" placeholder="مثال: حسين المبرزي" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-email" className="text-xs font-bold">البريد الإلكتروني</Label>
              <Input id="setup-email" name="email" type="email" dir="ltr" className="h-11" placeholder="admin@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-password" className="text-xs font-bold">كلمة المرور</Label>
              <Input id="setup-password" name="password" type="password" dir="ltr" className="h-11" placeholder="••••••••" minLength={8} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="setup-confirm" className="text-xs font-bold">تأكيد كلمة المرور</Label>
              <Input id="setup-confirm" name="confirm" type="password" dir="ltr" className="h-11" placeholder="••••••••" minLength={8} required />
            </div>
          </div>

          <SubmitButton label="إنشاء الحساب وبدء الاستخدام" variant="outline" />
        </form>
      </CardContent>
    </Card>
  );
}

export function SetupWizard() {
  return (
    <div className="space-y-6">
      <RestoreCard />
      <FreshCard />
    </div>
  );
}
