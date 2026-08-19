import { SENDER_DOMAIN } from "@/lib/email-templates/send-email";
import { sendLovableEmail } from "@lovable.dev/email-js";

import {
  companyFooterFromRow,
  companyFooterHtml,
  companyFooterText,
  type CompanyFooter,
} from "./company-footer.server";
import { emailLang, formatDateFor, labelsFor, type EmailLang } from "./email-i18n.server";
import { compareIndicator, resolvePolarity } from "./indicator-compare";
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
  language?: string | null;
};

type Indicator = {
  slug?: string;
  polarity?: string | null;
  label: string;
  value: string;
  unit: string;
  reference_period: string;
  trend: string;
  note: string;
  source_name: string;
  source_url: string;
  segment: string;
  previous_value: string;
  previous_period: string;
  forecast_value: string;
  forecast_period: string;
  forecast_source_name: string;
  forecast_source_url: string;
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

const LOCALE: Record<EmailLang, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

/** Trecho textual com a comparação (usado no texto puro e no WhatsApp). */
function indicatorDeltaText(i: Indicator, lang: EmailLang) {
  const delta = compareIndicator(
    i.value,
    i.previous_value,
    i.unit,
    LOCALE[lang],
    resolvePolarity(i.polarity, i.slug, i.label),
  );
  const L = labelsFor(lang);
  const prev = i.previous_value
    ? ` | ${L.previousLabel}: ${i.previous_value}${i.unit}${
        i.previous_period ? ` (${i.previous_period})` : ""
      }`
    : "";
  const change = delta.direction === "none" ? "" : ` | ${delta.arrow} ${delta.label}`;
  const forecast = i.forecast_value
    ? ` | ${L.forecastLabel}: ${i.forecast_value}${i.unit}${
        i.forecast_period ? ` (${i.forecast_period})` : ""
      }`
    : "";
  return `${prev}${change}${forecast}`;
}

/** Linha com a fonte do dado atual e da tendência (somente e-mail/texto). */
function indicatorSourceText(i: Indicator, lang: EmailLang) {
  const L = labelsFor(lang);
  const parts: string[] = [];
  if (i.source_name) parts.push(`${i.source_name}${i.source_url ? ` — ${i.source_url}` : ""}`);
  if (i.forecast_source_name)
    parts.push(
      `${L.forecastLabel}: ${i.forecast_source_name}${
        i.forecast_source_url ? ` — ${i.forecast_source_url}` : ""
      }`,
    );
  return parts.length ? `  ${L.sourceLabel}: ${parts.join(" | ")}` : "";
}

export function siteOrigin() {
  return process.env["PUBLIC_SITE_URL"] || "https://liberatoconsulting.com.br";
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
          "slug, polarity, label, value, unit, reference_period, trend, note, source_name, source_url, segment, previous_value, previous_period, forecast_value, forecast_period, forecast_source_name, forecast_source_url, position, published",
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

/** HTML do Boletim Semanal (corpo do e-mail), no idioma do destinatário. */
export function renderBulletinHtml(
  content: BulletinContent,
  unsubscribeUrl: string,
  lang: EmailLang = "pt",
) {
  const origin = siteOrigin();
  const L = labelsFor(lang);

  const sourceLink = (name: string, url: string) =>
    url
      ? `<a href="${escapeHtml(url)}" style="color:#e2751f;text-decoration:none">${escapeHtml(name)}</a>`
      : escapeHtml(name);

  const indicators =
    content.indicators.length > 0
      ? content.indicators
          .map((i) => {
            const delta = compareIndicator(
              i.value,
              i.previous_value,
              i.unit,
              LOCALE[lang],
              resolvePolarity(i.polarity, i.slug, i.label),
            );
            const sources = [
              i.source_name ? sourceLink(i.source_name, i.source_url) : "",
              i.forecast_source_name
                ? `${escapeHtml(L.forecastLabel)}: ${sourceLink(
                    i.forecast_source_name,
                    i.forecast_source_url,
                  )}`
                : "",
            ].filter(Boolean);
            return `<tr>
<td style="padding:10px 8px 10px 0;border-bottom:1px solid #eeece9">
  <div style="font-size:14px;color:#1f2328;font-weight:600">${escapeHtml(i.label)}</div>
  <div style="font-size:12px;color:#78716c">${escapeHtml(i.reference_period || "")}${
    i.note ? ` — ${escapeHtml(i.note)}` : ""
  }</div>
  ${
    sources.length
      ? `<div style="font-size:11px;color:#a8a29e">${escapeHtml(L.sourceLabel)}: ${sources.join(
          " · ",
        )}</div>`
      : ""
  }
</td>
<td align="right" style="padding:10px 8px;border-bottom:1px solid #eeece9;white-space:nowrap">
  <span style="font-size:16px;font-weight:700;color:#14192a">${escapeHtml(i.value)}${escapeHtml(
    i.unit || "",
  )}</span>
</td>
<td align="right" style="padding:10px 8px;border-bottom:1px solid #eeece9;white-space:nowrap">
  <span style="font-size:14px;color:#57534e">${
    i.previous_value ? `${escapeHtml(i.previous_value)}${escapeHtml(i.unit || "")}` : "—"
  }</span>
  <div style="font-size:11px;color:#a8a29e">${escapeHtml(i.previous_period || "")}</div>
</td>
<td align="right" style="padding:10px 8px;border-bottom:1px solid #eeece9;white-space:nowrap">
  <span style="font-size:14px;font-weight:700;color:${delta.color}">${delta.arrow} ${escapeHtml(
    delta.label,
  )}</span>
</td>
<td align="right" style="padding:10px 0 10px 8px;border-bottom:1px solid #eeece9;white-space:nowrap">
  <span style="font-size:14px;color:#1f2328">${
    i.forecast_value ? `${escapeHtml(i.forecast_value)}${escapeHtml(i.unit || "")}` : "—"
  }</span>
  <div style="font-size:11px;color:#a8a29e">${escapeHtml(i.forecast_period || "")}</div>
</td></tr>`;
          })
          .join("")
      : `<tr><td colspan="5" style="padding:10px 0;font-size:14px;color:#78716c">${escapeHtml(L.noIndicators)}</td></tr>`;

  const articleLink = (slug: string) =>
    `${origin}/content/${encodeURIComponent(slug)}${lang === "pt" ? "" : `?lang=${lang}`}`;

  const articles =
    content.articles.length > 0
      ? content.articles
          .map(
            (a) => `<p style="margin:0 0 14px">
<a href="${articleLink(a.slug)}" style="font-size:15px;font-weight:600;color:#14192a;text-decoration:none">${escapeHtml(
              a.title,
            )}</a><br />
<span style="font-size:13px;color:#57534e">${escapeHtml((a.summary || "").slice(0, 180))}</span><br />
<a href="${articleLink(a.slug)}" style="font-size:13px;color:#e2751f">${escapeHtml(L.readContent)}</a>
</p>`,
          )
          .join("")
      : `<p style="font-size:14px;color:#78716c">${escapeHtml(L.soonArticles)}</p>`;

  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f5f5f4;padding:28px 0;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:94%;background:#ffffff;border-radius:12px;overflow:hidden">

<tr><td style="padding:28px 32px 20px;border-bottom:1px solid #e7e5e4" align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" valign="middle" style="width:48px">
        <img src="${escapeHtml(content.logoUrl)}" alt="Liberato Consulting" height="26" width="auto" style="display:block;height:26px;width:auto;max-width:120px" />
      </td>
      <td align="left" valign="middle" style="padding-left:12px">
        <h1 style="margin:0;font-size:24px;color:#14192a">${escapeHtml(L.bulletinTitle)}</h1>
      </td>
    </tr>
  </table>
  <div style="margin-top:14px;font-size:13px;color:#78716c">${escapeHtml(L.updatedOn)} ${escapeHtml(content.dateLabel)}</div>
  <div style="margin-top:6px;font-size:12px;color:#e2751f;font-weight:600">${escapeHtml(
    L.segment,
  )}: ${escapeHtml(content.segment)}</div>
</td></tr>

<tr><td style="padding:24px 32px 8px">
  <h2 style="margin:0 0 8px;font-size:16px;color:#14192a">${escapeHtml(L.indicators)}</h2>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <th align="left" style="padding:0 8px 6px 0;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e">${escapeHtml(L.indicators)}</th>
      <th align="right" style="padding:0 8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e">${escapeHtml(L.currentLabel)}</th>
      <th align="right" style="padding:0 8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e">${escapeHtml(L.previousLabel)}</th>
      <th align="right" style="padding:0 8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e">${escapeHtml(L.changeLabel)}</th>
      <th align="right" style="padding:0 0 6px 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e">${escapeHtml(L.forecastLabel)}</th>
    </tr>
    ${indicators}
  </table>
</td></tr>

<tr><td style="padding:24px 32px 8px">
  <h2 style="margin:0 0 12px;font-size:16px;color:#14192a">${escapeHtml(L.latestArticles)}</h2>
  ${articles}
  <p style="margin:16px 0 0"><a href="${origin}/content${lang === "pt" ? "" : `?lang=${lang}`}" style="font-size:13px;font-weight:600;color:#e2751f">${escapeHtml(
    L.viewAll,
  )}</a></p>
</td></tr>

<tr><td style="padding:4px 32px 20px">
  ${
    content.articles[0]
      ? `<p style="margin:0;font-size:14px;color:#14192a">${escapeHtml(L.readLatest)}
        <a href="${origin}/content/${content.articles[0].slug}${lang === "pt" ? "" : `?lang=${lang}`}" style="font-weight:700;color:#e2751f">${escapeHtml(content.articles[0].title)}</a></p>`
      : ""
  }
</td></tr>

<tr><td style="padding:22px 32px;background:#14192a;color:#f7f6f4">
  ${companyFooterHtml(content.company)}
</td></tr>


<tr><td style="padding:18px 32px 26px;font-size:12px;color:#78716c">
  ${escapeHtml(L.bulletinWhy)}
  <a href="${unsubscribeUrl}" style="color:#e2751f">${escapeHtml(L.stopReceiving)}</a>.
</td></tr>

</table></td></tr></table></body></html>`;
}

export function renderBulletinText(
  content: BulletinContent,
  unsubscribeUrl: string,
  lang: EmailLang = "pt",
) {
  const origin = siteOrigin();
  const L = labelsFor(lang);
  const suffix = lang === "pt" ? "" : `?lang=${lang}`;
  const indicators = content.indicators
    .map((i) =>
      `• ${i.label}: ${i.value}${i.unit} (${i.reference_period})${indicatorDeltaText(i, lang)}\n${indicatorSourceText(i, lang)}`.trimEnd(),
    )
    .join("\n");
  const articles = content.articles
    .map((a) => `• ${a.title} — ${origin}/content/${a.slug}${suffix}`)
    .join("\n");
  return `${L.bulletinTitle.toUpperCase()} — Liberato Consulting
${L.updatedOn} ${content.dateLabel}
${L.segment}: ${content.segment}

${L.indicators.toUpperCase()}
${indicators || L.noIndicators}

${L.latestArticles.toUpperCase()}
${articles || L.soonArticles}
${
  content.articles[0]
    ? `\n${L.readLatest} ${content.articles[0].title} — ${origin}/content/${content.articles[0].slug}${suffix}\n`
    : ""
}
${companyFooterText(content.company)}

${L.stopReceiving}: ${unsubscribeUrl}`;
}

/** Mensagem enviada por WhatsApp (acompanha a imagem do boletim). */
export function renderBulletinWhatsApp(
  content: BulletinContent,
  unsubscribeUrl: string,
  lang: EmailLang = "pt",
) {
  const origin = siteOrigin();
  const L = labelsFor(lang);
  const suffix = lang === "pt" ? "" : `?lang=${lang}`;
  const indicators = content.indicators
    .slice(0, 5)
    .map((i) => `• ${i.label}: ${i.value}${i.unit}${indicatorDeltaText(i, lang)}`)
    .join("\n");
  const articles = content.articles
    .slice(0, 3)
    .map((a) => `• ${a.title}: ${origin}/content/${a.slug}${suffix}`)
    .join("\n");
  return `*${L.bulletinTitle} — Liberato Consulting*
${L.updatedOn} ${content.dateLabel}
${L.segment}: ${content.segment}

*${L.indicators}*
${indicators || L.noIndicators}

*${L.latestArticles}*
${articles || L.soonArticles}
${
  content.articles[0]
    ? `\n${L.readLatest} ${content.articles[0].title}: ${origin}/content/${content.articles[0].slug}${suffix}\n`
    : ""
}
${L.socialCta}

${companyFooterText(content.company)}

${L.stopReceiving}: ${unsubscribeUrl}`;
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
  idempotencyKey?: string;
}) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de e-mail indisponível.");
  const settings = await newsletterSettings();
  if (!settings.fromEmail) {
    throw new Error("Configure o e-mail remetente em Newsletter → Configurações.");
  }
  const from = `${settings.fromName} <contato@${SENDER_DOMAIN}>`;
  try {
    return await sendLovableEmail(
      {
        to: params.to,
        from,
        sender_domain: SENDER_DOMAIN,
        reply_to: settings.fromEmail,
        subject: params.subject,
        html: params.html,
        text: params.text,
        purpose: "transactional",
        label: "boletim-semanal",
        idempotency_key: `${
          params.idempotencyKey ?? `bol-${new Date().toISOString().slice(0, 10)}-${params.to}`
        }-${crypto.randomUUID().slice(0, 8)}`.slice(0, 200),
      },
      { apiKey },
    );
  } catch (error) {
    const { translateSuppressed } = await import("./newsletter.server");
    throw translateSuppressed(error, params.to);
  }
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
  testLanguage?: string | undefined;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { translateContent } = await import("./ai-translate.server");
  const origin = siteOrigin();
  const cache = new Map<string, BulletinContent>();
  const stamp = new Date().toISOString().slice(0, 10);

  /** Conteúdo do boletim por segmento, traduzido para o idioma do inscrito. */
  const contentFor = async (segment: string, lang: EmailLang): Promise<BulletinContent> => {
    const key = `${segment || "Todos"}|${lang}`;
    if (!cache.has(key)) {
      const base = await buildBulletinContent(segment || "Todos");
      if (lang === "pt") {
        cache.set(key, base);
      } else {
        const translated = await translateContent(`bulletin:${stamp}:${segment || "Todos"}`, lang, {
          segment: base.segment,
          indicators: base.indicators.map((i) => ({
            label: i.label,
            reference_period: i.reference_period,
            note: i.note,
          })),
          articles: base.articles.map((a) => ({ title: a.title, summary: a.summary })),
        });
        cache.set(key, {
          ...base,
          dateLabel: formatDateFor(lang),
          segment: translated.segment || base.segment,
          indicators: base.indicators.map((i, idx) => ({
            ...i,
            label: translated.indicators[idx]?.label || i.label,
            reference_period: translated.indicators[idx]?.reference_period ?? i.reference_period,
            note: translated.indicators[idx]?.note ?? i.note,
          })),
          articles: base.articles.map((a, idx) => ({
            ...a,
            title: translated.articles[idx]?.title || a.title,
            summary: translated.articles[idx]?.summary ?? a.summary,
          })),
        });
      }
    }
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
        language: options.testLanguage ?? "pt",
      },
    ];
  } else {
    const { data } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select(
        "id, full_name, company, segment, email, whatsapp, via_email, via_whatsapp, status, unsubscribe_token, language",
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
    const lang = emailLang(r.language);
    const content = await contentFor(r.segment, lang);
    const unsubscribeUrl = `${origin}/boletim/cancelar?token=${r.unsubscribe_token}`;
    const subject = `${labelsFor(lang).bulletinTitle} — ${content.dateLabel}`;
    if (!snapshot) {
      snapshot = {
        subject,
        dateLabel: content.dateLabel,
        html: renderBulletinHtml(content, unsubscribeUrl, lang),
      };
    }

    if (r.via_email && r.email) {
      try {
        await sendBulletinEmail({
          to: r.email,
          subject,
          html: renderBulletinHtml(content, unsubscribeUrl, lang),
          text: renderBulletinText(content, unsubscribeUrl, lang),
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
          caption: renderBulletinWhatsApp(content, unsubscribeUrl, lang),
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
  language?: string | null;
}) {
  const lang = emailLang(sub.language);
  const L = labelsFor(lang);
  const message = L.cancelBody(sub.full_name ?? "", siteOrigin());

  if (sub.via_email && sub.email) {
    try {
      await sendBulletinEmail({
        to: sub.email,
        subject: L.cancelSubject,
        html: `<!doctype html><html lang="${lang}"><body style="font-family:Helvetica,Arial,sans-serif;background:#f5f5f4;padding:28px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
<h1 style="font-size:20px;color:#14192a;margin:0 0 12px">${escapeHtml(L.cancelTitle)}</h1>
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
