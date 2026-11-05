"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateShipment, addShipmentItem, deleteShipmentItem, saveRegulatoryStep, deleteRegulatoryStep, toggleChecklistItem, addChecklistItem, setReleasePermit } from "@/app/actions/customs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ship, Save, Plus, Trash2, ShieldCheck, CheckSquare, Square, BadgeCheck, Loader2, Search, FileBadge } from "lucide-react";
import { CONTAINER_TYPES, REG_STEP_TYPES, CURRENCIES } from "@/lib/constants";
import { formatDateAr } from "@/lib/format";

export type ShipmentData = {
  billOfLadingNo: string | null; containerNos: string | null; containerType: string | null;
  supplierName: string | null; importerName: string | null; originCountry: string | null;
  arrivalPort: string | null; carrier: string | null; arrivalDate: Date | null;
  declarationNo: string | null; goodsType: string | null; weight: number | null;
  packagesCount: number | null; value: number | null; currency: string;
  releasePermitNo: string | null; releasePermitAt: Date | null; releasePermitPath: string | null;
};
export type ItemRow = { id: string; description: string; hsCodeText: string | null; hsCodeId: string | null; originCountry: string | null; quantity: number | null; unit: string | null; weight: number | null; value: number | null; currency: string; dutyRate: number | null; salesTaxRate?: number | null };
export type StepRow = { id: string; type: string; title: string; scheduledAt: Date | null; result: string | null; notes: string | null; attachmentPath: string | null; status: string };
export type CheckRow = { id: string; label: string; isDone: boolean };

export function ShipmentPanel({ requestId, shipment, items, steps, checklist }: {
  requestId: string; shipment: ShipmentData | null; items: ItemRow[]; steps: StepRow[]; checklist: CheckRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [checkLabel, setCheckLabel] = useState("");

  const toDateInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  return (
    <div className="space-y-5">
      {/* بيانات الشحنة */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Ship className="h-4 w-4 text-primary" /> بيانات الشحنة الجمركية</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await updateShipment(requestId, fd);
                if (res.ok) toast.success(res.message);
                else toast.error(res.error);
              });
            }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <Field label="رقم بوليصة الشحن" name="billOfLadingNo" defaultValue={shipment?.billOfLadingNo || ""} placeholder="B/L No." dir="ltr" />
            <Field label="أرقام الحاويات" name="containerNos" defaultValue={shipment?.containerNos || ""} placeholder="MSCU1234567, ..." dir="ltr" />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">نوع الحاوية</label>
              <select name="containerType" defaultValue={shipment?.containerType || ""} className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs">
                <option value="">—</option>
                {Object.entries(CONTAINER_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Field label="اسم المورد" name="supplierName" defaultValue={shipment?.supplierName || ""} />
            <Field label="المستورد" name="importerName" defaultValue={shipment?.importerName || ""} />
            <Field label="بلد المنشأ" name="originCountry" defaultValue={shipment?.originCountry || ""} />
            <Field label="ميناء/منفذ الوصول" name="arrivalPort" defaultValue={shipment?.arrivalPort || ""} placeholder="ميناء عدن" />
            <Field label="شركة الشحن" name="carrier" defaultValue={shipment?.carrier || ""} />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">تاريخ الوصول</label>
              <Input type="date" name="arrivalDate" defaultValue={toDateInput(shipment?.arrivalDate)} className="h-9 text-xs" />
            </div>
            <Field label="رقم البيان الجمركي" name="declarationNo" defaultValue={shipment?.declarationNo || ""} dir="ltr" />
            <Field label="نوع البضاعة" name="goodsType" defaultValue={shipment?.goodsType || ""} />
            <Field label="الوزن (كجم)" name="weight" defaultValue={shipment?.weight?.toString() || ""} type="number" dir="ltr" />
            <Field label="العدد" name="packagesCount" defaultValue={shipment?.packagesCount?.toString() || ""} type="number" dir="ltr" />
            <Field label="القيمة" name="value" defaultValue={shipment?.value?.toString() || ""} type="number" dir="ltr" />
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">العملة</label>
              <select name="currency" defaultValue={shipment?.currency || "USD"} className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end">
              <Button type="submit" size="sm" className="gap-1.5 font-bold text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ بيانات الشحنة
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* بنود البضاعة */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><FileBadge className="h-4 w-4 text-primary" /> بنود البضاعة والتصنيف الجمركي (HS Code)</CardTitle>
          <AddItemDialog requestId={requestId} />
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">لا توجد بنود — أضف بنداً مع رمز HS لتقدير الرسوم</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right min-w-40">الوصف</TableHead>
                    <TableHead className="text-right">رمز HS</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">المنشأ</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الكمية</TableHead>
                    <TableHead className="text-right hidden md:table-cell">الوزن</TableHead>
                    <TableHead className="text-right">القيمة</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">الرسوم التقديرية</TableHead>
                    <TableHead className="text-right w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const est = it.dutyRate != null && it.value ? (it.value * it.dutyRate) / 100 : null;
                    const tax = it.salesTaxRate != null && it.value ? (it.value * it.salesTaxRate) / 100 : null;
                    return (
                      <TableRow key={it.id}>
                        <TableCell className="text-xs font-medium max-w-48 truncate">{it.description}</TableCell>
                        <TableCell className="text-xs nums">{it.hsCodeText || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{it.originCountry || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs nums">{it.quantity ?? "—"} {it.unit || ""}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs nums">{it.weight ?? "—"}</TableCell>
                        <TableCell className="text-xs nums font-bold">{it.value?.toLocaleString()} {CURRENCIES[it.currency]?.symbol}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">
                          {est != null ? (
                            <span className="text-[11px] text-muted-foreground nums" title="تقدير غير رسمي">
                              جمارك ~{est.toLocaleString(undefined, { maximumFractionDigits: 0 })} {CURRENCIES[it.currency]?.symbol}
                              {tax != null ? ` + ضريبة ~${tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : ""}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                            disabled={pending}
                            onClick={() => startTransition(async () => {
                              const res = await deleteShipmentItem(it.id, requestId);
                              if (res.ok) toast.success(res.message);
                              else toast.error(res.error);
                            })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground p-3 border-t bg-amber-50/40">
            ⚠️ الحساب تقديري غير رسمي — النسب من الجدول المرجعي القابل للتحديث من مدير النظام، ولا تُعتمد إلا بتأكيد الموظف.
          </p>
        </CardContent>
      </Card>

      {/* الجهات الرقابية */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> سجل التمثيل أمام الجهات الرقابية</CardTitle>
          <AddStepDialog requestId={requestId} />
        </CardHeader>
        <CardContent className="space-y-2.5">
          {steps.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد إجراءات مسجلة</p>}
          {steps.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200">{REG_STEP_TYPES[s.type] || s.type}</span>
                  <p className="text-xs font-bold">{s.title}</p>
                  {s.status === "DONE" ? (
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${s.result === "PASS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s.result === "ISSUE" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {s.result === "PASS" ? "نتيجة: مطابق" : s.result === "ISSUE" ? "ملاحظات" : "منجز"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">قيد الانتظار</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.scheduledAt ? `الموعد: ${formatDateAr(s.scheduledAt)}` : "بدون موعد"}
                  {s.notes ? ` · ${s.notes}` : ""}
                </p>
                {s.attachmentPath && (
                  <a href={`/api/files/${s.attachmentPath}`} target="_blank" rel="noreferrer" className="text-[11px] text-primary font-bold hover:underline mt-1 inline-block">📎 عرض المرفق (محضر/صورة)</a>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                  disabled={pending}
                  onClick={() => startTransition(async () => {
                    const res = await deleteRegulatoryStep(s.id, requestId);
                    if (res.ok) toast.success("تم الحذف");
                    else toast.error(res.error);
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        {/* قائمة التحقق */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><CheckSquare className="h-4 w-4 text-amber-600" /> قائمة التحقق</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist.map((c) => (
              <button
                key={c.id}
                className="w-full flex items-center gap-2.5 rounded-lg border bg-card p-2.5 text-right hover:bg-muted/40 transition-colors"
                disabled={pending}
                onClick={() => startTransition(async () => { await toggleChecklistItem(c.id, !c.isDone, requestId); })}
              >
                {c.isDone ? <CheckSquare className="h-4.5 w-4.5 text-emerald-600 shrink-0" /> : <Square className="h-4.5 w-4.5 text-muted-foreground shrink-0" />}
                <span className={`text-xs font-medium ${c.isDone ? "line-through text-muted-foreground" : ""}`}>{c.label}</span>
              </button>
            ))}
            <div className="flex gap-2 pt-1">
              <Input value={checkLabel} onChange={(e) => setCheckLabel(e.target.value)} placeholder="بند جديد..." className="h-8 text-xs" />
              <Button size="sm" variant="outline" className="h-8 px-2.5 shrink-0" disabled={!checkLabel.trim() || pending}
                onClick={() => startTransition(async () => {
                  const res = await addChecklistItem(requestId, checkLabel);
                  if (res.ok) { setCheckLabel(""); toast.success("تمت الإضافة"); }
                  else toast.error(res.error);
                })}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* إذن الإفراج */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> إذن الإفراج النهائي</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                startTransition(async () => {
                  const res = await setReleasePermit(requestId, fd);
                  if (res.ok) toast.success(res.message);
                  else toast.error(res.error);
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="رقم الإذن" name="releasePermitNo" defaultValue={shipment?.releasePermitNo || ""} dir="ltr" />
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">تاريخ الإذن</label>
                  <Input type="date" name="releasePermitAt" defaultValue={toDateInput(shipment?.releasePermitAt)} className="h-9 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">نسخة الإذن (PDF/صورة)</label>
                <input type="file" name="permitFile" accept=".pdf,.jpg,.jpeg,.png" className="text-xs w-full" />
              </div>
              {shipment?.releasePermitPath && (
                <a href={`/api/files/${shipment.releasePermitPath}`} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline block">📎 عرض نسخة الإذن الحالية</a>
              )}
              <Button type="submit" size="sm" className="gap-1.5 font-bold text-xs" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} حفظ الإذن
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, name, defaultValue, placeholder, type = "text", dir }: any) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-muted-foreground">{label}</label>
      <Input name={name} defaultValue={defaultValue} placeholder={placeholder} type={type} dir={dir} className="h-9 text-xs" />
    </div>
  );
}

// ============ حوار إضافة بند بضاعة مع بحث HS ============
function AddItemDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) { return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/hs-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8"><Plus className="h-3.5 w-3.5" /> إضافة بند</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>إضافة بند بضاعة</DialogTitle>
          <DialogDescription>ابحث عن رمز HS بالرقم أو الوصف (عربي/إنجليزي) — يُقترح الرمز ولا يُعتمد إلا بتأكيدك</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await addShipmentItem(requestId, fd);
              if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); setSelected(null); setQuery(""); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          {/* بحث HS */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold">البحث في جدول HS Code</label>
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="مثال: 100630 أو أرز أو rice" className="pr-8 h-9 text-xs" />
            </div>
            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border divide-y bg-card">
                {results.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    className="w-full text-right p-2 hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                    onClick={() => {
                      setSelected(r);
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    <span className="text-xs font-bold nums">{r.code}</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">{r.descriptionAr}</span>
                    <span className="text-[10px] text-primary font-bold nums">{r.dutyRate}%</span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold nums">{selected.code} — {selected.descriptionAr}</p>
                  <p className="text-[10px] text-muted-foreground">جمارك {selected.dutyRate}% · ضريبة {selected.salesTaxRate}%</p>
                </div>
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] shrink-0" onClick={() => setSelected(null)}>تغيير</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold">وصف البند <span className="text-rose-500">*</span></label>
              <Input name="description" required defaultValue={selected?.descriptionAr || ""} className="h-9 text-xs" placeholder="وصف تفصيلي للبضاعة" />
            </div>
            <input type="hidden" name="hsCodeId" value={selected?.id || ""} />
            <input type="hidden" name="dutyRate" value={selected?.dutyRate ?? 0} />
            <input type="hidden" name="salesTaxRate" value={selected?.salesTaxRate ?? 0} />
            <div className="space-y-1">
              <label className="text-xs font-bold">رمز HS (يُقترح من البحث ويقبل التعديل)</label>
              <Input name="hsCodeText" defaultValue={selected?.code || ""} key={selected?.id || "none"} className="h-9 text-xs nums" dir="ltr" placeholder="مثال: 100630" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">بلد المنشأ</label>
              <Input name="originCountry" className="h-9 text-xs" placeholder="الهند" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الكمية</label>
              <Input name="quantity" type="number" step="any" className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الوحدة</label>
              <Input name="unit" className="h-9 text-xs" placeholder="كرتون / شوال" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الوزن (كجم)</label>
              <Input name="weight" type="number" step="any" className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">القيمة <span className="text-rose-500">*</span></label>
              <Input name="value" type="number" step="any" required className="h-9 text-xs" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">العملة</label>
              <select name="currency" defaultValue="USD" className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} إضافة البند
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============ حوار إضافة إجراء رقابي ============
function AddStepDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8"><Plus className="h-3.5 w-3.5" /> إضافة إجراء</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إجراء جهة رقابية</DialogTitle>
          <DialogDescription>فتح بيان، لجنة معاينة، مواصفات، صحة... مع إمكانية إرفاق محضر أو صورة</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await saveRegulatoryStep(requestId, fd);
              if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold">نوع الإجراء</label>
              <select name="type" defaultValue="INSPECTION" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(REG_STEP_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الموعد</label>
              <Input type="datetime-local" name="scheduledAt" className="h-10 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">العنوان <span className="text-rose-500">*</span></label>
            <Input name="title" required placeholder="مثال: لجنة الكشف والمعاينة — ميناء عدن" className="h-10 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold">النتيجة</label>
              <select name="result" defaultValue="" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                <option value="">قيد الانتظار</option>
                <option value="PASS">مطابق / ناجح</option>
                <option value="ISSUE">ملاحظات / مشكلة</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">مرفق (محضر/صورة)</label>
              <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png" className="text-xs w-full file:mr-2" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">ملاحظات</label>
            <Textarea name="notes" rows={2} placeholder="قيود فنية، متطلبات إضافية..." className="text-xs" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الإجراء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
