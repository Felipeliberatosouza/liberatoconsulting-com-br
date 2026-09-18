/**
 * Conteúdo do e-mail de confirmação de conta.
 * Regra: existe um único modelo editável, em português (Configurações →
 * E-mails automáticos). O texto é traduzido automaticamente por IA para o
 * idioma do destinatário.
 */
import { emailLang, type EmailLang } from "@/lib/email-i18n.server";
import { translateContent } from "@/lib/ai-translate.server";

export const SIGNUP_SLUG = "auth_signup";
/** Compatibilidade com o formato antigo (um modelo por idioma). */
export const SIGNUP_SLUG_PREFIX = "auth_signup_";

const DEFAULT = {
  subject: "Confirme seu cadastro na Liberato Consulting",
  body:
    "Olá! Recebemos seu cadastro na Liberato Consulting.\n\nPara ativar sua conta e acessar a área de materiais e ferramentas de gestão, confirme seu e-mail ({{email}}) clicando no botão abaixo.\n\nSe você não criou esta conta, pode ignorar esta mensagem com segurança.",
  button: "Confirmar meu e-mail",
};

const LOCALES: Record<EmailLang, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

function fill(text: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    text,
  );
}

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

/** Descobre o idioma do destinatário a partir dos cadastros existentes. */
async function languageFor(supabaseAdmin: any, email: string): Promise<EmailLang> {
  try {
    const { data } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("language")
      .ilike("email", email)
      .maybeSingle();
    if (data?.language) return emailLang(data.language);
  } catch {
    /* segue com o padrão */
  }
  try {
    const { data } = await supabaseAdmin
      .from("leads")
      .select("language")
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.language) return emailLang(data.language);
  } catch {
    /* segue com o padrão */
  }
  return "pt";
}

export async function getSignupEmailContent(email: string, confirmationUrl: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const lang = await languageFor(supabaseAdmin, email);

  let subject = DEFAULT.subject;
  let body = DEFAULT.body;
  try {
    const { data } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body, enabled")
      .eq("slug", SIGNUP_SLUG)
      .maybeSingle();
    if (data?.enabled !== false) {
      subject = data?.subject || subject;
      body = data?.body || body;
    }
  } catch {
    /* mantém o texto padrão */
  }

  const source = { subject, body, button: DEFAULT.button };
  const translated = await translateContent(
    `auth_signup:${hash(`${subject}\n${body}`)}`,
    lang,
    source,
  );

  let brandFooter: string | undefined;
  try {
    const { getEmailBrandFooter } = await import("@/lib/email-brand.server");
    brandFooter = await getEmailBrandFooter();
  } catch {
    brandFooter = undefined;
  }

  const vars = { email, link: confirmationUrl };
  return {
    subject: fill(translated.subject || subject, vars),
    body: fill(translated.body || body, vars),
    buttonLabel: translated.button || DEFAULT.button,
    htmlLang: LOCALES[lang],
    brandFooter,
  };
}
