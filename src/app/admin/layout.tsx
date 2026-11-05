import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { logoutStaff } from "@/app/actions/auth";

export const metadata = { title: "لوحة الإدارة" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getUserSession();
  if (!session || session.role !== "SUPER_ADMIN") redirect("/admin/login");

  return (
    <div className="min-h-screen flex flex-col lg:flex-row-reverse bg-muted/30">
      <AdminSidebar userName={session.name} logoutAction={logoutStaff} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
