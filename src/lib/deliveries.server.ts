type Built = { subject: string; html: string; text: string; whatsapp: string };

function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/** Monta exatamente o conteúdo de e-mail e WhatsApp de um envio, para pré-visualizar ou reenviar. */
export async function buildDeliveryMessage(source: string, referenceId: string, email?: string): Promise<Built> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { siteOrigin } = await import("./bulletin.server");
  const origin = siteOrigin();

  if (source === "newsletter") {
    const { data: c } = await supabaseAdmin.from("newsletter_campaigns").select("*").eq("id", referenceId).maybeSingle();
    if (!c) throw new Error("Newsletter não encontrada.");
    const { data: sub } = email
      ? await supabaseAdmin.from("newsletter_subscribers").select("unsubscribe_token, language").eq("email", email).maybeSingle()
      : { data: null };
    const { emailLang } = await import("./email-i18n.server");
    const lang = emailLang(sub?.language);
    const { translateContent } = await import("./ai-translate.server");
    const v = await translateContent(`campaign:${referenceId}`, lang, {
      subject: c.subject,
      preheader: c.preheader ?? "",
      body: c.body ?? "",
    });
    const unsubscribeUrl = `${origin}/newsletter/unsubscribe?token=${sub?.unsubscribe_token ?? "00000000-0000-0000-0000-000000000000"}`;
    const { renderCampaignHtml, renderCampaignText } = await import("./newsletter.server");
    const { loadEmailBrand } = await import("./company-footer.server");
    const { company, logoUrl } = await loadEmailBrand(origin);
    return {
      subject: v.subject,
      html: renderCampaignHtml({ subject: v.subject, preheader: v.preheader, body: v.body, unsubscribeUrl, company, lang, logoUrl }),
      text: renderCampaignText(v.body, unsubscribeUrl, company, lang),
      whatsapp: `*${v.subject}*\n\n${v.body}\n\nCancelar: ${unsubscribeUrl}`,
    };
  }

  if (source === "boletim") {
    const { data: b } = await supabaseAdmin.from("bulletin_dispatches").select("subject, body_html").eq("id", referenceId).maybeSingle();
    if (!b || !b.body_html) throw new Error("Conteúdo deste boletim não foi guardado.");
    const text = htmlToText(b.body_html);
    return { subject: b.subject, html: b.body_html, text, whatsapp: `*${b.subject}*\n\n${text}` };
  }

  throw new Error("Este tipo de envio não guarda o conteúdo para reenvio.");
}
