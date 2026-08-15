import { sendLovableEmail } from "@lovable.dev/email-js";

import { DEFAULT_NEWSLETTER_SETTINGS, type NewsletterSettings } from "./newsletter.server";
import { SENDER_DOMAIN } from "./email-templates/send-email";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Envia a mensagem de um visitante para o e-mail privado do consultor.
 * O e-mail nunca é devolvido ao navegador.
 */
export async function sendConsultantMessage(input: {
  consultantId: string;
  fromName: string;
  fromEmail: string;
  company: string;
  message: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: consultant } = await supabaseAdmin
    .from("consultants")
    .select("full_name, contact_email, published")
    .eq("id", input.consultantId)
    .maybeSingle();

  if (!consultant || !consultant.published) {
    return { ok: false as const, error: "Consultor não encontrado." };
  }
  if (!consultant.contact_email) {
    return { ok: false as const, error: "Este consultor ainda não tem contato cadastrado." };
  }

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
      error: "Envio de e-mail indisponível no momento. Use a página Fale conosco.",
    };
  }

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false as const, error: "Serviço de e-mail indisponível." };

  const subject = `${consultant.full_name}, novo contato de ${input.fromName} pelo site`;
  const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;color:#1f2328">
<p style="margin:0 0 10px">Olá, ${escapeHtml(consultant.full_name)}.</p>
<h2 style="margin:0 0 16px">Você recebeu uma nova mensagem pelo site oficial da Liberato Consulting</h2>
<p><strong>Para:</strong> ${escapeHtml(consultant.full_name)}</p>
<p><strong>Nome:</strong> ${escapeHtml(input.fromName)}</p>
<p><strong>E-mail:</strong> ${escapeHtml(input.fromEmail)}</p>
<p><strong>Empresa:</strong> ${escapeHtml(input.company || "—")}</p>
<p style="white-space:pre-wrap;margin-top:16px">${escapeHtml(input.message)}</p>
<p style="margin-top:20px;font-size:13px;color:#57534e">Responda diretamente a este e-mail para falar com ${escapeHtml(input.fromName)}. Esta mensagem foi enviada porque o visitante escolheu o seu perfil no site liberatoconsulting.com.br.</p>
</body></html>`;
  const text = `Olá, ${consultant.full_name}.\n\nVocê recebeu uma nova mensagem pelo site oficial da Liberato Consulting.\n\nNome: ${input.fromName}\nE-mail: ${input.fromEmail}\nEmpresa: ${input.company || "—"}\n\n${input.message}\n\nResponda diretamente a este e-mail para falar com ${input.fromName}. Esta mensagem foi enviada porque o visitante escolheu o seu perfil no site liberatoconsulting.com.br.`;

  await sendLovableEmail(
    {
      to: consultant.contact_email,
      from: `${settings.fromName} <noreply@${SENDER_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      reply_to: input.fromEmail,
      subject,
      html,
      text,
      purpose: "transactional",
      label: "consultant-contact",
      idempotency_key: `consultant-contact-${input.consultantId}-${crypto.randomUUID()}`.slice(0, 200),
    } as never,
    { apiKey },
  );

  return { ok: true as const };
}
