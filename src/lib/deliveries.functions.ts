import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DeliveryRecipient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel: string;
  status: string;
  error: string;
  sentAt: string;
  retroactive: boolean;
};

export type DeliveryItem = {
  key: string;
  source: string;
  subject: string;
  sentAt: string;
  isTest: boolean;
  status: string;
  sentEmail: number;
  sentWhatsApp: number;
  failed: number;
  lastError: string;
  recipients: DeliveryRecipient[];
};

/** Lista todos os envios do site (Newsletter, Boletim e notificações) com os destinatários. */
export const listDeliveries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await import("./access.server");
    await access.assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [camp, bul, log] = await Promise.all([
      supabaseAdmin
        .from("newsletter_campaigns")
        .select("id, subject, status, sent_at, sent_count, failed_count, last_error")
        .not("sent_at", "is", null),
      supabaseAdmin
        .from("bulletin_dispatches")
        .select("id, subject, segment, status, created_at, sent_email, sent_whatsapp, failed, last_error, is_test")
        .neq("status", "gerado"),
      supabaseAdmin.from("delivery_log").select("*").order("sent_at", { ascending: true }).limit(5000),
    ]);

    const byRef = new Map<string, DeliveryRecipient[]>();
    const loose: DeliveryItem[] = [];
    for (const l of log.data ?? []) {
      const rec: DeliveryRecipient = {
        id: l.id,
        name: l.recipient_name,
        email: l.recipient_email,
        phone: l.recipient_phone,
        channel: l.channel,
        status: l.status,
        error: l.error,
        sentAt: l.sent_at,
        retroactive: l.retroactive,
      };
      if (l.reference_id) {
        const arr = byRef.get(l.reference_id) ?? [];
        arr.push(rec);
        byRef.set(l.reference_id, arr);
      } else {
        loose.push({
          key: l.id,
          source: l.source,
          subject: l.subject,
          sentAt: l.sent_at,
          isTest: l.is_test,
          status: l.status,
          sentEmail: l.channel === "email" && l.status === "enviado" ? 1 : 0,
          sentWhatsApp: l.channel === "whatsapp" && l.status === "enviado" ? 1 : 0,
          failed: l.status === "falhou" ? 1 : 0,
          lastError: l.error,
          recipients: [rec],
        });
      }
    }

    const items: DeliveryItem[] = [];
    for (const c of camp.data ?? []) {
      const recipients = byRef.get(c.id) ?? [];
      const wa = recipients.filter((r) => r.channel === "whatsapp" && r.status === "enviado").length;
      items.push({
        key: c.id,
        source: "newsletter",
        subject: c.subject,
        sentAt: c.sent_at!,
        isTest: false,
        status: c.status,
        sentEmail: c.sent_count,
        sentWhatsApp: wa,
        failed: c.failed_count,
        lastError: c.last_error ?? "",
        recipients,
      });
    }
    for (const b of bul.data ?? []) {
      items.push({
        key: b.id,
        source: "boletim",
        subject: b.segment ? `${b.subject} (${b.segment})` : b.subject,
        sentAt: b.created_at,
        isTest: b.is_test,
        status: b.status,
        sentEmail: b.sent_email,
        sentWhatsApp: b.sent_whatsapp,
        failed: b.failed,
        lastError: b.last_error ?? "",
        recipients: byRef.get(b.id) ?? [],
      });
    }
    items.push(...loose);
    items.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    return items;
  });
