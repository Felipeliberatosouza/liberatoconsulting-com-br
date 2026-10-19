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

/** Contatos do CRM com e-mail, para escolher os destinatários do link. */
export const listLinkRecipients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const [companies, contacts] = await Promise.all([
      context.supabase.from("crm_companies").select("id, name, trade_name, email").order("name"),
      context.supabase.from("crm_contacts").select("id, company_id, full_name, email, role_title, active"),
    ]);
    const people = (contacts.data ?? []) as any[];
    return ((companies.data ?? []) as any[]).map((c) => {
      const list = people
        .filter((p) => p.company_id === c.id && p.email && p.active !== false)
        .map((p) => ({ name: p.full_name as string, email: p.email as string, role: (p.role_title ?? "") as string }));
      if (c.email && !list.some((p) => p.email.toLowerCase() === String(c.email).toLowerCase())) {
        list.push({ name: (c.trade_name || c.name) as string, email: c.email as string, role: "E-mail da empresa" });
      }
      return { id: c.id as string, name: (c.trade_name || c.name) as string, contacts: list };
    });
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
