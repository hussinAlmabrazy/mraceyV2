import { db } from "@/lib/db";
import { HsCodesManager } from "@/components/admin/hs-codes-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "جدول HS Code" };

export default async function AdminHsCodesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const page = parseInt(sp.page || "1");
  const perPage = 25;

  const where: any = { isActive: true };
  if (q) {
    where.OR = [{ code: { contains: q } }, { descriptionAr: { contains: q } }, { descriptionEn: { contains: q } }];
  }

  const [codes, total, inactiveCount] = await Promise.all([
    db.hSCode.findMany({
      where,
      orderBy: { code: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.hSCode.count({ where }),
    db.hSCode.count({ where: { isActive: false } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <HsCodesManager
        codes={codes.map((c) => ({
          id: c.id, code: c.code, descriptionAr: c.descriptionAr, descriptionEn: c.descriptionEn,
          unit: c.unit, dutyRate: c.dutyRate, salesTaxRate: c.salesTaxRate, otherTaxRate: c.otherTaxRate,
        }))}
        total={total}
        inactiveCount={inactiveCount}
        page={page}
        perPage={perPage}
        q={q}
      />
    </div>
  );
}
