import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Gestão unificada de pessoas (somente administradores) e consentimento LGPD.
 * Serviços incluídos pelo administrador ficam "pendentes" até o próprio usuário
 * aprovar pelo link enviado por e-mail/WhatsApp; só então os envios começam.
 */

export const SERVICE_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  bulletin: "Boletim Semanal",
};

const emailSchema = z.string().trim().toLowerCase().email().max(255);

async function admin(context: any) {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

/** Todos os dados que a pessoa cadastrou em qualquer formulário do site. */
export const getPersonDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: emailSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const e = data.email;
    const q = (t: string, cols = "*") => db.from(t).select(cols).ilike("email", e);
    const [nl, bl, tools, scopes, leads, apps, consents, profiles] = await Promise.all([
      q("newsletter_subscribers"),
      q("bulletin_subscribers"),
      q("tool_user_profiles"),
      q("project_scope_submissions", "id, company, respondent_name, respondent_role, phone, employees, answers, created_at"),
      q("leads"),
      q("job_applications", "id, full_name, phone, interest_area, linkedin_url, email_opt_in, created_at"),
      db.from("service_consents").select("*").ilike("email", e).order("created_at", { ascending: false }),
      q("profiles", "user_id, full_name, phone, active, email_opt_in"),
    ]);
    return {
      newsletter: nl.data ?? [],
      bulletin: bl.data ?? [],
      tools: tools.data ?? [],
      scopes: scopes.data ?? [],
      leads: leads.data ?? [],
      applications: apps.data ?? [],
      consents: consents.data ?? [],
      team: profiles.data ?? [],
    };
  });

async function sendInvite(c: any) {
  const { siteOrigin, sendBulletinEmail, sendWhatsAppMessage } = await import("./bulletin.server");
  const url = `${siteOrigin()}/autorizar/${c.token}`;
  const label = SERVICE_LABEL[c.service] ?? c.service;
  const name = c.full_name || "";
  const text = `Olá${name ? `, ${name}` : ""}! A Liberato Consulting gostaria de enviar a você o ${label}. Para respeitar a LGPD, só enviaremos após sua autorização. Para aprovar, acesse: ${url} — Se não deseja receber, basta ignorar esta mensagem.`;
  let emailStatus = "";
  let waStatus = "";
  if (c.via_email && c.email) {
    try {
      const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.6;max-width:560px">
<p>Olá${name ? `, ${escape(name)}` : ""}!</p>
<p>A <strong>Liberato Consulting</strong> gostaria de enviar a você o <strong>${label}</strong>.</p>
<p>Para respeitar a LGPD, só começaremos os envios depois da sua autorização.</p>
<p><a href="${url}" style="display:inline-block;background:#c2410c;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Autorizar recebimento</a></p>
<p style="font-size:13px;color:#6b7280">Ou copie o link: <a href="${url}">${url}</a><br/>Se não deseja receber, basta ignorar este e-mail.</p></div>`;
      await sendBulletinEmail({
        to: c.email,
        subject: `Autorize o recebimento do ${label} — Liberato Consulting`,
        html,
        text,
        idempotencyKey: `consent-${c.id}`,
      });
      emailStatus = "sent";
    } catch (err) {
      console.error("[consent email]", err);
      emailStatus = "failed";
    }
  }
  if (c.via_whatsapp && c.phone) {
    try {
      await sendWhatsAppMessage({ to: c.phone, caption: text });
      waStatus = "sent";
    } catch (err) {
      console.error("[consent whatsapp]", err);
      waStatus = "failed";
    }
  }
  return { emailStatus, waStatus };
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

/** Administrador inclui a pessoa num serviço: cria pedido pendente e envia o link de aprovação. */
export const inviteToService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        service: z.enum(["newsletter", "bulletin"]),
        email: emailSchema,
        full_name: z.string().trim().max(160).default(""),
        phone: z.string().trim().max(40).default(""),
        company: z.string().trim().max(160).default(""),
        segment: z.string().trim().max(140).default(""),
        via_email: z.boolean(),
        via_whatsapp: z.boolean(),
      })
      .refine((v) => v.via_email || v.via_whatsapp, "Escolha ao menos um canal.")
      .refine((v) => !v.via_whatsapp || v.phone.replace(/\D/g, "").length >= 10, "Informe o WhatsApp.")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { displayName } = await import("./access.server");
    // Cancela pedidos pendentes anteriores do mesmo serviço para não haver dois links válidos.
    await db
      .from("service_consents")
      .update({ status: "superseded" })
      .ilike("email", data.email)
      .eq("service", data.service)
      .eq("status", "pending");
    const { data: row, error } = await db
      .from("service_consents")
      .insert({ ...data, invited_by: context.userId, invited_by_name: await displayName(context) })
      .select("*")
      .single();
    if (error) return { ok: false as const, error: "Não foi possível registrar o pedido." };
    const st = await sendInvite(row);
    await db
      .from("service_consents")
      .update({ invite_email_status: st.emailStatus, invite_whatsapp_status: st.waStatus })
      .eq("id", row.id);
    return { ok: true as const, ...st };
  });

export const resendConsentInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { data: row } = await db.from("service_consents").select("*").eq("id", data.id).maybeSingle();
    if (!row || row.status !== "pending") return { ok: false as const, error: "Pedido não está pendente." };
    const st = await sendInvite(row);
    await db
      .from("service_consents")
      .update({ invite_email_status: st.emailStatus, invite_whatsapp_status: st.waStatus, invited_at: new Date().toISOString() })
      .eq("id", row.id);
    return { ok: true as const, ...st };
  });

/** Remove a pessoa de um serviço (exclui a inscrição e cancela pedidos pendentes). */
export const removeFromService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: emailSchema, service: z.enum(["newsletter", "bulletin"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const table = data.service === "newsletter" ? "newsletter_subscribers" : "bulletin_subscribers";
    await db.from(table).delete().ilike("email", data.email);
    await db
      .from("service_consents")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .ilike("email", data.email)
      .eq("service", data.service)
      .in("status", ["pending", "approved"]);
    return { ok: true as const };
  });

/** Exclui a pessoa de todos os cadastros públicos. Membros da equipe devem ser removidos na aba Equipe. */
export const deletePerson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: emailSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const db = await admin(context);
    const { data: team } = await db.from("profiles").select("user_id").ilike("email", data.email);
    if (team && team.length) {
      return { ok: false as const, error: "Esta pessoa tem acesso ao painel. Remova-a primeiro na aba Equipe com acesso." };
    }
    for (const t of [
      "newsletter_subscribers",
      "bulletin_subscribers",
      "tool_user_profiles",
      "project_scope_submissions",
      "leads",
      "job_applications",
    ]) {
      const { error } = await db.from(t).delete().ilike("email", data.email);
      if (error) console.error("[deletePerson]", t, error);
    }
    // O histórico de consentimento é mantido como prova (LGPD), marcado como revogado.
    await db
      .from("service_consents")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .ilike("email", data.email)
      .in("status", ["pending", "approved"]);
    return { ok: true as const };
  });

/* ----------------------------- Público ----------------------------- */

export const getConsentRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await (supabaseAdmin as any)
      .from("service_consents")
      .select("service, full_name, status, approved_at")
      .eq("token", data.token)
      .maybeSingle();
    if (!row) return null;
    return {
      service: SERVICE_LABEL[row.service] ?? row.service,
      name: String(row.full_name || "").split(" ")[0] ?? "",
      status: row.status as string,
      approved_at: row.approved_at as string | null,
    };
  });

export const approveConsent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: c } = await db.from("service_consents").select("*").eq("token", data.token).maybeSingle();
    if (!c) return { ok: false as const, error: "Link inválido." };
    if (c.status === "approved") return { ok: true as const };
    if (c.status !== "pending") return { ok: false as const, error: "Este link não é mais válido." };
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      (getRequestHeader("x-forwarded-for") || "").split(",")[0]?.trim() ||
      getRequestHeader("x-real-ip") ||
      "";
    const ua = (getRequestHeader("user-agent") || "").slice(0, 500);
    const now = new Date().toISOString();
    if (c.service === "newsletter") {
      const { error } = await db.from("newsletter_subscribers").upsert(
        {
          email: c.email,
          name: c.full_name,
          whatsapp: c.phone,
          via_whatsapp: c.via_whatsapp,
          source_path: "admin_invite",
          status: "active",
        },
        { onConflict: "email" },
      );
      if (error) return { ok: false as const, error: "Não foi possível concluir agora." };
    } else {
      const row = {
        full_name: c.full_name,
        company: c.company,
        segment: c.segment,
        email: c.email,
        whatsapp: c.phone,
        via_email: c.via_email,
        via_whatsapp: c.via_whatsapp,
        language: "pt",
        source_path: "admin_invite",
        status: "active",
        unsubscribed_at: null,
      };
      const { data: ex } = await db.from("bulletin_subscribers").select("id").ilike("email", c.email).maybeSingle();
      const { error } = ex
        ? await db.from("bulletin_subscribers").update(row).eq("id", ex.id)
        : await db.from("bulletin_subscribers").insert(row);
      if (error) return { ok: false as const, error: "Não foi possível concluir agora." };
    }
    await db
      .from("service_consents")
      .update({ status: "approved", approved_at: now, approved_ip: ip, approved_user_agent: ua })
      .eq("id", c.id);
    return { ok: true as const };
  });
