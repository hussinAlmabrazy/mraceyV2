import { db } from "@/lib/db";
import { OfficesManager } from "@/components/admin/offices-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "المكاتب والتراخيص" };

export default async function AdminOfficesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const statusFilter = sp.status || "";

  const where: any = {};
  if (statusFilter) where.status = statusFilter;
  if (q) where.OR = [{ name: { contains: q } }, { slug: { contains: q } }, { email: { contains: q } }, { managerName: { contains: q } }];

  const [offices, plans] = await Promise.all([
    db.office.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        licenses: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
        _count: { select: { users: true, customers: true, requests: true, services: true } },
      },
    }),
    db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } }),
  ]);

  // إحصاءات طلبات الشهر الحالي لكل مكتب
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthReqs = await db.request.groupBy({
    by: ["officeId"],
    where: { createdAt: { gte: monthStart } },
    _count: { _all: true },
  });
  const monthMap = new Map(monthReqs.map((m) => [m.officeId, m._count._all]));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <OfficesManager
        offices={offices.map((o) => {
          const license = o.licenses[0];
          const daysLeft = license?.endDate ? Math.ceil((new Date(license.endDate).getTime() - Date.now()) / 86400000) : null;
          return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            status: o.status,
            city: o.city,
            managerName: o.managerName,
            email: o.email,
            phone: o.phone,
            createdAt: o.createdAt,
            usersCount: o._count.users,
            customersCount: o._count.customers,
            requestsCount: o._count.requests,
            servicesCount: o._count.services,
            monthRequests: monthMap.get(o.id) || 0,
            license: license ? {
              id: license.id,
              key: license.key,
              status: license.status,
              endDate: license.endDate,
              planName: license.plan?.name || "—",
              planMaxUsers: license.plan?.maxUsers || 0,
              planMaxReqs: license.plan?.maxMonthlyReqs || 0,
              daysLeft,
            } : null,
          };
        })}
        plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}
