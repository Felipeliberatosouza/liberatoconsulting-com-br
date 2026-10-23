import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { answerMissing, answerText, type ClientAnswer, type EditableQuestion } from "./diagnostic-form";

/* ------------------------------------------------------------------ */
/* Etapa 1 — Escopo Inicial                                            */
/* ------------------------------------------------------------------ */

const scopeSchema = z.object({
  company: z.string().trim().min(2).max(160),
  respondent_name: z.string().trim().min(2).max(160),
  respondent_role: z.string().trim().max(160).default(""),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).default(""),
  employees: z.string().trim().max(20).default(""),
  answers: z.record(z.string().max(20), z.string().max(300)),
  comments: z.record(z.string().max(20), z.string().max(2000)),
  lang: z.string().trim().max(5).default("pt"),
  // Anti-spam: campo oculto (robôs preenchem) e tempo de preenchimento.
  website: z.string().max(200).optional().default(""),
  elapsedMs: z.number().int().min(0).optional(),
});

export type ScopeSubmission = {
  id: string;
  company: string;
  respondent_name: string;
  respondent_role: string;
  email: string;
  phone: string;
  employees?: string;
  answers: Record<string, string>;
  comments: Record<string, string>;
  notes: string;
  created_at: string;
};

const SCOPE_MAX_PER_HOUR = 5;
const SCOPE_MIN_FILL_MS = 2000;

/** Envio público do formulário de escopo inicial (link enviado a clientes). */
export const submitScopeForm = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => scopeSchema.parse(input))
  .handler(async ({ data }) => {
    // Honeypot: responde como sucesso para não ensinar o robô.
    if (data.website && data.website.trim() !== "") return { ok: true as const };
    if (data.elapsedMs !== undefined && data.elapsedMs < SCOPE_MIN_FILL_MS) {
      return { ok: false as const, error: "Envio muito rápido. Revise as respostas e tente novamente." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("project_scope_submissions")
      .select("id", { count: "exact", head: true })
      .ilike("email", data.email)
      .gte("created_at", since);
    if ((count ?? 0) >= SCOPE_MAX_PER_HOUR) {
      return { ok: false as const, error: "Muitos envios em pouco tempo. Tente novamente mais tarde." };
    }
    const { error } = await supabaseAdmin.from("project_scope_submissions").insert({
      company: data.company,
      respondent_name: data.respondent_name,
      respondent_role: data.respondent_role,
      email: data.email,
      phone: data.phone,
      employees: data.employees,
      answers: data.answers as never,
      comments: data.comments as never,
      lang: data.lang,
    });
    if (error) {
      console.error("[scope] insert failed", error);
      return { ok: false as const, error: "Não foi possível enviar agora. Tente novamente." };
    }
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

const editableQuestionSchema = z.object({
  id: z.string().max(30),
  block: z.string().max(120),
  question: z.string().trim().min(3).max(600),
  purpose: z.string().max(600),
  options: z.array(z.string().trim().min(1).max(200)).max(20),
  multi: z.boolean(),
  required: z.boolean(),
});

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
  questions: z.array(editableQuestionSchema).max(120).default([]),
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
  questions: EditableQuestion[];
  public_token: string | null;
  public_slug: string | null;
  client_answers: Record<string, ClientAnswer>;
  client_respondent: Record<string, string>;
  client_submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Gera (ou reaproveita) o link público do diagnóstico para o cliente responder. */
export const createDiagnosticLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("project_diagnostics").select("public_slug, client_name").eq("id", data.id).single();
    if (error) return { ok: false as const, error: error.message };
    const r = row as { public_slug: string | null; client_name: string | null };
    let token = r.public_slug;
    // Link curto com o nome da empresa (ex.: /diagnostico/lhs); links antigos com código são trocados.
    if (!token) {
      const { shortSlug } = await import("./short-slug");
      const root = shortSlug(r.client_name ?? "", 1) || "cliente";
      token = root;
      for (let i = 2; i < 50; i++) {
        const { data: hit } = await context.supabase
          .from("project_diagnostics").select("id").eq("public_slug", token).maybeSingle();
        if (!hit || (hit as { id: string }).id === data.id) break;
        token = `${root}-${i}`;
      }
      const { error: e2 } = await context.supabase
        .from("project_diagnostics").update({ public_slug: token } as never).eq("id", data.id);
      if (e2) return { ok: false as const, error: e2.message };
    }
    return { ok: true as const, token };
  });

/** Leitura pública pelo link: só perguntas e identificação, nunca notas internas ou preço. */
export const getPublicDiagnostic = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().trim().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("project_diagnostics")
      .select("client_name, service_title, questions, client_submitted_at")
      .eq(/^[0-9a-f-]{36}$/i.test(data.token) ? "public_token" : "public_slug", data.token.toLowerCase())
      .maybeSingle();
    if (!row) return null;
    const r = row as unknown as { client_name: string; service_title: string; questions: EditableQuestion[]; client_submitted_at: string | null };
    return { client_name: r.client_name, service_title: r.service_title, questions: r.questions ?? [], submitted: !!r.client_submitted_at };
  });

export const submitPublicDiagnostic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      token: z.string().trim().min(1).max(80),
      respondent: z.object({
        name: z.string().trim().min(2).max(160),
        role: z.string().trim().max(160).default(""),
        email: z.string().trim().email().max(180),
      }),
      answers: z.record(z.string().max(30), z.object({ choices: z.array(z.string().max(200)).max(30), detail: z.string().max(4000) })),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("project_diagnostics").select("id, questions, answers").eq(/^[0-9a-f-]{36}$/i.test(data.token) ? "public_token" : "public_slug", data.token.toLowerCase()).maybeSingle();
    if (!row) return { ok: false as const, error: "Link inválido." };
    const r = row as unknown as { id: string; questions: EditableQuestion[]; answers: Record<string, string> };
    const missing = (r.questions ?? []).filter((q) => answerMissing(q, data.answers[q.id]));
    if (missing.length) return { ok: false as const, error: `Responda e explique: ${missing.map((q) => q.question).slice(0, 2).join(" / ")}` };
    const merged = { ...(r.answers ?? {}) };
    for (const q of r.questions ?? []) {
      const a = data.answers[q.id];
      if (a && (a.choices.length || a.detail.trim())) merged[q.id] = answerText(a);
    }
    const { error } = await supabaseAdmin.from("project_diagnostics").update({
      client_answers: data.answers,
      client_respondent: data.respondent,
      client_submitted_at: new Date().toISOString(),
      answers: merged,
    } as never).eq("id", r.id);
    if (error) return { ok: false as const, error: "Não foi possível salvar. Tente novamente." };
    return { ok: true as const };
  });

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
      questions: data.questions as never,
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
  label: string;
  crmId?: string;
  scopeId?: string;
  diagId?: string;
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [crm, scopes, diags, leads] = await Promise.all([
      sb.from("crm_companies").select("id, name, trade_name, segment, city, state, website, size, country").order("name").limit(2000),
      sb.from("project_scope_submissions").select("id, company, created_at").order("created_at", { ascending: false }).limit(500),
      sb.from("project_diagnostics").select("id, client_name, service_title, updated_at").order("updated_at", { ascending: false }).limit(500),
      supabaseAdmin.from("leads").select("company, country, email, phone, created_at").order("created_at", { ascending: false }).limit(1000),
    ]);
    return buildProjectClients(crm.data ?? [], scopes.data ?? [], diags.data ?? [], leads.data ?? []);
  });

/** Um cliente = uma opção: CRM, leads com contato, escopos e diagnósticos são agrupados pelo nome. */
export function buildProjectClients(crm: any[], scopes: any[], diags: any[], leads: any[] = []): ProjectClient[] {
  const clean = (v: unknown) => String(v ?? "").trim();
  const norm = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const map = new Map<string, ProjectClient>();
  const get = (name: string) => {
    const k = norm(name);
    if (!k || k === "sem empresa") return null;
    let c = map.get(k);
    if (!c) {
      c = { key: `client:${k}`, name, label: name, sector: "", location: "", website: "" };
      map.set(k, c);
    }
    return c;
  };
  for (const r of crm) {
    const c = get(clean(r.trade_name) || clean(r.name));
    if (!c) continue;
    c.crmId ??= r.id;
    c.sector ||= clean(r.segment);
    c.location ||= [r.city, r.state].map(clean).filter(Boolean).join(" / ");
    c.website ||= clean(r.website);
    c.size ||= r.size;
    c.country ||= r.country;
  }
  for (const l of leads) {
    if (!clean(l.email) && !clean(l.phone)) continue;
    const c = get(clean(l.company));
    if (c) c.country ||= l.country;
  }
  // Listas já vêm do mais recente para o mais antigo: o primeiro encontrado é o vigente.
  for (const s of scopes) {
    const c = get(clean(s.company));
    if (c) c.scopeId ??= s.id;
  }
  for (const g of diags) {
    const c = get(clean(g.client_name));
    if (c) c.diagId ??= g.id;
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
