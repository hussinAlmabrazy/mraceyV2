import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { formatDateAr } from "@/lib/format";
import { SettingsManager } from "@/components/admin/settings-manager";
import { AccountSettings } from "@/components/admin/account-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "الإعدادات العامة" };

export default async function AdminSettingsPage() {
  const settings = await db.platformSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  // بيانات حساب مدير المنصة الحالي (الجلسة محرَسة في layout — موجودة حتماً هنا)
  const session = await getUserSession();
  const admin = session
    ? await db.user.findUnique({
        where: { id: session.sub },
        select: { email: true, name: true, lastLoginAt: true },
      })
    : null;

  const [officesCount, usersCount, customersCount, requestsCount, messageStats] = await Promise.all([
    db.office.count(),
    db.user.count(),
    db.customer.count(),
    db.request.count(),
    db.messageLog.groupBy({ by: ["channel"], _count: { _all: true } }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">الإعدادات</h1>
        <p className="text-sm text-muted-foreground mt-1">حسابك الشخصي وهوية المنصة وسياسات التشغيل</p>
      </div>
      <AccountSettings
        email={admin?.email || ""}
        name={admin?.name || session?.name || ""}
        lastLoginAt={formatDateAr(admin?.lastLoginAt, true)}
      />
      <SettingsManager
        settings={{
          platform_name: map["platform_name"] || "منصة مراسي",
          platform_tagline: map["platform_tagline"] || "",
          email_provider: map["email_provider"] || "",
          whatsapp_provider: map["whatsapp_provider"] || "",
          backup_daily: map["backup_daily"] !== "معطّل",
        }}
        stats={{
          officesCount, usersCount, customersCount, requestsCount,
          messageChannels: messageStats.map((m) => ({ channel: m.channel, count: m._count._all })),
        }}
      />
    </div>
  );
}
