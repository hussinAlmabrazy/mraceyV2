"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfficeLogo } from "@/components/shared/logo";
import { formatMoney, formatDateAr } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = { DRAFT: "مسودة", SENT: "مرسلة", PAID: "مسددة", CANCELLED: "ملغاة" };

export function InvoicePrint({
  invoice, customer, office, requestInfo,
}: {
  invoice: {
    invoiceNumber: string; issueDate: Date; dueDate: Date | null; status: string;
    currency: string; total: number; subtotal: number; note: string | null;
    items: { label: string; amount: number; isOfficeFee?: boolean }[];
  };
  customer: {
    name: string; customerType: string; phone: string | null; email: string | null;
    address: string | null; taxNumber: string | null;
  };
  office: {
    name: string; phone: string | null; email: string | null; address: string | null;
    city: string | null; brandColor: string; workingHours: string | null; slug: string;
  };
  requestInfo: { requestNumber: string; serviceName: string } | null;
}) {
  const officeFees = invoice.items.filter((i) => i.isOfficeFee);
  const expenses = invoice.items.filter((i) => !i.isOfficeFee);

  const Row = ({ item }: { item: { label: string; amount: number; isOfficeFee?: boolean } }) => (
    <tr className="border-b border-border/50">
      <td className="py-2.5 px-3 text-xs">{item.label}</td>
      <td className="py-2.5 px-3 text-center text-[10px] font-bold">{item.isOfficeFee ? "أتعاب" : "مصاريف"}</td>
      <td className="py-2.5 px-3 text-xs nums font-bold text-left" dir="ltr">{item.amount.toLocaleString()}</td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-muted/40 py-6 px-3 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* شريط الطباعة */}
        <div className="flex items-center justify-between no-print">
          <p className="text-xs text-muted-foreground">فاتورة رسمية — استخدم زر الطباعة وحفظها PDF</p>
          <Button onClick={() => window.print()} className="gap-1.5 font-bold text-xs">
            <Printer className="h-4 w-4" /> طباعة / حفظ PDF
          </Button>
        </div>

        {/* الفاتورة */}
        <div className="bg-white print-full shadow-lg rounded-2xl overflow-hidden border" style={{ borderTop: `4px solid ${office.brandColor}` }}>
          {/* الرأس */}
          <div className="p-6 sm:p-8 border-b bg-gradient-to-l from-muted/30 to-transparent">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <OfficeLogo name={office.name} color={office.brandColor} size={52} />
                <div>
                  <h1 className="text-lg font-extrabold">{office.name}</h1>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {office.address}{office.city ? ` — ${office.city}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground nums" dir="ltr">
                    {office.phone}{office.email ? ` · ${office.email}` : ""}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-center">
                <h2 className="text-2xl font-extrabold" style={{ color: office.brandColor }}>فاتورة</h2>
                <p className="text-sm font-bold nums mt-1">{invoice.invoiceNumber}</p>
                <p className="text-[11px] text-muted-foreground mt-1">حالة: {STATUS_LABELS[invoice.status] || invoice.status}</p>
              </div>
            </div>
          </div>

          {/* بيانات */}
          <div className="grid sm:grid-cols-2 gap-6 p-6 sm:p-8">
            <div>
              <p className="text-[10px] font-extrabold text-muted-foreground mb-2">فاتورة إلى</p>
              <p className="text-sm font-extrabold">{customer.name}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {customer.customerType === "COMPANY" ? "شركة" : "فرد"}
                {customer.taxNumber ? ` · رقم ضريبي: ${customer.taxNumber}` : ""}
              </p>
              {customer.phone && <p className="text-[11px] text-muted-foreground nums" dir="ltr">{customer.phone}</p>}
              {customer.address && <p className="text-[11px] text-muted-foreground">{customer.address}</p>}
            </div>
            <div className="sm:text-left">
              <div className="space-y-1.5 text-[11px]">
                <p><span className="text-muted-foreground font-bold">تاريخ الإصدار: </span><span className="nums">{formatDateAr(invoice.issueDate)}</span></p>
                {invoice.dueDate && <p><span className="text-muted-foreground font-bold">تاريخ الاستحقاق: </span><span className="nums">{formatDateAr(invoice.dueDate)}</span></p>}
                {requestInfo && (
                  <>
                    <p><span className="text-muted-foreground font-bold">المعاملة: </span><span className="nums font-bold">{requestInfo.requestNumber}</span></p>
                    <p><span className="text-muted-foreground font-bold">الخدمة: </span>{requestInfo.serviceName}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* البنود */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/60 text-[11px] font-extrabold text-muted-foreground">
                    <th className="py-2.5 px-3 text-right">البند</th>
                    <th className="py-2.5 px-3 text-center">النوع</th>
                    <th className="py-2.5 px-3 text-left">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length > 0 && (
                    <>
                      <tr className="bg-muted/20"><td colSpan={3} className="py-1.5 px-3 text-[10px] font-extrabold text-muted-foreground">مصاريف سُددت نيابة عن العميل</td></tr>
                      {expenses.map((item, i) => <Row key={`e${i}`} item={item} />)}
                    </>
                  )}
                  {officeFees.length > 0 && (
                    <>
                      <tr className="bg-muted/20"><td colSpan={3} className="py-1.5 px-3 text-[10px] font-extrabold text-muted-foreground">أتعاب المكتب</td></tr>
                      {officeFees.map((item, i) => <Row key={`f${i}`} item={item} />)}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* الإجماليات */}
            <div className="flex justify-start sm:justify-end mt-4">
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-bold">المجموع الفرعي</span>
                  <span className="nums font-bold" dir="ltr">{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: `${office.brandColor}12` }}>
                  <span className="text-sm font-extrabold" style={{ color: office.brandColor }}>الإجمالي المستحق</span>
                  <span className="text-lg font-extrabold nums" style={{ color: office.brandColor }} dir="ltr">
                    {invoice.total.toLocaleString()} {invoice.currency === "YER" ? "ر.ي" : invoice.currency}
                  </span>
                </div>
              </div>
            </div>

            {invoice.note && (
              <div className="mt-4 rounded-lg border bg-muted/20 p-3 text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-bold">ملاحظات: </span>{invoice.note}
              </div>
            )}

            {/* الذيل */}
            <div className="mt-6 pt-4 border-t flex items-center justify-between flex-wrap gap-2 text-[10px] text-muted-foreground">
              <span>شكراً لثقتكم — {office.name}</span>
              <span className="nums" dir="ltr">{office.slug}.marsaa.platform</span>
            </div>
            <div className="mt-4 text-center text-[9px] text-muted-foreground/60 border-t pt-3">
              هذه الفاتورة صادرة إلكترونياً من منصة مراسي ولا تتطلب توقيعاً — تُسدَّد خلال 14 يوماً من تاريخ الإصدار
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
