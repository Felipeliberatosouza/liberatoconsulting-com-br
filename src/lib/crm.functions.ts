import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** CRM: empresas, pessoas, datas importantes, interações e histórico de navegação. */

const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(200),
  trade_name: z.string().trim().max(200).default(""),
  cnpj: z.string().trim().max(40).default(""),
  segment: z.string().trim().max(120).default(""),
  size: z.enum(["pme", "corporacao"]).default("pme"),
  status: z.enum(["lead", "prospect", "cliente", "inativo"]).default("lead"),
  country: z.string().trim().max(80).default("Brasil"),
  state: z.string().trim().max(80).default(""),
  city: z.string().trim().max(120).default(""),
  district: z.string().trim().max(160).default(""),
  zip: z.string().trim().max(20).default(""),
  address: z.string().trim().max(300).default(""),
  website: z.string().trim().max(200).default(""),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(60).default(""),
  founded_on: z.string().trim().max(10).nullable().default(null),
  employees: z.number().int().min(0).max(10_000_000).nullable().default(null),
  revenue_range: z.string().trim().max(120).default(""),
  owner_name: z.string().trim().max(160).default(""),
  tags: z.array(z.string().trim().max(40)).max(20).default([]),
  notes: z.string().trim().max(6000).default(""),
  birthday_email: z.boolean().default(true),
});

const contactSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  full_name: z.string().trim().min(2).max(200),
  role_title: z.string().trim().max(160).default(""),
  department: z.string().trim().max(160).default(""),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(60).default(""),
  whatsapp: z.string().trim().max(60).default(""),
  linkedin_url: z.string().trim().max(255).default(""),
  birth_date: z.string().trim().max(10).nullable().default(null),
  decision_maker: z.boolean().default(false),
  email_opt_in: z.boolean().default(true),
  birthday_email: z.boolean().default(true),
  language: z.string().trim().max(8).default("pt"),
  active: z.boolean().default(true),
  notes: z.string().trim().max(4000).default(""),
});

const dateSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().default(null),
  label: z.string().trim().min(2).max(160),
  event_date: z.string().trim().min(8).max(10),
  recurring: z.boolean().default(true),
  notify_email: z.boolean().default(false),
  notes: z.string().trim().max(2000).default(""),
});

const interactionSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().default(null),
  kind: z.enum(["reuniao", "ligacao", "email", "whatsapp", "proposta", "visita", "nota"]).default("nota"),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(6000).default(""),
  occurred_at: z.string().trim().min(4).max(40),
});

async function admin(context: { supabase: any; userId: string }) {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
}

export const listCrmCompanies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await admin(context);
    const [companies, contacts] = await Promise.all([
      context.supabase.from("crm_companies").select("*").order("name"),
      context.supabase.from("crm_contacts").select("id, company_id, full_name, role_title, email, birth_date"),
    ]);
    const list = (companies.data ?? []) as any[];
    const people = (contacts.data ?? []) as any[];
    return list.map((c) => ({
      ...c,
      contacts: people.filter((p) => p.company_id === c.id),
    }));
  });

export const getCrmCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await admin(context);
    const [company, contacts, dates, interactions] = await Promise.all([
      context.supabase.from("crm_companies").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("crm_contacts").select("*").eq("company_id", data.id).order("full_name"),
      context.supabase.from("crm_dates").select("*").eq("company_id", data.id).order("event_date"),
      context.supabase
        .from("crm_interactions")
        .select("*")
        .eq("company_id", data.id)
        .order("occurred_at", { ascending: false })
        .limit(200),
    ]);
    if (!company.data) return { ok: false as const, error: "Empresa não encontrada." };

    const row = company.data as any;
    const emails = ((contacts.data ?? []) as any[])
      .map((c) => String(c.email || "").toLowerCase())
      .filter(Boolean);
    if (row.email) emails.push(String(row.email).toLowerCase());
    const names = [row.name, row.trade_name].filter(Boolean) as string[];

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const quotesQuery = names.length
      ? supabaseAdmin
          .from("quotes")
          .select("id, service_title, client_name, currency, total_currency, total_brl, created_at, file_path, file_name")
          .or(names.map((n) => `client_name.ilike.%${n.replace(/[%,()]/g, "")}%`).join(","))
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as any[] });

    const leadsQuery = emails.length
      ? supabaseAdmin
          .from("leads")
          .select("id, name, email, service_title, service_slug, message, created_at, source_path")
          .in("email", emails)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as any[] });

    const eventsQuery = emails.length
      ? supabaseAdmin
          .from("crm_site_events")
          .select("id, kind, path, label, lang, created_at, email")
          .in("email", emails)
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as any[] });

    const [quotes, leads, events] = await Promise.all([quotesQuery, leadsQuery, eventsQuery]);

    return {
      ok: true as const,
      company: row,
      contacts: (contacts.data ?? []) as any[],
      dates: (dates.data ?? []) as any[],
      interactions: (interactions.data ?? []) as any[],
      quotes: ((quotes as any).data ?? []) as any[],
      leads: ((leads as any).data ?? []) as any[],
      events: ((events as any).data ?? []) as any[],
    };
  });

function emptyToNull(value: string | null | undefined) {
  const v = (value ?? "").trim();
  return v ? v : null;
}

export const saveCrmCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => companySchema.parse(d))
  .handler(async ({ context, data }) => {
    await admin(context);
    const { id, ...rest } = data;
    const payload = { ...rest, founded_on: emptyToNull(rest.founded_on) };
    const query = id
      ? context.supabase.from("crm_companies").update(payload).eq("id", id)
      : context.supabase.from("crm_companies").insert(payload);
    const { error } = await query;
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const saveCrmContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ context, data }) => {
    await admin(context);
    const { id, ...rest } = data;
    const payload = { ...rest, birth_date: emptyToNull(rest.birth_date) };
    const { error } = id
      ? await context.supabase.from("crm_contacts").update(payload).eq("id", id)
      : await context.supabase.from("crm_contacts").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const saveCrmDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dateSchema.parse(d))
  .handler(async ({ context, data }) => {
    await admin(context);
    const { id, ...rest } = data;
    const { error } = id
      ? await context.supabase.from("crm_dates").update(rest).eq("id", id)
      : await context.supabase.from("crm_dates").insert(rest);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const saveCrmInteraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => interactionSchema.parse(d))
  .handler(async ({ context, data }) => {
    await admin(context);
    const { displayName } = await import("./access.server");
    const { id, ...rest } = data;
    const payload = { ...rest, author_name: await displayName(context) };
    const { error } = id
      ? await context.supabase.from("crm_interactions").update(payload).eq("id", id)
      : await context.supabase.from("crm_interactions").insert(payload);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteCrmRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        table: z.enum(["crm_companies", "crm_contacts", "crm_dates", "crm_interactions"]),
        id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await admin(context);
    const { error } = await context.supabase.from(data.table).delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export type UpcomingItem = {
  kind: "empresa" | "pessoa" | "data";
  label: string;
  company: string;
  date: string;
  inDays: number;
  email: string;
};

/** Aniversários e datas importantes dos próximos 60 dias. */
export const upcomingCrmDates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await admin(context);
    const [companies, contacts, dates] = await Promise.all([
      context.supabase.from("crm_companies").select("id, name, founded_on, email"),
      context.supabase.from("crm_contacts").select("id, full_name, birth_date, email, company_id"),
      context.supabase.from("crm_dates").select("id, label, event_date, recurring, company_id, notify_email"),
    ]);
    const byId = new Map<string, string>(
      ((companies.data ?? []) as any[]).map((c) => [c.id as string, c.name as string]),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function inDays(iso: string | null, recurring = true): number | null {
      if (!iso) return null;
      const d = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(d.getTime())) return null;
      const target = new Date(d);
      if (recurring) {
        target.setFullYear(today.getFullYear());
        if (target < today) target.setFullYear(today.getFullYear() + 1);
      }
      const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
      return diff >= 0 && diff <= 60 ? diff : null;
    }

    const items: UpcomingItem[] = [];
    for (const c of (companies.data ?? []) as any[]) {
      const d = inDays(c.founded_on);
      if (d !== null) items.push({ kind: "empresa", label: `Aniversário da empresa`, company: c.name, date: c.founded_on, inDays: d, email: c.email ?? "" });
    }
    for (const p of (contacts.data ?? []) as any[]) {
      const d = inDays(p.birth_date);
      if (d !== null)
        items.push({ kind: "pessoa", label: `Aniversário de ${p.full_name}`, company: byId.get(p.company_id) ?? "", date: p.birth_date, inDays: d, email: p.email ?? "" });
    }
    for (const e of (dates.data ?? []) as any[]) {
      const d = inDays(e.event_date, e.recurring);
      if (d !== null) items.push({ kind: "data", label: e.label, company: byId.get(e.company_id) ?? "", date: e.event_date, inDays: d, email: "" });
    }
    return items.sort((a, b) => a.inDays - b.inDays);
  });

/** Últimas páginas navegadas no site (visão geral, mesmo sem e-mail conhecido). */
export const recentSiteEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await admin(context);
    const { data } = await context.supabase
      .from("crm_site_events")
      .select("id, visitor_id, email, kind, path, label, lang, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    return (data ?? []) as any[];
  });
