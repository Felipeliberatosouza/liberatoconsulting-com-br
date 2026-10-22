import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SCOPE_LINK, surveyLink, type SurveyRow } from "./satisfaction";

const submitSchema = z.object({
  kind: z.enum(["executado", "nao_executado"]),
  company: z.string().trim().min(2).max(160),
  respondent_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(180),
  service: z.string().trim().max(200).default(""),
  score1: z.number().int().min(0).max(10),
  score2: z.number().int().min(0).max(10).nullable(),
  score3: z.number().int().min(0).max(10),
  reason: z.string().trim().max(600).default(""),
  comment: z.string().trim().max(2000).default(""),
  lang: z.string().trim().max(5).default("pt"),
  website: z.string().max(200).optional().default(""),
  elapsedMs: z.number().int().min(0).optional(),
});

/** Envio público da pesquisa de satisfação. */
export const submitSatisfaction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website.trim() !== "") return { ok: true as const };
    if (data.elapsedMs !== undefined && data.elapsedMs < 2000) return { ok: false as const };
    if (data.kind === "executado" && data.score2 == null) return { ok: false as const };
    if (data.kind === "nao_executado" && !data.reason) return { ok: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await supabaseAdmin
      .from("project_satisfaction_surveys")
      .select("id", { count: "exact", head: true })
      .ilike("email", data.email)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) return { ok: false as const };
    const { website: _w, elapsedMs: _e, ...row } = data;
    const { error } = await supabaseAdmin.from("project_satisfaction_surveys").insert(row);
    if (error) {
      console.error("[satisfaction] insert failed", error);
      return { ok: false as const };
    }
    return { ok: true as const };
  });

export const listSatisfaction = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("project_satisfaction_surveys")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return (data ?? []) as SurveyRow[];
  });

export const deleteSatisfaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase.from("project_satisfaction_surveys").delete().eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export type RecipientSource = "crm" | "escopo" | "diagnostico" | "site";

/**
 * Todos os clientes com quem houve contato (CRM, Escopo Inicial, Diagnóstico,
 * formulários do site/WhatsApp), com e-mail. Candidatos do "Trabalhe conosco"
 * são sempre excluídos.
 */
export const listLinkRecipients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const sb = context.supabase;
    const [companies, contacts, scopes, diags, leads, apps] = await Promise.all([
      sb.from("crm_companies").select("id, name, trade_name, email").order("name"),
      sb.from("crm_contacts").select("id, company_id, full_name, email, role_title, active"),
      sb.from("project_scope_submissions").select("id, company, respondent_name, respondent_role, email").limit(1000),
      sb.from("project_diagnostics").select("id, client_name, scope_submission_id").limit(1000),
      import("@/integrations/supabase/client.server").then(({ supabaseAdmin }) =>
        supabaseAdmin.from("leads").select("id, name, company, email").not("email", "is", null).limit(2000),
      ),
      sb.from("job_applications").select("email").limit(5000),
    ]);
    const blocked = new Set(((apps.data ?? []) as any[]).map((a) => String(a.email ?? "").trim().toLowerCase()).filter(Boolean));
    type Contact = { name: string; email: string; role: string };
    type Group = { id: string; name: string; source: RecipientSource; contacts: Contact[] };
    const groups: Group[] = [];
    const add = (g: Group, c: Contact) => {
      const e = c.email.trim().toLowerCase();
      if (!e.includes("@") || blocked.has(e)) return;
      if (!g.contacts.some((x) => x.email.toLowerCase() === e)) g.contacts.push({ ...c, email: c.email.trim() });
    };

    const people = (contacts.data ?? []) as any[];
    for (const c of (companies.data ?? []) as any[]) {
      const g: Group = { id: `crm:${c.id}`, name: (c.trade_name || c.name) as string, source: "crm", contacts: [] };
      for (const p of people.filter((p) => p.company_id === c.id && p.email && p.active !== false))
        add(g, { name: p.full_name ?? "", email: p.email, role: p.role_title ?? "" });
      if (c.email) add(g, { name: g.name, email: c.email, role: "E-mail da empresa" });
      groups.push(g);
    }

    const scopeRows = (scopes.data ?? []) as any[];
    const byKey = new Map<string, Group>();
    const grouped = (source: RecipientSource, name: string) => {
      const key = `${source}:${name.trim().toLowerCase() || "sem-empresa"}`;
      let g = byKey.get(key);
      if (!g) {
        g = { id: key, name: name.trim() || "(sem empresa)", source, contacts: [] };
        byKey.set(key, g);
        groups.push(g);
      }
      return g;
    };
    for (const s of scopeRows) {
      if (s.email) add(grouped("escopo", s.company ?? ""), { name: s.respondent_name ?? "", email: s.email, role: s.respondent_role ?? "" });
    }
    const scopeById = new Map(scopeRows.map((s) => [s.id, s]));
    for (const d of (diags.data ?? []) as any[]) {
      const s = d.scope_submission_id ? scopeById.get(d.scope_submission_id) : null;
      if (s?.email) add(grouped("diagnostico", d.client_name || s.company || ""), { name: s.respondent_name ?? "", email: s.email, role: s.respondent_role ?? "" });
    }
    for (const l of (leads.data ?? []) as any[]) {
      if (l.email) add(grouped("site", l.company ?? ""), { name: l.name ?? "", email: l.email, role: "Formulário / WhatsApp" });
    }
    return groups.filter((g) => g.contacts.length > 0).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

const sendSchema = z.object({
  form: z.enum(["escopo", "executado", "nao_executado"]),
  company: z.string().trim().max(160).default(""),
  recipients: z.array(z.object({ name: z.string().trim().max(160), email: z.string().trim().email().max(180) })).min(1).max(50),
});

/** Envia o link do formulário (Escopo ou Satisfação) por e-mail a cada contato escolhido. */
export const sendFormLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slug = data.form === "escopo" ? "scope_invite" : "satisfaction_invite";
    const { data: tpl } = await supabaseAdmin
      .from("email_templates")
      .select("subject, body, enabled")
      .eq("slug", slug)
      .maybeSingle();
    if (tpl && !tpl.enabled) return { ok: false as const, error: "Este e-mail está desativado em E-mails automáticos.", sent: 0, failed: 0 };
    const link = data.form === "escopo" ? SCOPE_LINK : surveyLink(data.form);
    const subjectDefault = data.form === "escopo" ? "Escopo Inicial — Liberato Consulting" : "Pesquisa de satisfação — Liberato Consulting";
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    const { logDeliveries } = await import("./delivery-log.server");

    const seen = new Set<string>();
    let sent = 0;
    let failed = 0;
    const log: Parameters<typeof logDeliveries>[0] = [];
    for (const r of data.recipients) {
      const key = r.email.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const nome = r.name.split(" ")[0] || r.name || "";
      const fill = (s: string) =>
        s.replaceAll("{{nome}}", nome).replaceAll("{{empresa}}", data.company || "sua empresa").replaceAll("{{link}}", link);
      const subject = fill(tpl?.subject ?? subjectDefault);
      try {
        const res = await sendTemplateEmail("consultant-notice", r.email, {
          templateData: {
            subject,
            body: fill(tpl?.body ?? `Olá, {{nome}}! Acesse: {{link}}`),
            buttons: [{ label: data.form === "escopo" ? "Responder Escopo Inicial" : "Responder pesquisa", href: link }],
          },
          idempotencyKey: `${slug}-${key}-${Date.now()}`,
        });
        if (res.sent) sent += 1;
        else failed += 1;
        log.push({ source: slug, subject, recipient_name: r.name, recipient_email: r.email, channel: "email", status: res.sent ? "enviado" : "falhou", error: res.sent ? "" : "Destinatário bloqueado" });
      } catch (err) {
        failed += 1;
        log.push({ source: slug, subject, recipient_name: r.name, recipient_email: r.email, channel: "email", status: "falhou", error: err instanceof Error ? err.message : "Falha" });
      }
    }
    await logDeliveries(log);
    return { ok: true as const, sent, failed };
  });
