import { useEffect, useState } from "react";

import { searchCrmLeads, importCrmLeads, type ProspectLead } from "@/lib/crm-prospect.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";
import { STATES } from "@/lib/audience-filters";

const COUNTRY_REGIONS: Record<string, { label: string; options: string[] }> = {
  Brasil: { label: "Estado (UF)", options: STATES.map((s) => s.uf) },
  Argentina: { label: "Província", options: ["Buenos Aires", "Ciudad Autónoma de Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán"] },
  Chile: { label: "Região", options: ["Arica y Parinacota", "Tarapacá", "Antofagasta", "Atacama", "Coquimbo", "Valparaíso", "Metropolitana de Santiago", "O'Higgins", "Maule", "Ñuble", "Biobío", "La Araucanía", "Los Ríos", "Los Lagos", "Aysén", "Magallanes"] },
  Paraguai: { label: "Departamento", options: ["Asunción", "Alto Paraná", "Central", "Itapúa", "Caaguazú", "San Pedro", "Cordillera", "Guairá", "Paraguarí", "Concepción", "Amambay", "Canindeyú", "Misiones", "Ñeembucú", "Caazapá", "Presidente Hayes", "Boquerón", "Alto Paraguay"] },
  Uruguai: { label: "Departamento", options: ["Montevideo", "Canelones", "Maldonado", "Colonia", "Salto", "Paysandú", "Rivera", "Tacuarembó", "Soriano", "San José", "Cerro Largo", "Rocha", "Florida", "Lavalleja", "Durazno", "Artigas", "Río Negro", "Treinta y Tres", "Flores"] },
  Portugal: { label: "Distrito", options: ["Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Açores", "Madeira"] },
  México: { label: "Estado", options: ["Ciudad de México", "Jalisco", "Nuevo León", "Estado de México", "Puebla", "Guanajuato", "Querétaro", "Veracruz", "Yucatán", "Baja California", "Chihuahua", "Sonora", "Coahuila", "Sinaloa", "Quintana Roo"] },
  "Estados Unidos": { label: "Estado", options: ["California", "Texas", "Florida", "New York", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington", "Arizona", "Massachusetts", "Colorado"] },
  Canadá: { label: "Província", options: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island"] },
  China: { label: "Província", options: ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", "Shandong", "Sichuan", "Fujian", "Hubei", "Henan", "Tianjin", "Chongqing"] },
};

const REVENUE_RANGES = [
  "Até R$ 360 mil por ano",
  "R$ 360 mil a R$ 4,8 milhões por ano",
  "R$ 4,8 mi a R$ 30 milhões por ano",
  "R$ 30 mi a R$ 100 milhões por ano",
  "R$ 100 mi a R$ 300 milhões por ano",
  "R$ 300 mi a R$ 1 bilhão por ano",
  "Acima de R$ 1 bilhão por ano",
];

const EMPLOYEE_RANGES: Array<{ label: string; min: string; max: string }> = [
  { label: "1 a 9", min: "1", max: "9" },
  { label: "10 a 49", min: "10", max: "49" },
  { label: "50 a 99", min: "50", max: "99" },
  { label: "100 a 499", min: "100", max: "499" },
  { label: "500 a 999", min: "500", max: "999" },
  { label: "1.000 a 4.999", min: "1000", max: "4999" },
  { label: "5.000 ou mais", min: "5000", max: "" },
];

/** Prospecção de leads com IA: pesquisa empresas e pessoas na web e grava no CRM. */

const baseField = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60";
const btnGhost = "rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-60";

type Filters = {
  segment: string;
  companyName: string;
  country: string;
  state: string;
  city: string;
  size: "" | "pme" | "corporacao";
  minEmployees: string;
  maxEmployees: string;
  revenue: string;
  keywords: string;
  roles: string;
  limit: string;
};

const initial: Filters = {
  segment: "",
  companyName: "",
  country: "Brasil",
  state: "",
  city: "",
  size: "",
  minEmployees: "",
  maxEmployees: "",
  revenue: "",
  keywords: "",
  roles: "",
  limit: "6",
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-muted-foreground">{children}</span>;
}

export function CrmProspect({ onImported }: { onImported: () => void }) {
  const [filters, setFilters] = useState<Filters>(initial);
  const [leads, setLeads] = useState<ProspectLead[] | null>(null);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = (key: keyof Filters, value: string | number) =>
    setFilters((prev) => ({ ...prev, [key]: value }) as Filters);

  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const region = COUNTRY_REGIONS[filters.country];

  useEffect(() => {
    setCities([]);
    if (filters.country !== "Brasil" || !filters.state) return;
    let alive = true;
    setCitiesLoading(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filters.state}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((rows: Array<{ nome: string }>) => alive && setCities(rows.map((r) => r.nome)))
      .catch(() => alive && setCities([]))
      .finally(() => alive && setCitiesLoading(false));
    return () => {
      alive = false;
    };
  }, [filters.country, filters.state]);

  const employeeRange = EMPLOYEE_RANGES.find((r) => r.min === filters.minEmployees && r.max === filters.maxEmployees)?.label ?? "";

  const num = (v: string) => {
    const n = Number(v.replace(/\D/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  async function search() {
    setBusy(true);
    setError("");
    setMessage("");
    setLeads(null);
    setPicked({});
    try {
      const res = await searchCrmLeads({
        data: {
          segment: filters.segment,
          companyName: filters.companyName,
          country: filters.country,
          state: filters.state,
          city: filters.city,
          size: filters.size,
          minEmployees: num(filters.minEmployees),
          maxEmployees: num(filters.maxEmployees),
          revenue: filters.revenue,
          keywords: filters.keywords,
          roles: filters.roles,
          limit: Math.min(30, Math.max(1, Number(filters.limit) || 6)),
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLeads(res.leads);
      const next: Record<number, boolean> = {};
      res.leads.forEach((l, i) => {
        if (!l.duplicate) next[i] = true;
      });
      setPicked(next);
      if (res.leads.length === 0) setMessage("Nenhuma empresa encontrada com esses critérios. Tente ampliar os filtros.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na pesquisa.");
    } finally {
      setBusy(false);
    }
  }

  async function importSelected() {
    if (!leads) return;
    const chosen = leads.filter((_, i) => picked[i]).map(({ duplicate: _d, ...lead }) => lead);
    if (chosen.length === 0) {
      setError("Selecione pelo menos uma empresa.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await importCrmLeads({ data: { leads: chosen } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(`${res.created} empresa(s) e ${res.people} pessoa(s) adicionadas ao CRM como lead.`);
      setLeads(null);
      setPicked({});
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gravar os leads.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-background p-5">
      <h2 className="font-display text-base font-bold">Prospecção de leads com IA</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A IA pesquisa empresas reais em fontes públicas (site oficial, LinkedIn, imprensa de negócios, registros
        públicos) conforme os filtros e sugere os contatos decisores. Revise antes de gravar: nada é salvo sem sua
        seleção.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label>
          <Label>Segmento</Label>
          <select className={baseField} value={filters.segment} onChange={(e) => set("segment", e.target.value)}>
            <option value="">Qualquer segmento</option>
            {CRM_SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Label>Porte</Label>
          <select className={baseField} value={filters.size} onChange={(e) => set("size", e.target.value)}>
            <option value="">Qualquer porte</option>
            <option value="pme">Pequena e média empresa</option>
            <option value="corporacao">Corporação</option>
          </select>
        </label>
        <label>
          <Label>Nome da empresa</Label>
          <input className={baseField} value={filters.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Ex.: Embraer (opcional)" />
        </label>
        <label>
          <Label>País</Label>
          <select
            className={baseField}
            value={filters.country}
            onChange={(e) => setFilters((prev) => ({ ...prev, country: e.target.value, state: "", city: "" }))}
          >
            {Object.keys(COUNTRY_REGIONS).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <Label>{region?.label ?? "Estado / Província"}</Label>
          <select
            className={baseField}
            value={filters.state}
            onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value, city: "" }))}
          >
            <option value="">Qualquer {(region?.label ?? "estado").toLowerCase()}</option>
            {(region?.options ?? []).map((o) => (
              <option key={o} value={o}>
                {filters.country === "Brasil" ? `${o} — ${STATES.find((s) => s.uf === o)?.name ?? ""}` : o}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Label>Cidade</Label>
          {filters.country === "Brasil" ? (
            <select
              className={baseField}
              value={filters.city}
              disabled={!filters.state || citiesLoading}
              onChange={(e) => set("city", e.target.value)}
            >
              <option value="">
                {!filters.state ? "Escolha a UF primeiro" : citiesLoading ? "Carregando cidades…" : "Qualquer cidade"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <input className={baseField} value={filters.city} onChange={(e) => set("city", e.target.value)} placeholder="Cidade (opcional)" />
          )}
        </label>
        <label>
          <Label>Faixa de faturamento</Label>
          <select className={baseField} value={filters.revenue} onChange={(e) => set("revenue", e.target.value)}>
            <option value="">Qualquer faturamento</option>
            {REVENUE_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          <Label>Número de funcionários</Label>
          <select
            className={baseField}
            value={employeeRange}
            onChange={(e) => {
              const r = EMPLOYEE_RANGES.find((x) => x.label === e.target.value);
              setFilters((prev) => ({ ...prev, minEmployees: r?.min ?? "", maxEmployees: r?.max ?? "" }));
            }}
          >
            <option value="">Qualquer quantidade</option>
            {EMPLOYEE_RANGES.map((r) => (
              <option key={r.label} value={r.label}>{r.label} funcionários</option>
            ))}
          </select>
        </label>
        <label>
          <Label>Número de empresas (até 30)</Label>
          <input
            type="number"
            min={1}
            max={30}
            className={baseField}
            value={filters.limit}
            onChange={(e) => set("limit", e.target.value.replace(/\D/g, ""))}
            placeholder="6"
          />
        </label>
        <label className="md:col-span-2">
          <Label>Outros critérios</Label>
          <input
            className={baseField}
            value={filters.keywords}
            onChange={(e) => set("keywords", e.target.value)}
            placeholder="Ex.: indústrias com expansão recente, exportadoras, certificação ISO"
          />
        </label>
        <label>
          <Label>Cargos procurados</Label>
          <input
            className={baseField}
            value={filters.roles}
            onChange={(e) => set("roles", e.target.value)}
            placeholder="Diretor de operações, gerente comercial"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button className={btn} onClick={search} disabled={busy}>
          {busy ? "Pesquisando na web…" : "Pesquisar leads"}
        </button>
        <button className={btnGhost} onClick={() => { setFilters(initial); setLeads(null); setPicked({}); setMessage(""); setError(""); }} disabled={busy}>
          Limpar filtros
        </button>
        {busy && <span className="text-sm text-muted-foreground">A pesquisa pode levar até um minuto.</span>}
      </div>

      {error && <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm">{message}</p>}

      {leads && leads.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-sm font-bold">Resultados ({leads.length})</h3>
            <button className={`${btn} ml-auto`} onClick={importSelected} disabled={saving}>
              {saving ? "Gravando…" : "Adicionar selecionados ao CRM"}
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {leads.map((lead, i) => (
              <article key={`${lead.name}-${i}`} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(picked[i])}
                    onChange={(e) => setPicked((prev) => ({ ...prev, [i]: e.target.checked }))}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {lead.name}
                      {lead.duplicate && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs">já cadastrada</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[
                        lead.segment,
                        lead.size === "corporacao" ? "Corporação" : "PME",
                        [lead.city, lead.state, lead.country].filter(Boolean).join("/"),
                        lead.employees ? `${lead.employees} funcionários` : "",
                        lead.revenue_range,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[lead.website, lead.email, lead.phone, lead.cnpj].filter(Boolean).join(" · ") || "Sem contato público encontrado"}
                    </p>
                    {lead.owner_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Executivo: {lead.owner_name}
                        {lead.owner_title ? ` — ${lead.owner_title}` : ""}
                      </p>
                    )}
                    {lead.notes && <p className="mt-2 text-sm">{lead.notes}</p>}
                    {lead.contacts.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {lead.contacts.map((c, k) => (
                          <li key={k}>
                            <strong className="text-foreground">{c.full_name}</strong>
                            {c.role_title ? ` — ${c.role_title}` : ""}
                            {c.department ? ` (${c.department})` : ""}
                            {c.email ? ` · ${c.email}` : ""}
                            {c.linkedin_url ? ` · ${c.linkedin_url}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                    {lead.sources.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">Fontes: {lead.sources.join(" · ")}</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
