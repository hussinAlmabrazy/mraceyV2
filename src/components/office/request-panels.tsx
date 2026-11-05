"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { addComment, createTask, toggleTask } from "@/app/actions/requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Lock, Loader2, Plus, CheckSquare, Square } from "lucide-react";
import { formatDateAr, timeAgoAr } from "@/lib/format";

export type CommentRow = { id: string; authorType: string; authorName: string; body: string; isInternal: boolean; createdAt: Date };
export type TaskRow = { id: string; title: string; note: string | null; dueAt: Date | null; isDone: boolean; assigneeName: string | null };

export function CommentsPanel({ requestId, comments }: { requestId: string; comments: CommentRow[] }) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    if (!body.trim()) return;
    startTransition(async () => {
      const res = await addComment(requestId, body, internal);
      if (res.ok) { setBody(""); toast.success("تمت إضافة التعليق"); }
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-96 overflow-y-auto pl-1">
        {comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">لا توجد تعليقات بعد</p>}
        {comments.map((c) => (
          <div key={c.id} className={`rounded-xl border p-3 ${c.isInternal ? "bg-amber-50/50 border-amber-200" : "bg-card"}`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${c.authorType === "STAFF" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {c.authorName[0]}
                </div>
                <span className="text-xs font-bold">{c.authorName}</span>
                {c.isInternal && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full px-1.5 py-0.5">
                    <Lock className="h-2.5 w-2.5" /> داخلي — لا يظهر للعميل
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{timeAgoAr(c.createdAt)}</span>
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-3 space-y-2.5 bg-muted/20">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={internal ? "ملاحظة داخلية للفريق فقط..." : "رسالة إلى العميل — تظهر في صفحة التتبع..."}
          className="bg-card text-xs"
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <Checkbox checked={internal} onCheckedChange={(v) => setInternal(Boolean(v))} />
            ملاحظة داخلية
          </label>
          <Button size="sm" className="font-bold gap-1.5 text-xs" disabled={pending || !body.trim()} onClick={submit}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            إرسال
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TasksPanel({ requestId, tasks, staff }: { requestId: string; tasks: TaskRow[]; staff: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground">مهام وتذكيرات مرتبطة بالطلب ({tasks.length})</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8"><Plus className="h-3.5 w-3.5" /> مهمة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة مهمة / تذكير</DialogTitle>
              <DialogDescription>مثل: حضور لجنة المعاينة غداً — مع تنبيه عند تجاوز المدة المتوقعة</DialogDescription>
            </DialogHeader>
            <form
              ref={formRef}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await createTask(requestId, {
                    title: String(fd.get("title") || ""),
                    note: String(fd.get("note") || ""),
                    dueAt: String(fd.get("dueAt") || "") || undefined,
                    assigneeId: String(fd.get("assigneeId") || "") || undefined,
                  });
                  if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); }
                  else toast.error(res.error);
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold">عنوان المهمة <span className="text-rose-500">*</span></label>
                <Input name="title" required placeholder="مثال: حضور المعاينة في الميناء" className="h-10 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">الموعد</label>
                  <Input type="datetime-local" name="dueAt" className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold">المسؤول</label>
                  <select name="assigneeId" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                    <option value="">بدون</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ملاحظة</label>
                <Input name="note" placeholder="تفاصيل إضافية" className="h-10 text-xs" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />} إضافة المهمة
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">لا توجد مهام</p>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <button
              className="shrink-0"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await toggleTask(t.id, !t.isDone);
                })
              }
            >
              {t.isDone ? <CheckSquare className="h-5 w-5 text-emerald-600" /> : <Square className="h-5 w-5 text-muted-foreground" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-bold ${t.isDone ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t.dueAt ? (
                  <span className={t.dueAt < new Date() && !t.isDone ? "text-rose-600 font-bold" : ""}>
                    الموعد: {formatDateAr(t.dueAt, true)}
                  </span>
                ) : "بدون موعد"}
                {t.assigneeName ? ` · المسؤول: ${t.assigneeName}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
