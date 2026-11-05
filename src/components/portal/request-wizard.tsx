"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Upload, Loader2, Send, Save, PackageCheck, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCIES } from "@/lib/constants";

type ServiceOption = {
  id: string; name: string; description: string | null; icon: string | null;
  price: number | null; priceLabel: string | null; currency: string; estimatedDays: number;
  categoryName: string;
  formFields: { id: string; key: string; label: string; type: string; options: string | null; isRequired: boolean; placeholder: string | null }[];
  requiredDocs: { id: string; name: string; isMandatory: boolean; description: string | null; allowedFormats: string; maxSizeMb: number }[];
};

const STEPS = [
  { n: 1, title: "اختيار الخدمة" },
  { n: 2, title: "تعبئة النموذج" },
  { n: 3, title: "رفع المستندات" },
  { n: 4, title: "المراجعة والإرسال" },
];

export function RequestWizard({
  office, preselectedServiceId, services, action,
}: {
  office: { name: string; slug: string; brandColor: string };
  preselectedServiceId: string;
  services: ServiceOption[];
  action: (prev: any, formData: FormData) => Promise<any>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [serviceId, setServiceId] = useState(preselectedServiceId);
  const [step, setStep] = useState(preselectedServiceId ? 2 : 1);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [confirm, setConfirm] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const mandatoryDocs = service?.requiredDocs.filter((d) => d.isMandatory) || [];
  const uploadedMandatory = mandatoryDocs.filter((d) => files[`doc_${d.id}`]).length;
  const allMandatoryUploaded = uploadedMandatory === mandatoryDocs.length;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs font-medium">{state.error}</AlertDescription>
        </Alert>
      )}

      {/* مؤشر الخطوات */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5 shrink-0">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-colors",
              step === s.n ? "text-white border-transparent shadow-sm" : step > s.n ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-card text-muted-foreground border-border"
            )} style={step === s.n ? { backgroundColor: office.brandColor } : undefined}>
              {step > s.n ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="nums">{s.n}</span>}
              {s.title}
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 w-4", step > s.n ? "bg-emerald-300" : "bg-border")} />}
          </div>
        ))}
      </div>

      {/* الخطوة 1: الخدمة */}
      {step === 1 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => { setServiceId(s.id); }}
              className={cn(
                "text-right rounded-2xl border p-4 transition-all hover:shadow-md",
                serviceId === s.id ? "border-transparent ring-2 shadow-md" : "border-border hover:border-primary/40"
              )}
              style={serviceId === s.id ? { boxShadow: `0 0 0 2px ${office.brandColor}` } : undefined}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.categoryName}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-extrabold" style={{ color: office.brandColor }}>
                    {s.price != null ? `${s.price.toLocaleString()} ${CURRENCIES[s.currency]?.symbol || ""}` : (s.priceLabel || "حسب الطلب")}
                  </p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5"><Clock className="h-3 w-3" /><span className="nums">{s.estimatedDays}</span> يوم</p>
                </div>
              </div>
              {s.description && <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed line-clamp-2">{s.description}</p>}
              <p className="text-[10px] mt-2 flex items-center gap-1 text-muted-foreground">
                <FileText className="h-3 w-3" /> {s.requiredDocs.length} مستند مطلوب
              </p>
            </button>
          ))}
        </div>
      )}

      {/* الخطوة 2: النموذج — يبقى محمّلاً (مخفياً بـ CSS) للحفاظ على القيم عند التنقل بين الخطوات */}
      {service && (
        <Card className={cn("border-border/60", step !== 2 && "hidden")}>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div>
              <p className="text-sm font-extrabold">{service.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">املأ بيانات الطلب — الحقول المعلّمة بنجمة إلزامية</p>
            </div>
            {service.formFields.length === 0 && <p className="text-xs text-muted-foreground">لا تتطلب هذه الخدمة بيانات إضافية</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              {service.formFields.map((f) => (
                <div key={f.id} className={cn("space-y-1.5", f.type === "TEXTAREA" && "sm:col-span-2")}>
                  <Label className="text-xs font-bold">{f.label} {f.isRequired && <span className="text-rose-500">*</span>}</Label>
                  {f.type === "SELECT" ? (
                    <select name={`field_${f.key}`} defaultValue="" className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm">
                      <option value="">— اختر —</option>
                      {(f.options || "").split(",").filter(Boolean).map((o) => <option key={o} value={o.trim()}>{o.trim()}</option>)}
                    </select>
                  ) : f.type === "TEXTAREA" ? (
                    <Textarea name={`field_${f.key}`} rows={3} placeholder={f.placeholder || ""} className="text-sm" />
                  ) : (
                    <Input name={`field_${f.key}`} type={f.type.toLowerCase()} placeholder={f.placeholder || ""} dir={f.type === "NUMBER" || f.type === "DATE" ? "ltr" : undefined} className="h-11" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* الخطوة 3: المستندات — تبقى محمّلة (مخفية بـ CSS) للحفاظ على الملفات المختارة */}
      {service && (
        <Card className={cn("border-border/60", step !== 3 && "hidden")}>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div>
              <p className="text-sm font-extrabold flex items-center gap-2"><CloudUpload className="h-4.5 w-4.5 text-primary" /> المستندات المطلوبة</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                PDF أو JPG أو PNG — يمكنك التصوير من كاميرا الجوال مباشرة
                {mandatoryDocs.length > 0 && <span className="text-rose-600 font-bold"> ({uploadedMandatory}/{mandatoryDocs.length} إلزامي مرفوع)</span>}
              </p>
            </div>
            {service.requiredDocs.map((d) => {
              const file = files[`doc_${d.id}`];
              return (
                <div key={d.id} className={cn("rounded-xl border p-3.5 transition-colors", file ? "border-emerald-300 bg-emerald-50/40" : d.isMandatory ? "border-border" : "border-dashed border-border/70 bg-muted/20")}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-bold">{d.name} {d.isMandatory && <span className="text-rose-500">*</span>}</p>
                      {d.description && <p className="text-[10px] text-muted-foreground mt-0.5">{d.description}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 nums" dir="ltr">{d.allowedFormats} · ≤ {d.maxSizeMb}MB</p>
                    </div>
                    <label className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 px-4 py-2 text-[11px] font-bold text-muted-foreground transition-colors text-center shrink-0">
                      {file ? `✓ ${file.name.slice(0, 22)}${file.name.length > 22 ? "..." : ""}` : "📎 اختر / صوّر"}
                      <input
                        type="file"
                        name={`doc_${d.id}`}
                        accept=".pdf,.jpg,.jpeg,.png,image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFiles((prev) => ({ ...prev, [`doc_${d.id}`]: f }));
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
            {service.requiredDocs.length === 0 && <p className="text-xs text-muted-foreground">لا توجد مستندات مطلوبة لهذه الخدمة</p>}
          </CardContent>
        </Card>
      )}

      {/* الخطوة 4: المراجعة */}
      {step === 4 && service && (
        <Card className="border-border/60">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <p className="text-sm font-extrabold">مراجعة الطلب قبل الإرسال</p>
            <div className="rounded-xl border bg-muted/30 divide-y text-xs">
              <div className="flex justify-between p-3"><span className="text-muted-foreground">الخدمة</span><span className="font-bold">{service.name}</span></div>
              <div className="flex justify-between p-3"><span className="text-muted-foreground">السعر التقريبي</span><span className="font-bold" style={{ color: office.brandColor }}>{service.price != null ? `${service.price.toLocaleString()} ${CURRENCIES[service.currency]?.symbol}` : (service.priceLabel || "حسب الطلب")}</span></div>
              <div className="flex justify-between p-3"><span className="text-muted-foreground">المدة التقريبية</span><span className="font-bold nums">{service.estimatedDays} يوم عمل</span></div>
              <div className="flex justify-between p-3"><span className="text-muted-foreground">المستندات المرفوعة</span><span className="font-bold nums">{Object.keys(files).length} من {service.requiredDocs.length}</span></div>
            </div>
            <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 cursor-pointer">
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-700" />
              <span className="text-[11px] leading-relaxed text-amber-900">
                أتعهّد بصحة البيانات والمستندات المرفقة، وأوافق على شروط الخدمة وسياسة الخصوصية.
                سيصلني رقم الطلب ورابط التتبع فور الإرسال، مع إشعارات تلقائية عند كل تحديث.
              </span>
            </label>
          </CardContent>
        </Card>
      )}

      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="draft" id="draft-flag" value="0" />

      {/* أزرار التنقل */}
      <div className="flex items-center justify-between gap-3 sticky bottom-4">
        <Button
          type="button"
          variant="outline"
          className="gap-1.5 font-bold"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ChevronRight className="h-4 w-4" /> السابق
        </Button>
        <div className="flex items-center gap-2">
          {step < 4 && (
            <Button
              type="button"
              className="gap-1.5 font-bold"
              disabled={(step === 1 && !serviceId) || (step === 3 && !allMandatoryUploaded)}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              style={{ backgroundColor: office.brandColor }}
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {step === 4 && (
            <>
              <SaveDraftButton brandColor={office.brandColor} />
              <SubmitButton disabled={!confirm || !allMandatoryUploaded} brandColor={office.brandColor} />
            </>
          )}
          {step < 4 && (
            <SaveDraftButton brandColor={office.brandColor} />
          )}
        </div>
      </div>
    </form>
  );
}

function SubmitButton({ disabled, brandColor }: { disabled: boolean; brandColor: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="font-bold gap-2 px-6"
      disabled={pending || disabled}
      onClick={() => {
        const flag = document.getElementById("draft-flag") as HTMLInputElement;
        if (flag) flag.value = "0";
      }}
      style={{ backgroundColor: brandColor }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      إرسال الطلب
    </Button>
  );
}

function SaveDraftButton({ brandColor }: { brandColor: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="outline"
      className="gap-1.5 font-bold"
      disabled={pending}
      onClick={() => {
        const flag = document.getElementById("draft-flag") as HTMLInputElement;
        if (flag) flag.value = "1";
      }}
    >
      <Save className="h-4 w-4" style={{ color: brandColor }} /> حفظ كمسودة
    </Button>
  );
}
