import Link from "next/link";
import { db } from "@/lib/db";
import { StatCard } from "@/components/shared/widgets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, FileText, Users, AlertTriangle, TrendingUp, HardDrive, Plus, Activity } from "lucide-react";
import { formatDateAr, timeAgoAr } from "@/lib/business";
import { OFFICE_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة مؤشرات المنصة" };

export default async function AdminDashboard() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeOffices, totalOffices, totalRequests, monthRequests, customers, expiringSoon, recentAudit, monthlyVolume] = await Promise.all([
    db.office.count({ where: { status: "ACTIVE" } }),
    db.office.count(),
    db.request.count(),
    db.request.count({ where: { createdAt: { gte: monthStart } } }),
    db.customer.count(),
    db.license.findMany({
      where: { status: "ACTIVE", endDate: { lte: new Date(now.getTime() + 30 * 86400000) } },
      include: { office: { select: { name: true } } },
      take: 5,
      orderBy: { endDate: "asc" },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, where: { officeId: null } }),
    db.request.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 90 * 86400000) } },
      select: { createdAt: true },
    }),
  ]);

  // حجم طلبات آخر 3 أشهر أسبوعياً
  const weeks: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 86400000);
    const start = new Date(end.getTime() - 7 * 86400000);
    weeks.push({
      label: `${end.getDate()}/${end.getMonth() + 1}`,
      count: monthlyVolume.filter((r) => r.createdAt > start && r.createdAt <= end).length,
    });
  }
  const maxWeek = Math.max(...weeks.map((w) => w.count), 1);

  const storageUsed = await db.office.aggregate({ _sum: { storageUsedMb: true } });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">لوحة مؤشرات المنصة</h1>
          <p className="text-sm text-muted-foreground mt-1">نظرة عامة على المكاتب والتراخيص والاستخدام</p>
        </div>
        <Button asChild size="sm" className="gap-1.5 font-bold">
          <Link href="/admin/offices"><Plus className="h-4 w-4" /> مكتب جديد</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="مكاتب نشطة" value={activeOffices} sub={`من أصل ${totalOffices} مكتب`} icon="building" tone="teal" />
        <StatCard title="إجمالي الطلبات" value={totalRequests} sub={`${monthRequests} هذا الشهر`} icon="file" tone="cyan" />
        <StatCard title="عملاء مسجلون" value={customers} icon="users" tone="violet" />
        <StatCard title="تراخيص تنتهي قريباً" value={expiringSoon.length} sub="خلال 30 يوماً" icon="alert" tone="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* نشاط الطلبات */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> حجم الطلبات — آخر 12 أسبوعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-36" dir="ltr">
              {weeks.map((w, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-teal-700 to-teal-500 hover:from-teal-800 hover:to-teal-600 transition-all relative"
                    style={{ height: `${Math.max((w.count / maxWeek) * 100, 4)}%` }}
                  >
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity nums">{w.count}</span>
                  </div>
                  <span className="text-[8px] text-muted-foreground nums">{w.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* التراخيص القريبة + التخزين */}
        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-extrabold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> تراخيص قريبة من الانتهاء</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {expiringSoon.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">لا توجد تراخيص تنتهي خلال 30 يوماً</p>}
              {expiringSoon.map((l) => {
                const days = Math.ceil((new Date(l.endDate!).getTime() - now.getTime()) / 86400000);
                return (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{l.office.name}</p>
                      <p className="text-[10px] text-muted-foreground nums">{formatDateAr(l.endDate)}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${days <= 7 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      <span className="nums">{days}</span> يوم
                    </Badge>
                  </div>
                );
              })}
              <Button asChild variant="outline" size="sm" className="w-full text-xs font-bold">
                <Link href="/admin/offices">إدارة التراخيص</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center">
                  <HardDrive className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold">استهلاك التخزين الكلي</p>
                  <p className="text-[10px] text-muted-foreground nums">{(storageUsed._sum.storageUsedMb || 0).toFixed(1)} ميجابايت مستخدمة</p>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-l from-violet-600 to-violet-400" style={{ width: "12%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground">النسخ الاحتياطي اليومي: مفعّل مع اختبار استعادة أسبوعي</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* آخر عمليات الإدارة */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> آخر عمليات الإدارة العامة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">المستخدم</TableHead>
                <TableHead className="text-right">العملية</TableHead>
                <TableHead className="text-right hidden sm:table-cell">الكيان</TableHead>
                <TableHead className="text-right hidden lg:table-cell">التفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAudit.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-[11px] text-muted-foreground nums whitespace-nowrap">{timeAgoAr(a.createdAt)}</TableCell>
                  <TableCell className="text-xs font-bold">{a.actorName}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-bold bg-muted">{a.action}</Badge></TableCell>
                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{a.entityType}</TableCell>
                  <TableCell className="hidden lg:table-cell text-[10px] text-muted-foreground max-w-72 truncate">{a.details || "—"}</TableCell>
                </TableRow>
              ))}
              {recentAudit.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">لا توجد عمليات بعد</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
