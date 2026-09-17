/**
 * Onboarding de quem se cadastra para receber as ferramentas gratuitas:
 * e-mail de boas-vindas (modelo editável no painel), inscrição na Newsletter
 * e no Boletim Semanal e registro entre os leads recebidos pelos formulários.
 */

export type ToolsProfile = {
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  job_title: string;
  revenue_range: string;
  segment: string;
  state: string;
};

const WELCOME_SLUG = "tools_welcome";
/** Validade do link do material enviado no e-mail (7 dias). */
const LINK_TTL_SECONDS = 60 * 60 * 24 * 7;

function fill(text: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    text,
  );
}

export async function runToolsOnboarding(
  userId: string,
  email: string,
  profile: ToolsProfile,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const address = email.trim().toLowerCase();
  if (!address) return;

  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  await subscribeLists(supabaseAdmin, address, fullName, profile);
  await registerLead(supabaseAdmin, address, fullName, profile);
  await sendWelcome(supabaseAdmin, userId, address, fullName, profile);
}

async function subscribeLists(
  supabaseAdmin: any,
  email: string,
  fullName: string,
  profile: ToolsProfile,
) {
  try {
    await supabaseAdmin.from("newsletter_subscribers").upsert(
      {
        email,
        name: fullName,
        whatsapp: profile.phone,
        via_whatsapp: false,
        language: "pt",
        source_path: "/ferramentas",
        status: "active",
      },
      { onConflict: "email" },
    );
  } catch (error) {
    console.error("tools onboarding newsletter failed", error);
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from("bulletin_subscribers")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    const payload = {
      full_name: fullName,
      company: profile.company,
      segment: profile.segment,
      email,
      whatsapp: profile.phone,
      via_email: true,
      via_whatsapp: false,
      language: "pt",
      source_path: "/ferramentas",
      status: "active",
      unsubscribed_at: null,
    };
    if (existing) await supabaseAdmin.from("bulletin_subscribers").update(payload).eq("id", existing.id);
    else await supabaseAdmin.from("bulletin_subscribers").insert(payload);
  } catch (error) {
    console.error("tools onboarding bulletin failed", error);
  }
}

async function registerLead(
  supabaseAdmin: any,
  email: string,
  fullName: string,
  profile: ToolsProfile,
) {
  try {
    const { data: existing } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("service_slug", "ferramentas-gratuitas")
      .ilike("email", email)
      .maybeSingle();
    if (existing) return;
    await supabaseAdmin.from("leads").insert({
      name: fullName,
      company: profile.company,
      country: "Brasil",
      email,
      phone: profile.phone,
      service_slug: "ferramentas-gratuitas",
      service_title: "Ferramentas gratuitas de gestão",
      message: `Cargo: ${profile.job_title} · Faturamento: ${profile.revenue_range} · Segmento: ${profile.segment} · Estado: ${profile.state}`,
      language: "pt",
      source_path: "/ferramentas",
      email_opt_in: true,
    });
  } catch (error) {
    console.error("tools onboarding lead failed", error);
  }
}

async function sendWelcome(
  supabaseAdmin: any,
  userId: string,
  email: string,
  fullName: string,
  profile: ToolsProfile,
) {
  try {
    const { data: already } = await supabaseAdmin
      .from("tool_user_profiles")
      .select("welcome_sent_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (already?.welcome_sent_at) return;

    const { data: tpl } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body, enabled")
      .eq("slug", WELCOME_SLUG)
      .maybeSingle();
    if (tpl && !tpl.enabled) return;

    const { data: material } = await supabaseAdmin
      .from("management_tools")
      .select("title, file_path, file_name")
      .eq("welcome_attachment", true)
      .eq("published", true)
      .order("position")
      .limit(1)
      .maybeSingle();

    let link = "";
    if (material?.file_path) {
      const signed = await supabaseAdmin.storage
        .from("management-tools")
        .createSignedUrl(material.file_path, LINK_TTL_SECONDS, { download: material.file_name });
      link = signed.data?.signedUrl ?? "";
    }

    const vars = {
      nome: fullName.split(" ")[0] || fullName,
      empresa: profile.company,
      material: material?.title ?? "",
      link: link || "https://liberatoconsulting.com.br/ferramentas",
    };

    const subject = fill(
      tpl?.subject || "Bem-vindo(a) à biblioteca gratuita da Liberato Consulting, {{nome}}!",
      vars,
    );
    let body = fill(tpl?.body || "", vars);
    if (!material) {
      // Sem material marcado no painel, a frase do anexo é removida do texto.
      body = body
        .split(/\n{2,}/)
        .filter((p) => !/anexo/i.test(p))
        .join("\n\n");
    }

    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("tools-welcome", email, {
      templateData: { subject, body, material: material?.title ?? "", link },
      idempotencyKey: `tools-welcome-${userId}`,
    });

    await supabaseAdmin
      .from("tool_user_profiles")
      .update({ welcome_sent_at: new Date().toISOString() })
      .eq("user_id", userId);
  } catch (error) {
    console.error("tools welcome email failed", error);
  }
}
