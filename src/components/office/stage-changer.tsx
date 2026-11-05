"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { changeStage } from "@/app/actions/requests";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Zap, Flag, Truck } from "lucide-react";
import { STATUS } from "@/lib/constants";

export type Stage = { id: string; name: string; sortOrder: number; isVisibleToClient: boolean; notifyClient: boolean };

/** تغيير المرحلة بنقرة واحدة مع تسجيل الموظف والوقت (FR-OF-15) */
export function StageChanger({ requestId, currentStageId, stages, status }: { requestId: string; currentStageId: string | null; stages: Stage[]; status: string }) {
  const [pending, startTransition] = useTransition();
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [dialogStage, setDialogStage] = useState<Stage | null>(null);
  const [note, setNote] = useState("");
  const [visible, setVisible] = useState(true);

  const canAdvance = [STATUS.ACCEPTED, STATUS.IN_PROGRESS].includes(status);
  if (!canAdvance) return null;

  const nextStages = stages.filter((s) => !currentStageId || s.sortOrder >= (stages.find((x) => x.id === currentStageId)?.sortOrder ?? -1));

  const advance = (stage: Stage, withNote = false, noteText = "", isVisible = true) => {
    setBusyStage(stage.id);
    startTransition(async () => {
      const res = await changeStage(requestId, { stageId: stage.id, note: noteText || undefined, isVisible });
      if (res.ok) {
        toast.success(`تم الانتقال إلى: ${stage.name}`);
        setDialogStage(null);
        setNote("");
      } else toast.error(res.error);
      setBusyStage(null);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-muted-foreground">الانتقال بين المراحل</p>
        <span className="text-[10px] text-muted-foreground">يظهر للعميل فوراً عند المراحل المرئية</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {nextStages.map((s) => {
          const isCurrent = s.id === currentStageId;
          const isLast = s.sortOrder === stages[stages.length - 1]?.sortOrder;
          return (
            <div key={s.id} className="relative group">
              <Button
                size="sm"
                variant={isCurrent ? "default" : "outline"}
                className={`gap-1.5 text-xs font-bold h-9 ${isLast ? "border-emerald-400 text-emerald-700 hover:bg-emerald-50" : ""}`}
                disabled={pending && busyStage === s.id}
                onClick={() => {
                  setNote("");
                  setVisible(s.isVisibleToClient);
                  setDialogStage(s);
                }}
              >
                {pending && busyStage === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isLast ? <Flag className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                {s.name}
                {isCurrent && <span className="text-[9px] opacity-80">(الحالية)</span>}
              </Button>
            </div>
          );
        })}
      </div>

      {/* حوار التفاصيل */}
      <Dialog open={!!dialogStage} onOpenChange={(o) => !o && setDialogStage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-primary" />
              الانتقال إلى: {dialogStage?.name}
            </DialogTitle>
            <DialogDescription>اختياري: أضف ملاحظة وحدّد ظهورها للعميل في الخط الزمني</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">ملاحظة (اختياري)</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: تم فتح البيان برقم..." className="text-xs h-9" />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <Checkbox checked={visible} onCheckedChange={(v) => setVisible(Boolean(v))} />
              إظهار هذه المرحلة للعميل في صفحة التتبع
            </label>
            {dialogStage?.notifyClient && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                هذه المرحلة مضبوطة لإرسال إشعار تلقائي للعميل عند الوصول إليها.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogStage(null)}>إلغاء</Button>
            <Button className="font-bold gap-1.5" onClick={() => dialogStage && advance(dialogStage, true, note, visible)}>
              <Zap className="h-4 w-4" /> تأكيد الانتقال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** أزرار الحالات العامة: جاهز / إقفال */
export function StatusQuickActions({ requestId, status }: { requestId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const actions: { label: string; to: string; note: string; className: string }[] = [];
  if (status === STATUS.IN_PROGRESS) {
    actions.push({ label: "تمييز كجاهز للاستلام", to: STATUS.READY, note: "أصبح الطلب جاهزاً للاستلام", className: "border-emerald-400 text-emerald-700 hover:bg-emerald-50" });
  }
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button
          key={a.to}
          size="sm"
          variant="outline"
          className={`gap-1.5 text-xs font-bold h-9 ${a.className}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await changeStage(requestId, { toStatus: a.to, note: a.note });
              if (res.ok) toast.success(res.message || "تم");
              else toast.error(res.error);
            })
          }
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
          {a.label}
        </Button>
      ))}
    </div>
  );
}
