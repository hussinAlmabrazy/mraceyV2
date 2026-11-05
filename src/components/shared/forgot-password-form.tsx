"use client";

// ============ نموذج استعادة كلمة المرور (خطوتان + رمز OTP) ============
// الخطوة 1: إدخال البريد/الجوال → توليد رمز سداسي
// الخطوة 2: إدخال الرمز + كلمة المرور الجديدة
// الخطوة 3: شاشة النجاح مع رابط تسجيل الدخول المناسب

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { requestPasswordReset, completePasswordReset, type ResetState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordField } from "@/components/shared/password-field";
import { waMeUrl } from "@/lib/wa-link";
import { Loader2, AlertCircle, KeyRound, CheckCircle2, Copy, Check, MessageCircle, LogIn, RotateCcw } from "lucide-react";

export function ForgotPasswordForm({
  accountType,
  slug,
  accent = "#0F766E",
}: {
  accountType: "USER" | "CUSTOMER";
  slug?: string;
  accent?: string;
}) {
  const [reqState, reqAction, reqPending] = useActionState(requestPasswordReset, undefined);
  const [doneState, doneAction, donePending] = useActionState(completePasswordReset, undefined);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reqState?.resetId) setStep(2);
  }, [reqState]);

  useEffect(() => {
    if (doneState?.ok) setStep(3);
  }, [doneState]);

  async function copyCode() {
    if (!reqState?.devCode) return;
    try {
      await navigator.clipboard.writeText(reqState.devCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* المتصفح منع النسخ — المستخدم ينسخ يدوياً */
    }
  }

  // ---------- الخطوة 1: طلب الرمز ----------
  if (step === 1) {
    return (
      <form action={reqAction} className="space-y-4">
        {reqState?.error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs font-medium">{reqState.error}</AlertDescription>
          </Alert>
        )}
        <input type="hidden" name="accountType" value={accountType} />
        {accountType === "CUSTOMER" && <input type="hidden" name="slug" value={slug || ""} />}
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="text-xs font-bold">
            {accountType === "CUSTOMER" ? "البريد الإلكتروني أو رقم الجوال" : "البريد الإلكتروني"}
            <span className="text-rose-500 mr-1">*</span>
          </Label>
          <Input
            id="identifier"
            name="identifier"
            dir="ltr"
            className="h-11"
            placeholder={accountType === "CUSTOMER" ? "client@mail.com / +967 7xx xxx xxx" : "name@office.ye"}
            autoComplete="username"
            required
          />
        </div>
        <Button type="submit" className="w-full font-bold gap-2 h-11" disabled={reqPending}>
          {reqPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          إرسال رمز التحقق
        </Button>
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          ستصلك رسالة تحتوي رمزاً من 6 أرقام صالحاً لمدة 15 دقيقة لإعادة تعيين كلمة المرور
        </p>
      </form>
    );
  }

  // ---------- الخطوة 3: النجاح ----------
  if (step === 3 && doneState?.ok) {
    return (
      <div className="text-center space-y-4 py-2">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${accent}18` }}
        >
          <CheckCircle2 className="h-9 w-9" style={{ color: accent }} />
        </div>
        <p className="text-sm font-bold leading-relaxed">{doneState.message}</p>
        <Button asChild className="w-full font-bold gap-2 h-11" style={{ backgroundColor: accent }}>
          <Link href={doneState.loginHref || "/office/login"}>
            <LogIn className="h-4 w-4" />
            الانتقال لتسجيل الدخول
          </Link>
        </Button>
      </div>
    );
  }

  // ---------- الخطوة 2: الرمز + كلمة المرور الجديدة ----------
  if (!reqState?.resetId) return null;
  const waText = reqState.devCode
    ? `رمز استعادة كلمة المرور في منصة مراسي: ${reqState.devCode}\nصالح لمدة 15 دقيقة. إن لم تطلبه فتجاهل هذه الرسالة.`
    : "";

  return (
    <form action={doneAction} className="space-y-4">
      {doneState?.error && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-medium">{doneState.error}</AlertDescription>
        </Alert>
      )}
      <input type="hidden" name="resetId" value={reqState.resetId} />
      <input type="hidden" name="code" value={code} />

      {/* لوحة التسليم */}
      <div className="rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-800 dark:bg-teal-950/30 p-4 space-y-3">
        <p className="text-xs font-bold text-teal-900 dark:text-teal-100 flex items-center gap-1.5">
          <KeyRound className="h-4 w-4" />
          تم إنشاء رمز تحقق صالح لمدة 15 دقيقة
        </p>
        {(reqState.maskedEmail || reqState.maskedPhone) && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            الحساب المرتبط:{" "}
            <span className="nums font-bold" dir="ltr">
              {[reqState.maskedEmail, reqState.maskedPhone].filter(Boolean).join(" / ")}
            </span>
          </p>
        )}

        {reqState.devCode ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 px-4 py-3">
              <span className="nums text-2xl font-extrabold tracking-[0.3em] text-amber-900 dark:text-amber-100" dir="ltr">
                {reqState.devCode}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="gap-1.5 shrink-0 h-8 text-xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "تم النسخ" : "نسخ"}
              </Button>
            </div>
            <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
              ملاحظة: لم يُربط مزود بريد إلكتروني بعد، لذا يُعرض الرمز هنا مؤقتاً{accountType === "CUSTOMER" ? " وأُرسل إشعار لموظفي المكتب لتسليمه عبر واتساب" : ""}
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {accountType === "CUSTOMER"
              ? "تواصل مع موظفي المكتب ليُرسلوا لك الرمز عبر واتساب"
              : "تواصل مع مدير النظام لتسليمك الرمز"}
          </p>
        )}

        {reqState.waPhone && reqState.devCode && (
          <a href={waMeUrl(reqState.waPhone, waText)} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              type="button"
              variant="outline"
              className="w-full font-bold gap-2 h-10 text-xs"
              style={{ borderColor: "#1DA851", color: "#1DA851" }}
            >
              <MessageCircle className="h-4 w-4" />
              إرسال الرمز إلى واتساب المرتبط بالحساب
            </Button>
          </a>
        )}
      </div>

      {/* إدخال الرمز */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold">
          رمز التحقق <span className="text-rose-500 mr-1">*</span>
        </Label>
        <div dir="ltr" className="flex justify-center py-1">
          <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-11 text-lg first:rounded-l-lg last:rounded-r-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      {/* كلمة المرور الجديدة */}
      <PasswordField
        id="new-password"
        name="password"
        label="كلمة المرور الجديدة"
        placeholder="8 أحرف على الأقل"
        autoComplete="new-password"
      />
      <PasswordField
        id="confirm-password"
        name="passwordConfirm"
        label="تأكيد كلمة المرور الجديدة"
        placeholder="أعد إدخال كلمة المرور الجديدة"
        autoComplete="new-password"
      />

      <Button
        type="submit"
        className="w-full font-bold gap-2 h-11"
        style={{ backgroundColor: accent }}
        disabled={donePending || code.length !== 6}
      >
        {donePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        تعيين كلمة المرور الجديدة
      </Button>

      <button
        type="button"
        onClick={() => {
          setStep(1);
          setCode("");
        }}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        رجوع — تغيير البريد أو إعادة إرسال الرمز
      </button>
    </form>
  );
}
