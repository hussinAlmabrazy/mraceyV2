"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { requestDecision, startReview, assignRequest, closeRequest } from "@/app/actions/requests";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, FileQuestion, Play, Lock, UserCog, Loader2 } from "lucide-react";
import { STATUS } from "@/lib/constants";

type StaffOption = { id: string; name: string; role: string };

export function RequestActions({
  requestId, status, serviceEstimatedDays, staff, assignedToId, canManage, canFinance,
}: {
  requestId: string;
  status: string;
  serviceEstimatedDays: number;
  staff: StaffOption[];
  assignedToId: string | null;
  canManage: boolean;
  canFinance: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(serviceEstimatedDays);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) toast.success(res.message || "تم");
      else toast.error(res.error || "فشل الإجراء");
    });
  };

  const reviewable = status === STATUS.SUBMITTED || status === STATUS.UNDER_REVIEW || status === STATUS.AWAITING_CLIENT;
  const closable = (status === STATUS.READY || status === STATUS.COMPLETED) && canFinance;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}

      {canManage && status === STATUS.SUBMITTED && (
        <Button size="sm" variant="outline" className="gap-1.5 font-bold" disabled={pending} onClick={() => run(() => startReview(requestId))}>
          <Play className="h-4 w-4" /> بدء المراجعة
        </Button>
      )}

      {canManage && reviewable && (
        <>
          <AcceptDialog requestId={requestId} estimatedDays={serviceEstimatedDays} days={days} setDays={setDays} disabled={pending} />
          <MissingDialog requestId={requestId} docNames={[]} disabled={pending} />
          <RejectDialog requestId={requestId} disabled={pending} />
        </>
      )}

      {canManage && (
        <AssignSelect requestId={requestId} staff={staff} assignedToId={assignedToId} disabled={pending} />
      )}

      {closable && (
        <Button size="sm" variant="outline" className="gap-1.5 font-bold" disabled={pending} onClick={() => run(() => closeRequest(requestId))}>
          <Lock className="h-4 w-4" /> إقفال وتسليم
        </Button>
      )}
    </div>
  );
}

function AcceptDialog({ requestId, estimatedDays, days, setDays, disabled }: any) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 font-bold bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> قبول الطلب
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>قبول الطلب وتحديد المدة</DialogTitle>
          <DialogDescription>
            ستُربط المدة التقريبية للخدمة تلقائياً ({estimatedDays} يوم عمل) ويُحسب التاريخ المتوقع بأيام العمل، وسيصل العميل إشعار بالقبول.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">المدة المتوقعة (أيام عمل)</Label>
            <Input type="number" min={1} max={365} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-10 nums" />
          </div>
          <p className="text-[11px] text-muted-foreground">يمكنك تعديل المدة لهذا الطلب فقط — تتاح التعديلات على المدة الافتراضية من إعدادات الخدمة.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 font-bold gap-1.5"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await requestDecision(requestId, "ACCEPTED", { estimatedDays: days });
                if (res.ok) { toast.success(res.message || "تم قبول الطلب"); setOpen(false); }
                else toast.error(res.error);
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد القبول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MissingDialog({ requestId, docNames, disabled }: any) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [customDocs, setCustomDocs] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selected, setSelected] = useState<string[]>(docNames || []);
  const [allDocs, setAllDocs] = useState<{ name: string; status: string }[]>([]);

  // جلب مستندات الطلب عند الفتح
  const openDialog = async () => {
    setOpen(true);
    try {
      const res = await fetch(`/api/request-docs?requestId=${requestId}`);
      const data = await res.json();
      setAllDocs(data.documents || []);
      setSelected((data.documents || []).filter((d: any) => d.status !== "APPROVED").map((d: any) => d.name));
    } catch { /* ignore */ }
  };

  const names = [...selected, ...customDocs.split("،").map((s) => s.trim()).filter(Boolean)];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-bold border-amber-300 text-amber-800 hover:bg-amber-50" disabled={disabled} onClick={openDialog}>
          <FileQuestion className="h-4 w-4" /> طلب استكمال
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>طلب استكمال نواقص</DialogTitle>
          <DialogDescription>حدد المستندات الناقصة — سيعود الطلب للعميل مع إشعار بالمطلوب والموعد النهائي.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-72 overflow-y-auto">
          {allDocs.map((d) => (
            <label key={d.name} className="flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer hover:bg-muted/50">
              <Checkbox
                checked={selected.includes(d.name)}
                onCheckedChange={(v) =>
                  setSelected(v ? [...selected, d.name] : selected.filter((s) => s !== d.name))
                }
              />
              <span className="text-xs font-medium flex-1">{d.name}</span>
              <span className="text-[10px] text-muted-foreground">{d.status === "APPROVED" ? "مدقق" : d.status === "MISSING" ? "ناقص" : "مرفوع"}</span>
            </label>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">مستندات أخرى (فصل بينها بـ «،»)</Label>
            <Input value={customDocs} onChange={(e) => setCustomDocs(e.target.value)} placeholder="مثال: شهادة مطابقة، تفويض موقّع" className="h-9 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">الموعد النهائي للاستكمال</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-9 text-xs" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            className="font-bold gap-1.5 bg-amber-600 hover:bg-amber-700"
            disabled={pending || names.length === 0}
            onClick={() =>
              startTransition(async () => {
                const res = await requestDecision(requestId, "MISSING", { missingDocNames: names, deadline: deadline || undefined });
                if (res.ok) { toast.success(res.message); setOpen(false); }
                else toast.error(res.error);
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} إرسال طلب الاستكمال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({ requestId, disabled }: any) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 font-bold border-rose-300 text-rose-700 hover:bg-rose-50" disabled={disabled}>
          <XCircle className="h-4 w-4" /> رفض
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>رفض الطلب</DialogTitle>
          <DialogDescription>سيصل العميل إشعار بالرفض مع السبب — يُسجَّل القرار في سجل التدقيق.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <Label className="text-xs font-bold">سبب الرفض <span className="text-rose-500">*</span></Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="مثال: المستندات غير مطابقة للمتطلبات الجمركية..." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          <Button
            variant="destructive" className="font-bold gap-1.5" disabled={pending || !reason.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await requestDecision(requestId, "REJECTED", { reason });
                if (res.ok) { toast.success(res.message); setOpen(false); }
                else toast.error(res.error);
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />} تأكيد الرفض
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignSelect({ requestId, staff, assignedToId, disabled }: any) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(assignedToId || "none");
  return (
    <div className="flex items-center gap-2">
      <UserCog className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select
        value={value}
        onValueChange={(v) => {
          setValue(v);
          startTransition(async () => {
            const res = await assignRequest(requestId, v === "none" ? null : v);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          });
        }}
        disabled={disabled || pending}
      >
        <SelectTrigger className="h-9 w-44 text-xs font-bold">
          <SelectValue placeholder="إسناد إلى..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" className="text-xs">— بدون إسناد —</SelectItem>
          {staff.map((s: StaffOption) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.name} {s.role === "BROKER" ? "(مخلص)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
