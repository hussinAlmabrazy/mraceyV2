// ============ سجل التدقيق ============
import "server-only";
import { db } from "@/lib/db";

type AuditActor = {
  actorType: "SUPER_ADMIN" | "STAFF" | "CUSTOMER" | "SYSTEM";
  actorId?: string | null;
  actorName: string;
};

/** تسجيل عملية حساسة في سجل التدقيق — كل تغيير حالة أو مبلغ أو ملف */
export async function audit(
  actor: AuditActor,
  action: string,
  entityType: string,
  entityId?: string | null,
  officeId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        officeId: officeId ?? null,
        actorType: actor.actorType,
        actorId: actor.actorId ?? null,
        actorName: actor.actorName,
        action,
        entityType,
        entityId: entityId ?? null,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (e) {
    console.error("AUDIT_LOG_ERROR", e);
  }
}
