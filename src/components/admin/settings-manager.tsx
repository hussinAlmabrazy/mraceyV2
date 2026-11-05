"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { savePlatformSettings } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Save, Loader2, Server, Database, MessageSquare, Mail, ShieldCheck, RefreshCw } from "lucide-react";
import { CHANNEL_LABELS } from "@/lib/constants";

export function SettingsManager({
  settings, stats,
}: {
  settings: {
    platform_name: string; platform_tagline: string; email_provider: string;
    whatsapp_provider: string; backup_daily: boolean;
  };
  stats: {
    officesCount: number; usersCount: number; customersCount: number; requestsCount: number;
    messageChannels: { channel: string; count: number }[];
  };
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <div className="border-t pt-5">
        <h2 className="text-lg font-extrabold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> الإعدادات العامة للمنصة</h2>
        <p className="text-sm text-muted-foreground mt-1">الهوية، مزودو الرسائل، سياسات النسخ الاحتياطي</p>
      </div>

      {/* حالة النظام */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Server, label: "مكاتب مسجلة", value: stats.officesCount },
          { icon: Database, label: "مستخدمون", value: stats.usersCount },
          { icon: ShieldCheck, label: "عملاء", value: stats.customersCount },
          { icon: RefreshCw, label: "إجمالي الطلبات", value: stats.requestsCount },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-extrabold nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* الإعدادات */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold">إعدادات المنصة</CardTitle>
          <CardDescription className="text-xs mt-1">تظهر في الصفحات العامة وتحدد سياسات التشغيل</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await savePlatformSettings(fd);
                if (res.ok) toast.success(res.message);
                else toast.error(res.error);
              });
            }}
            className="space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">اسم المنصة</label>
                <Input name="platform_name" defaultValue={settings.platform_name} className="h-10 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الشعار النصي</label>
                <Input name="platform_tagline" defaultValue={settings.platform_tagline} className="h-10 text-xs" placeholder="منصة إدارة مكاتب السفر والتخليص" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary" /> مزود البريد الإلكتروني</label>
                <Input name="email_provider" defaultValue={settings.email_provider} className="h-10 text-xs" placeholder="SMTP / مزود رسمي" />
                <p className="text-[10px] text-muted-foreground">حالياً: تسجيل في سجل الإرسال — جاهز للربط بمزود SMTP دون تغيير القوالب</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> مزود واتساب Business</label>
                <Input name="whatsapp_provider" defaultValue={settings.whatsapp_provider} className="h-10 text-xs" placeholder="WhatsApp Business API / BSP" />
                <p className="text-[10px] text-muted-foreground">سياسات واتساب تتطلب قوالب معتمدة مسبقاً (Pre-approved Templates)</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer rounded-lg border p-3 bg-emerald-50/40 border-emerald-200">
              <input type="checkbox" name="backup_daily" defaultChecked={settings.backup_daily} className="h-4 w-4 accent-teal-700" />
              النسخ الاحتياطي اليومي التلقائي مع اختبار استعادة أسبوعي (هدف التوافر 99.5%)
            </label>
            <div className="flex justify-end">
              <Button type="submit" size="sm" className="font-bold gap-1.5 text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ الإعدادات
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* إحصاءات القنوات */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold">الرسائل المرسلة حسب القناة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {stats.messageChannels.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد رسائل مرسلة بعد</p>}
          {stats.messageChannels.map((c) => (
            <div key={c.channel} className="flex items-center justify-between rounded-lg border p-2.5">
              <span className="text-xs font-bold">{CHANNEL_LABELS[c.channel] || c.channel}</span>
              <span className="text-xs nums font-extrabold text-primary">{c.count} رسالة</span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground pt-1 border-t">
            كل رسالة تمر عبر بوابة الإشعارات الموحدة: قالب + متغيرات + سجل إرسال + إعادة محاولة عند الفشل — الربط بمزود خارجي لا يغيّر منطق القوالب.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
