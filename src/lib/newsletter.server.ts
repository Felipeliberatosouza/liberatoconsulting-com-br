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
<tr><td style="padding:20px 32px 28px;border-top:1px solid #e7e5e4;font-size:12px;color:#78716c">
Você recebeu este e-mail porque se inscreveu na newsletter da Liberato Consulting.
<a href="${input.unsubscribeUrl}" style="color:#ea580c">Cancelar inscrição</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

export function renderCampaignText(body: string, unsubscribeUrl: string) {
  return `${body}\n\n—\nCancelar inscrição: ${unsubscribeUrl}`;
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
