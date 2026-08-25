import { SENDER_DOMAIN } from "@/lib/email-templates/send-email";
import { sendLovableEmail } from "@lovable.dev/email-js";

import {
  companyFooterHtml,
  companyFooterText,
  loadEmailBrand,
  type CompanyFooter,
} from "./company-footer.server";
import { emailLang, labelsFor, type EmailLang } from "./email-i18n.server";


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
  lang?: EmailLang;
  logoUrl?: string;
}) {
  const labels = labelsFor(input.lang ?? "pt");
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

  const brandName = input.company?.name || "Liberato Consulting";
  const site = input.company?.website || "";
  // Logomarca atual do painel; sem logo cadastrada, cai no logotipo em texto.
  const logoImg = input.logoUrl
    ? `<img src="${input.logoUrl}" alt="${escapeHtml(brandName)}" width="180" style="display:block;margin:0 auto;max-width:220px;height:auto;border:0" />`
    : `<span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#111111">LIBERATO</span><span style="font-size:20px;font-weight:600;color:#ea580c"> consulting</span>`;
  const logoBlock = site
    ? `<a href="${site}" style="text-decoration:none">${logoImg}</a>`
    : logoImg;

  const companyBlock = input.company
    ? `<tr><td style="padding:22px 32px;background:#14192a;color:#f7f6f4">
${companyFooterHtml(input.company)}
</td></tr>`
    : "";

  return `<!doctype html><html lang="${input.lang ?? "pt"}"><body style="margin:0;background:#f5f5f4;padding:32px 0;font-family:Helvetica,Arial,sans-serif">
<span style="display:none;opacity:0;color:transparent">${escapeHtml(input.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td align="center" style="padding:28px 32px;border-bottom:1px solid #e7e5e4;text-align:center">
${logoBlock}
</td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:#111111;text-align:center">${escapeHtml(input.subject)}</h1>
${paragraphs}
</td></tr>
${companyBlock}
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c">
${escapeHtml(labels.newsletterWhy)}
<a href="${input.unsubscribeUrl}" style="color:#ea580c">${escapeHtml(labels.unsubscribe)}</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function renderCampaignText(
  body: string,
  unsubscribeUrl: string,
  company?: CompanyFooter,
  lang: EmailLang = "pt",
) {
  const footer = company ? `\n\n${companyFooterText(company)}` : "";
  return `${body}${footer}\n\n—\n${labelsFor(lang).unsubscribe}: ${unsubscribeUrl}`;
}



/** Envia um e-mail da newsletter pelo serviço de e-mail da Lovable. */
export async function sendNewsletterEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from: string;
  replyTo?: string;
  idempotencyKey: string;
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de e-mail indisponível (chave ausente).");
  const senderDomain = SENDER_DOMAIN;
  try {
    return await sendLovableEmail(
      {
        to: params.to,
        from: params.from,
        sender_domain: senderDomain,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
        subject: params.subject,
        html: params.html,
        text: params.text,
        purpose: "transactional",
        label: "newsletter",
        idempotency_key: params.idempotencyKey,
      },
      { apiKey },
    );
  } catch (error) {
    throw translateSuppressed(error, params.to);
  }
}

/** Converte o erro de destinatário descadastrado em uma mensagem clara. */
export function translateSuppressed(error: unknown, to: string) {
  const code = (error as { code?: string } | null)?.code;
  const msg = error instanceof Error ? error.message : String(error);
  if (code === "recipient_suppressed" || /recipient_suppressed|suppressed/i.test(msg)) {
    return new Error(
      `O e-mail ${to} cancelou o recebimento (Unsubscribe) e por isso não pode receber envios. ` +
        `Para voltar a receber, o próprio destinatário precisa clicar em "Resubscribe" na página de cancelamento, ou use outro e-mail para o teste.`,
    );
  }
  return error instanceof Error ? error : new Error(msg);
}


/** Envia uma campanha para todos os inscritos ativos (ou para um e-mail de teste). */
export async function dispatchCampaign(campaignId: string, testEmail?: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // Chave única por tentativa de disparo: reenvios após falha não colidem (HTTP 409).
  const runId = crypto.randomUUID().slice(0, 8);

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
  // Sempre enviar pelo subdomínio verificado; o e-mail configurado vira reply-to.
  const from = `${settings.fromName} <contato@${SENDER_DOMAIN}>`;
  const { siteOrigin } = await import("./bulletin.server");
  const origin = siteOrigin();
  // Logomarca e dados institucionais lidos do painel a cada disparo.
  const { company, logoUrl } = await loadEmailBrand(origin);


  type Recipient = { email: string; unsubscribe_token: string; language?: string | null };
  let recipients: Recipient[];
  if (testEmail) {
    recipients = [{ email: testEmail, unsubscribe_token: "00000000-0000-0000-0000-000000000000" }];
  } else {
    const { data: subs } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token, language")
      .eq("status", "active")
      .limit(5000);
    recipients = (subs ?? []) as Recipient[];
  }
  if (recipients.length === 0) return { ok: false as const, error: "Nenhum inscrito ativo." };

  if (!testEmail) {
    // limpa o erro da tentativa anterior enquanto reenviamos
    await supabaseAdmin
      .from("newsletter_campaigns")
      .update({ status: "sending", last_error: null })
      .eq("id", campaignId);
  }

  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;

  // Conteúdo traduzido uma única vez por idioma presente na lista.
  const { translateContent } = await import("./ai-translate.server");
  const variants = new Map<EmailLang, { subject: string; preheader: string; body: string }>();
  const variantFor = async (lang: EmailLang) => {
    if (!variants.has(lang)) {
      variants.set(
        lang,
        await translateContent(`campaign:${campaignId}`, lang, {
          subject: campaign.subject as string,
          preheader: (campaign.preheader ?? "") as string,
          body: (campaign.body ?? "") as string,
        }),
      );
    }
    return variants.get(lang)!;
  };

  for (const r of recipients) {
    const lang = emailLang(r.language);
    const unsubscribeUrl = `${origin}/newsletter/unsubscribe?token=${r.unsubscribe_token}`;
    try {
      const v = await variantFor(lang);
      await sendNewsletterEmail({
        to: r.email,
        from,
        replyTo: settings.fromEmail,
        subject: v.subject,
        html: renderCampaignHtml({
          subject: v.subject,
          preheader: v.preheader,
          body: v.body,
          unsubscribeUrl,
          company,
          lang,
        }),
        text: renderCampaignText(v.body, unsubscribeUrl, company, lang),
        idempotencyKey: `nl-${campaignId}-${runId}-${lang}-${r.unsubscribe_token}-${r.email}`.slice(0, 200),
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
