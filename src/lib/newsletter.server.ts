import { sendLovableEmail } from "@lovable.dev/email-js";

export type NewsletterSettings = {
  fromName: string;
  fromEmail: string;
  autoSendOnPublish: boolean;
};

export const DEFAULT_NEWSLETTER_SETTINGS: NewsletterSettings = {
  fromName: "Liberato Consulting",
  fromEmail: "",
  autoSendOnPublish: false,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Converte o texto simples da campanha em HTML com a identidade do site. */
export function renderCampaignHtml(input: {
  subject: string;
  preheader: string;
  body: string;
  unsubscribeUrl: string;
  company?: CompanyFooter;
}) {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#1f2328">${escapeHtml(
          p,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  const companyBlock = input.company
    ? `<tr><td style="padding:22px 32px;background:#14192a;color:#f7f6f4">
${companyFooterHtml(input.company)}
</td></tr>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#f5f5f4;padding:32px 0;font-family:Helvetica,Arial,sans-serif">
<span style="display:none;opacity:0;color:transparent">${escapeHtml(input.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e7e5e4">
<span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#111111">LIBERATO</span>
<span style="font-size:20px;font-weight:600;color:#ea580c"> consulting</span>
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#111111">${escapeHtml(input.subject)}</h1>
${paragraphs}
</td></tr>
${companyBlock}
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c">
Você recebeu este e-mail porque se inscreveu na newsletter da Liberato Consulting.
<a href="${input.unsubscribeUrl}" style="color:#ea580c">Cancelar inscrição</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function renderCampaignText(
  body: string,
  unsubscribeUrl: string,
  company?: CompanyFooter,
) {
  const footer = company ? `\n\n${companyFooterText(company)}` : "";
  return `${body}${footer}\n\n—\nCancelar inscrição: ${unsubscribeUrl}`;
}


/** Envia um e-mail da newsletter pelo serviço de e-mail da Lovable. */
export async function sendNewsletterEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de e-mail indisponível (chave ausente).");
  const senderDomain = params.from.split("@")[1] ?? "";
  return sendLovableEmail(
    {
      to: params.to,
      from: params.from,
      sender_domain: senderDomain,
      subject: params.subject,
      html: params.html,
      text: params.text,
      purpose: "newsletter",
      label: "newsletter",
    },
    { apiKey },
  );
}

/** Envia uma campanha para todos os inscritos ativos (ou para um e-mail de teste). */
export async function dispatchCampaign(campaignId: string, testEmail?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: campaign } = await supabaseAdmin
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (!campaign) return { ok: false as const, error: "Campanha não encontrada." };

  const { data: settingsRow } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "newsletter")
    .maybeSingle();
  const settings: NewsletterSettings = {
    ...DEFAULT_NEWSLETTER_SETTINGS,
    ...((settingsRow?.value ?? {}) as Partial<NewsletterSettings>),
  };
  if (!settings.fromEmail) {
    return {
      ok: false as const,
      error:
        "Configure o e-mail remetente da newsletter (é preciso ter um domínio de e-mail próprio conectado).",
    };
  }
  const from = `${settings.fromName} <${settings.fromEmail}>`;
  const origin = process.env["PUBLIC_SITE_URL"] || "https://liberato.com";

  type Recipient = { email: string; unsubscribe_token: string };
  let recipients: Recipient[];
  if (testEmail) {
    recipients = [{ email: testEmail, unsubscribe_token: "00000000-0000-0000-0000-000000000000" }];
  } else {
    const { data: subs } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("status", "active")
      .limit(5000);
    recipients = (subs ?? []) as Recipient[];
  }
  if (recipients.length === 0) return { ok: false as const, error: "Nenhum inscrito ativo." };

  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;

  for (const r of recipients) {
    const unsubscribeUrl = `${origin}/newsletter/unsubscribe?token=${r.unsubscribe_token}`;
    try {
      await sendNewsletterEmail({
        to: r.email,
        from,
        subject: campaign.subject,
        html: renderCampaignHtml({
          subject: campaign.subject,
          preheader: campaign.preheader ?? "",
          body: campaign.body,
          unsubscribeUrl,
        }),
        text: renderCampaignText(campaign.body, unsubscribeUrl),
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  if (!testEmail) {
    await supabaseAdmin
      .from("newsletter_campaigns")
      .update({
        status: sent > 0 ? "sent" : "failed",
        sent_at: new Date().toISOString(),
        sent_count: sent,
        failed_count: failed,
        last_error: lastError,
      })
      .eq("id", campaignId);
  }

  if (sent === 0) return { ok: false as const, error: lastError ?? "Nenhum e-mail pôde ser enviado." };
  return { ok: true as const, sent, failed };
}

/** Cria e dispara automaticamente uma campanha anunciando um novo conteúdo publicado. */
export async function announceArticle(article: {
  title: string;
  summary: string;
  slug: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: settingsRow } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "newsletter")
    .maybeSingle();
  const settings: NewsletterSettings = {
    ...DEFAULT_NEWSLETTER_SETTINGS,
    ...((settingsRow?.value ?? {}) as Partial<NewsletterSettings>),
  };
  if (!settings.autoSendOnPublish || !settings.fromEmail) return;

  const origin = process.env["PUBLIC_SITE_URL"] || "https://liberato.com";
  const body = `${article.summary}\n\nLeia o conteúdo completo: ${origin}/content/${article.slug}`;

  const { data: created } = await supabaseAdmin
    .from("newsletter_campaigns")
    .insert({ subject: article.title, preheader: article.summary.slice(0, 160), body, status: "draft" })
    .select("id")
    .single();
  if (!created) return;
  await dispatchCampaign(created.id as string);
}
