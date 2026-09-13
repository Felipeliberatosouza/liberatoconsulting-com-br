import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CRM_SEGMENTS, CRM_DEPARTMENTS } from "@/lib/crm-segments";

/**
 * Prospecção de leads com IA: pesquisa empresas e pessoas em fontes públicas
 * (site oficial, LinkedIn, imprensa, registros públicos) conforme filtros e
 * grava os selecionados no CRM como leads.
 */

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

const personSchema = z.object({
  full_name: z.string().trim().max(200).default(""),
  role_title: z.string().trim().max(160).default(""),
  department: z.string().trim().max(160).default(""),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(60).default(""),
  linkedin_url: z.string().trim().max(255).default(""),
});

const leadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  trade_name: z.string().trim().max(200).default(""),
  cnpj: z.string().trim().max(40).default(""),
  segment: z.string().trim().max(160).default(""),
  size: z.enum(["pme", "corporacao"]).default("pme"),
  country: z.string().trim().max(80).default("Brasil"),
  state: z.string().trim().max(80).default(""),
  city: z.string().trim().max(120).default(""),
  district: z.string().trim().max(160).default(""),
  zip: z.string().trim().max(20).default(""),
  address: z.string().trim().max(300).default(""),
  founded_on: z.string().trim().max(10).default(""),
  website: z.string().trim().max(200).default(""),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(60).default(""),
  employees: z.number().nullable().default(null),
  revenue_range: z.string().trim().max(120).default(""),
  owner_name: z.string().trim().max(160).default(""),
  owner_title: z.string().trim().max(160).default(""),
  tags: z.array(z.string().trim().max(40)).max(8).default([]),
  notes: z.string().trim().max(2000).default(""),
  sources: z.array(z.string().trim().max(300)).max(6).default([]),
  contacts: z.array(personSchema).max(6).default([]),
});

export type ProspectLead = z.infer<typeof leadSchema> & { duplicate?: boolean };

type RawLead = Record<string, unknown> & { contacts?: unknown[]; sources?: unknown[] };

function normalizeLead(raw: RawLead): ProspectLead | null {
  const name = str(raw['name'], 200);
  if (name.length < 2) return null;
  const employees = Number(raw['employees']);
  const segment = CRM_SEGMENTS.find(
    (s) => s.toLowerCase() === str(raw['segment'], 160).toLowerCase(),
  );
  const contacts = (Array.isArray(raw.contacts) ? raw.contacts : [])
    .map((c) => {
      const p = (c ?? {}) as Record<string, unknown>;
      const full = str(p['full_name'], 200);
      if (full.length < 2) return null;
      const dept = CRM_DEPARTMENTS.find(
        (d) => d.toLowerCase() === str(p['department'], 160).toLowerCase(),
      );
      return {
        full_name: full,
        role_title: str(p['role_title'], 160),
        department: dept ?? "Outros",
        email: str(p['email'], 255),
        phone: str(p['phone'], 60),
        linkedin_url: str(p['linkedin_url'], 255),
      };
    })
    .filter(Boolean)
    .slice(0, 6) as ProspectLead["contacts"];

  return {
    name,
    trade_name: str(raw['trade_name'], 200) || name,
    cnpj: str(raw['cnpj'], 40),
    segment: segment ?? "",
    size: str(raw['size'], 20).toLowerCase() === "corporacao" ? "corporacao" : "pme",
    country: str(raw['country'], 80) || "Brasil",
    state: str(raw['state'], 80),
    city: str(raw['city'], 120),
    district: str(raw['district'], 160),
    zip: str(raw['zip'], 20),
    address: str(raw['address'], 300),
    founded_on: /^\d{4}-\d{2}-\d{2}$/.test(str(raw['founded_on'], 10)) ? str(raw['founded_on'], 10) : "",
    website: str(raw['website'], 200),
    email: str(raw['email'], 255),
    phone: str(raw['phone'], 60),
    employees: Number.isFinite(employees) && employees > 0 ? Math.round(employees) : null,
    revenue_range: str(raw['revenue_range'], 120),
    owner_name: str(raw['owner_name'], 160),
    owner_title: str(raw['owner_title'], 160),
    tags: (Array.isArray(raw['tags']) ? (raw['tags'] as unknown[]) : [])
      .map((t) => str(t, 40))
      .filter(Boolean)
      .slice(0, 8),
    notes: str(raw['notes'], 2000),
    sources: (Array.isArray(raw.sources) ? raw.sources : [])
      .map((s) => str(s, 300))
      .filter(Boolean)
      .slice(0, 6),
    contacts,
  };
}

const key = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Pesquisa novas empresas e pessoas na web conforme os filtros informados. */
export const searchCrmLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        segment: z.string().trim().max(160).default(""),
        country: z.string().trim().max(80).default("Brasil"),
        state: z.string().trim().max(80).default(""),
        city: z.string().trim().max(120).default(""),
        size: z.enum(["", "pme", "corporacao"]).default(""),
        minEmployees: z.number().int().min(0).max(5_000_000).nullable().default(null),
        maxEmployees: z.number().int().min(0).max(5_000_000).nullable().default(null),
        revenue: z.string().trim().max(160).default(""),
        keywords: z.string().trim().max(400).default(""),
        roles: z.string().trim().max(300).default(""),
        limit: z.number().int().min(1).max(12).default(6),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJsonGrounded } = await import("./ai.server");

    const filters = [
      data.segment ? `Segmento: ${data.segment}` : "",
      `Local: ${[data.city, data.state, data.country].filter(Boolean).join(", ")}`,
      data.size ? `Porte desejado: ${data.size === "corporacao" ? "corporação/grande empresa" : "pequena ou média empresa"}` : "",
      data.minEmployees ? `Mínimo de funcionários: ${data.minEmployees}` : "",
      data.maxEmployees ? `Máximo de funcionários: ${data.maxEmployees}` : "",
      data.revenue ? `Faixa de faturamento desejada: ${data.revenue}` : "",
      data.keywords ? `Outros critérios: ${data.keywords}` : "",
      data.roles ? `Cargos/decisores procurados: ${data.roles}` : "Cargos procurados: diretoria, gerência de operações, comercial e financeiro",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = await askJsonGrounded<{ leads?: RawLead[] }>(
        "Você é analista de prospecção B2B de uma consultoria brasileira. Pesquise na web em fontes públicas e " +
          "confiáveis (site oficial da empresa, LinkedIn, registros públicos, imprensa de negócios, associações setoriais) " +
          "empresas reais que atendam aos filtros. NUNCA invente empresas, CNPJs, e-mails ou pessoas: deixe o campo vazio " +
          "quando não houver informação pública confiável. Traga apenas contatos profissionais públicos (e-mail corporativo, " +
          "telefone institucional, perfil público do LinkedIn); nunca dados pessoais privados.",
        `Encontre até ${data.limit} empresas que atendam a estes critérios:
${filters}

Responda com JSON exatamente neste formato (strings vazias quando não souber):
{"leads":[{
 "name":"razão social",
 "trade_name":"nome fantasia",
 "cnpj":"00.000.000/0000-00",
 "segment":"escolha EXATAMENTE um item desta lista: ${CRM_SEGMENTS.join(" | ")}",
 "size":"pme ou corporacao",
 "country":"país da sede","state":"UF","city":"cidade",
 "district":"bairro da sede","zip":"CEP da sede","address":"rua e número da sede",
 "founded_on":"AAAA-MM-DD da fundação",
 "website":"site oficial","email":"e-mail público","phone":"+55 11 3000-0000",
 "employees": 0,
 "revenue_range":"faixa de faturamento MENSAL estimada em reais",
 "owner_name":"principal executivo em exercício hoje","owner_title":"cargo",
 "tags":["até 6 tags curtas"],
 "notes":"por que esta empresa é um bom lead para consultoria de gestão (até 400 caracteres)",
 "sources":["URLs públicas consultadas"],
 "contacts":[{"full_name":"pessoa","role_title":"cargo","department":"escolha um item: ${CRM_DEPARTMENTS.join(" | ")}","email":"","phone":"","linkedin_url":"perfil público"}]
}]}`,
      );

      const leads = (result?.leads ?? [])
        .map(normalizeLead)
        .filter(Boolean)
        .slice(0, data.limit) as ProspectLead[];

      const { data: existing } = await context.supabase
        .from("crm_companies")
        .select("name, trade_name, cnpj");
      const known = new Set<string>();
      for (const row of (existing ?? []) as any[]) {
        for (const v of [row.name, row.trade_name, row.cnpj]) if (v) known.add(key(String(v)));
      }

      return {
        ok: true as const,
        leads: leads.map((l) => ({
          ...l,
          duplicate: known.has(key(l.name)) || known.has(key(l.trade_name)) || (!!l.cnpj && known.has(key(l.cnpj))),
        })),
      };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha na pesquisa de leads." };
    }
  });

/** Grava no CRM os leads selecionados (empresa + pessoas), como status "lead". */
export const importCrmLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ leads: z.array(leadSchema).min(1).max(12) }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);

    const { enrichCompanyProfile } = await import("./crm-enrich.server");

    let created = 0;
    let people = 0;
    for (const lead of data.leads) {
      const { contacts, sources, ...company } = lead;

      // Completa o cadastro com a mesma pesquisa do botão "IA" do CRM,
      // para o lead entrar com todos os dados atualizados na data da geração.
      const extra = await enrichCompanyProfile({
        tradeName: company.trade_name || company.name,
        legalName: company.name,
        cnpj: company.cnpj,
        segment: company.segment,
        city: company.city,
        country: company.country,
        website: company.website,
      });
      const pick = (current: string, fresh?: string) => (current ? current : (fresh ?? "")).trim();
      if (extra) {
        company.name = company.name || extra.legal_name;
        company.cnpj = pick(company.cnpj, extra.cnpj);
        company.segment = company.segment || extra.segment;
        company.country = pick(company.country, extra.country);
        company.state = pick(company.state, extra.state);
        company.city = pick(company.city, extra.city);
        company.district = pick(company.district, extra.district);
        company.zip = pick(company.zip, extra.zip);
        company.address = pick(company.address, extra.address);
        company.website = pick(company.website, extra.website);
        company.email = pick(company.email, extra.email);
        company.phone = pick(company.phone, extra.phone);
        company.founded_on = pick(company.founded_on, extra.founded_on);
        company.employees = company.employees ?? extra.employees;
        company.revenue_range = pick(company.revenue_range, extra.revenue_range);
        company.owner_name = pick(company.owner_name, extra.owner_name);
        company.owner_title = pick(company.owner_title, extra.owner_title);
        if (company.tags.length === 0) company.tags = extra.tags;
        if (!company.notes) company.notes = extra.notes;
      }

      const notes = [company.notes, sources.length ? `Fontes: ${sources.join(" | ")}` : ""]
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 6000);
      const { data: inserted, error } = await context.supabase
        .from("crm_companies")
        .insert({
          ...company,
          trade_name: company.trade_name || company.name,
          status: "lead",
          notes,
          founded_on: company.founded_on || null,
          birthday_email: true,
        })
        .select("id")
        .maybeSingle();
      if (error || !inserted) continue;
      created += 1;

      const rows = contacts
        .filter((c) => c.full_name.length >= 2)
        .map((c) => ({
          company_id: (inserted as any).id,
          full_name: c.full_name,
          role_title: c.role_title,
          department: c.department,
          email: c.email,
          phone: c.phone,
          linkedin_url: c.linkedin_url,
          decision_maker: true,
          email_opt_in: true,
          birthday_email: true,
          language: "pt",
          active: true,
          notes: "Contato encontrado pela prospecção com IA.",
        }));
      if (rows.length > 0) {
        const { error: contactError } = await context.supabase.from("crm_contacts").insert(rows);
        if (!contactError) people += rows.length;
      }
    }

    if (created === 0) return { ok: false as const, error: "Nenhum lead pôde ser gravado." };
    return { ok: true as const, created, people };
  });

/** Reconsulta a web e atualiza os dados de uma empresa já cadastrada. */
export const refreshCrmLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);

    const { data: company } = await context.supabase
      .from("crm_companies")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (!company) return { ok: false as const, error: "Empresa não encontrada." };

    const { askJsonGrounded } = await import("./ai.server");
    const row = company as any;

    try {
      const fresh = await askJsonGrounded<RawLead>(
        "Você é analista de inteligência de mercado. Reconfira na web, em fontes públicas e confiáveis, os dados " +
          "atuais da empresa. Nunca invente CNPJ, e-mail ou pessoas: deixe vazio quando não houver fonte confiável.",
        `Empresa: ${row.name}${row.trade_name ? ` (${row.trade_name})` : ""}${row.cnpj ? ` | CNPJ: ${row.cnpj}` : ""}${row.website ? ` | site: ${row.website}` : ""}.
Atualize os dados para hoje e responda com JSON:
{"segment":"escolha EXATAMENTE um item: ${CRM_SEGMENTS.join(" | ")}","size":"pme ou corporacao","country":"","state":"","city":"","website":"","email":"","phone":"","employees":0,"revenue_range":"faturamento mensal estimado","owner_name":"executivo em exercício hoje","owner_title":"","tags":["até 6 tags"],"notes":"atualização executiva de até 500 caracteres","sources":["URLs"],"contacts":[{"full_name":"","role_title":"","department":"escolha um item: ${CRM_DEPARTMENTS.join(" | ")}","email":"","phone":"","linkedin_url":""}]}`,
      );
      const normalized = normalizeLead({ ...fresh, name: row.name });
      if (!normalized) return { ok: false as const, error: "A IA não retornou dados utilizáveis." };

      const patch: Record<string, unknown> = {};
      const keep = (field: string, value: string | number | null) => {
        if (value === null || value === "" || value === undefined) return;
        patch[field] = value;
      };
      keep("segment", normalized.segment);
      keep("size", normalized.size);
      keep("country", normalized.country);
      keep("state", normalized.state);
      keep("city", normalized.city);
      keep("website", normalized.website);
      keep("email", normalized.email);
      keep("phone", normalized.phone);
      keep("employees", normalized.employees);
      keep("revenue_range", normalized.revenue_range);
      keep("owner_name", normalized.owner_name);
      keep("owner_title", normalized.owner_title);
      if (normalized.tags.length > 0) patch['tags'] = normalized.tags;
      if (normalized.notes) {
        const stamp = new Date().toISOString().slice(0, 10);
        patch['notes'] = [`[Atualização IA ${stamp}] ${normalized.notes}`, row.notes || ""]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 6000);
      }

      const { error } = await context.supabase.from("crm_companies").update(patch as any).eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };

      // Acrescenta apenas pessoas ainda não cadastradas.
      const { data: current } = await context.supabase
        .from("crm_contacts")
        .select("full_name")
        .eq("company_id", data.id);
      const have = new Set(((current ?? []) as any[]).map((c) => key(String(c.full_name))));
      const rows = normalized.contacts
        .filter((c) => !have.has(key(c.full_name)))
        .map((c) => ({
          company_id: data.id,
          full_name: c.full_name,
          role_title: c.role_title,
          department: c.department,
          email: c.email,
          phone: c.phone,
          linkedin_url: c.linkedin_url,
          decision_maker: true,
          email_opt_in: true,
          birthday_email: true,
          language: "pt",
          active: true,
          notes: "Contato encontrado pela atualização com IA.",
        }));
      if (rows.length > 0) await context.supabase.from("crm_contacts").insert(rows);

      return { ok: true as const, addedPeople: rows.length };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha ao atualizar." };
    }
  });
