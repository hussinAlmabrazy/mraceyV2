import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { formatDateAr } from "@/lib/business";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "سجل التدقيق العام" };

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const officeFilter = sp.office || "";

  const where: any = {};
  if (officeFilter) where.officeId = officeFilter;
  if (q) where.OR = [{ actorName: { contains: q } }, { action: { contains: q } }, { details: { contains: q } }, { entityType: { contains: q } }];

  const [logs, offices] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { office: { select: { name: true } } },
    }),
    db.office.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><ScrollText className="h-6 w-6 text-primary" /> سجل التدقيق العام</h1>
        <p className="text-sm text-muted-foreground mt-1">كل العمليات الحساسة على مستوى المنصة: التراخيص، الانتحال، الإعدادات، وعمليات المكاتب</p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-3.5">
          <form method="get" className="flex flex-wrap gap-2">
            <input name="q" defaultValue={q} placeholder="بحث: المستخدم، العملية، التفاصيل..." className="flex h-9 flex-1 min-w-44 rounded-lg border border-input bg-card px-3 text-xs" />
            <select name="office" defaultValue={officeFilter} className="h-9 rounded-lg border border-input bg-card px-2 text-xs">
              <option value="">كل المكاتب</option>
              {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button type="submit" className="h-9 rounded-lg bg-primary text-primary-foreground px-4 text-xs font-bold">تصفية</button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="bg-muted">
                  <TableHead className="text-right min-w-36">الوقت</TableHead>
                  <TableHead className="text-right">المستخدم</TableHead>
                  <TableHead className="text-right">العملية</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">المكتب</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">الكيان</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">التفاصيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-[11px] text-muted-foreground nums whitespace-nowrap">{formatDateAr(a.createdAt, true)}</TableCell>
                    <TableCell className="text-xs font-bold">{a.actorName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-bold bg-muted">{AUDIT_ACTION_LABELS[a.action] || a.action}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{a.office?.name || "عام"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{a.entityType}</TableCell>
                    <TableCell className="hidden xl:table-cell text-[10px] text-muted-foreground max-w-80 truncate nums">{a.details || "—"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-10">لا توجد سجلات</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
