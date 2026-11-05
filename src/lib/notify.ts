// ============ محرك الإشعارات والقنوات ============
import "server-only";
import { db } from "@/lib/db";
import { NOTIFICATION_EVENTS } from "@/lib/constants";

type NotifyContext = {
  officeId: string;
  requestId?: string | null;
  event: string;
  customer?: { id: string; name: string; phone?: string | null; whatsapp?: string | null; email?: string | null } | null;
  staffUserId?: string | null;
  variables: Record<string, string>;
  link?: string;
};

/** تطبيق المتغيرات على قالب الرسالة: {{client_name}} وغيرها */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

/**
 * إرسال إشعار عبر القنوات المتاحة:
 * - داخل النظام (حقيقي)
 * - البريد الإلكتروني / واتساب / SMS (تُسجَّل في سجل الإرسال — جاهزة للربط بمزود رسمي)
 */
export async function notify(ctx: NotifyContext): Promise<void> {
  try {
    const templates = await db.notificationTemplate.findMany({
      where: {
        OR: [{ officeId: ctx.officeId }, { officeId: null }],
        event: ctx.event,
        isActive: true,
      },
      orderBy: [{ officeId: "desc" }], // قالب المكتب يتقدم على العام
    });

    const seenChannels = new Set<string>();
    for (const tpl of templates) {
      if (seenChannels.has(tpl.channel)) continue;
      seenChannels.add(tpl.channel);
      const body = renderTemplate(tpl.body, ctx.variables);
      const subject = tpl.subject ? renderTemplate(tpl.subject, ctx.variables) : undefined;

      if (tpl.channel === "INAPP") {
        // إشعار داخلي للعميل أو للموظف المكلف
        const recipients: { recipientType: string; customerId?: string; userId?: string }[] = [];
        if (ctx.customer?.id) recipients.push({ recipientType: "CUSTOMER", customerId: ctx.customer.id });
        if (ctx.staffUserId) recipients.push({ recipientType: "STAFF", userId: ctx.staffUserId });
        for (const r of recipients) {
          await db.notification.create({
            data: {
              officeId: ctx.officeId,
              requestId: ctx.requestId ?? null,
              recipientType: r.recipientType,
              customerId: r.customerId ?? null,
              userId: r.userId ?? null,
              title: subject || NOTIFICATION_EVENTS[ctx.event] || "إشعار",
              body,
              link: ctx.link ?? null,
            },
          });
        }
        await db.messageLog.create({
          data: {
            officeId: ctx.officeId,
            requestId: ctx.requestId ?? null,
            channel: "INAPP",
            recipient: ctx.customer?.name || "موظف",
            subject,
            body,
            status: "SENT",
            sentAt: new Date(),
          },
        });
      } else {
        // EMAIL / WHATSAPP / SMS — تسجيل في سجل الإرسال (محاكاة حتى ربط المزود الرسمي)
        const recipient =
          tpl.channel === "EMAIL"
            ? ctx.customer?.email || ctx.customer?.phone || "غير متوفر"
            : tpl.channel === "WHATSAPP"
              ? ctx.customer?.whatsapp || ctx.customer?.phone || "غير متوفر"
              : ctx.customer?.phone || "غير متوفر";
        const enabled = await channelEnabled(ctx.officeId, tpl.channel);
        await db.messageLog.create({
          data: {
            officeId: ctx.officeId,
            requestId: ctx.requestId ?? null,
            channel: tpl.channel,
            recipient,
            subject,
            body,
            status: enabled ? "SENT" : "FAILED",
            error: enabled ? null : "القناة غير مفعّلة في إعدادات المكتب",
            sentAt: enabled ? new Date() : null,
          },
        });
      }
    }
  } catch (e) {
    console.error("NOTIFY_ERROR", e);
  }
}

/** إشعار داخلي لموظفي المكتب (الكل أو مستخدمون محددون) */
export async function notifyStaff(
  officeId: string,
  event: string,
  title: string,
  body: string,
  opts: { requestId?: string | null; userIds?: string[] } = {}
): Promise<void> {
  try {
    const users = opts.userIds?.length
      ? await db.user.findMany({ where: { id: { in: opts.userIds }, isActive: true }, select: { id: true } })
      : await db.user.findMany({
          where: { officeId, isActive: true, role: { in: ["OFFICE_ADMIN", "STAFF", "ACCOUNTANT"] } },
          select: { id: true },
        });
    if (users.length) {
      await db.notification.createMany({
        data: users.map((u) => ({
          officeId,
          requestId: opts.requestId ?? null,
          recipientType: "STAFF",
          userId: u.id,
          title,
          body,
        })),
      });
    }
    await db.messageLog.create({
      data: {
        officeId,
        requestId: opts.requestId ?? null,
        channel: "INAPP",
        recipient: "فريق المكتب",
        subject: title,
        body,
        status: "SENT",
        sentAt: new Date(),
      },
    });
    void event;
  } catch (e) {
    console.error("NOTIFY_STAFF_ERROR", e);
  }
}

async function channelEnabled(officeId: string, channel: string): Promise<boolean> {
  const office = await db.office.findUnique({ where: { id: officeId }, select: { email: true, whatsapp: true, phone: true } });
  if (!office) return false;
  if (channel === "EMAIL") return Boolean(office.email);
  if (channel === "WHATSAPP") return Boolean(office.whatsapp || office.phone);
  if (channel === "SMS") return Boolean(office.phone);
  return true;
}
