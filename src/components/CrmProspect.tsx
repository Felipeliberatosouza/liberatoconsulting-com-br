import { useEffect, useState } from "react";

import { searchCrmLeads, importCrmLeads, type ProspectLead } from "@/lib/crm-prospect.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";
import { employeeRangesFor, PORTE_LABEL, PORTE_LIMITS, SECTOR_LABEL, sectorFromSegment, type Porte, type Sector } from "@/lib/company-size";
import { STATES } from "@/lib/audience-filters";
import { exportProspects } from "@/lib/prospect-export";
import { MultiSelect } from "@/components/MultiSelect";

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


/** Prospecção de leads com IA: pesquisa empresas e pessoas na web e grava no CRM. */

const baseField = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60";
const btnGhost = "rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-60";

type Filters = {
  segment: string[];
  companyName: string;
  country: string[];
  state: string[];
  city: string[];
  porte: Array<Exclude<Porte, "">>;
  sector: Sector[];
  employees: string[];
  revenue: string[];
  keywords: string;
  roles: string;
  limit: string;
  excludeLarge: boolean;
};

const QUALITY_LABEL = { completo: "Lead completo", parcial: "Lead parcial", basico: "Apenas empresa" } as const;

const initial: Filters = {
  segment: [],
  companyName: "",
  country: ["Brasil"],
  state: [],
  city: [],
  porte: [],
  sector: [],
  employees: [],
  revenue: [],
  keywords: "",
  roles: "",
  limit: "6",
  excludeLarge: true,
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

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setFilters((prev) => ({ ...prev, [key]: value }));

  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const onlyBrazil = filters.country.length === 1 && filters.country[0] === "Brasil";
  const regionLabel = filters.country.length === 1 ? COUNTRY_REGIONS[filters.country[0]]?.label ?? "Estado / Província" : "Estado / Província";
  const countriesForRegion = filters.country.length ? filters.country : Object.keys(COUNTRY_REGIONS);
  const regionOptions = countriesForRegion.flatMap((c) =>
    (COUNTRY_REGIONS[c]?.options ?? []).map((o) => ({
      value: o,
      label:
        c === "Brasil"
          ? `${o} — ${STATES.find((s) => s.uf === o)?.name ?? ""}`
          : countriesForRegion.length > 1 ? `${o} (${c})` : o,
    })),
  );
  const brStates = filters.state.filter((s) => STATES.some((x) => x.uf === s));
  const brKey = brStates.join(",");

  useEffect(() => {
    setCities([]);
    if (!filters.country.includes("Brasil") || brStates.length === 0) return;
    let alive = true;
    setCitiesLoading(true);
    Promise.all(
      brStates.map((uf) =>
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
          .then((r) => r.json())
          .then((rows: Array<{ nome: string }>) => rows.map((r) => (brStates.length > 1 ? `${r.nome}/${uf}` : r.nome)))
          .catch(() => [] as string[]),
      ),
    )
      .then((lists) => alive && setCities(lists.flat()))
      .finally(() => alive && setCitiesLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.country.join(","), brKey]);

  const sectors: Sector[] = filters.sector.length ? filters.sector : (Object.keys(SECTOR_LABEL) as Sector[]);
  const portes: Array<Exclude<Porte, "">> = filters.porte.length ? filters.porte : (Object.keys(PORTE_LABEL) as Array<Exclude<Porte, "">>);
  const employeeRanges = Array.from(
    new Map(
      sectors.flatMap((s) => portes.flatMap((p) => employeeRangesFor(p, s))).map((r) => [r.label, r] as const),
    ).values(),
  ).sort((a, b) => a.min - b.min);
  const chosenRanges = employeeRanges.filter((r) => filters.employees.includes(r.label));
  const porteLimits = filters.porte.length
    ? sectors.flatMap((s) => filters.porte.map((p) => PORTE_LIMITS[s][p]))
    : [];

  function bounds(list: Array<{ min: number; max: number | null }>) {
    if (!list.length) return { min: null as number | null, max: null as number | null };
    return {
      min: Math.min(...list.map((r) => r.min)),
      max: list.some((r) => r.max == null) ? null : Math.max(...list.map((r) => r.max as number)),
    };
  }

  async function search() {
    setBusy(true);
    setError("");
    setMessage("");
    setLeads(null);
    setPicked({});
    try {
      const res = await searchCrmLeads({
        data: {
          segment: filters.segment.join(" OU "),
          companyName: filters.companyName,
          country: filters.country.join(" OU "),
          state: filters.state.join(" OU "),
          city: filters.city.join(" OU "),
          size:
            filters.porte.length && filters.porte.every((p) => p === "grande")
              ? "corporacao"
              : filters.porte.length && !filters.porte.includes("grande") ? "pme" : "",
          porte: filters.porte.length || filters.sector.length
            ? `${filters.porte.length ? filters.porte.map((p) => PORTE_LABEL[p]).join(" ou ") : "Qualquer porte"} (${sectors.map((s) => SECTOR_LABEL[s]).join(" ou ")}, critério IBGE/Sebrae)${chosenRanges.length ? `; faixas de funcionários: ${chosenRanges.map((r) => r.label).join(", ")}` : ""}`
            : chosenRanges.length ? `Faixas de funcionários: ${chosenRanges.map((r) => r.label).join(", ")}` : "",
          minEmployees: (chosenRanges.length ? bounds(chosenRanges) : bounds(porteLimits)).min,
          maxEmployees: (chosenRanges.length ? bounds(chosenRanges) : bounds(porteLimits)).max,
          revenue: filters.revenue.join(" OU "),
          keywords: filters.keywords,
          roles: filters.roles,
          limit: Math.min(30, Math.max(1, Number(filters.limit) || 6)),
          excludeLarge: filters.excludeLarge,
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
        <div>
          <Label>Segmento</Label>
          <MultiSelect
            className={baseField}
            options={CRM_SEGMENTS as unknown as string[]}
            value={filters.segment}
            placeholder="Qualquer segmento"
            onChange={(segment) =>
              setFilters((prev) => ({
                ...prev,
                segment,
                sector: segment.length ? Array.from(new Set(segment.map(sectorFromSegment))) : prev.sector,
                employees: [],
              }))
            }
          />
        </div>
        <div>
          <Label>Setor econômico</Label>
          <MultiSelect
            className={baseField}
            options={(Object.keys(SECTOR_LABEL) as Sector[]).map((s) => ({ value: s, label: SECTOR_LABEL[s] }))}
            value={filters.sector}
            placeholder="Qualquer setor"
            onChange={(v) => setFilters((prev) => ({ ...prev, sector: v as Sector[], employees: [] }))}
          />
        </div>
        <div>
          <Label>Porte</Label>
          <MultiSelect
            className={baseField}
            options={(Object.keys(PORTE_LABEL) as Array<Exclude<Porte, "">>).map((p) => ({ value: p, label: PORTE_LABEL[p] }))}
            value={filters.porte}
            placeholder="Qualquer porte"
            onChange={(v) => setFilters((prev) => ({ ...prev, porte: v as Array<Exclude<Porte, "">>, employees: [] }))}
          />
        </div>
        <label>
          <Label>Nome da empresa</Label>
          <input className={baseField} value={filters.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Ex.: Embraer (opcional)" />
        </label>
        <div>
          <Label>País</Label>
          <MultiSelect
            className={baseField}
            options={Object.keys(COUNTRY_REGIONS)}
            value={filters.country}
            placeholder="Qualquer país"
            onChange={(country) => setFilters((prev) => ({ ...prev, country, state: [], city: [] }))}
          />
        </div>
        <div>
          <Label>{regionLabel}</Label>
          <MultiSelect
            className={baseField}
            options={regionOptions}
            value={filters.state}
            placeholder={`Qualquer ${regionLabel.toLowerCase()}`}
            onChange={(state) => setFilters((prev) => ({ ...prev, state, city: [] }))}
          />
        </div>
        <div>
          <Label>Cidade</Label>
          {onlyBrazil ? (
            <MultiSelect
              className={baseField}
              options={cities}
              value={filters.city}
              disabled={brStates.length === 0 || citiesLoading}
              placeholder={brStates.length === 0 ? "Escolha a UF primeiro" : citiesLoading ? "Carregando cidades…" : "Qualquer cidade"}
              onChange={(city) => set("city", city)}
            />
          ) : (
            <input
              className={baseField}
              value={filters.city.join(", ")}
              onChange={(e) => set("city", e.target.value.split(",").map((s) => s.trimStart()).filter((s, i, a) => s || i === a.length - 1))}
              placeholder="Cidades separadas por vírgula (opcional)"
            />
          )}
        </div>
        <div>
          <Label>Faixa de faturamento</Label>
          <MultiSelect
            className={baseField}
            options={REVENUE_RANGES}
            value={filters.revenue}
            placeholder="Qualquer faturamento"
            onChange={(v) => set("revenue", v)}
          />
        </div>
        <div>
          <Label>Número de funcionários</Label>
          <MultiSelect
            className={baseField}
            options={employeeRanges.map((r) => ({ value: r.label, label: `${r.label} funcionários` }))}
            value={filters.employees}
            placeholder={
              porteLimits.length
                ? (() => {
                    const b = bounds(porteLimits);
                    return `Todo o porte (${b.min}${b.max ? ` a ${b.max}` : "+"} funcionários)`;
                  })()
                : "Qualquer quantidade"
            }
            onChange={(v) => set("employees", v)}
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            As opções seguem o porte e o setor escolhidos (critério IBGE/Sebrae).
          </span>
        </div>
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
        <label className="flex items-center gap-2 text-sm md:col-span-3">
          <input type="checkbox" checked={filters.excludeLarge} onChange={(e) => setFilters((p) => ({ ...p, excludeLarge: e.target.checked }))} />
          Excluir grandes empresas (multinacionais, listadas em bolsa, bancos e estatais) — foco em PMEs
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
            <span className="text-xs text-muted-foreground">
              {(["completo", "parcial", "basico"] as const)
                .map((q) => `${QUALITY_LABEL[q]}: ${leads.filter((l) => l.quality === q).length}`)
                .join(" · ")}
            </span>
            <button className={`${btnGhost} ml-auto`} onClick={() => void exportProspects(leads, "xlsx")}>
              Baixar Excel
            </button>
            <button className={btnGhost} onClick={() => void exportProspects(leads, "csv")}>
              Baixar CSV
            </button>
            <button
              className={btnGhost}
              onClick={() => {
                const next: Record<number, boolean> = {};
                leads.forEach((l, i) => {
                  if (!l.duplicate && l.quality !== "basico") next[i] = true;
                });
                setPicked(next);
              }}
            >
              Marcar só completos e parciais
            </button>
            <button className={btn} onClick={importSelected} disabled={saving}>
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
                      {lead.quality && (
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                            lead.quality === "completo"
                              ? "bg-accent text-accent-foreground"
                              : lead.quality === "parcial"
                                ? "border border-accent text-foreground"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {QUALITY_LABEL[lead.quality]}
                        </span>
                      )}
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
