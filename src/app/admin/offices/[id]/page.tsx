import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { StatCard } from "@/components/shared/widgets";
import { OfficeDetail } from "@/components/admin/office-detail";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminOfficeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const office = await db.office.findUnique({
    where: { id },
    include: {
      licenses: { orderBy: { createdAt: "desc" }, include: { plan: true } },
      users: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true } },
    },
  });
  if (!office) notFound();

  const [requestsCount, customersCount, servicesCount, messageLogs, monthlyReqs] = await Promise.all([
    db.request.count({ where: { officeId: id } }),
    db.customer.count({ where: { officeId: id } }),
    db.service.count({ where: { officeId: id } }),
    db.messageLog.count({ where: { officeId: id } }),
    db.request.count({ where: { officeId: id, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5">
      <Button asChild variant="ghost" size="sm" className="h-6 px-1.5 gap-1 text-xs text-muted-foreground hover:text-foreground p-0">
        <Link href="/admin/offices"><ArrowRight className="h-3.5 w-3.5" /> كل المكاتب</Link>
      </Button>

      <OfficeDetail
        office={{
          id: office.id, name: office.name, slug: office.slug, status: office.status,
          city: office.city, managerName: office.managerName, email: office.email, phone: office.phone,
          activityType: office.activityType, createdAt: office.createdAt,
        }}
        licenses={office.licenses.map((l) => ({
          id: l.id, key: l.key, status: l.status, planName: l.plan?.name || "—",
          startDate: l.startDate, endDate: l.endDate, activatedAt: l.activatedAt, durationDays: l.durationDays,
        }))}
        users={office.users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt }))}
        stats={{ requestsCount, customersCount, servicesCount, messageLogs, monthlyReqs }}
      />
    </div>
  );
}
