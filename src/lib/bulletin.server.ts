import { sendLovableEmail } from "@lovable.dev/email-js";

import {
  companyFooterFromRow,
  companyFooterHtml,
  companyFooterText,
  type CompanyFooter,
} from "./company-footer.server";
import { DEFAULT_NEWSLETTER_SETTINGS, type NewsletterSettings } from "./newsletter.server";

export type BulletinSubscriber = {
  id: string;
  full_name: string;
  company: string;
  segment: string;
  email: string;
  whatsapp: string;
  via_email: boolean;
  via_whatsapp: boolean;
  status: string;
  unsubscribe_token: string;
};

type Indicator = {
  label: string;
  value: string;
  unit: string;
  reference_period: string;
  trend: string;
  note: string;
  source_name: string;
  segment: string;
};

type Article = { slug: string; title: string; summary: string; kind: string };

export type BulletinContent = {
  segment: string;
  dateLabel: string;
  indicators: Indicator[];
  articles: Article[];
  company: CompanyFooter;
  logoUrl: string;
};

export function siteOrigin() {
  return process.env["PUBLIC_SITE_URL"] || "https://liberato-ai-insight.lovable.app";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDatePt(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

/** Monta o conteúdo do boletim para um segmento específico ("Todos" = geral). */
export async function buildBulletinContent(segment: string): Promise<BulletinContent> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: indicatorRows }, { data: articleRows }, { data: companyRow }, { data: branding }] =
    await Promise.all([
      supabaseAdmin
        .from("economic_indicators")
        .select(
          "label, value, unit, reference_period, trend, note, source_name, segment, position, published",
        )
        .eq("published", true)
        .order("position", { ascending: true }),
      supabaseAdmin
        .from("content_articles")
        .select("slug, title, summary, kind, created_at, published")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4),
      supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
      supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
    ]);

  const all = (indicatorRows ?? []) as Array<Indicator & { position: number }>;
  const isGeneral = !segment || segment === "Todos" || segment === "Geral";
  const scoped = isGeneral
    ? all
    : all.filter((i) => !i.segment || i.segment === "Todos" || i.segment === segment);

  const company = companyFooterFromRow(
    companyRow as Record<string, string | null> | null,
    siteOrigin(),
  );

  const logo =
    ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl || `${siteOrigin()}/logo.png`;

  return {
    segment: isGeneral ? "Todos os segmentos" : segment,
    dateLabel: formatDatePt(),
    indicators: scoped.slice(0, 8),
    articles: (articleRows ?? []) as Article[],
    company,
    logoUrl: logo,
  };

}

/** HTML do Boletim Semanal (corpo do e-mail). */
export function renderBulletinHtml(content: BulletinContent, unsubscribeUrl: string) {
  const origin = siteOrigin();

  const indicators =
    content.indicators.length > 0
      ? content.indicators
          .map(
            (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid #eeece9">
  <div style="font-size:14px;color:#1f2328;font-weight:600">${escapeHtml(i.label)}</div>
  <div style="font-size:12px;color:#78716c">${escapeHtml(i.reference_period || "")}${
    i.note ? ` — ${escapeHtml(i.note)}` : ""
  }</div>
</td>
<td align="right" style="padding:10px 0;border-bottom:1px solid #eeece9;white-space:nowrap">
  <span style="font-size:16px;font-weight:700;color:#14192a">${escapeHtml(i.value)}${escapeHtml(
    i.unit || "",
  )}</span>
</td></tr>`,
          )
          .join("")
      : `<tr><td style="padding:10px 0;font-size:14px;color:#78716c">Sem indicadores publicados para este recorte nesta semana.</td></tr>`;

  const articles =
    content.articles.length > 0
      ? content.articles
          .map(
            (a) => `<p style="margin:0 0 14px">
<a href="${origin}/content/${encodeURIComponent(a.slug)}" style="font-size:15px;font-weight:600;color:#14192a;text-decoration:none">${escapeHtml(
              a.title,
            )}</a><br />
<span style="font-size:13px;color:#57534e">${escapeHtml((a.summary || "").slice(0, 180))}</span><br />
<a href="${origin}/content/${encodeURIComponent(a.slug)}" style="font-size:13px;color:#e2751f">Ler o conteúdo →</a>
</p>`,
          )
          .join("")
      : `<p style="font-size:14px;color:#78716c">Novos conteúdos serão publicados em breve.</p>`;

  return `<!doctype html><html><body style="margin:0;background:#f5f5f4;padding:28px 0;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;background:#ffffff;border-radius:12px;overflow:hidden">

<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #e7e5e4" align="center">
  <img src="${escapeHtml(content.logoUrl)}" alt="Liberato Consulting" style="height:44px;width:auto" />
  <h1 style="margin:18px 0 6px;font-size:24px;color:#14192a">Boletim Semanal</h1>
  <div style="font-size:13px;color:#78716c">Atualizado em ${escapeHtml(content.dateLabel)}</div>
  <div style="margin-top:6px;font-size:12px;color:#e2751f;font-weight:600">Segmento: ${escapeHtml(
    content.segment,
  )}</div>
</td></tr>

<tr><td style="padding:24px 32px 8px">
  <h2 style="margin:0 0 8px;font-size:16px;color:#14192a">Indicadores econômicos</h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${indicators}</table>
</td></tr>

<tr><td style="padding:24px 32px 8px">
  <h2 style="margin:0 0 12px;font-size:16px;color:#14192a">Últimos artigos</h2>
  ${articles}
  <p style="margin:16px 0 0"><a href="${origin}/content" style="font-size:13px;font-weight:600;color:#e2751f">Ver todos os conteúdos →</a></p>
</td></tr>

<tr><td style="padding:22px 32px;background:#14192a;color:#f7f6f4">
  ${companyFooterHtml(content.company)}
</td></tr>


<tr><td style="padding:18px 32px 26px;font-size:12px;color:#78716c">
  Você recebe o Boletim Semanal da Liberato Consulting porque solicitou esta atualização.
  <a href="${unsubscribeUrl}" style="color:#e2751f">Parar de receber</a>.
</td></tr>

</table></td></tr></table></body></html>`;
}

export function renderBulletinText(content: BulletinContent, unsubscribeUrl: string) {
  const origin = siteOrigin();
  const indicators = content.indicators
    .map((i) => `• ${i.label}: ${i.value}${i.unit} (${i.reference_period})`)
    .join("\n");
  const articles = content.articles
    .map((a) => `• ${a.title} — ${origin}/content/${a.slug}`)
    .join("\n");
  return `BOLETIM SEMANAL — Liberato Consulting
Atualizado em ${content.dateLabel}
Segmento: ${content.segment}

INDICADORES ECONÔMICOS
${indicators || "Sem indicadores para este recorte."}

ÚLTIMOS ARTIGOS
${articles || "Novos conteúdos em breve."}

${companyFooterText(content.company)}

Parar de receber: ${unsubscribeUrl}`;
}

/** Mensagem enviada por WhatsApp (acompanha a imagem do boletim). */
export function renderBulletinWhatsApp(content: BulletinContent, unsubscribeUrl: string) {
  const origin = siteOrigin();
  const indicators = content.indicators
    .slice(0, 5)
    .map((i) => `• ${i.label}: ${i.value}${i.unit}`)
    .join("\n");
  const articles = content.articles
    .slice(0, 3)
    .map((a) => `• ${a.title}: ${origin}/content/${a.slug}`)
    .join("\n");
  return `*Boletim Semanal — Liberato Consulting*
Atualizado em ${content.dateLabel}
Segmento: ${content.segment}

*Indicadores econômicos*
${indicators || "Sem indicadores para este recorte."}

*Últimos artigos*
${articles || "Novos conteúdos em breve."}

${companyFooterText(content.company)}

Para parar de receber, acesse: ${unsubscribeUrl}`;
}

async function newsletterSettings(): Promise<NewsletterSettings> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "newsletter")
    .maybeSingle();
  return {
    ...DEFAULT_NEWSLETTER_SETTINGS,
    ...((data?.value ?? {}) as Partial<NewsletterSettings>),
  };
}

export async function sendBulletinEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de e-mail indisponível.");
  const settings = await newsletterSettings();
  if (!settings.fromEmail) {
    throw new Error("Configure o e-mail remetente em Newsletter → Configurações.");
  }
  const from = `${settings.fromName} <${settings.fromEmail}>`;
  return sendLovableEmail(
    {
      to: params.to,
      from,
      sender_domain: settings.fromEmail.split("@")[1] ?? "",
      subject: params.subject,
      html: params.html,
      text: params.text,
      purpose: "newsletter",
      label: "boletim-semanal",
    },
    { apiKey },
  );
}

/** Normaliza o número para o padrão internacional exigido pela API do WhatsApp. */
export function normalizeWhatsAppNumber(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

/** Envia mensagem pela WhatsApp Cloud API (imagem com legenda ou texto). */
export async function sendWhatsAppMessage(params: {
  to: string;
  caption: string;
  imageUrl?: string;
}) {
  const token = process.env["WHATSAPP_TOKEN"];
  const phoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  if (!token || !phoneId) {
    throw new Error(
      "WhatsApp não configurado. Cadastre as credenciais da API do WhatsApp para ativar o envio.",
    );
  }
  const to = normalizeWhatsAppNumber(params.to);
  if (!to) throw new Error("Número de WhatsApp inválido.");

  const useImage = Boolean(params.imageUrl && /^https?:\/\//i.test(params.imageUrl));
  const body = useImage
    ? {
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: { link: params.imageUrl, caption: params.caption.slice(0, 1024) },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { body: params.caption } };

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha no envio por WhatsApp: ${detail.slice(0, 200)}`);
  }
  return { ok: true as const };
}

/** Dispara o boletim para os inscritos ativos (ou para um destinatário de teste). */
export async function dispatchBulletin(options?: {
  testEmail?: string | undefined;
  testWhatsApp?: string | undefined;
  testSegment?: string | undefined;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const origin = siteOrigin();
  const cache = new Map<string, BulletinContent>();
  const contentFor = async (segment: string) => {
    const key = segment || "Todos";
    if (!cache.has(key)) cache.set(key, await buildBulletinContent(key));
    return cache.get(key)!;
  };

  let recipients: BulletinSubscriber[];
  if (options?.testEmail || options?.testWhatsApp) {
    recipients = [
      {
        id: "test",
        full_name: "Teste",
        company: "",
        segment: options.testSegment || "Todos",
        email: options.testEmail ?? "",
        whatsapp: options.testWhatsApp ?? "",
        via_email: Boolean(options.testEmail),
        via_whatsapp: Boolean(options.testWhatsApp),
        status: "active",
        unsubscribe_token: "00000000-0000-0000-0000-000000000000",
      },
    ];
  } else {
    const { data } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select(
        "id, full_name, company, segment, email, whatsapp, via_email, via_whatsapp, status, unsubscribe_token",
      )
      .eq("status", "active")
      .limit(5000);
    recipients = (data ?? []) as BulletinSubscriber[];
  }

  if (recipients.length === 0) {
    return { ok: false as const, error: "Nenhum inscrito ativo no Boletim Semanal." };
  }

  let sentEmail = 0;
  let sentWhatsApp = 0;
  let failed = 0;
  let lastError: string | null = null;
  let snapshot: { subject: string; dateLabel: string; html: string } | null = null;

  for (const r of recipients) {
    const content = await contentFor(r.segment);
    const unsubscribeUrl = `${origin}/boletim/cancelar?token=${r.unsubscribe_token}`;
    const subject = `Boletim Semanal — ${content.dateLabel}`;
    if (!snapshot) {
      snapshot = {
        subject,
        dateLabel: content.dateLabel,
        html: renderBulletinHtml(content, unsubscribeUrl),
      };
    }

    if (r.via_email && r.email) {
      try {
        await sendBulletinEmail({
          to: r.email,
          subject,
          html: renderBulletinHtml(content, unsubscribeUrl),
          text: renderBulletinText(content, unsubscribeUrl),
        });
        sentEmail += 1;
      } catch (err) {
        failed += 1;
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (r.via_whatsapp && r.whatsapp) {
      try {
        await sendWhatsAppMessage({
          to: r.whatsapp,
          caption: renderBulletinWhatsApp(content, unsubscribeUrl),
          imageUrl: content.logoUrl,
        });
        sentWhatsApp += 1;
      } catch (err) {
        failed += 1;
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (r.id !== "test") {
      await supabaseAdmin
        .from("bulletin_subscribers")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("id", r.id);
    }
  }

  // Registra o envio no histórico do painel administrativo.
  await supabaseAdmin.from("bulletin_dispatches").insert({
    subject: snapshot?.subject ?? "Boletim Semanal",
    date_label: snapshot?.dateLabel ?? "",
    sent_email: sentEmail,
    sent_whatsapp: sentWhatsApp,
    failed,
    last_error: lastError,
    is_test: Boolean(options?.testEmail || options?.testWhatsApp),
    body_html: snapshot?.html ?? "",
    status: "enviado",
    segment: options?.testSegment ?? "",
  });

  if (sentEmail === 0 && sentWhatsApp === 0) {
    return { ok: false as const, error: lastError ?? "Nenhum envio pôde ser concluído." };
  }
  return { ok: true as const, sentEmail, sentWhatsApp, failed, lastError };
}


/** Confirmação enviada quando o inscrito cancela o recebimento. */
export async function sendUnsubscribeConfirmation(sub: {
  email: string;
  whatsapp: string;
  via_email: boolean;
  via_whatsapp: boolean;
  full_name: string;
}) {
  const message = `Olá${sub.full_name ? `, ${sub.full_name}` : ""}. Confirmamos o cancelamento do Boletim Semanal da Liberato Consulting. Você não receberá mais estes envios. Se quiser voltar, é só se cadastrar novamente em ${siteOrigin()}/brasil.`;

  if (sub.via_email && sub.email) {
    try {
      await sendBulletinEmail({
        to: sub.email,
        subject: "Cancelamento confirmado — Boletim Semanal",
        html: `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#f5f5f4;padding:28px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
<h1 style="font-size:20px;color:#14192a;margin:0 0 12px">Cancelamento confirmado</h1>
<p style="font-size:15px;color:#1f2328;line-height:1.6">${escapeHtml(message)}</p>
</div></body></html>`,
        text: message,
      });
    } catch {
      /* confirmação é best-effort */
    }
  }
  if (sub.via_whatsapp && sub.whatsapp) {
    try {
      await sendWhatsAppMessage({ to: sub.whatsapp, caption: message });
    } catch {
      /* confirmação é best-effort */
    }
  }
}

/**
 * Registra no histórico do painel a edição do Boletim Semanal assim que ela é
 * gerada (antes de qualquer envio). Evita duplicar a mesma edição.
 */
export async function recordBulletinGenerated(params: {
  subject: string;
  dateLabel: string;
  html: string;
  segment?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("bulletin_dispatches")
    .select("id")
    .eq("status", "gerado")
    .eq("subject", params.subject)
    .eq("date_label", params.dateLabel)
    .eq("segment", params.segment ?? "")
    .maybeSingle();
  if (existing) {
    await supabaseAdmin
      .from("bulletin_dispatches")
      .update({ body_html: params.html })
      .eq("id", existing.id);
    return;
  }
  await supabaseAdmin.from("bulletin_dispatches").insert({
    subject: params.subject,
    date_label: params.dateLabel,
    sent_email: 0,
    sent_whatsapp: 0,
    failed: 0,
    is_test: false,
    body_html: params.html,
    status: "gerado",
    segment: params.segment ?? "",
  });
}
