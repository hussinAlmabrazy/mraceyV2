"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveHsCode, deleteHsCode } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Table2, Plus, Search, Pencil, Trash2, Loader2, FileSpreadsheet, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

type CodeRow = {
  id: string; code: string; descriptionAr: string; descriptionEn: string | null; unit: string | null;
  dutyRate: number; salesTaxRate: number; otherTaxRate: number;
};

export function HsCodesManager({
  codes, total, inactiveCount, page, perPage, q,
}: {
  codes: CodeRow[]; total: number; inactiveCount: number; page: number; perPage: number; q: string;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{ open: boolean; code?: CodeRow }>({ open: false });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const exportCsv = () => {
    const header = ["الرمز", "الوصف بالعربية", "الوصف بالإنجليزية", "الوحدة", "الجمارك %", "ضريبة المبيعات %", "ضرائب أخرى %"];
    const rows = codes.map((c) => [c.code, c.descriptionAr, c.descriptionEn || "", c.unit || "", String(c.dutyRate), String(c.salesTaxRate), String(c.otherTaxRate)]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "hs-codes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><Table2 className="h-6 w-6 text-primary" /> جدول HS Code المرجعي</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} رمزاً نشطاً · {inactiveCount} معطّلاً — النسب لتقدير الرسوم فقط وتُعتمد من مصدر رسمي
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
          </Button>
          <Button size="sm" className="gap-1.5 font-bold" onClick={() => setDialog({ open: true })}>
            <Plus className="h-4 w-4" /> رمز جديد
          </Button>
        </div>
      </div>

      {/* البحث */}
      <Card className="border-border/60">
        <CardContent className="p-3.5">
          <form method="get" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" defaultValue={q} placeholder="البحث بالرمز أو الوصف (عربي/إنجليزي)..." className="pr-8 h-9 text-xs" />
            </div>
            <Button type="submit" size="sm" className="h-9 text-xs font-bold">بحث</Button>
          </form>
        </CardContent>
      </Card>

      {/* الجدول */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الرمز</TableHead>
                  <TableHead className="text-right min-w-52">الوصف</TableHead>
                  <TableHead className="text-right hidden md:table-cell">الوحدة</TableHead>
                  <TableHead className="text-right">الجمارك</TableHead>
                  <TableHead className="text-right">ضريبة المبيعات</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">ضرائب أخرى</TableHead>
                  <TableHead className="text-right w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/40">
                    <TableCell className="text-xs font-extrabold nums">{c.code}</TableCell>
                    <TableCell>
                      <p className="text-xs font-medium">{c.descriptionAr}</p>
                      {c.descriptionEn && <p className="text-[10px] text-muted-foreground" dir="ltr">{c.descriptionEn}</p>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{c.unit || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold bg-teal-50 text-teal-800 border-teal-200"><span className="nums">{c.dutyRate}%</span></Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200"><span className="nums">{c.salesTaxRate}%</span></Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs nums text-muted-foreground">{c.otherTaxRate ? `${c.otherTaxRate}%` : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDialog({ open: true, code: c })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" disabled={pending}
                          onClick={() => startTransition(async () => {
                            const res = await deleteHsCode(c.id);
                            if (res.ok) toast.success(res.message);
                            else toast.error(res.error);
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {codes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">لا توجد رموز مطابقة</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
          {/* ترقيم الصفحات */}
          {totalPages > 1 && (
            <div className="p-3 border-t flex items-center justify-between text-xs">
              <span className="text-muted-foreground nums">صفحة {page} من {totalPages} · {total} رمزاً</span>
              <div className="flex items-center gap-1.5">
                {page > 1 && (
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Link href={`/admin/hs-codes?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}><ChevronRight className="h-3.5 w-3.5" /> السابق</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <Link href={`/admin/hs-codes?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>التالي <ChevronLeft className="h-3.5 w-3.5" /></Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار الرمز */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, code: o ? dialog.code : undefined })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.code ? `تعديل الرمز: ${dialog.code.code}` : "رمز HS جديد"}</DialogTitle>
            <DialogDescription>النسب تُستخدم في الحساب التقديري للرسوم — حدّثها من المصدر الرسمي المعتمد</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await saveHsCode(fd);
                if (res.ok) { toast.success(res.message); setDialog({ open: false }); }
                else toast.error(res.error);
              });
            }}
            className="space-y-3"
          >
            {dialog.code && <input type="hidden" name="id" value={dialog.code.id} />}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الرمز <span className="text-rose-500">*</span></label>
                <Input name="code" defaultValue={dialog.code?.code || ""} required dir="ltr" className="h-10 text-xs nums" placeholder="مثال: 100630" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الوحدة</label>
                <Input name="unit" defaultValue={dialog.code?.unit || ""} className="h-10 text-xs" placeholder="كجم / لتر / قطعة" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الوصف بالعربية <span className="text-rose-500">*</span></label>
              <Input name="descriptionAr" defaultValue={dialog.code?.descriptionAr || ""} required className="h-10 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold">الوصف بالإنجليزية</label>
              <Input name="descriptionEn" defaultValue={dialog.code?.descriptionEn || ""} dir="ltr" className="h-10 text-xs" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold">الجمارك %</label>
                <Input name="dutyRate" type="number" step="any" min="0" defaultValue={dialog.code?.dutyRate ?? 0} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ضريبة المبيعات %</label>
                <Input name="salesTaxRate" type="number" step="any" min="0" defaultValue={dialog.code?.salesTaxRate ?? 0} className="h-10 text-xs nums" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold">ضرائب أخرى %</label>
                <Input name="otherTaxRate" type="number" step="any" min="0" defaultValue={dialog.code?.otherTaxRate ?? 0} className="h-10 text-xs nums" dir="ltr" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog({ open: false })}>إلغاء</Button>
              <Button type="submit" className="font-bold gap-1.5" disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />} حفظ الرمز
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
