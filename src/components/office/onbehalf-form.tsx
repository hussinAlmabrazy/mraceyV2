"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, User, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type ServiceOption = {
  id: string; name: string; description: string | null; isClearance: boolean;
  formFields: { id: string; key: string; label: string; type: string; options: string | null; isRequired: boolean; placeholder: string | null }[];
  requiredDocs: { id: string; name: string; isMandatory: boolean; description: string | null }[];
};
type CustomerOption = { id: string; name: string; phone: string | null; whatsapp: string | null; email: string | null; customerType: string };

export function OnBehalfForm({
  services, customers, action,
}: {
  services: ServiceOption[];
  customers: CustomerOption[];
  action: (prev: any, formData: FormData) => Promise<any>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [serviceId, setServiceId] = useState("");
  const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
  const [docFiles, setDocFiles] = useState<Record<string, string>>({});

  const service = services.find((s) => s.id === serviceId);

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs font-medium">{state.error}</AlertDescription>
        </Alert>
      )}

      {/* الخدمة */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> الخدمة المطلوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "text-right rounded-xl border p-3 transition-all",
                  serviceId === s.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <p className="text-xs font-bold">{s.name}</p>
                {s.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{s.description}</p>}
              </button>
            ))}
          </div>
          <input type="hidden" name="serviceId" value={serviceId} />
        </CardContent>
      </Card>

      {/* العميل */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><User className="h-4 w-4 text-primary" /> بيانات العميل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <button type="button" onClick={() => setCustomerMode("existing")}
              className={cn("text-xs font-bold rounded-full border px-3 py-1.5 transition-colors", customerMode === "existing" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
              عميل موجود
            </button>
            <button type="button" onClick={() => setCustomerMode("new")}
              className={cn("text-xs font-bold rounded-full border px-3 py-1.5 transition-colors", customerMode === "new" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>
              عميل جديد
            </button>
          </div>

          {customerMode === "existing" ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">اختر العميل</Label>
              <select name="customerId" className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm">
                <option value="">— اختر —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">أو بدّل إلى «عميل جديد» لإدخاله مباشرة</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <input type="hidden" name="customerId" value="" />
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold">اسم العميل <span className="text-rose-500">*</span></Label>
                <Input name="newCustomerName" placeholder="الاسم الكامل أو اسم الشركة" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">رقم الواتساب/الجوال <span className="text-rose-500">*</span></Label>
                <Input name="newCustomerPhone" placeholder="+967 7xx xxx xxx" dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">واتساب (إن اختلف)</Label>
                <Input name="newCustomerWhatsapp" placeholder="+967 7xx xxx xxx" dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">البريد الإلكتروني</Label>
                <Input name="newCustomerEmail" type="email" placeholder="client@mail.com" dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">النوع</Label>
                <select name="newCustomerType" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                  <option value="INDIVIDUAL">فرد</option>
                  <option value="COMPANY">شركة</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الحقول الديناميكية */}
      {service && service.formFields.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold">تفاصيل الطلب — {service.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {service.formFields.map((f) => (
              <div key={f.id} className={cn("space-y-1.5", f.type === "TEXTAREA" && "sm:col-span-2")}>
                <Label className="text-xs font-bold">{f.label} {f.isRequired && <span className="text-rose-500">*</span>}</Label>
                {f.type === "SELECT" ? (
                  <select name={`field_${f.key}`} defaultValue="" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                    <option value="">— اختر —</option>
                    {(f.options || "").split(",").filter(Boolean).map((o) => <option key={o} value={o.trim()}>{o.trim()}</option>)}
                  </select>
                ) : f.type === "TEXTAREA" ? (
                  <Textarea name={`field_${f.key}`} rows={3} placeholder={f.placeholder || ""} className="text-xs" />
                ) : (
                  <Input name={`field_${f.key}`} type={f.type.toLowerCase()} placeholder={f.placeholder || ""} className="h-10 text-xs" dir={f.type === "NUMBER" || f.type === "DATE" ? "ltr" : undefined} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* المستندات المطلوبة */}
      {service && service.requiredDocs.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> المستندات المطلوبة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {service.requiredDocs.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{d.name} {d.isMandatory && <span className="text-rose-500">*</span>}</p>
                  {d.description && <p className="text-[10px] text-muted-foreground mt-0.5">{d.description}</p>}
                </div>
                <label className="cursor-pointer rounded-lg border-2 border-dashed border-border hover:border-primary/50 px-3 py-2 text-[11px] font-bold text-muted-foreground transition-colors text-center shrink-0">
                  {docFiles[d.id] ? `✓ ${docFiles[d.id]}` : "اختر ملفاً (PDF/JPG/PNG)"}
                  <input type="file" name={`doc_${d.id}`} accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setDocFiles((p) => ({ ...p, [d.id]: f.name }));
                    }}
                  />
                </label>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">المستندات الإلزامية مطلوبة قبل إرسال الطلب — يمكن للعميل استكمال الباقي لاحقاً.</p>
          </CardContent>
        </Card>
      )}

      {/* ملاحظة */}
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-1.5">
          <Label className="text-xs font-bold">ملاحظة الإدخال (تظهر في سجل الطلب)</Label>
          <Textarea name="note" rows={2} placeholder="مثال: أدخل الطلب بموجب زيارة العميل للمكتب ومكالمة هاتفية..." className="text-xs" />
        </CardContent>
      </Card>

      <SubmitButton disabled={!serviceId} />
    </form>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full font-bold gap-2 h-12" disabled={pending || disabled}>
      {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="h-4.5 w-4.5" />}
      إنشاء الطلب وإرسال رابط التتبع للعميل
    </Button>
  );
}
