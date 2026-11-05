import { db } from "@/lib/db";
import { PlansManager } from "@/components/admin/plans-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "الباقات" };

export default async function AdminPlansPage() {
  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: { _count: { select: { licenses: true } } },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PlansManager
        plans={plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          maxUsers: p.maxUsers,
          maxStorageMb: p.maxStorageMb,
          maxMonthlyReqs: p.maxMonthlyReqs,
          whatsappEnabled: p.whatsappEnabled,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly,
          isDefault: p.isDefault,
          officesCount: p._count.licenses,
        }))}
      />
    </div>
  );
}
