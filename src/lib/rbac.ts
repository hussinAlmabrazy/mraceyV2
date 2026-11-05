// ============ الصلاحيات (RBAC) ============
import "server-only";

/**
 * مصفوفة الصلاحيات — المخلص الميداني يرى المعاملات المسندة إليه فقط
 * ولا يرى البيانات المالية (قاعدة العمل).
 */
export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  OFFICE_ADMIN: [
    "office.manage", "staff.manage", "services.manage", "requests.view_all", "requests.manage",
    "requests.create_behalf", "customers.manage", "customs.manage", "finance.view", "finance.manage",
    "reports.view", "templates.manage", "notifications.view",
  ],
  STAFF: [
    "requests.view_all", "requests.manage", "requests.create_behalf", "customers.manage",
    "customs.manage", "finance.view", "reports.view", "notifications.view",
  ],
  BROKER: ["requests.view_assigned", "requests.update_stages", "customs.manage"],
  ACCOUNTANT: [
    "requests.view_all", "customers.manage", "finance.view", "finance.manage",
    "reports.view", "notifications.view",
  ],
};

export function can(role: string, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  // Broker يستطيع رؤية الطلبات المسندة له
  if (role === "BROKER" && permission === "requests.view_all") return false;
  return false;
}
