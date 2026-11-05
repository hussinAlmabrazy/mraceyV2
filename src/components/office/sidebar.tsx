"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OfficeLogo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, ExternalLink, LayoutDashboard, ClipboardList, Layers, Users, UserCog, ListTodo, Wallet, Receipt, BellRing, ScrollText, Settings, UserCircle } from "lucide-react";
import { logoutStaff } from "@/app/actions/auth";
import type { NavItem } from "@/lib/nav";

export type { NavItem };
export { buildOfficeNav } from "@/lib/nav";

const NAV_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard, clipboard: ClipboardList, layers: Layers, users: Users,
  usercog: UserCog, todo: ListTodo, wallet: Wallet, receipt: Receipt,
  bell: BellRing, scroll: ScrollText, settings: Settings, user: UserCircle,
};

export function OfficeSidebar({
  office, user, roleLabel, nav, publicUrl,
}: {
  office: { name: string; slug: string; brandColor: string; city?: string | null };
  user: { name: string; role: string };
  roleLabel: string;
  nav: NavItem[];
  publicUrl: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/office" ? pathname === "/office" : pathname.startsWith(href);

  const content = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* المكتب */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/40 flex items-center gap-3">
        <OfficeLogo name={office.name} color={office.brandColor} size={42} />
        <div className="min-w-0">
          <p className="font-bold text-sm truncate text-white">{office.name}</p>
          <p className="text-[11px] text-sidebar-foreground/75">لوحة إدارة المكتب</p>
        </div>
      </div>

      {/* المستخدم */}
      <div className="px-4 py-3 border-b border-sidebar-border bg-black/15">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-sidebar-primary/25 border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate text-white">{user.name}</p>
            <p className="text-[10px] text-sidebar-foreground/75">{roleLabel}</p>
          </div>
        </div>
      </div>

      {/* التنقل */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/25 font-bold"
                : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-white"
            )}
          >
            {(() => { const Icon = NAV_ICONS[item.icon] || ClipboardList; return <Icon className="h-4.5 w-4.5 shrink-0" />; })()}
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className={cn("h-5 min-w-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center nums", isActive(item.href) ? "bg-white/25 text-white" : "bg-sidebar-primary text-white")}>
                {item.badge > 99 ? "+99" : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {/* أدناه */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-xs font-medium text-sidebar-foreground/85 hover:text-white hover:bg-white/10">
          <a href={publicUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> عرض صفحة المكتب العامة
          </a>
        </Button>
        <form action={logoutStaff}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/15">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* سطح المكتب */}
      <aside className="hidden lg:block w-64 shrink-0 border-l border-sidebar-border bg-sidebar h-screen sticky top-0">
        {content}
      </aside>

      {/* الجوال */}
      <div className="lg:hidden sticky top-0 z-40 border-b bg-background shadow-sm">
        <div className="h-14 px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <OfficeLogo name={office.name} color={office.brandColor} size={32} />
            <p className="font-bold text-sm truncate">{office.name}</p>
          </div>
          <MobileMenu>{content}</MobileMenu>
        </div>
      </div>
    </>
  );
}

function MobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setOpen(!open)} aria-label="القائمة">
        <Menu className="h-5 w-5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-sidebar border-l border-sidebar-border shadow-2xl">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
