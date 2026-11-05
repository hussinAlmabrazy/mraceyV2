"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createTask, toggleTask } from "@/app/actions/requests";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, CheckSquare, Square, Loader2, Clock, User } from "lucide-react";
import { formatDateAr, timeAgoAr } from "@/lib/format";

type TaskRow = {
  id: string; title: string; note: string | null; dueAt: Date | null; isDone: boolean; doneAt: Date | null;
  requestId: string | null; requestNumber: string | null; assigneeName: string | null; createdByName: string | null;
};

export function TasksManager({ tasks, staff }: { tasks: TaskRow[]; staff: { id: string; name: string }[] }) {
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const [showForm, setShowForm] = useState(false);

  const filtered = tasks.filter((t) => (filter === "open" ? !t.isDone : filter === "done" ? t.isDone : true));
  const overdue = tasks.filter((t) => !t.isDone && t.dueAt && t.dueAt < new Date()).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><ListTodo className="h-6 w-6 text-primary" /> المهام والتذكيرات</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks.filter((t) => !t.isDone).length} مهمة مفتوحة
            {overdue > 0 && <span className="text-rose-600 font-bold"> · {overdue} متأخرة</span>}
          </p>
        </div>
        <Button size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> مهمة عامة
        </Button>
      </div>

      {showForm && (
        <Card className="border-border/60">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await createTask(null, {
                    title: String(fd.get("title") || ""),
                    note: String(fd.get("note") || "") || undefined,
                    dueAt: String(fd.get("dueAt") || "") || undefined,
                    assigneeId: String(fd.get("assigneeId") || "") || undefined,
                  });
                  if (res.ok) { toast.success(res.message); (e.target as HTMLFormElement).reset(); setShowForm(false); }
                  else toast.error(res.error);
                });
              }}
              className="grid sm:grid-cols-4 gap-2.5 items-end"
            >
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">عنوان المهمة *</label>
                <Input name="title" required placeholder="مثال: متابعة نتيجة فحص المواصفات" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">الموعد</label>
                <Input type="datetime-local" name="dueAt" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">المسؤول</label>
                <select name="assigneeId" className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs">
                  <option value="">بدون</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4 flex justify-end">
                <Button type="submit" size="sm" className="font-bold gap-1.5 text-xs" disabled={pending}>
                  {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} إضافة
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* الفلاتر */}
      <div className="flex gap-2">
        {[
          { v: "open", l: "مفتوحة" },
          { v: "done", l: "منجزة" },
          { v: "all", l: "الكل" },
        ].map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v as any)}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${filter === f.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">لا توجد مهام</p>}
        {filtered.map((t) => {
          const isOverdue = !t.isDone && t.dueAt && t.dueAt < new Date();
          return (
            <Card key={t.id} className={`border-border/60 ${isOverdue ? "border-rose-200 bg-rose-50/30" : ""}`}>
              <CardContent className="p-3.5 flex items-center gap-3">
                <button disabled={pending} onClick={() => startTransition(async () => { await toggleTask(t.id, !t.isDone); })} className="shrink-0">
                  {t.isDone ? <CheckSquare className="h-5 w-5 text-emerald-600" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-bold ${t.isDone ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {t.requestNumber && (
                      <Link href={`/office/requests/${t.requestId}`} className="text-[10px] font-bold text-primary hover:underline nums">
                        {t.requestNumber}
                      </Link>
                    )}
                    {t.dueAt && (
                      <span className={`text-[10px] flex items-center gap-1 ${isOverdue ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                        <Clock className="h-3 w-3" /> {formatDateAr(t.dueAt, true)}
                      </span>
                    )}
                    {t.assigneeName && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> {t.assigneeName}</span>
                    )}
                    {t.note && <span className="text-[10px] text-muted-foreground">· {t.note}</span>}
                  </div>
                </div>
                {isOverdue && <Badge variant="outline" className="bg-rose-50 border-rose-200 text-rose-700 text-[9px] shrink-0">متأخرة</Badge>}
                {t.isDone && t.doneAt && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgoAr(t.doneAt)}</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
