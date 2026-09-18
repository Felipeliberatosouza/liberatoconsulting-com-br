/**
 * Conteúdo do e-mail de confirmação de conta: idioma do destinatário e texto
 * editável no painel (Configurações → E-mails automáticos), um modelo por idioma.
 */
import { emailLang, type EmailLang } from "@/lib/email-i18n.server";

export const SIGNUP_SLUG_PREFIX = "auth_signup_";

const DEFAULTS: Record<EmailLang, { subject: string; body: string; button: string; lang: string }> =
  {
    pt: {
      subject: "Confirme seu cadastro na Liberato Consulting",
      body:
        "Olá! Recebemos seu cadastro na Liberato Consulting.\n\nPara ativar sua conta e acessar a área de materiais e ferramentas de gestão, confirme seu e-mail ({{email}}) clicando no botão abaixo.\n\nSe você não criou esta conta, pode ignorar esta mensagem com segurança.",
      button: "Confirmar meu e-mail",
      lang: "pt-BR",
    },
    en: {
      subject: "Confirm your Liberato Consulting account",
      body:
        "Hello! We received your registration at Liberato Consulting.\n\nTo activate your account and access the management tools and materials area, confirm your email ({{email}}) by clicking the button below.\n\nIf you did not create this account, you can safely ignore this message.",
      button: "Confirm my email",
      lang: "en-US",
    },
    es: {
      subject: "Confirme su registro en Liberato Consulting",
      body:
        "¡Hola! Recibimos su registro en Liberato Consulting.\n\nPara activar su cuenta y acceder al área de materiales y herramientas de gestión, confirme su correo ({{email}}) haciendo clic en el botón de abajo.\n\nSi usted no creó esta cuenta, puede ignorar este mensaje con seguridad.",
      button: "Confirmar mi correo",
      lang: "es-ES",
    },
    zh: {
      subject: "确认您的 Liberato Consulting 账户",
      body:
        "您好！我们收到了您在 Liberato Consulting 的注册申请。\n\n请点击下方按钮确认您的邮箱（{{email}}），以激活账户并访问管理工具与资料专区。\n\n如果这不是您本人的注册，请忽略此邮件。",
      button: "确认邮箱",
      lang: "zh-CN",
    },
  };

function fill(text: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    text,
  );
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
  const fallback = DEFAULTS[lang];

  let subject = fallback.subject;
  let body = fallback.body;
  try {
    const { data } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body, enabled")
      .eq("slug", `${SIGNUP_SLUG_PREFIX}${lang}`)
      .maybeSingle();
    if (data?.enabled !== false) {
      subject = data?.subject || subject;
      body = data?.body || body;
    }
  } catch {
    /* mantém o texto padrão */
  }

  let brandFooter: string | undefined;
  try {
    const { getEmailBrandFooter } = await import("@/lib/email-brand.server");
    brandFooter = await getEmailBrandFooter();
  } catch {
    brandFooter = undefined;
  }

  const vars = { email, link: confirmationUrl };
  return {
    subject: fill(subject, vars),
    body: fill(body, vars),
    buttonLabel: fallback.button,
    htmlLang: fallback.lang,
    brandFooter,
  };
}
