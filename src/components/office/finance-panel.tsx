"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { addCostItem, deleteCostItem, addPayment, createInvoice } from "@/app/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Loader2, Receipt, Wallet, Landmark, FileText } from "lucide-react";
import { COST_CATEGORIES, CURRENCIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatMoney, formatDateAr } from "@/lib/format";

export type CostRow = { id: string; category: string; label: string; amount: number; currency: string; amountBase: number; isOfficeFee: boolean; note: string | null; createdByName: string | null; createdAt: Date };
export type PaymentRow = { id: string; amount: number; currency: string; amountBase: number; method: string; reference: string | null; createdAt: Date; receivedByName: string | null };

export function RequestFinancePanel({
  requestId, customerId, costs, payments, invoice, canManage, remaining,
}: {
  requestId: string; customerId: string; costs: CostRow[]; payments: PaymentRow[];
  invoice: { id: string; invoiceNumber: string; total: number; status: string } | null;
  canManage: boolean; remaining: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      {/* الملخص */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/60">
          <CardContent className="p-3.5 text-center">
            <p className="text-[11px] text-muted-foreground font-bold">إجمالي بنود المعاملة</p>
            <p className="text-lg font-extrabold mt-1 nums">{formatMoney(costs.reduce((a, c) => a + c.amountBase, 0), "YER")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-3.5 text-center">
            <p className="text-[11px] text-muted-foreground font-bold">إجمالي المسدد</p>
            <p className="text-lg font-extrabold mt-1 nums text-emerald-700">{formatMoney(payments.reduce((a, p) => a + p.amountBase, 0), "YER")}</p>
          </CardContent>
        </Card>
        <Card className={remaining > 0.5 ? "border-rose-200 bg-rose-50/50" : "border-emerald-200 bg-emerald-50/50"}>
          <CardContent className="p-3.5 text-center">
            <p className="text-[11px] text-muted-foreground font-bold">{remaining > 0.5 ? "المتبقي على العميل" : "الحساب مسدد بالكامل"}</p>
            <p className={`text-lg font-extrabold mt-1 nums ${remaining > 0.5 ? "text-rose-700" : "text-emerald-700"}`}>{formatMoney(Math.max(remaining, 0), "YER")}</p>
          </CardContent>
        </Card>
      </div>

      {/* بنود التكلفة */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> بنود تكلفة المعاملة</CardTitle>
          {canManage && <AddCostDialog requestId={requestId} />}
        </CardHeader>
        <CardContent className="p-0">
          {costs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">لا توجد بنود تكلفة بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right min-w-32">البند</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">التصنيف</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right hidden md:table-cell">النوع</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">المسجّل</TableHead>
                    <TableHead className="text-right w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs font-medium">{c.label}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{COST_CATEGORIES[c.category] || c.category}</TableCell>
                      <TableCell className="text-xs nums font-bold">{formatMoney(c.amount, c.currency)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${c.isOfficeFee ? "bg-teal-50 text-teal-800 border-teal-200" : "bg-amber-50 text-amber-800 border-amber-200"}`}>
                          {c.isOfficeFee ? "أتعاب المكتب" : "مصاريف نيابة عن العميل"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{c.createdByName}</TableCell>
                      <TableCell>
                        {canManage && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                            onClick={() => startTransition(async () => {
                              const res = await deleteCostItem(c.id, requestId);
                              if (res.ok) toast.success(res.message);
                              else toast.error(res.error);
                            })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الدفعات + الفاتورة */}
      <div className="grid md:grid-cols-2 gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Wallet className="h-4 w-4 text-emerald-600" /> دفعات هذه المعاملة</CardTitle>
            {canManage && <AddPaymentDialog customerId={customerId} requestId={requestId} />}
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">لا توجد دفعات</p>}
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card p-2.5">
                <div>
                  <p className="text-xs font-bold nums">{formatMoney(p.amount, p.currency)}</p>
                  <p className="text-[10px] text-muted-foreground">{PAYMENT_METHODS[p.method]} {p.reference ? `· ${p.reference}` : ""} · {formatDateAr(p.createdAt)}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{p.receivedByName}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><FileText className="h-4 w-4 text-violet-600" /> الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice ? (
              <>
                <div className="rounded-xl border bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-extrabold nums">{invoice.invoiceNumber}</p>
                    <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${invoice.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : invoice.status === "SENT" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-muted text-muted-foreground border-border"}`}>
                      {invoice.status === "PAID" ? "مسددة" : invoice.status === "SENT" ? "مرسلة" : invoice.status === "CANCELLED" ? "ملغاة" : "مسودة"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 nums">الإجمالي: {formatMoney(invoice.total, "YER")}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full gap-1.5 font-bold text-xs">
                  <a href={`/office/invoices/${invoice.id}`} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5" /> عرض / طباعة الفاتورة PDF</a>
                </Button>
              </>
            ) : canManage ? (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  أنشئ فاتورة PDF بهوية المكتب تُجمّع بنود التكلفة الحالية ({costs.length} بنداً) بترقيم تسلسلي.
                </p>
                <Button size="sm" className="gap-1.5 font-bold text-xs w-full" disabled={pending || costs.length === 0}
                  onClick={() => startTransition(async () => {
                    const res = await createInvoice(requestId);
                    if (res.ok) toast.success(res.message);
                    else toast.error(res.error);
                  })}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Receipt className="h-3.5 w-3.5" />} إصدار فاتورة لهذه المعاملة
                </Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">لا توجد فاتورة صادرة</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddCostDialog({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8"><Plus className="h-3.5 w-3.5" /> بند تكلفة</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة بند تكلفة</DialogTitle>
          <DialogDescription>رسوم جمركية، ضرائب، تخزين، مناولة، رسوم رقابية، أتعاب المكتب... بميز المبالغ المدفوعة نيابة عن العميل عن أتعاب المكتب</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await addCostItem(requestId, fd);
              if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-xs font-bold">البيان <span className="text-rose-500">*</span></label>
            <Input name="label" required placeholder="مثال: رسوم تخزين 10 أيام" className="h-10 text-xs" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold">التصنيف</label>
              <select name="category" defaultValue="CUSTOMS" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(COST_CATEGORIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">المبلغ <span className="text-rose-500">*</span></label>
              <Input name="amount" type="number" step="any" min="0" required className="h-10 text-xs nums" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">العملة</label>
              <select name="currency" defaultValue="YER" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.symbol} {c.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer rounded-lg border p-2.5 bg-teal-50/40 border-teal-200">
            <input type="checkbox" name="isOfficeFee" className="h-4 w-4 accent-teal-700" />
            هذا البند من أتعاب المكتب (وليس مصروفاً نيابة عن العميل)
          </label>
          <div className="space-y-1">
            <label className="text-xs font-bold">ملاحظة</label>
            <Input name="note" className="h-10 text-xs" />
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

function AddPaymentDialog({ customerId, requestId }: { customerId: string; requestId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-bold h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"><Plus className="h-3.5 w-3.5" /> تسجيل دفعة</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة للمعاملة</DialogTitle>
          <DialogDescription>تُحتسب تلقائياً بالعملة الأساسية وفق سعر الصرف المضبوط — ويُحدَّث المتبقي فوراً</DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await addPayment(fd);
              if (res.ok) { toast.success(res.message); setOpen(false); formRef.current?.reset(); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          <input type="hidden" name="customerId" value={customerId} />
          <input type="hidden" name="requestId" value={requestId} />
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-xs font-bold">المبلغ <span className="text-rose-500">*</span></label>
              <Input name="amount" type="number" step="any" min="0" required className="h-10 text-xs nums" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">العملة</label>
              <select name="currency" defaultValue="YER" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.symbol}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الطريقة</label>
              <select name="method" defaultValue="CASH" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">المرجع (رقم التحويل/الحوالة)</label>
            <Input name="reference" className="h-10 text-xs" dir="ltr" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold">مرفق إثبات السداد (اختياري)</label>
            <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png" className="text-xs w-full" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} تسجيل الدفعة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
