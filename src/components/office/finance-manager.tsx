"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addPayment } from "@/app/actions/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Wallet, Plus, Loader2, FileSpreadsheet, AlertTriangle, Paperclip, Users } from "lucide-react";
import { COST_CATEGORIES, CURRENCIES, PAYMENT_METHODS } from "@/lib/constants";
import { formatMoney, formatDateAr } from "@/lib/format";

type CostRow = { id: string; label: string; category: string; amount: number; currency: string; amountBase: number; isOfficeFee: boolean; requestNumber: string | null; requestId: string | null; customerName: string; createdByName: string | null; createdAt: Date };
type PaymentRow = { id: string; amount: number; currency: string; amountBase: number; method: string; reference: string | null; customerName: string; requestNumber: string | null; receivedByName: string | null; createdAt: Date; attachmentPath: string | null };
type ReceivableRow = { id: string; name: string; due: number };

export function FinanceManager({
  canManage, period, q, costs, payments, receivables, customers,
}: {
  canManage: boolean; period: string; q: string;
  costs: CostRow[]; payments: PaymentRow[]; receivables: ReceivableRow[];
  customers: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [payDialog, setPayDialog] = useState(false);

  const exportCsv = (rows: string[][], filename: string) => {
    const csv = "\uFEFF" + rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* شريط الفترة */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { v: "month", l: "هذا الشهر" },
          { v: "quarter", l: "هذا الربع" },
          { v: "year", l: "هذه السنة" },
          { v: "all", l: "الكل" },
        ].map((p) => (
          <Link key={p.v} href={`/office/finance?period=${p.v}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded-full border px-3 py-1 text-xs font-bold transition-colors ${period === p.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
            {p.l}
          </Link>
        ))}
      </div>

      <Tabs defaultValue="costs" dir="rtl">
        <TabsList className="h-auto flex-wrap justify-start bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="costs" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><Receipt className="h-3.5 w-3.5" /> بنود التكلفة ({costs.length})</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><Wallet className="h-3.5 w-3.5" /> الدفعات ({payments.length})</TabsTrigger>
          <TabsTrigger value="receivables" className="text-xs font-bold rounded-lg data-[state=active]:bg-card px-3 py-1.5 gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> الذمم المستحقة ({receivables.length})</TabsTrigger>
        </TabsList>

        {/* بنود التكلفة */}
        <TabsContent value="costs" className="mt-4">
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="text-right min-w-36">البند</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">التصنيف</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right hidden md:table-cell">النوع</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">المعاملة</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">العميل</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">التاريخ</TableHead>
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
                            {c.isOfficeFee ? "أتعاب" : "مصاريف"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {c.requestId ? (
                            <Link href={`/office/requests/${c.requestId}`} className="text-xs font-bold text-primary hover:underline nums">{c.requestNumber}</Link>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{c.customerName}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground nums">{formatDateAr(c.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {costs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">لا توجد بنود في الفترة المحددة</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 border-t flex justify-end">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold"
                  onClick={() => exportCsv([
                    ["البند", "التصنيف", "المبلغ", "العملة", "بالريال", "النوع", "المعاملة", "العميل", "التاريخ"],
                    ...costs.map((c) => [c.label, COST_CATEGORIES[c.category] || c.category, String(c.amount), c.currency, String(Math.round(c.amountBase)), c.isOfficeFee ? "أتعاب" : "مصاريف", c.requestNumber || "", c.customerName, formatDateAr(c.createdAt)]),
                  ], "cost-items.csv")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> تصدير Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الدفعات */}
        <TabsContent value="payments" className="mt-4 space-y-4">
          {canManage && (
            <div className="flex justify-end">
              <Dialog open={payDialog} onOpenChange={setPayDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 font-bold text-xs"><Plus className="h-4 w-4" /> تسجيل دفعة</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>تسجيل دفعة من عميل</DialogTitle>
                    <DialogDescription>دفعات عامة أو مرتبطة بمعاملة — مع مرجع ومرفق اختياري</DialogDescription>
                  </DialogHeader>
                  <PaymentForm onSubmit={addPayment} onDone={() => setPayDialog(false)} pending={pending} startTransition={startTransition} customers={customers} />
                </DialogContent>
              </Dialog>
            </div>
          )}
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-muted">
                      <TableHead className="text-right min-w-32">العميل</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">الطريقة</TableHead>
                      <TableHead className="text-right hidden md:table-cell">المرجع</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">المعاملة</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">المستلم</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">التاريخ</TableHead>
                      <TableHead className="text-right w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-bold">{p.customerName}</TableCell>
                        <TableCell className="text-xs nums font-bold text-emerald-700">{formatMoney(p.amount, p.currency)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{PAYMENT_METHODS[p.method]}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs nums">{p.reference || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs nums">{p.requestNumber || "عامة"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{p.receivedByName || "—"}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground nums">{formatDateAr(p.createdAt)}</TableCell>
                        <TableCell>
                          {p.attachmentPath && (
                            <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <a href={`/api/files/${p.attachmentPath}`} target="_blank" rel="noreferrer" title="إثبات السداد"><Paperclip className="h-3.5 w-3.5" /></a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">لا توجد دفعات في الفترة</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
              <div className="p-3 border-t flex justify-end">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold"
                  onClick={() => exportCsv([
                    ["العميل", "المبلغ", "العملة", "بالريال", "الطريقة", "المرجع", "المعاملة", "المستلم", "التاريخ"],
                    ...payments.map((p) => [p.customerName, String(p.amount), p.currency, String(Math.round(p.amountBase)), PAYMENT_METHODS[p.method], p.reference || "", p.requestNumber || "", p.receivedByName || "", formatDateAr(p.createdAt)]),
                  ], "payments.csv")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> تصدير Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* الذمم */}
        <TabsContent value="receivables" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Users className="h-4 w-4 text-rose-600" /> أرصدة العملاء المستحقة</CardTitle>
              <CardDescription className="text-xs mt-1">
                إجمالي الذمم: {formatMoney(receivables.reduce((a, r) => a + r.due, 0), "YER")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {receivables.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">لا توجد ذمم مستحقة — جميع الحسابات مسددة 🎉</p>}
              {receivables.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border bg-card p-3">
                  <span className="text-xs font-bold">{r.name}</span>
                  <span className="text-xs nums font-extrabold text-rose-700">{formatMoney(r.due, "YER")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PaymentForm({ onSubmit, onDone, pending, startTransition, customers }: {
  onSubmit: (fd: FormData) => Promise<{ ok: boolean; error?: string; message?: string }>;
  onDone: () => void; pending: boolean; startTransition: (fn: () => Promise<void>) => void;
  customers: { id: string; name: string }[];
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await onSubmit(fd);
          if (res.ok) { toast.success(res.message); onDone(); (e.target as HTMLFormElement).reset(); }
          else toast.error(res.error);
        });
      }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label className="text-xs font-bold">العميل <span className="text-rose-500">*</span></label>
        <select name="customerId" required className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
          <option value="">— اختر العميل —</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold">المبلغ <span className="text-rose-500">*</span></label>
        <Input name="amount" type="number" step="any" min="0" required className="h-10 text-xs nums" dir="ltr" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold">العملة</label>
          <select name="currency" defaultValue="YER" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
            {Object.entries(CURRENCIES).map(([v, c]) => <option key={v} value={v}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold">الطريقة</label>
          <select name="method" defaultValue="CASH" className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold">المرجع</label>
        <Input name="reference" className="h-10 text-xs" dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold">مرفق (اختياري)</label>
        <input type="file" name="attachment" accept=".pdf,.jpg,.jpeg,.png" className="text-xs w-full" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>إلغاء</Button>
        <Button type="submit" className="font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} تسجيل
        </Button>
      </DialogFooter>
    </form>
  );
}
