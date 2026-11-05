"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package, Plus, Receipt, Bell, LogOut, Menu, Home, UserCircle } from "lucide-react";
import { useState } from "react";

export function ClientNavbar({
  office, clientName, unread, logoutAction,
}: {
  office: { name: string; slug: string; brandColor: string; logoPath: string | null };
  clientName: string;
  unread: number;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const base = `/o/${office.slug}/portal`;
  const links = [
    { href: base, label: "طلباتي", icon: Package },
    { href: `${base}/requests/new`, label: "طلب جديد", icon: Plus },
    { href: `${base}/statement`, label: "كشف الحساب", icon: Receipt },
    { href: `${base}/notifications`, label: "الإشعارات", icon: Bell, badge: unread },
    { href: `${base}/account`, label: "حسابي", icon: UserCircle },
  ];
  const [open, setOpen] = useState(false);

  const content = (
    <>
      <div className="hidden sm:flex items-center gap-1">
        {links.map((l) => {
          const active = l.href === base ? pathname === base : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-colors",
                active ? "text-white shadow-sm" : "text-foreground/70 hover:bg-muted"
              )}
              style={active ? { backgroundColor: office.brandColor } : undefined}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
              {l.badge ? <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center nums">{l.badge}</span> : null}
            </Link>
          );
        })}
      </div>
      <div className="sm:hidden flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setOpen(!open)} aria-label="القائمة">
          <Menu className="h-5 w-5" />
        </Button>
        {open && (
          <div className="absolute top-16 inset-x-0 z-50 border-b bg-background shadow-lg sm:hidden">
            <nav className="p-3 space-y-1" onClick={() => setOpen(false)}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-bold hover:bg-muted">
                  <l.icon className="h-4.5 w-4.5" /> {l.label}
                  {l.badge ? <span className="h-5 min-w-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center nums">{l.badge}</span> : null}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-3 relative">
        <div className="flex items-center gap-3 min-w-0">
          {office.logoPath ? (
             
            <img src={`/api/files/${office.logoPath}`} alt={office.name} className="h-10 w-10 rounded-xl object-contain border" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0" style={{ backgroundColor: office.brandColor }}>
              {office.name.replace("مكتب ", "").split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
            </div>
          )}
          <div className="min-w-0 hidden xs:block">
            <p className="font-extrabold text-sm truncate">{office.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">بوابة العميل — {clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {content}
          <Link href={`/o/${office.slug}`} className="hidden md:inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold hover:bg-muted transition-colors">
            <Home className="h-4 w-4" /> صفحة المكتب
          </Link>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" className="h-9 w-9 text-rose-600 hover:bg-rose-50" title="تسجيل الخروج">
              <LogOut className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
