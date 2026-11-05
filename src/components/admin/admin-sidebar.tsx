"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Building2, CreditCard, Table2, ScrollText, Settings, LogOut, Menu, ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "لوحة المؤشرات", icon: LayoutDashboard },
  { href: "/admin/offices", label: "المكاتب والتراخيص", icon: Building2 },
  { href: "/admin/plans", label: "الباقات", icon: CreditCard },
  { href: "/admin/hs-codes", label: "جدول HS Code", icon: Table2 },
  { href: "/admin/audit", label: "سجل التدقيق", icon: ScrollText },
  { href: "/admin/settings", label: "الإعدادات العامة", icon: Settings },
];

export function AdminSidebar({ userName, logoutAction }: { userName: string; logoutAction: () => Promise<void> }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="p-4 border-b border-sidebar-border bg-sidebar-accent/40">
        <Logo size="sm" light />
        <p className="text-[10px] text-sidebar-foreground/75 mt-2 flex items-center gap-1 font-bold">
          <ShieldCheck className="h-3 w-3 text-sidebar-primary" /> بوابة إدارة المنصة
        </p>
      </div>
      <div className="px-4 py-3 border-b border-sidebar-border bg-black/15 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-full bg-sidebar-primary/25 border border-white/10 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {userName[0]}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate text-white">{userName}</p>
          <p className="text-[10px] text-sidebar-foreground/75">مدير النظام</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href) ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/25 font-bold" : "text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-white"
            )}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/15">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-l border-sidebar-border bg-sidebar h-screen sticky top-0">
        {content}
      </aside>
      <div className="lg:hidden sticky top-0 z-40 border-b bg-background shadow-sm">
        <div className="h-14 px-3 flex items-center justify-between gap-2">
          <Logo size="sm" withText={false} />
          <span className="font-bold text-sm">إدارة المنصة</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setOpen(!open)} aria-label="القائمة">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {open && (
          <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-72 bg-sidebar border-l border-sidebar-border shadow-2xl">
              {content}
            </div>
          </>
        )}
      </div>
    </>
  );
}
