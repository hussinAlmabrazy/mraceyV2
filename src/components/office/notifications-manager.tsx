"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { saveTemplate, toggleTemplate, markNotificationsRead, testNotifyStaff, resendMessage } from "@/app/actions/office";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BellRing, Pencil, Power, Loader2, CheckCheck, Send, Variable, MessageSquareText, FlaskConical, RotateCcw, MessageCircle, Link as LinkIcon } from "lucide-react";
import { timeAgoAr } from "@/lib/format";

type TemplateRow = { id: string; event: string; channel: string; subject: string | null; body: string; isActive: boolean };
type NotificationRow = { id: string; title: string; body: string; isRead: boolean; createdAt: Date; requestNumber: string | null; link: string | null };
type MessageLogRow = { id: string; channel: string; recipient: string; subject: string | null; body: string; status: string; error: string | null; createdAt: Date; attempts: number };

const VARIABLES = [
  { key: "{{client_name}}", desc: "اسم العميل" },
  { key: "{{request_number}}", desc: "رقم الطلب" },
  { key: "{{service_name}}", desc: "اسم الخدمة" },
  { key: "{{track_link}}", desc: "رابط التتبع العام" },
  { key: "{{estimated_days}}", desc: "المدة المتوقعة" },
  { key: "{{expected_date}}", desc: "التاريخ المتوقع للإنجاز" },
  { key: "{{stage_name}}", desc: "اسم المرحلة" },
  { key: "{{missing_docs}}", desc: "المستندات الناقصة" },
  { key: "{{deadline}}", desc: "الموعد النهائي" },
  { key: "{{reason}}", desc: "سبب الرفض" },
  { key: "{{remaining}}", desc: "المبلغ المتبقي" },
];

export function NotificationsManager({
  templates, notifications, messageLogs, eventLabels, channelLabels,
}: {
  templates: TemplateRow[];
  notifications: NotificationRow[];
  messageLogs: MessageLogRow[];
  eventLabels: Record<string, string>;
  channelLabels: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [editDialog, setEditDialog] = useState<TemplateRow | null>(null);

  // تجميع القوالب حسب الحدث
  const byEvent = new Map<string, TemplateRow[]>();
  for (const t of templates) {
    const list = byEvent.get(t.event) || [];
    list.push(t);
    byEvent.set(t.event, list);
  }

  const channelIcons: Record<string, string> = { INAPP: "🔔", EMAIL: "✉️", WHATSAPP: "💬", SMS: "📱" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><BellRing className="h-6 w-6 text-primary" /> الإشعارات والقوالب</h1>
          <p className="text-sm text-muted-foreground mt-1">قوالب قابلة للتعديل بمتغيرات — تُرسل تلقائياً عند الأحداث</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs" disabled={pending}
          onClick={() => startTransition(async () => {
            const res = await testNotifyStaff();
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          })}
        >
          <FlaskConical className="h-4 w-4" /> إشعار تجريبي
        </Button>
      </div>

      <Tabs defaultValue="templates" dir="rtl">
        <TabsList className="h-auto flex-wrap justify-start bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="templates" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><MessageSquareText className="h-3.5 w-3.5" /> القوالب ({templates.length})</TabsTrigger>
          <TabsTrigger value="inbox" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><BellRing className="h-3.5 w-3.5" /> إشعاراتي ({notifications.filter((n) => !n.isRead).length})</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><Send className="h-3.5 w-3.5" /> سجل الإرسال ({messageLogs.length})</TabsTrigger>
        </TabsList>

        {/* القوالب */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {Array.from(byEvent.entries()).map(([event, list]) => (
            <Card key={event} className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold">{eventLabels[event] || event}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {list.map((t) => (
                  <div key={t.id} className={`rounded-xl border p-3 ${!t.isActive ? "opacity-50" : "bg-card"}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold bg-muted gap-1">
                          {channelIcons[t.channel]} {channelLabels[t.channel] || t.channel}
                        </Badge>
                        {t.subject && <span className="text-xs font-bold">{t.subject}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="تعديل" onClick={() => setEditDialog(t)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={t.isActive ? "تعطيل" : "تفعيل"} disabled={pending}
                          onClick={() => startTransition(async () => {
                            const res = await toggleTemplate(t.id, !t.isActive);
                            if (!res.ok) toast.error(res.error);
                          })}
                        >
                          <Power className={`h-3.5 w-3.5 ${t.isActive ? "text-emerald-600" : "text-muted-foreground"}`} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3">{t.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* إشعاراتي */}
        <TabsContent value="inbox" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-extrabold">آخر الإشعارات</CardTitle>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-8" disabled={pending}
                onClick={() => startTransition(async () => {
                  const res = await markNotificationsRead();
                  if (res.ok) toast.success("تم تعليم الكل كمقروء");
                })}
              >
                <CheckCheck className="h-3.5 w-3.5" /> تعليم الكل كمقروء
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">لا توجد إشعارات</p>}
              {notifications.map((n) => (
                <div key={n.id} className={`rounded-xl border p-3 ${n.isRead ? "bg-card opacity-70" : "bg-primary/5 border-primary/20"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold">{n.title}</p>
                    <span className="text-[10px] text-muted-foreground">{timeAgoAr(n.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap line-clamp-3">{n.body}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {n.requestNumber && <span className="text-[10px] font-bold text-primary nums">{n.requestNumber}</span>}
                    {n.link && (
                      n.link.startsWith("https://wa.me/") ? (
                        <a
                          href={n.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "#1DA851" }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          إرسال عبر واتساب
                        </a>
                      ) : (
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/5"
                        >
                          <LinkIcon className="h-3 w-3" />
                          عرض التفاصيل
                        </Link>
                      )
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* سجل الإرسال */}
        <TabsContent value="logs" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold">سجل الإرسال (نجاح/فشل/وقت + إعادة المحاولة)</CardTitle>
              <CardDescription className="text-xs mt-1">
                البريد وواتساب وSMS تعمل حالياً بوضع المحاكاة الكامل عبر بوابة موحّدة — جاهزة للربط بمزود رسمي (SMTP / WhatsApp Business API) دون تغيير القوالب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {messageLogs.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">لا توجد رسائل مرسلة</p>}
              {messageLogs.map((l) => (
                <div key={l.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold bg-muted gap-1">
                        {channelIcons[l.channel]} {channelLabels[l.channel] || l.channel}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground nums" dir="ltr">{l.recipient}</span>
                      {l.requestId && <span className="text-[10px] text-primary font-bold">طلب مرتبط</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${l.status === "SENT" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                        {l.status === "SENT" ? "✓ أُرسلت" : "فشلت"}
                        {l.attempts > 1 ? ` (${l.attempts} محاولات)` : ""}
                      </span>
                      {l.status !== "SENT" && (
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold gap-1" disabled={pending}
                          onClick={() => startTransition(async () => {
                            const res = await resendMessage(l.id);
                            if (res.ok) toast.success(res.message);
                            else toast.error(res.error);
                          })}
                        >
                          <RotateCcw className="h-3 w-3" /> إعادة
                        </Button>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeAgoAr(l.createdAt)}</span>
                    </div>
                  </div>
                  {l.subject && <p className="text-xs font-bold mt-2">{l.subject}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed whitespace-pre-wrap line-clamp-2">{l.body}</p>
                  {l.error && <p className="text-[10px] text-rose-600 mt-1">{l.error}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* حوار تعديل القالب */}
      <Dialog open={!!editDialog} onOpenChange={(o) => !o && setEditDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل القالب — {editDialog && (eventLabels[editDialog.event] || editDialog.event)} ({editDialog && (channelLabels[editDialog.channel] || editDialog.channel)})</DialogTitle>
            <DialogDescription className="text-xs">استخدم المتغيرات بالضغط عليها لإدراجها</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await saveTemplate(fd);
                if (res.ok) { toast.success(res.message); setEditDialog(null); }
                else toast.error(res.error);
              });
            }}
            className="space-y-3"
          >
            <input type="hidden" name="id" value={editDialog?.id} />
            <div className="space-y-1.5">
              <label className="text-xs font-bold">العنوان (للبريد والإشعار الداخلي)</label>
              <Input name="subject" defaultValue={editDialog?.subject || ""} className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">نص الرسالة <span className="text-rose-500">*</span></label>
              <Textarea name="body" defaultValue={editDialog?.body} rows={6} required className="text-xs" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  type="button"
                  key={v.key}
                  title={v.desc}
                  className="text-[10px] font-bold rounded-full border bg-muted/60 hover:bg-primary hover:text-primary-foreground border-border px-2 py-0.5 nums transition-colors"
                  onClick={() => {
                    const ta = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
                    if (ta) {
                      const start = ta.selectionStart;
                      ta.value = ta.value.slice(0, start) + v.key + ta.value.slice(ta.selectionEnd);
                      ta.focus();
                      ta.setSelectionRange(start + v.key.length, start + v.key.length);
                    }
                  }}
                >
                  {v.key}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input type="checkbox" name="isActive" defaultChecked={editDialog?.isActive} className="h-4 w-4 accent-teal-700" />
              القالب مفعّل
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialog(null)}>إلغاء</Button>
              <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ القالب
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
