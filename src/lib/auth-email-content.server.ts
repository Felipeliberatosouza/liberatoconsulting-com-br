/**
 * Conteúdo dos e-mails automáticos de conta (confirmação, recuperação de
 * senha, link de acesso, convite e troca de e-mail).
 *
 * Regra do projeto: existe um único modelo editável, em português
 * (Configurações → E-mails automáticos). O texto é traduzido automaticamente
 * por IA para o idioma do destinatário.
 */
import { emailLang, type EmailLang } from "@/lib/email-i18n.server";
import { translateContent } from "@/lib/ai-translate.server";

export type AuthEmailKind =
  | "signup"
  | "recovery"
  | "magiclink"
  | "invite"
  | "email_change";

export const AUTH_EMAIL_SLUGS: Record<AuthEmailKind, string> = {
  signup: "auth_signup",
  recovery: "auth_recovery",
  magiclink: "auth_magiclink",
  invite: "auth_invite",
  email_change: "auth_email_change",
};

export const SIGNUP_SLUG = AUTH_EMAIL_SLUGS.signup;
/** Compatibilidade com o formato antigo (um modelo por idioma). */
export const SIGNUP_SLUG_PREFIX = "auth_signup_";

const DEFAULTS: Record<AuthEmailKind, { subject: string; body: string; button: string }> = {
  signup: {
    subject: "Confirme seu cadastro na Liberato Consulting",
    body:
      "Olá! Recebemos seu cadastro na Liberato Consulting.\n\nPara ativar sua conta e acessar a área de materiais e ferramentas de gestão, confirme seu e-mail ({{email}}) clicando no botão abaixo.\n\nSe você não criou esta conta, pode ignorar esta mensagem com segurança.",
    button: "Confirmar meu e-mail",
  },
  recovery: {
    subject: "Redefina sua senha da Liberato Consulting",
    body:
      "Olá! Recebemos uma solicitação para redefinir a senha da conta {{email}}.\n\nClique no botão abaixo para escolher uma nova senha. Por segurança, este link expira em breve e só pode ser usado uma vez.\n\nSe você não solicitou a troca de senha, ignore esta mensagem: sua senha atual continua válida.",
    button: "Redefinir minha senha",
  },
  magiclink: {
    subject: "Seu link de acesso à Liberato Consulting",
    body:
      "Olá! Use o botão abaixo para acessar sua conta ({{email}}) na Liberato Consulting.\n\nPor segurança, este link expira em breve e só pode ser usado uma vez.\n\nSe você não solicitou este acesso, ignore esta mensagem.",
    button: "Acessar minha conta",
  },
  invite: {
    subject: "Convite para acessar a Liberato Consulting",
    body:
      "Olá! Você recebeu um convite para acessar a Liberato Consulting com o e-mail {{email}}.\n\nClique no botão abaixo para aceitar o convite e criar sua senha de acesso.",
    button: "Aceitar convite",
  },
  email_change: {
    subject: "Confirme a alteração do seu e-mail",
    body:
      "Olá! Recebemos uma solicitação para alterar o e-mail da sua conta na Liberato Consulting.\n\nClique no botão abaixo para confirmar a alteração.\n\nSe você não solicitou esta mudança, ignore esta mensagem.",
    button: "Confirmar alteração",
  },
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

/**
 * Monta assunto, texto e botão de um e-mail de conta no idioma do
 * destinatário, a partir do modelo em português salvo no painel.
 */
export async function getAuthEmailContent(
  kind: AuthEmailKind,
  email: string,
  actionUrl: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const lang = await languageFor(supabaseAdmin, email);
  const defaults = DEFAULTS[kind];
  const slug = AUTH_EMAIL_SLUGS[kind];

  let subject = defaults.subject;
  let body = defaults.body;
  try {
    const { data } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body, enabled")
      .eq("slug", slug)
      .maybeSingle();
    if (data?.enabled !== false) {
      subject = data?.subject || subject;
      body = data?.body || body;
    }
  } catch {
    /* mantém o texto padrão */
  }

  const source = { subject, body, button: defaults.button };
  const translated = await translateContent(
    `${slug}:${hash(`${subject}\n${body}`)}`,
    lang,
    source,
  );

  let brandFooter: string | undefined;
  let logoUrl: string | undefined;
  try {
    const { getEmailBrandFooter } = await import("@/lib/email-brand.server");
    const { loadEmailBrand } = await import("@/lib/company-footer.server");
    const [footer, brand] = await Promise.all([
      getEmailBrandFooter(),
      loadEmailBrand("https://liberatoconsulting.com.br"),
    ]);
    brandFooter = footer;
    logoUrl = brand.logoUrl;
  } catch {
    brandFooter = undefined;
  }

  const vars = { email, link: actionUrl };
  return {
    subject: fill(translated.subject || subject, vars),
    body: fill(translated.body || body, vars),
    buttonLabel: translated.button || defaults.button,
    htmlLang: LOCALES[lang],
    brandFooter,
    logoUrl,
  };
}

export async function getSignupEmailContent(email: string, confirmationUrl: string) {
  return getAuthEmailContent("signup", email, confirmationUrl);
}
