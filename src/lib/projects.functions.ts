import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Etapa 1 — Escopo Inicial                                            */
/* ------------------------------------------------------------------ */

const scopeSchema = z.object({
  company: z.string().trim().min(2).max(160),
  respondent_name: z.string().trim().min(2).max(160),
  respondent_role: z.string().trim().max(160).default(""),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).default(""),
  answers: z.record(z.string().max(20), z.string().max(300)),
  comments: z.record(z.string().max(20), z.string().max(2000)),
  lang: z.string().trim().max(5).default("pt"),
});

export type ScopeSubmission = {
  id: string;
  company: string;
  respondent_name: string;
  respondent_role: string;
  email: string;
  phone: string;
  answers: Record<string, string>;
  comments: Record<string, string>;
  notes: string;
  created_at: string;
};

/** Envio público do formulário de escopo inicial (link enviado a clientes). */
export const submitScopeForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("project_scope_submissions").insert({
      company: data.company,
      respondent_name: data.respondent_name,
      respondent_role: data.respondent_role,
      email: data.email,
      phone: data.phone,
      answers: data.answers as never,
      comments: data.comments as never,
      lang: data.lang,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Lista os escopos recebidos (painel). */
export const listScopeSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("project_scope_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as ScopeSubmission[];
  });

/** Anotações internas do consultor sobre um escopo recebido. */
export const saveScopeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), notes: z.string().max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("project_scope_submissions")
      .update({ notes: data.notes })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteScopeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("project_scope_submissions")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Etapa 2 — Diagnóstico Detalhado                                     */
/* ------------------------------------------------------------------ */

const diagnosticSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200).default(""),
  client_name: z.string().trim().max(200).default(""),
  service_slug: z.string().trim().max(120).default(""),
  service_title: z.string().trim().max(200).default(""),
  scope_submission_id: z.string().uuid().nullable().default(null),
  answers: z.record(z.string().max(30), z.string().max(4000)),
  consultant_notes: z.record(z.string().max(30), z.string().max(4000)),
  scores: z.record(z.string().max(30), z.number().min(0).max(5)),
  modules: z.array(z.record(z.string().max(30), z.union([z.string().max(600), z.number(), z.boolean()]))).max(60),
  budget: z.record(z.string().max(30), z.number()),
});

export type DiagnosticRow = {
  id: string;
  title: string;
  client_name: string;
  service_slug: string;
  service_title: string;
  scope_submission_id: string | null;
  answers: Record<string, string>;
  consultant_notes: Record<string, string>;
  scores: Record<string, number>;
  modules: Array<Record<string, string | number | boolean>>;
  budget: Record<string, number>;
  created_at: string;
  updated_at: string;
};

export const listDiagnostics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("project_diagnostics")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as DiagnosticRow[];
  });

export const saveDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => diagnosticSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const payload = {
      title: data.title,
      client_name: data.client_name,
      service_slug: data.service_slug,
      service_title: data.service_title,
      scope_submission_id: data.scope_submission_id,
      answers: data.answers as never,
      consultant_notes: data.consultant_notes as never,
      scores: data.scores as never,
      modules: data.modules as never,
      budget: data.budget as never,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("project_diagnostics")
        .update(payload)
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("project_diagnostics")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: (row as { id: string }).id };
  });

export const deleteDiagnostic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase.from("project_diagnostics").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Contadores mostrados na trilha de etapas. */
export const getProjectsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const [scopes, diags, quotes, pres] = await Promise.all([
      context.supabase.from("project_scope_submissions").select("id", { count: "exact", head: true }),
      context.supabase.from("project_diagnostics").select("id", { count: "exact", head: true }),
      context.supabase.from("quotes").select("id", { count: "exact", head: true }),
      (context.supabase as any).from("project_presentations").select("id", { count: "exact", head: true }),
    ]);
    return {
      scopes: scopes.count ?? 0,
      diagnostics: diags.count ?? 0,
      quotes: quotes.count ?? 0,
      presentations: (pres.count as number | null) ?? 0,
    };
  });

/* ------------------------------------------------------------------ */
/* Lista única de clientes (CRM + escopos + diagnósticos identificados) */
/* ------------------------------------------------------------------ */

export type ProjectClient = {
  key: string;
  name: string;
  source: "crm" | "scope" | "diag";
  label: string;
  crmId?: string;
  sector: string;
  location: string;
  website: string;
  size?: string;
  country?: string;
};

export const listProjectClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const sb = context.supabase as any;
    const [crm, scopes, diags] = await Promise.all([
      sb.from("crm_companies").select("id, name, trade_name, segment, city, state, website, size, country").order("name").limit(2000),
      sb.from("project_scope_submissions").select("id, company, created_at").order("created_at", { ascending: false }).limit(500),
      sb.from("project_diagnostics").select("id, client_name, service_title, updated_at").order("updated_at", { ascending: false }).limit(500),
    ]);
    return buildProjectClients(crm.data ?? [], scopes.data ?? [], diags.data ?? []);
  });

export function buildProjectClients(crm: any[], scopes: any[], diags: any[]): ProjectClient[] {
  const clean = (v: unknown) => String(v ?? "").trim();
  const out: ProjectClient[] = [];
  for (const c of crm) {
    const name = clean(c.trade_name) || clean(c.name);
    if (!name) continue;
    out.push({ key: `crm:${c.id}`, name, source: "crm", label: `${name} · CRM`, crmId: c.id, sector: clean(c.segment), location: [c.city, c.state].map(clean).filter(Boolean).join(" / "), website: clean(c.website), size: c.size, country: c.country });
  }
  for (const s of scopes) {
    const name = clean(s.company);
    if (!name) continue;
    out.push({ key: `scope:${s.id}`, name, source: "scope", label: `${name} · Escopo inicial (${new Date(s.created_at).toLocaleDateString("pt-BR")})`, sector: "", location: "", website: "" });
  }
  for (const g of diags) {
    const name = clean(g.client_name);
    if (!name) continue;
    out.push({ key: `diag:${g.id}`, name, source: "diag", label: `${name} · Diagnóstico${g.service_title ? ` (${g.service_title})` : ""}`, sector: "", location: "", website: "" });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
