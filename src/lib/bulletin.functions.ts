import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidPhone, PHONE_ERROR } from "./validation";
import { WHATSAPP_SENDING_ENABLED } from "./bulletin.server";

export type BulletinSubscriberRow = {
  id: string;
  full_name: string;
  company: string;
  segment: string;
  email: string;
  whatsapp: string;
  via_email: boolean;
  via_whatsapp: boolean;
  status: string;
  source_path: string;
  unsubscribed_at: string | null;
  last_sent_at: string | null;
  created_at: string;
};

const subscribeInput = z.object({
  fullName: z.string().trim().min(2).max(120),
  company: z.string().trim().min(2).max(140),
  segment: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  whatsapp: z.string().trim().refine(isValidPhone, PHONE_ERROR),
  viaEmail: z.boolean(),
  viaWhatsApp: z.boolean(),
  language: z.string().trim().max(8).optional().default("pt"),
  sourcePath: z.string().trim().max(300).optional().default(""),
  website: z.string().max(200).optional().default(""),
});

/** Cadastro público no Boletim Semanal. */
export const subscribeBulletin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subscribeInput.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    if (!data.viaEmail && !data.viaWhatsApp) {
      return { ok: false as const, error: "Escolha ao menos uma forma de recebimento." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: existing } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select("id, status")
      .ilike("email", email)
      .maybeSingle();

    // Cadastro público não altera inscrições existentes (evita sobrescrever dados de terceiros).
    if (existing) return { ok: true as const };

    const payload = {
      full_name: data.fullName,
      company: data.company,
      segment: data.segment,
      email,
      whatsapp: data.whatsapp,
      via_email: data.viaEmail,
      via_whatsapp: WHATSAPP_SENDING_ENABLED && data.viaWhatsApp,
      language: data.language ?? "pt",
      source_path: data.sourcePath ?? "",
      status: "active",
      unsubscribed_at: null,
    };

    const { error } = await supabaseAdmin.from("bulletin_subscribers").insert(payload);

    if (error) return { ok: false as const, error: "Não foi possível concluir o cadastro." };
    return { ok: true as const };
  });

/** Cancelamento do Boletim Semanal pelo link enviado no e-mail/WhatsApp. */
export const unsubscribeBulletin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("bulletin_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("unsubscribe_token", data.token)
      .select("full_name, email, whatsapp, via_email, via_whatsapp, language")
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: "Link inválido ou já utilizado." };

    if (row.via_email) {
      const { setRecipientEmailConsent } = await import("./email-consent.server");
      await setRecipientEmailConsent(row.email, false);
    }

    const { sendUnsubscribeConfirmation } = await import("./bulletin.server");
    await sendUnsubscribeConfirmation({
      full_name: row.full_name ?? "",
      email: row.email ?? "",
      whatsapp: row.whatsapp ?? "",
      via_email: Boolean(row.via_email),
      via_whatsapp: Boolean(row.via_whatsapp),
      language: row.language,
    });
    return { ok: true as const };
  });

/** Equipe do painel (admin, consultor e autor) pode consultar o boletim. */
async function assertPanel(context: { supabase: unknown; userId: string }) {
  const { assertAnyRole } = await import("./access.server");
  await assertAnyRole(context as never, ["consultor", "autor"]);
}

/** Lista os cadastros do Boletim Semanal (painel administrativo). */
export const listBulletinSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BulletinSubscriberRow[]> => {
    await assertPanel(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select(
        "id, full_name, company, segment, email, whatsapp, via_email, via_whatsapp, status, source_path, unsubscribed_at, last_sent_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    const rows = (data ?? []) as BulletinSubscriberRow[];
    const { getRecipientEmailConsent } = await import("./email-consent.server");
    await Promise.all(
      rows.map(async (row) => {
        if (!row.via_email) return;
        try {
          const consent = await getRecipientEmailConsent(row.email);
          const status = consent.subscribed ? "active" : "unsubscribed";
          if (row.status !== status) {
            const unsubscribedAt = consent.subscribed ? null : new Date().toISOString();
            await supabaseAdmin
              .from("bulletin_subscribers")
              .update({ status, unsubscribed_at: unsubscribedAt })
              .eq("id", row.id);
            row.status = status;
            row.unsubscribed_at = unsubscribedAt;
          }
        } catch {
          // Mantém o estado local quando a consulta ao serviço de e-mail estiver indisponível.
        }
      }),
    );
    return rows;
  });

/** Pré-visualização do boletim para um segmento. */
export const previewBulletin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ segment: z.string().trim().max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPanel(context);
    const { fillMissingIndicatorSeries } = await import("./indicators.server");
    await fillMissingIndicatorSeries();
    const {
      buildBulletinContent,
      renderBulletinHtml,
      renderBulletinWhatsApp,
      siteOrigin,
      recordBulletinGenerated,
    } = await import("./bulletin.server");
    const content = await buildBulletinContent(data.segment);
    const url = `${siteOrigin()}/boletim/cancelar?token=00000000-0000-0000-0000-000000000000`;
    const html = renderBulletinHtml(content, url);
    // O boletim entra no histórico assim que é gerado, antes de qualquer envio.
    try {
      await recordBulletinGenerated({
        subject: `Boletim Semanal — ${content.dateLabel}`,
        dateLabel: content.dateLabel,
        html,
        segment: data.segment,
      });
    } catch {
      /* histórico é best-effort */
    }
    return {
      ok: true as const,
      html,
      whatsapp: renderBulletinWhatsApp(content, url),
      dateLabel: content.dateLabel,
      indicators: content.indicators.length,
      indicatorRows: content.indicators.map((i) => ({
        slug: i.slug ?? "",
        polarity: i.polarity ?? "auto",
        label: i.label,
        value: i.value,
        unit: i.unit,
        reference_period: i.reference_period,
        previous_value: i.previous_value,
        previous_period: i.previous_period,
        forecast_value: i.forecast_value,
        forecast_period: i.forecast_period,
      })),
      articles: content.articles.length,
    };
  });

/** Envia o boletim agora: teste (e-mail/WhatsApp) ou para todos os inscritos ativos. */
export const sendBulletinNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        testEmail: z.string().trim().email().max(255).optional(),
        testWhatsApp: z.string().trim().refine((v) => !v || isValidPhone(v), PHONE_ERROR).optional(),
        testSegment: z.string().trim().max(80).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertPanel(context);
    const { isAdmin, queueChangeRequest } = await import("./access.server");
    if (!(await isAdmin(context as never))) {
      const queued = await queueChangeRequest(context as never, {
        kind: "bulletin",
        action: "send",
        title: "Envio do Boletim Semanal",
        summary: data.testEmail || data.testWhatsApp
          ? "Envio de teste do Boletim Semanal."
          : "Envio do Boletim Semanal para todos os inscritos ativos.",
        payload: data,
      });
      return queued.ok
        ? { ok: false as const, error: "Pedido enviado para aprovação do administrador." }
        : { ok: false as const, error: queued.error };
    }
    const { dispatchBulletin } = await import("./bulletin.server");
    try {
      return await dispatchBulletin({
        testEmail: data.testEmail,
        testWhatsApp: data.testWhatsApp,
        testSegment: data.testSegment,
      });
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha no envio." };
    }
  });

/** Cancela manualmente um cadastro pelo painel. */
export const unsubscribeBulletinByAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPanel(context);
    const { isAdmin, queueChangeRequest } = await import("./access.server");
    if (!(await isAdmin(context as never))) {
      const queued = await queueChangeRequest(context as never, {
        kind: "bulletin",
        action: "unsubscribe",
        targetId: data.id,
        title: "Interromper envio do Boletim Semanal",
        summary: "Cancelamento de um cadastro do Boletim Semanal.",
        payload: data,
      });
      return queued.ok
        ? { ok: false as const, error: "Pedido enviado para aprovação do administrador." }
        : { ok: false as const, error: queued.error };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: subscriber } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select("email, via_email")
      .eq("id", data.id)
      .maybeSingle();
    if (!subscriber) return { ok: false as const, error: "Cadastro não encontrado." };
    if (subscriber.via_email) {
      try {
        const { setRecipientEmailConsent } = await import("./email-consent.server");
        await setRecipientEmailConsent(subscriber.email, false);
      } catch (error) {
        const { consentErrorMessage } = await import("./email-consent.server");
        return { ok: false as const, error: consentErrorMessage(error) };
      }
    }
    const { error } = await supabaseAdmin
      .from("bulletin_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: "Não foi possível cancelar o cadastro." };
    return { ok: true as const };
  });
