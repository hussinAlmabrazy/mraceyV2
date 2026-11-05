"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveCustomer, shareStatement } from "@/app/actions/office";
import { shareStatement as shareStatementFinance } from "@/app/actions/finance";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Search, Plus, Pencil, FileSpreadsheet, UserRound, Building2, Loader2, Send, KeyRound } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { WhatsAppQuickLink } from "@/components/office/whatsapp-notify";

type CustomerRow = {
  id: string; name: string; customerType: string; phone: string | null; whatsapp: string | null;
  email: string | null; taxNumber: string | null; crNumber: string | null; address: string | null;
  hasAccount: boolean; requestsCount: number; balance: number;
};

export function CustomersManager({ canManage, officeSlug, customers }: { canManage: boolean; officeSlug: string; customers: CustomerRow[] }) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ open: boolean; customer?: CustomerRow }>({ open: false });

  const exportCsv = () => {
    const header = ["الاسم", "النوع", "الجوال", "واتساب", "البريد", "الرقم الضريبي", "السجل التجاري", "عدد الطلبات", "الرصيد المستحق"];
    const rows = customers.map((c) => [
      c.name, c.customerType === "COMPANY" ? "شركة" : "فرد", c.phone || "", c.whatsapp || "", c.email || "",
      c.taxNumber || "", c.crNumber || "", String(c.requestsCount), String(Math.round(c.balance)),
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> العملاء</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} عميل — أرصدتهم وطلباتهم وسجلاتهم</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
          </Button>
          {canManage && (
            <Button size="sm" className="gap-1.5 font-bold text-xs" onClick={() => setDialog({ open: true })}>
              <Plus className="h-4 w-4" /> عميل جديد
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-3.5">
          <form method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="بحث بالاسم أو الجوال أو البريد أو الرقم الضريبي" className="pr-8 h-9 text-xs" />
            </div>
            <Button type="submit" size="sm" className="h-9 text-xs font-bold">بحث</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right min-w-40">العميل</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">النوع</TableHead>
                  <TableHead className="text-right hidden md:table-cell">التواصل</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">الرقم الضريبي</TableHead>
                  <TableHead className="text-right">الطلبات</TableHead>
                  <TableHead className="text-right">الرصيد المستحق</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">الحساب</TableHead>
                  <TableHead className="text-right w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${c.customerType === "COMPANY" ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                          {c.customerType === "COMPANY" ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                        </div>
                        <span className="text-xs font-bold truncate max-w-36">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{c.customerType === "COMPANY" ? "شركة" : "فرد"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs nums" dir="ltr">
                      <div>{c.phone || "—"}</div>
                      {c.email && <div className="text-[10px] text-muted-foreground">{c.email}</div>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs nums">{c.taxNumber || "—"}</TableCell>
                    <TableCell className="text-xs nums font-bold">{c.requestsCount}</TableCell>
                    <TableCell className="text-xs">
                      <span className={`nums font-bold ${c.balance > 0.5 ? "text-rose-700" : "text-emerald-700"}`}>
                        {c.balance > 0.5 ? formatMoney(c.balance, "YER") : "مسدد"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.hasAccount ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 flex items-center gap-1 w-fit"><KeyRound className="h-2.5 w-2.5" /> له بوابة</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">بدون حساب</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <WhatsAppQuickLink
                          phone={c.whatsapp || c.phone}
                          text={`مرحباً ${c.name}،`}
                          title={c.whatsapp || c.phone ? "مراسلة عبر واتساب" : undefined}
                        />
                        {canManage && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="تعديل" onClick={() => setDialog({ open: true, customer: c })}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" title="إرسال كشف حساب للعميل" disabled={pending}
                          onClick={() => startTransition(async () => {
                            const res = await shareStatementFinance(c.id);
                            if (res.ok) toast.success(res.message);
                            else toast.error(res.error);
                          })}
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-10">لا يوجد عملاء مطابقون</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* حوار العميل */}
      <CustomerDialog open={dialog.open} customer={dialog.customer} onOpenChange={(o) => setDialog({ open: o, customer: o ? dialog.customer : undefined })} />
    </div>
  );
}

function CustomerDialog({ open, customer, onOpenChange }: { open: boolean; customer?: CustomerRow; onOpenChange: (o: boolean) => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "تعديل بيانات العميل" : "عميل جديد"}</DialogTitle>
          <DialogDescription>{customer ? "تحديث بيانات التواصل والسجلات" : "أضف عميلاً لإسناد الطلبات إليه"}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await saveCustomer(fd);
              if (res.ok) { toast.success(res.message); onOpenChange(false); }
              else toast.error(res.error);
            });
          }}
          className="space-y-3"
        >
          {customer && <input type="hidden" name="id" value={customer.id} />}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold">الاسم <span className="text-rose-500">*</span></label>
              <Input name="name" defaultValue={customer?.name || ""} required className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">النوع</label>
              <select name="customerType" defaultValue={customer?.customerType || "INDIVIDUAL"} className="h-10 w-full rounded-lg border border-input bg-card px-2 text-xs">
                <option value="INDIVIDUAL">فرد</option>
                <option value="COMPANY">شركة</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الجوال</label>
              <Input name="phone" defaultValue={customer?.phone || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">واتساب</label>
              <Input name="whatsapp" defaultValue={customer?.whatsapp || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">البريد الإلكتروني</label>
              <Input name="email" type="email" defaultValue={customer?.email || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الرقم الضريبي</label>
              <Input name="taxNumber" defaultValue={customer?.taxNumber || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">السجل التجاري</label>
              <Input name="crNumber" defaultValue={customer?.crNumber || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold">العنوان</label>
              <Input name="address" defaultValue={customer?.address || ""} className="h-10 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
