import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMPTY_ONBOARDING, type OnboardingData } from "./onboarding-fields";

const SITE = "https://liberatoconsulting.com.br";

const str = (max: number) => z.string().trim().max(max).default("");
const list = (max: number, len: number) => z.array(z.string().trim().max(len)).max(max).default([]);
const logos = (max: number) =>
  z.array(z.object({ name: str(160), url: z.string().max(1_500_000) })).max(max).default([]);

const dataSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  photo_url: z.string().max(2_000_000).default(""),
  headline: str(300),
  education: str(4000),
  experience: str(6000),
  clients: str(4000),
  works: str(6000),
  specialties: list(60, 160),
  segments: list(40, 120),
  years_experience: z.number().int().min(0).max(80).default(0),
  certifications: list(40, 200),
  highlights: list(12, 400),
  academic_logos: logos(12),
  client_logos: logos(24),
  orcid_url: str(300),
  lattes_url: str(300),
  website_url: str(300),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(8).max(40),
  birth_date: str(20),
  cpf: z.string().trim().min(11).max(20),
  rg: str(30),
  nationality: str(60),
  marital_status: str(40),
  address_street: str(160),
  address_number: str(20),
  address_complement: str(80),
  address_district: str(80),
  address_city: str(80),
  address_state: str(40),
  address_zip: str(20),
  address_country: str(60),
  bank_name: str(80),
  bank_branch: str(20),
  bank_account: str(30),
  pix_key: str(140),
});

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

async function loadTemplate(slug: string, fallbackSubject: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("email_templates")
    .select("subject, body, enabled")
    .eq("slug", slug)
    .maybeSingle();
  return { subject: data?.subject || fallbackSubject, body: data?.body || "", enabled: data?.enabled ?? true };
}

async function admin(context: any) {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Aprova a candidatura e envia o link único de cadastro ao candidato. */
export const sendOnboardingInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ application_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { data: app } = await sb
      .from("job_applications")
      .select("id, full_name, email, phone")
      .eq("id", data.application_id)
      .maybeSingle();
    if (!app) return { ok: false as const, error: "Candidatura não encontrada." };

    const { data: existing } = await sb
      .from("consultant_onboarding")
      .select("id, token, status")
      .eq("application_id", app.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing && existing.status !== "sent") {
      return { ok: false as const, error: "O candidato já enviou o cadastro." };
    }
    let row = existing;
    const expires = new Date(Date.now() + 30 * 86400_000).toISOString();
    if (row) {
      await sb.from("consultant_onboarding").update({ expires_at: expires }).eq("id", row.id);
    } else {
      const ins = await sb
        .from("consultant_onboarding")
        .insert({ application_id: app.id, full_name: app.full_name, email: app.email, phone: app.phone ?? "", expires_at: expires })
        .select("id, token, status")
        .single();
      if (ins.error) return { ok: false as const, error: ins.error.message };
      row = ins.data;
    }

    const tpl = await loadTemplate("consultant_approval", "{{nome}}, sua candidatura foi aprovada — Liberato Consulting");
    if (!tpl.enabled) return { ok: false as const, error: "O e-mail de aprovação está desativado em E-mails automáticos." };
    const link = `${SITE}/novoconsultor?c=${row.token}`;
    const vars = { nome: String(app.full_name).split(" ")[0] ?? "", link };
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const sent = await sendTemplateEmail("consultant-notice", app.email, {
      templateData: {
        subject: fill(tpl.subject, vars),
        body: fill(tpl.body, vars),
        buttons: [{ label: "Preencher meu cadastro", href: link }],
      },
      idempotencyKey: `consultant-approval-${row.id}-${Date.now()}`,
    });
    if (!sent.sent) return { ok: false as const, error: "O endereço de e-mail do candidato está bloqueado para envios." };
    await sb.from("consultant_onboarding").update({ sent_at: new Date().toISOString() }).eq("id", row.id);
    return { ok: true as const, link };
  });

/** Dados iniciais do convite (página pública /novoconsultor). */
export const getOnboardingByToken = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await (supabaseAdmin as any)
      .from("consultant_onboarding")
      .select("full_name, email, phone, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!row) return { ok: false as const, reason: "invalid" as const };
    if (row.status !== "sent") return { ok: false as const, reason: "used" as const };
    if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false as const, reason: "expired" as const };
    return { ok: true as const, full_name: row.full_name as string, email: row.email as string, phone: row.phone as string };
  });

/** Envio público do cadastro pelo candidato aprovado. */
export const submitOnboarding = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid(), data: dataSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: row } = await sb
      .from("consultant_onboarding")
      .select("id, status, expires_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!row || row.status !== "sent" || new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "Este link não é mais válido." };
    }
    const { error } = await sb
      .from("consultant_onboarding")
      .update({
        payload: data.data,
        full_name: data.data.full_name,
        email: data.data.email,
        phone: data.data.phone,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("status", "sent");
    if (error) return { ok: false as const, error: "Não foi possível salvar agora. Tente novamente." };
    return { ok: true as const };
  });

export type OnboardingRow = {
  id: string;
  application_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  sent_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  expires_at: string;
  review_note: string;
  payload: OnboardingData;
  user_id: string | null;
  consultant_id: string | null;
};

export const listOnboardings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin(context);
    const { data, error } = await sb
      .from("consultant_onboarding")
      .select("id, application_id, full_name, email, phone, status, sent_at, submitted_at, approved_at, expires_at, review_note, payload, user_id, consultant_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return ((data ?? []) as OnboardingRow[]).map((r) => ({ ...r, payload: { ...EMPTY_ONBOARDING, ...(r.payload ?? {}) } }));
  });

/** Edição do cadastro pelo administrador antes da aprovação. */
export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), data: dataSchema, review_note: str(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { error } = await sb
      .from("consultant_onboarding")
      .update({ payload: data.data, full_name: data.data.full_name, email: data.data.email, phone: data.data.phone, review_note: data.review_note })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const rejectOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), review_note: str(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { error } = await sb.from("consultant_onboarding").update({ status: "rejected", review_note: data.review_note }).eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/**
 * Aprova o cadastro: cria o consultor (não publicado), o acesso ao painel com
 * papel Consultor (bloqueado até o contrato assinado) e envia o contrato.
 */
export const approveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), data: dataSchema, review_note: str(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { data: row } = await sb.from("consultant_onboarding").select("id, status, user_id, consultant_id").eq("id", data.id).maybeSingle();
    if (!row) return { ok: false as const, error: "Cadastro não encontrado." };
    if (row.status === "approved") return { ok: false as const, error: "Este cadastro já foi aprovado." };
    const d = data.data;

    // 1. Perfil de consultor (fica oculto no site até a publicação pelo administrador).
    const consultantRow = {
      full_name: d.full_name,
      photo_url: d.photo_url,
      headline: d.headline,
      education: d.education,
      experience: d.experience,
      clients: d.clients,
      works: d.works,
      specialties: d.specialties,
      segments: d.segments,
      years_experience: d.years_experience,
      certifications: d.certifications,
      highlights: d.highlights,
      academic_logos: d.academic_logos,
      client_logos: d.client_logos,
      orcid_url: d.orcid_url,
      lattes_url: d.lattes_url,
      website_url: d.website_url,
      contact_email: d.email,
      published: false,
    };
    let consultantId = row.consultant_id as string | null;
    if (consultantId) {
      await sb.from("consultants").update(consultantRow).eq("id", consultantId);
    } else {
      const ins = await sb.from("consultants").insert(consultantRow).select("id").single();
      if (ins.error) return { ok: false as const, error: `Consultor: ${ins.error.message}` };
      consultantId = ins.data.id;
    }

    // 2. Acesso ao painel, bloqueado até o contrato assinado ser recebido.
    let userId = row.user_id as string | null;
    if (!userId) {
      const password = `${crypto.randomUUID()}Aa1!`;
      const created = await sb.auth.admin.createUser({
        email: d.email,
        password,
        email_confirm: true,
        ban_duration: "876000h",
      });
      if (created.error || !created.data.user) {
        return { ok: false as const, error: `Acesso: ${created.error?.message ?? "falha ao criar usuário"}` };
      }
      userId = created.data.user.id as string;
      await sb.from("user_roles").insert({ user_id: userId, role: "consultor" });
    }
    const { full_name, email, phone, birth_date, cpf, rg, nationality, marital_status } = d;
    const profile = {
      user_id: userId,
      full_name, email, phone, cpf, rg, nationality, marital_status,
      birth_date: birth_date || null,
      address_street: d.address_street,
      address_number: d.address_number,
      address_complement: d.address_complement,
      address_district: d.address_district,
      address_city: d.address_city,
      address_state: d.address_state,
      address_zip: d.address_zip,
      address_country: d.address_country,
      bank_name: d.bank_name,
      bank_branch: d.bank_branch,
      bank_account: d.bank_account,
      pix_key: d.pix_key,
    };
    const prof = await sb.from("profiles").upsert(profile, { onConflict: "user_id" });
    if (prof.error) return { ok: false as const, error: `Dados pessoais: ${prof.error.message}` };

    await sb
      .from("consultant_onboarding")
      .update({ payload: d, full_name, email, phone, review_note: data.review_note, consultant_id: consultantId, user_id: userId })
      .eq("id", data.id);

    // 3. Contrato preenchido com os dados aprovados, em PDF.
    const { data: tpl } = await sb
      .from("contract_templates")
      .select("title, body, version")
      .eq("audience", "consultor")
      .eq("active", true)
      .maybeSingle();
    if (!tpl) return { ok: false as const, error: "Cadastro aprovado, mas não há contrato de Consultor ativo em Dados da consultoria." };
    const { buildContractVars } = await import("./contract-fill.server");
    const { fillContract } = await import("./contract-fill");
    const filled = fillContract(String(tpl.body), await buildContractVars({ userId }));

    const { loadCompanyFooter } = await import("./company-footer.server");
    const company = await loadCompanyFooter(SITE);
    const { buildBrandedPdf } = await import("./pdf.server");
    const pdf = await buildBrandedPdf({
      title: `${tpl.title} (versão ${tpl.version})`,
      subtitle: full_name,
      body: filled,
      contact: {
        name: company.name || "Liberato Consulting",
        line1: company.email || "contato@liberatoconsulting.com.br",
        line2: company.cnpj ? `CNPJ ${company.cnpj}` : "Consultoria em gestão empresarial",
        website: SITE.replace("https://", "www."),
      },
    });
    const path = `onboarding/${data.id}/contrato-consultor.pdf`;
    const up = await sb.storage.from("contracts").upload(path, pdf, { upsert: true, contentType: "application/pdf" });
    if (up.error) return { ok: false as const, error: `Contrato: ${up.error.message}` };
    const signed = await sb.storage.from("contracts").createSignedUrl(path, 30 * 86400, { download: "Contrato-Consultor-Liberato.pdf" });

    const etpl = await loadTemplate("consultant_contract", "{{nome}}, seu contrato de consultor — Liberato Consulting");
    let warning = "";
    if (etpl.enabled) {
      const vars = { nome: full_name.split(" ")[0] ?? "", link: signed.data?.signedUrl ?? "" };
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const sent = await sendTemplateEmail("consultant-notice", email, {
        templateData: {
          subject: fill(etpl.subject, vars),
          body: fill(etpl.body, vars),
          buttons: [
            { label: "Baixar contrato em PDF", href: signed.data?.signedUrl ?? "" },
            { label: "Acessar o painel", href: `${SITE}/admin/login` },
          ],
          appendix: `${tpl.title} (versão ${tpl.version})\n\n${filled}`,
        },
        idempotencyKey: `consultant-contract-${data.id}-${Date.now()}`,
      });
      if (!sent.sent) warning = "O e-mail do consultor está bloqueado para envios.";
    } else warning = "O e-mail de contrato está desativado em E-mails automáticos.";

    const now = new Date().toISOString();
    await sb.from("consultant_onboarding").update({ status: "approved", approved_at: now, contract_path: path }).eq("id", data.id);
    await sb.from("profiles").update({ contract_sent_at: now }).eq("user_id", userId);
    return { ok: true as const, warning };
  });
