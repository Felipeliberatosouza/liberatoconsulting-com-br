import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

    const [ns, bs] = await Promise.all([
      supabaseAdmin.from("newsletter_subscribers").select("email, whatsapp"),
      supabaseAdmin.from("bulletin_subscribers").select("email, whatsapp"),
    ]);
    const phones = new Map<string, string>();
    for (const s of [...(ns.data ?? []), ...(bs.data ?? [])]) if (s.whatsapp && !phones.has(s.email)) phones.set(s.email, s.whatsapp);

    const byRef = new Map<string, DeliveryRecipient[]>();
    const loose: DeliveryItem[] = [];
    for (const l of log.data ?? []) {
      const rec: DeliveryRecipient = {
        id: l.id,
        name: l.recipient_name,
        email: l.recipient_email,
        phone: l.recipient_phone || phones.get(l.recipient_email) || "",
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

const refSchema = z.object({
  source: z.enum(["newsletter", "boletim"]),
  referenceId: z.string().uuid(),
  email: z.string().email().optional().or(z.literal("")),
});

/** Pré-visualização realista do e-mail e da mensagem de WhatsApp de um envio. */
export const previewDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => refSchema.parse(d))
  .handler(async ({ data, context }) => {
    const access = await import("./access.server");
    await access.assertAdmin(context);
    try {
      const { buildDeliveryMessage } = await import("./deliveries.server");
      const m = await buildDeliveryMessage(data.source, data.referenceId, data.email || undefined);
      return { ok: true as const, ...m };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha ao montar a prévia." };
    }
  });

/** Reenvia imediatamente o conteúdo para um destinatário, por e-mail ou WhatsApp. */
export const resendDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    refSchema
      .extend({
        channel: z.enum(["email", "whatsapp"]),
        name: z.string().max(200).optional(),
        phone: z.string().max(40).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const access = await import("./access.server");
    await access.assertAdmin(context);
    const { logDeliveries } = await import("./delivery-log.server");
    const base = {
      source: data.source,
      reference_id: data.referenceId,
      recipient_name: data.name ?? "",
      recipient_email: data.email ?? "",
      recipient_phone: data.phone ?? "",
      channel: data.channel,
    };
    try {
      const { buildDeliveryMessage } = await import("./deliveries.server");
      const m = await buildDeliveryMessage(data.source, data.referenceId, data.email || undefined);
      const bulletin = await import("./bulletin.server");
      if (data.channel === "email") {
        if (!data.email) throw new Error("Destinatário sem e-mail.");
        await bulletin.sendBulletinEmail({
          to: data.email,
          subject: m.subject,
          html: m.html,
          text: m.text,
          idempotencyKey: `resend-${data.referenceId}-${data.email}-${Date.now()}`,
        });
      } else {
        if (!data.phone) throw new Error("Destinatário sem WhatsApp.");
        await bulletin.sendWhatsAppMessage({ to: data.phone, caption: m.whatsapp });
      }
      await logDeliveries([{ ...base, subject: `${m.subject} (reenvio)`, status: "enviado" }]);
      return { ok: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha no reenvio.";
      await logDeliveries([{ ...base, subject: "Reenvio", status: "falhou", error: msg }]);
      return { ok: false as const, error: msg };
    }
  });

/** Inscritos ativos que recebem por WhatsApp (usado quando o envio não tem detalhe individual). */
export const listWhatsAppSubscribers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ source: z.enum(["newsletter", "boletim"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const access = await import("./access.server");
    await access.assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.source === "newsletter") {
      const { data: rows } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("name, email, whatsapp")
        .eq("status", "active")
        .eq("via_whatsapp", true);
      return (rows ?? []).filter((r) => r.whatsapp).map((r) => ({ name: r.name ?? "", email: r.email ?? "", phone: r.whatsapp as string }));
    }
    const { data: rows } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select("full_name, email, whatsapp")
      .eq("status", "active")
      .eq("via_whatsapp", true);
    return (rows ?? []).filter((r) => r.whatsapp).map((r) => ({ name: r.full_name ?? "", email: r.email ?? "", phone: r.whatsapp as string }));
  });
