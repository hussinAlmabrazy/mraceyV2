// ============ بناء قائمة تنقل المكتب حسب الدور (مشترك بين الخادم والعميل) ============

export type NavItem = { href: string; label: string; icon: string; badge?: number };

export function buildOfficeNav(role: string, badges: { requests?: number; tasks?: number }): NavItem[] {
  const isAdmin = role === "OFFICE_ADMIN";
  const isBroker = role === "BROKER";
  const canFinance = isAdmin || role === "ACCOUNTANT" || role === "STAFF";

  const items: NavItem[] = [
    { href: "/office", label: "لوحة المؤشرات", icon: "dashboard" },
    {
      href: "/office/requests",
      label: isBroker ? "طلباتي المسندة" : "الطلبات",
      icon: "clipboard",
      badge: badges.requests,
    },
    { href: "/office/tasks", label: "المهام والتذكيرات", icon: "todo", badge: badges.tasks },
  ];

  if (!isBroker) {
    items.push({ href: "/office/services", label: "كتالوج الخدمات", icon: "layers" });
    items.push({ href: "/office/customers", label: "العملاء", icon: "users" });
  }
  if (isAdmin) {
    items.push({ href: "/office/staff", label: "الموظفون والصلاحيات", icon: "usercog" });
  }
  if (canFinance) {
    items.push({ href: "/office/finance", label: "الحسابات والذمم", icon: "wallet" });
    items.push({ href: "/office/invoices", label: "الفواتير", icon: "receipt" });
  }
  items.push({ href: "/office/notifications", label: "الإشعارات والقوالب", icon: "bell" });
  items.push({ href: "/office/logs", label: "سجل التدقيق والإرسال", icon: "scroll" });
  items.push({ href: "/office/account", label: "حسابي", icon: "user" });
  if (isAdmin) {
    items.push({ href: "/office/settings", label: "إعدادات المكتب", icon: "settings" });
  }
  return items;
}
