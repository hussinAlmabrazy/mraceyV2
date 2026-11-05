"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOfficeSettings, updateLogo } from "@/app/actions/office";
import { updateExchangeRate } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/office/copy-button";
import { Settings, Save, Upload, Loader2, KeyRound, Globe, CalendarOff, Coins } from "lucide-react";
import { formatDateAr } from "@/lib/format";
import { LICENSE_STATUS_LABELS } from "@/lib/constants";

export function OfficeSettingsForm({
  office, license, exchangeRates,
}: {
  office: {
    name: string; slug: string; phone: string | null; whatsapp: string | null; email: string | null;
    address: string | null; city: string | null; managerName: string | null; brandColor: string;
    workingHours: string | null; about: string | null; holidays: string[]; logoPath: string | null;
  };
  license: {
    key: string; status: string; startDate: Date | null; endDate: Date | null; planName: string;
    maxUsers: number; maxStorageMb: number; maxMonthlyReqs: number; whatsappEnabled: boolean;
  } | null;
  exchangeRates: { currency: string; rate: number }[];
}) {
  const [pending, startTransition] = useTransition();
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(exchangeRates.map((r) => [r.currency, String(r.rate)]))
  );

  const daysLeft = license?.endDate ? Math.ceil((new Date(license.endDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> إعدادات المكتب</h1>
        <p className="text-sm text-muted-foreground mt-1">الملف التعريفي، الهوية، ساعات العمل، العطل الرسمية، وأسعار الصرف</p>
      </div>

      {/* الترخيص والباقة */}
      {license && (
        <Card className="border-teal-200 bg-gradient-to-l from-teal-50/70 to-transparent">
          <CardContent className="p-4 sm:p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5"><KeyRound className="h-3.5 w-3.5" /> الباقة والترخيص</p>
              <p className="text-sm font-extrabold mt-1">{license.planName}</p>
              <Badge variant="outline" className={`mt-1.5 text-[10px] font-bold ${license.status === "ACTIVE" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                {LICENSE_STATUS_LABELS[license.status]}
                {daysLeft != null ? ` · ${daysLeft} يوم متبقٍ` : ""}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">حدود الباقة</p>
              <p className="text-xs mt-1 leading-relaxed text-muted-foreground">
                {license.maxUsers} مستخدم · {(license.maxStorageMb / 1024).toFixed(0)} جيجا تخزين · {license.maxMonthlyReqs} طلب/شهر
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">الصلاحية</p>
              <p className="text-xs mt-1 nums">{formatDateAr(license.startDate)} — {formatDateAr(license.endDate)}</p>
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> رابطك العام</p>
              <CopyButton value={`/o/${office.slug}`} label={`/o/${office.slug}`} />
              <span className="text-[10px] text-muted-foreground">شاركه مع عملائك لطلب خدماتك مباشرة</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* الملف التعريفي */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold">الملف التعريفي والهوية</CardTitle>
          <CardDescription className="text-xs">تظهر هذه البيانات في صفحة المكتب العامة وبوابة العملاء</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await updateOfficeSettings(fd);
                if (res.ok) toast.success(res.message);
                else toast.error(res.error);
              });
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold">اسم المكتب</label>
                <Input name="name" defaultValue={office.name} required className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">اسم المسؤول</label>
                <Input name="managerName" defaultValue={office.managerName || ""} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">المدينة</label>
                <Input name="city" defaultValue={office.city || ""} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الهاتف</label>
                <Input name="phone" defaultValue={office.phone || ""} dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">واتساب المكتب</label>
                <Input name="whatsapp" defaultValue={office.whatsapp || ""} dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">البريد الإلكتروني</label>
                <Input name="email" type="email" defaultValue={office.email || ""} dir="ltr" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ساعات العمل</label>
                <Input name="workingHours" defaultValue={office.workingHours || ""} placeholder="السبت - الخميس: 8ص - 4م" className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold">العنوان</label>
                <Input name="address" defaultValue={office.address || ""} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold">نبذة عن المكتب</label>
                <textarea name="about" defaultValue={office.about || ""} rows={3}
                  className="flex w-full rounded-lg border border-input bg-card px-3 py-2 text-xs min-h-20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">لون الهوية</label>
                <div className="flex items-center gap-2">
                  <input type="color" name="brandColor" defaultValue={office.brandColor} className="h-10 w-14 rounded-lg border border-input bg-card p-1" />
                  <span className="text-xs text-muted-foreground nums" dir="ltr">{office.brandColor}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5"><CalendarOff className="h-3.5 w-3.5" /> العطل الرسمية (تُستثنى من المدد)</label>
                <Input name="holidays" defaultValue={office.holidays.join(", ")} placeholder="2026-01-01, 2026-05-01" dir="ltr" className="h-10 text-xs nums" />
                <p className="text-[10px] text-muted-foreground">تواريخ ISO مفصولة بفواصل — تُستثنى من حساب أيام العمل</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="font-bold gap-1.5 text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ الإعدادات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* الشعار */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold">شعار المكتب</CardTitle>
            <CardDescription className="text-xs">PNG أو JPG مربّع — يظهر في الصفحة العامة والفواتير</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await updateLogo(fd);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                });
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/40 shrink-0">
                  {office.logoPath ? (
                     
                    <img src={`/api/files/${office.logoPath}`} alt="شعار المكتب" className="h-full w-full object-contain" />
                  ) : (
                    <Upload className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <input type="file" name="logo" accept=".jpg,.jpeg,.png" required className="text-xs w-full" />
              </div>
              <Button type="submit" size="sm" variant="outline" className="gap-1.5 font-bold text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} رفع الشعار
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* أسعار الصرف */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Coins className="h-4 w-4 text-primary" /> أسعار الصرف مقابل الريال اليمني</CardTitle>
            <CardDescription className="text-xs">تُستخدم في تحويل البنود المالية إلى العملة الأساسية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["USD", "SAR"].map((cur) => (
              <div key={cur} className="flex items-center gap-2">
                <span className="text-xs font-bold w-16">{cur === "USD" ? "دولار" : "ريال سعودي"}</span>
                <Input
                  value={rates[cur] || ""}
                  onChange={(e) => setRates((r) => ({ ...r, [cur]: e.target.value }))}
                  type="number"
                  className="h-9 text-xs nums flex-1"
                  dir="ltr"
                />
                <span className="text-[11px] text-muted-foreground">ر.ي</span>
                <Button size="sm" variant="outline" className="h-9 text-xs font-bold shrink-0" disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await updateExchangeRate(cur, parseFloat(rates[cur] || "0"));
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  تحديث
                </Button>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">المبالغ المحوّلة تُحسب وقت تسجيل البند وفق السعر الساري حينها.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
