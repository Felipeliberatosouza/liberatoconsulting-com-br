import { useState } from "react";

import { searchCrmLeads, importCrmLeads, type ProspectLead } from "@/lib/crm-prospect.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";

/** Prospecção de leads com IA: pesquisa empresas e pessoas na web e grava no CRM. */

const baseField = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const btn = "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60";
const btnGhost = "rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-60";

type Filters = {
  segment: string;
  country: string;
  state: string;
  city: string;
  size: "" | "pme" | "corporacao";
  minEmployees: string;
  maxEmployees: string;
  revenue: string;
  keywords: string;
  roles: string;
  limit: number;
};

const initial: Filters = {
  segment: "",
  country: "Brasil",
  state: "",
  city: "",
  size: "",
  minEmployees: "",
  maxEmployees: "",
  revenue: "",
  keywords: "",
  roles: "",
  limit: 6,
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
          country: filters.country,
          state: filters.state,
          city: filters.city,
          size: filters.size,
          minEmployees: num(filters.minEmployees),
          maxEmployees: num(filters.maxEmployees),
          revenue: filters.revenue,
          keywords: filters.keywords,
          roles: filters.roles,
          limit: Number(filters.limit) || 6,
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
          <Label>Faixa de faturamento</Label>
          <input
            className={baseField}
            value={filters.revenue}
            onChange={(e) => set("revenue", e.target.value)}
            placeholder="Ex.: R$ 10 mi a R$ 100 mi por ano"
          />
        </label>
        <label>
          <Label>País</Label>
          <input className={baseField} value={filters.country} onChange={(e) => set("country", e.target.value)} />
        </label>
        <label>
          <Label>Estado / UF</Label>
          <input className={baseField} value={filters.state} onChange={(e) => set("state", e.target.value)} placeholder="SP" />
        </label>
        <label>
          <Label>Cidade</Label>
          <input className={baseField} value={filters.city} onChange={(e) => set("city", e.target.value)} placeholder="Campinas" />
        </label>
        <label>
          <Label>Funcionários (mínimo)</Label>
          <input className={baseField} value={filters.minEmployees} onChange={(e) => set("minEmployees", e.target.value)} placeholder="50" />
        </label>
        <label>
          <Label>Funcionários (máximo)</Label>
          <input className={baseField} value={filters.maxEmployees} onChange={(e) => set("maxEmployees", e.target.value)} placeholder="500" />
        </label>
        <label>
          <Label>Quantidade de empresas</Label>
          <select className={baseField} value={filters.limit} onChange={(e) => set("limit", Number(e.target.value))}>
            {[3, 6, 9, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
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
