import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import {
  listCrmCompanies,
  getCrmCompany,
  saveCrmCompany,
  saveCrmContact,
  saveCrmDate,
  saveCrmInteraction,
  deleteCrmRecord,
  upcomingCrmDates,
} from "@/lib/crm.functions";
import { draftCrmCompanyProfile } from "@/lib/crm-ai.functions";
import { quoteFileUrl } from "@/lib/pricing.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";
import { lookupCep } from "@/lib/cep";
import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
  isValidPhone,
  isValidWebsite,
  PHONE_ERROR,
  PHONE_PLACEHOLDER,
} from "@/lib/validation";

export const Route = createFileRoute("/admin/crm")({
  head: () => ({
    meta: [
      { title: "CRM — Painel Liberato" },
      { name: "description", content: "Cadastro de clientes, contatos, datas importantes e histórico de relacionamento." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "CRM — Painel Liberato" },
      { property: "og:description", content: "Clientes, contatos e histórico de relacionamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCrm,
});

const baseField = "w-full rounded-md bg-background px-3 py-2 text-sm outline-none";
const field = `${baseField} border border-input focus:border-accent`;
const fieldOf = (err?: string) =>
  err ? `${baseField} border border-destructive ring-1 ring-destructive` : field;

type Errors = Record<string, string>;

function Field({
  label,
  required,
  error,
  hint,
  className = "",
  children,
}: {
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  className?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <label className={`text-sm ${className}`}>
      <span className="mb-1 block text-muted-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

function validDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00`);
  return !Number.isNaN(d.getTime());
}
function inPast(v: string) {
  return new Date(`${v}T00:00:00`).getTime() <= Date.now();
}

function validateCompany(f: Record<string, any>): Errors {
  const e: Errors = {};
  const get = (k: string) => String(f[k] ?? "").trim();
  if (!get("name")) e['name'] = "Informe a razão social ou o nome da empresa.";
  if (!get("segment")) e['segment'] = "Escolha um segmento.";
  if (!get("country")) e['country'] = "Informe o país.";
  if (get("cnpj") && !isValidCnpj(get("cnpj"))) e['cnpj'] = "CNPJ incompleto: são 14 dígitos.";
  if (get("email") && !isValidEmail(get("email")))
    e['email'] = "E-mail inválido. Exemplo: contato@empresa.com.br";
  const phone = get("phone");
  if (phone && phone !== "+55" && !isValidPhone(phone)) e['phone'] = PHONE_ERROR;
  if (get("zip") && !isValidCep(get("zip"))) e['zip'] = "CEP inválido: informe os 8 dígitos.";
  if (!isValidWebsite(get("website"))) e['website'] = "Site inválido. Exemplo: empresa.com.br";
  const founded = get("founded_on");
  if (founded && (!validDate(founded) || !inPast(founded)))
    e['founded_on'] = "Data inválida ou no futuro.";
  const emp = get("employees");
  if (emp && !/^\d{1,7}$/.test(emp)) e['employees'] = "Use apenas números inteiros.";
  return e;
}

function validateContact(f: Record<string, any>): Errors {
  const e: Errors = {};
  const get = (k: string) => String(f[k] ?? "").trim();
  if (get("full_name").length < 2) e['full_name'] = "Informe o nome completo.";
  if (!get("email")) e['email'] = "Informe o e-mail.";
  else if (!isValidEmail(get("email"))) e['email'] = "E-mail inválido. Exemplo: nome@empresa.com.br";
  for (const k of ["phone", "whatsapp"]) {
    const v = get(k);
    if (v && v !== "+55" && !isValidPhone(v)) e[k] = PHONE_ERROR;
  }
  const url = get("linkedin_url");
  if (url && !/^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(url))
    e['linkedin_url'] = "Informe um endereço do LinkedIn. Exemplo: linkedin.com/in/nome";
  const birth = get("birth_date");
  if (birth && (!validDate(birth) || !inPast(birth))) e['birth_date'] = "Data inválida ou no futuro.";
  return e;
}
const btn = "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground";
const btnGhost = "rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent";

const STATUS = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "cliente", label: "Cliente" },
  { value: "inativo", label: "Inativo" },
];
const KINDS = [
  { value: "reuniao", label: "Reunião" },
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "proposta", label: "Proposta" },
  { value: "visita", label: "Visita" },
  { value: "nota", label: "Nota" },
];

function fmtDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}
function fmtDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function emptyCompany() {
  return {
    name: "",
    trade_name: "",
    cnpj: "",
    segment: "",
    size: "pme",
    status: "lead",
    country: "Brasil",
    state: "",
    city: "",
    district: "",
    zip: "",
    address: "",
    website: "",
    email: "",
    phone: "+55 ",
    founded_on: "",
    employees: "",
    revenue_range: "",
    owner_name: "",
    tags: "",
    notes: "",
    birthday_email: true,
  } as Record<string, any>;
}

function emptyContact() {
  return {
    full_name: "",
    role_title: "",
    department: "",
    email: "",
    phone: "+55 ",
    whatsapp: "+55 ",
    linkedin_url: "",
    birth_date: "",
    decision_maker: false,
    email_opt_in: true,
    birthday_email: true,
    language: "pt",
    active: true,
    notes: "",
  } as Record<string, any>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
      <div className="mt-10 w-full max-w-3xl rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-accent">
            Fechar
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function AdminCrm() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<Record<string, any> | null>(null);
  const [contactForm, setContactForm] = useState<Record<string, any> | null>(null);
  const [dateForm, setDateForm] = useState<Record<string, any> | null>(null);
  const [noteForm, setNoteForm] = useState<Record<string, any> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [companyErrors, setCompanyErrors] = useState<Errors>({});
  const [contactErrors, setContactErrors] = useState<Errors>({});
  const [cepBusy, setCepBusy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiFor, setAiFor] = useState("");

  /** Preenche faturamento e tags com pesquisa de IA a partir do nome fantasia. */
  async function fillCompanyWithAi(force = false) {
    const form = companyForm ?? {};
    const tradeName = String(form['trade_name'] ?? "").trim();
    if (tradeName.length < 2) return;
    if (!force && aiFor === tradeName) return;
    setAiFor(tradeName);
    setAiBusy(true);
    try {
      const res = await draftCrmCompanyProfile({
        data: {
          tradeName,
          legalName: String(form['name'] ?? ""),
          segment: String(form['segment'] ?? ""),
          city: String(form['city'] ?? ""),
          country: String(form['country'] ?? "Brasil"),
          website: String(form['website'] ?? ""),
        },
      });
      if (res.ok) {
        setCompanyForm((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (force || !String(next['revenue_range'] ?? "").trim()) {
            if (res.revenue_range) next['revenue_range'] = res.revenue_range;
          }
          if (force || !String(next['tags'] ?? "").trim()) {
            if (res.tags.length) next['tags'] = res.tags.join(", ");
          }
          return next;
        });
      }
    } catch {
      /* sugestão opcional: falha não bloqueia o cadastro */
    } finally {
      setAiBusy(false);
    }
  }

  function setCompanyField(key: string, value: any) {
    setCompanyForm((prev) => ({ ...(prev ?? {}), [key]: value }));
    setCompanyErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }
  function setContactField(key: string, value: any) {
    setContactForm((prev) => ({ ...(prev ?? {}), [key]: value }));
    setContactErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }
  async function fillFromCep(raw: string) {
    const masked = formatCep(raw);
    setCompanyField("zip", masked);
    if (!isValidCep(masked)) return;
    setCepBusy(true);
    const found = await lookupCep(masked);
    setCepBusy(false);
    if (!found) {
      setCompanyErrors((prev) => ({ ...prev, zip: "CEP não encontrado." }));
      return;
    }
    setCompanyForm((prev) => ({
      ...(prev ?? {}),
      zip: masked,
      address: found.street || prev?.['address'] || "",
      district: found.district || prev?.['district'] || "",
      city: found.city,
      state: found.state,
      country: "Brasil",
    }));
  }

  const companies = useQuery({ queryKey: ["crm-companies"], queryFn: () => listCrmCompanies(), retry: false });
  const agenda = useQuery({ queryKey: ["crm-agenda"], queryFn: () => upcomingCrmDates(), retry: false });
  const detail = useQuery({
    queryKey: ["crm-company", selected],
    queryFn: () => getCrmCompany({ data: { id: selected as string } }),
    enabled: Boolean(selected),
    retry: false,
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (companies.data ?? []) as any[];
    if (!term) return list;
    return list.filter((c) =>
      [c.name, c.trade_name, c.segment, c.city, c.state, c.country, c.status, c.cnpj]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term)),
    );
  }, [companies.data, search]);

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["crm-companies"] });
    void qc.invalidateQueries({ queryKey: ["crm-agenda"] });
    if (selected) void qc.invalidateQueries({ queryKey: ["crm-company", selected] });
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, done: () => void) {
    setBusy(true);
    setError("");
    try {
      const res = await action();
      if (!res.ok) setError(res.error ?? "Não foi possível salvar.");
      else {
        refresh();
        done();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  async function removeRecord(table: string, id: string, label: string) {
    if (!window.confirm(`Excluir ${label}?`)) return;
    await run(() => deleteCrmRecord({ data: { table: table as any, id } }), () => {
      if (table === "crm_companies" && selected === id) setSelected(null);
    });
  }

  async function openQuote(path: string, name: string) {
    const res = await quoteFileUrl({ data: { path, name } });
    if (res.url) window.open(res.url, "_blank", "noopener");
  }

  const d = detail.data && (detail.data as any).ok ? (detail.data as any) : null;

  return (
    <AdminShell
      title="CRM"
      description="Empresas e pessoas, datas importantes com e-mail automático de aniversário, histórico de interações, orçamentos enviados e áreas do site navegadas."
      requireAdmin
    >
      {error && <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

      {/* AGENDA */}
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="font-display text-base font-bold">Próximas datas (60 dias)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Aniversários de empresas e pessoas recebem e-mail automático de parabéns no dia, quando há e-mail cadastrado.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(agenda.data ?? []).length === 0 && (
            <span className="text-sm text-muted-foreground">Nenhuma data nos próximos 60 dias.</span>
          )}
          {((agenda.data ?? []) as any[]).slice(0, 20).map((item, i) => (
            <span key={i} className="rounded-full border border-border px-3 py-1 text-xs">
              <strong>{fmtDate(item.date)}</strong> · {item.label}
              {item.company ? ` — ${item.company}` : ""} ({item.inDays === 0 ? "hoje" : `em ${item.inDays} dia(s)`})
            </span>
          ))}
        </div>
      </section>

      {/* LISTA */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-base font-bold">Empresas cadastradas</h2>
          <span className="text-sm text-muted-foreground">{rows.length} registro(s)</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, segmento, cidade…"
            className={`${field} ml-auto max-w-xs`}
          />
          <button className={btn} onClick={() => { setCompanyErrors({}); setCompanyForm(emptyCompany()); }}>
            Nova empresa
          </button>
        </div>

        {companies.isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>}

        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Porte</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Pessoas</th>
                <th className="px-4 py-3">Fundação</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c: any) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">
                    <button className="text-left hover:text-accent" onClick={() => setSelected(c.id)}>
                      {c.name}
                    </button>
                    {c.trade_name && <span className="block text-xs text-muted-foreground">{c.trade_name}</span>}
                  </td>
                  <td className="px-4 py-3">{c.segment || "—"}</td>
                  <td className="px-4 py-3">{c.size === "corporacao" ? "Corporação" : "PME"}</td>
                  <td className="px-4 py-3 capitalize">{c.status}</td>
                  <td className="px-4 py-3">{[c.city, c.state, c.country].filter(Boolean).join("/") || "—"}</td>
                  <td className="px-4 py-3">{c.contacts?.length ?? 0}</td>
                  <td className="px-4 py-3">{fmtDate(c.founded_on)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-xs text-accent hover:underline" onClick={() => setSelected(c.id)}>
                      Abrir
                    </button>
                    <button
                      className="ml-3 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeRecord("crm_companies", c.id, `a empresa ${c.name}`)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {!companies.isLoading && rows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={8}>
                    Nenhuma empresa cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* DETALHE */}
      {selected && (
        <section className="mt-10 rounded-xl border border-border bg-background p-6">
          {detail.isLoading && <p className="text-sm text-muted-foreground">Carregando ficha…</p>}
          {d && (
            <>
              <div className="flex flex-wrap items-start gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">{d.company.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[d.company.segment, d.company.size === "corporacao" ? "Corporação" : "PME", d.company.status]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[d.company.email, d.company.phone, d.company.website].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fundação: {fmtDate(d.company.founded_on)} · {[d.company.city, d.company.state, d.company.country].filter(Boolean).join("/")}
                  </p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button
                    className={btnGhost}
                    onClick={() => {
                      setCompanyErrors({});
                      setCompanyForm({
                        ...d.company,
                        founded_on: d.company.founded_on ?? "",
                        employees: d.company.employees ?? "",
                        tags: (d.company.tags ?? []).join(", "),
                      });
                    }}
                  >
                    Editar empresa
                  </button>
                  <button className={btnGhost} onClick={() => { setContactErrors({}); setContactForm(emptyContact()); }}>
                    Nova pessoa
                  </button>
                  <button
                    className={btnGhost}
                    onClick={() => setDateForm({ label: "", event_date: "", recurring: true, notify_email: false, notes: "", contact_id: "" })}
                  >
                    Nova data
                  </button>
                  <button
                    className={btn}
                    onClick={() =>
                      setNoteForm({ kind: "reuniao", title: "", body: "", occurred_at: new Date().toISOString().slice(0, 16), contact_id: "" })
                    }
                  >
                    Registrar interação
                  </button>
                  <button className="text-sm text-muted-foreground hover:text-accent" onClick={() => setSelected(null)}>
                    Fechar ficha
                  </button>
                </div>
              </div>

              {d.company.notes && <p className="mt-4 whitespace-pre-line text-sm">{d.company.notes}</p>}

              {/* PESSOAS */}
              <h3 className="mt-8 font-display text-base font-bold">Pessoas da empresa</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {d.contacts.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pessoa cadastrada.</p>}
                {d.contacts.map((p: any) => (
                  <div key={p.id} className="rounded-lg border border-border p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {p.full_name} {p.decision_maker && <span className="text-xs text-accent">· decisor</span>}
                        </p>
                        <p className="text-muted-foreground">{[p.role_title, p.department].filter(Boolean).join(" — ") || "—"}</p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          className="text-accent hover:underline"
                          onClick={() => { setContactErrors({}); setContactForm({ ...p, birth_date: p.birth_date ?? "" }); }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeRecord("crm_contacts", p.id, p.full_name)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-muted-foreground">
                      {[p.email, p.phone, p.whatsapp].filter(Boolean).join(" · ") || "sem contato"}
                    </p>
                    <p className="text-muted-foreground">Aniversário: {fmtDate(p.birth_date)}</p>
                  </div>
                ))}
              </div>

              {/* DATAS */}
              <h3 className="mt-8 font-display text-base font-bold">Datas importantes</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {d.dates.length === 0 && <li className="text-muted-foreground">Nenhuma data cadastrada.</li>}
                {d.dates.map((e: any) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-4 py-2">
                    <strong>{fmtDate(e.event_date)}</strong>
                    <span>{e.label}</span>
                    {e.recurring && <span className="text-xs text-muted-foreground">(todo ano)</span>}
                    {e.notify_email && <span className="text-xs text-accent">e-mail automático</span>}
                    <button
                      className="ml-auto text-xs text-accent hover:underline"
                      onClick={() => setDateForm({ ...e, contact_id: e.contact_id ?? "" })}
                    >
                      Editar
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => removeRecord("crm_dates", e.id, e.label)}
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>

              {/* INTERAÇÕES */}
              <h3 className="mt-8 font-display text-base font-bold">Histórico de interações</h3>
              <ul className="mt-3 space-y-3 text-sm">
                {d.interactions.length === 0 && <li className="text-muted-foreground">Nenhuma interação registrada.</li>}
                {d.interactions.map((i: any) => (
                  <li key={i.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs capitalize">{i.kind}</span>
                      <strong>{i.title}</strong>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(i.occurred_at)}</span>
                      {i.author_name && <span className="text-xs text-muted-foreground">· {i.author_name}</span>}
                      <button
                        className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => removeRecord("crm_interactions", i.id, i.title)}
                      >
                        Excluir
                      </button>
                    </div>
                    {i.body && <p className="mt-2 whitespace-pre-line text-muted-foreground">{i.body}</p>}
                  </li>
                ))}
              </ul>

              {/* ORÇAMENTOS */}
              <h3 className="mt-8 font-display text-base font-bold">Orçamentos enviados</h3>
              <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Data</th>
                      <th className="px-4 py-2">Serviço</th>
                      <th className="px-4 py-2">Cliente</th>
                      <th className="px-4 py-2">Valor</th>
                      <th className="px-4 py-2">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.quotes.length === 0 && (
                      <tr>
                        <td className="px-4 py-4 text-muted-foreground" colSpan={5}>
                          Nenhum orçamento encontrado para esta empresa.
                        </td>
                      </tr>
                    )}
                    {d.quotes.map((q: any) => (
                      <tr key={q.id} className="border-t border-border">
                        <td className="px-4 py-2">{fmtDate(q.created_at)}</td>
                        <td className="px-4 py-2">{q.service_title}</td>
                        <td className="px-4 py-2">{q.client_name}</td>
                        <td className="px-4 py-2">
                          {q.currency} {Number(q.total_currency ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2">
                          <button className="text-accent hover:underline" onClick={() => openQuote(q.file_path, q.file_name)}>
                            Baixar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* SOLICITAÇÕES */}
              <h3 className="mt-8 font-display text-base font-bold">Solicitações pelo site</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {d.leads.length === 0 && <li className="text-muted-foreground">Nenhuma solicitação vinculada aos e-mails cadastrados.</li>}
                {d.leads.map((l: any) => (
                  <li key={l.id} className="rounded-lg border border-border px-4 py-2">
                    <strong>{fmtDateTime(l.created_at)}</strong> — {l.service_title ?? l.service_slug} ({l.name})
                    {l.message && <p className="text-muted-foreground">{l.message}</p>}
                  </li>
                ))}
              </ul>

              {/* NAVEGAÇÃO */}
              <h3 className="mt-8 font-display text-base font-bold">Áreas navegadas no site</h3>
              <ul className="mt-3 space-y-1 text-sm">
                {d.events.length === 0 && (
                  <li className="text-muted-foreground">
                    Sem registros ainda. A navegação é vinculada quando a pessoa envia um formulário com o mesmo e-mail.
                  </li>
                )}
                {d.events.map((e: any) => (
                  <li key={e.id} className="flex flex-wrap gap-2 border-b border-border/60 py-1">
                    <span className="text-muted-foreground">{fmtDateTime(e.created_at)}</span>
                    <span className="rounded-full bg-secondary px-2 text-xs capitalize">{e.kind}</span>
                    <span>{e.label || e.path}</span>
                    <span className="text-xs text-muted-foreground">{e.path}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {/* FORM EMPRESA */}
      {companyForm && (
        <Modal title={companyForm['id'] ? "Editar empresa" : "Nova empresa"} onClose={() => setCompanyForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Razão social / nome" required error={companyErrors['name']}>
              <input
                className={fieldOf(companyErrors['name'])}
                value={companyForm['name'] ?? ""}
                onChange={(e) => setCompanyField("name", e.target.value)}
              />
            </Field>
            <Field label="Nome fantasia" required error={companyErrors['trade_name']}>
              <input
                className={fieldOf(companyErrors['trade_name'])}
                value={companyForm['trade_name'] ?? ""}
                onChange={(e) => setCompanyField("trade_name", e.target.value)}
                onBlur={() => void fillCompanyWithAi()}
              />
            </Field>
            <Field label="CNPJ" error={companyErrors['cnpj']} hint="00.000.000/0000-00">
              <input
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                className={fieldOf(companyErrors['cnpj'])}
                value={companyForm['cnpj'] ?? ""}
                onChange={(e) => setCompanyField("cnpj", formatCnpj(e.target.value))}
              />
            </Field>
            <Field label="Segmento" required error={companyErrors['segment']}>
              <select
                className={fieldOf(companyErrors['segment'])}
                value={companyForm['segment'] ?? ""}
                onChange={(e) => setCompanyField("segment", e.target.value)}
              >
                <option value="">Selecione…</option>
                {CRM_SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="CEP"
              error={companyErrors['zip']}
              hint={cepBusy ? "Buscando endereço…" : "Digite o CEP para preencher o endereço automaticamente."}
            >
              <input
                inputMode="numeric"
                placeholder="00000-000"
                className={fieldOf(companyErrors['zip'])}
                value={companyForm['zip'] ?? ""}
                onChange={(e) => void fillFromCep(e.target.value)}
              />
            </Field>
            <Field label="País" required error={companyErrors['country']}>
              <input
                className={fieldOf(companyErrors['country'])}
                value={companyForm['country'] ?? ""}
                onChange={(e) => setCompanyField("country", e.target.value)}
              />
            </Field>
            <Field label="Endereço (rua e número)">
              <input
                className={field}
                value={companyForm['address'] ?? ""}
                onChange={(e) => setCompanyField("address", e.target.value)}
              />
            </Field>
            <Field label="Bairro">
              <input
                className={field}
                value={companyForm['district'] ?? ""}
                onChange={(e) => setCompanyField("district", e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <input
                className={field}
                value={companyForm['city'] ?? ""}
                onChange={(e) => setCompanyField("city", e.target.value)}
              />
            </Field>
            <Field label="Estado">
              <input
                className={field}
                value={companyForm['state'] ?? ""}
                onChange={(e) => setCompanyField("state", e.target.value)}
              />
            </Field>

            <Field label="Site" error={companyErrors['website']} hint="empresa.com.br">
              <input
                className={fieldOf(companyErrors['website'])}
                value={companyForm['website'] ?? ""}
                onChange={(e) => setCompanyField("website", e.target.value)}
              />
            </Field>
            <Field label="E-mail principal" error={companyErrors['email']}>
              <input
                type="email"
                placeholder="contato@empresa.com.br"
                className={fieldOf(companyErrors['email'])}
                value={companyForm['email'] ?? ""}
                onChange={(e) => setCompanyField("email", e.target.value)}
              />
            </Field>
            <Field label="Telefone / WhatsApp" error={companyErrors['phone']} hint={PHONE_PLACEHOLDER}>
              <input
                inputMode="tel"
                placeholder={PHONE_PLACEHOLDER}
                className={fieldOf(companyErrors['phone'])}
                value={companyForm['phone'] ?? ""}
                onChange={(e) => setCompanyField("phone", formatPhone(e.target.value))}
              />
            </Field>
            <Field
              label="Faixa de faturamento mensal (média dos últimos 12 meses)"
              hint={aiBusy ? "Pesquisando com IA…" : "Preenchido por IA a partir do nome fantasia; pode editar."}
            >
              <input
                className={field}
                placeholder="Ex.: R$ 500 mil a R$ 1 milhão/mês"
                value={companyForm['revenue_range'] ?? ""}
                onChange={(e) => setCompanyField("revenue_range", e.target.value)}
              />
            </Field>
            <Field label="Nome do principal executivo">
              <input
                className={field}
                value={companyForm['owner_name'] ?? ""}
                onChange={(e) => setCompanyField("owner_name", e.target.value)}
              />
            </Field>
            <Field label="Cargo do principal executivo">
              <input
                className={field}
                placeholder="Ex.: CEO, Diretor-presidente"
                value={companyForm['owner_title'] ?? ""}
                onChange={(e) => setCompanyField("owner_title", e.target.value)}
              />
            </Field>
            <Field
              label="Tags (separadas por vírgula)"
              hint={aiBusy ? "Pesquisando com IA…" : "Preenchidas por IA a partir do nome fantasia; pode editar."}
            >
              <input
                className={field}
                value={companyForm['tags'] ?? ""}
                onChange={(e) => setCompanyField("tags", e.target.value)}
              />
            </Field>

            <Field label="Data de fundação (aniversário)" error={companyErrors['founded_on']}>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={fieldOf(companyErrors['founded_on'])}
                value={companyForm['founded_on'] ?? ""}
                onChange={(e) => setCompanyField("founded_on", e.target.value)}
              />
            </Field>
            <Field label="Nº de funcionários" error={companyErrors['employees']}>
              <input
                type="number"
                min={0}
                className={fieldOf(companyErrors['employees'])}
                value={companyForm['employees'] ?? ""}
                onChange={(e) => setCompanyField("employees", e.target.value)}
              />
            </Field>
            <Field label="Porte" required>
              <select
                className={field}
                value={companyForm['size']}
                onChange={(e) => setCompanyField("size", e.target.value)}
              >
                <option value="pme">Pequena ou média empresa</option>
                <option value="corporacao">Corporação</option>
              </select>
            </Field>
            <Field label="Status" required>
              <select
                className={field}
                value={companyForm['status']}
                onChange={(e) => setCompanyField("status", e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea
                rows={4}
                className={field}
                value={companyForm['notes'] ?? ""}
                onChange={(e) => setCompanyField("notes", e.target.value)}
              />
            </Field>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(companyForm['birthday_email'])}
                onChange={(e) => setCompanyField("birthday_email", e.target.checked)}
              />
              Enviar e-mail automático no aniversário da empresa
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className={btn}
              disabled={busy}
              onClick={() => {
                const v = validateCompany(companyForm);
                setCompanyErrors(v);
                if (Object.keys(v).length > 0) return;
                void run(
                  () =>
                    saveCrmCompany({
                      data: {
                        ...(companyForm['id'] ? { id: companyForm['id'] } : {}),
                        name: companyForm['name'] ?? "",
                        trade_name: companyForm['trade_name'] ?? "",
                        cnpj: companyForm['cnpj'] ?? "",
                        segment: companyForm['segment'] ?? "",
                        size: companyForm['size'] ?? "pme",
                        status: companyForm['status'] ?? "lead",
                        country: companyForm['country'] ?? "",
                        state: companyForm['state'] ?? "",
                        city: companyForm['city'] ?? "",
                        district: companyForm['district'] ?? "",
                        zip: companyForm['zip'] ?? "",
                        address: companyForm['address'] ?? "",
                        website: companyForm['website'] ?? "",
                        email: companyForm['email'] ?? "",
                        phone: companyForm['phone'] ?? "",
                        founded_on: companyForm['founded_on'] || null,
                        employees: companyForm['employees'] === "" || companyForm['employees'] == null ? null : Number(companyForm['employees']),
                        revenue_range: companyForm['revenue_range'] ?? "",
                        owner_name: companyForm['owner_name'] ?? "",
                        owner_title: companyForm['owner_title'] ?? "",
                        tags: String(companyForm['tags'] ?? "")
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                        notes: companyForm['notes'] ?? "",
                        birthday_email: Boolean(companyForm['birthday_email']),
                      } as any,
                    }),
                  () => setCompanyForm(null),
                );
              }}
            >
              {busy ? "Salvando…" : "Salvar empresa"}
            </button>
            <button className={btnGhost} onClick={() => setCompanyForm(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* FORM PESSOA */}
      {contactForm && selected && (
        <Modal title={contactForm['id'] ? "Editar pessoa" : "Nova pessoa"} onClose={() => setContactForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome completo" required error={contactErrors['full_name']}>
              <input
                className={fieldOf(contactErrors['full_name'])}
                value={contactForm['full_name'] ?? ""}
                onChange={(e) => setContactField("full_name", e.target.value)}
              />
            </Field>
            <Field label="Função / cargo">
              <input
                className={field}
                value={contactForm['role_title'] ?? ""}
                onChange={(e) => setContactField("role_title", e.target.value)}
              />
            </Field>
            <Field label="Área / departamento">
              <input
                className={field}
                value={contactForm['department'] ?? ""}
                onChange={(e) => setContactField("department", e.target.value)}
              />
            </Field>
            <Field label="E-mail" required error={contactErrors['email']}>
              <input
                type="email"
                placeholder="nome@empresa.com.br"
                className={fieldOf(contactErrors['email'])}
                value={contactForm['email'] ?? ""}
                onChange={(e) => setContactField("email", e.target.value)}
              />
            </Field>
            <Field label="Telefone" error={contactErrors['phone']} hint={PHONE_PLACEHOLDER}>
              <input
                inputMode="tel"
                placeholder={PHONE_PLACEHOLDER}
                className={fieldOf(contactErrors['phone'])}
                value={contactForm['phone'] ?? ""}
                onChange={(e) => setContactField("phone", formatPhone(e.target.value))}
              />
            </Field>
            <Field label="WhatsApp" error={contactErrors['whatsapp']} hint={PHONE_PLACEHOLDER}>
              <input
                inputMode="tel"
                placeholder={PHONE_PLACEHOLDER}
                className={fieldOf(contactErrors['whatsapp'])}
                value={contactForm['whatsapp'] ?? ""}
                onChange={(e) => setContactField("whatsapp", formatPhone(e.target.value))}
              />
            </Field>
            <Field label="LinkedIn" error={contactErrors['linkedin_url']} hint="linkedin.com/in/nome">
              <input
                className={fieldOf(contactErrors['linkedin_url'])}
                value={contactForm['linkedin_url'] ?? ""}
                onChange={(e) => setContactField("linkedin_url", e.target.value)}
              />
            </Field>
            <Field label="Data de nascimento" error={contactErrors['birth_date']}>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                className={fieldOf(contactErrors['birth_date'])}
                value={contactForm['birth_date'] ?? ""}
                onChange={(e) => setContactField("birth_date", e.target.value)}
              />
            </Field>
            <Field label="Observações" className="sm:col-span-2">
              <textarea
                rows={3}
                className={field}
                value={contactForm['notes'] ?? ""}
                onChange={(e) => setContactField("notes", e.target.value)}
              />
            </Field>
            {([
              ["decision_maker", "É decisor na empresa"],
              ["email_opt_in", "Aceita receber e-mails"],
              ["birthday_email", "Enviar e-mail de aniversário"],
              ["active", "Contato ativo"],
            ] as [string, string][]).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(contactForm[key])}
                  onChange={(e) => setContactField(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className={btn}
              disabled={busy}
              onClick={() => {
                const v = validateContact(contactForm);
                setContactErrors(v);
                if (Object.keys(v).length > 0) return;
                void run(
                  () =>
                    saveCrmContact({
                      data: {
                        ...(contactForm['id'] ? { id: contactForm['id'] } : {}),
                        company_id: selected,
                        full_name: contactForm['full_name'] ?? "",
                        role_title: contactForm['role_title'] ?? "",
                        department: contactForm['department'] ?? "",
                        email: contactForm['email'] ?? "",
                        phone: contactForm['phone'] ?? "",
                        whatsapp: contactForm['whatsapp'] ?? "",
                        linkedin_url: contactForm['linkedin_url'] ?? "",
                        birth_date: contactForm['birth_date'] || null,
                        decision_maker: Boolean(contactForm['decision_maker']),
                        email_opt_in: Boolean(contactForm['email_opt_in']),
                        birthday_email: Boolean(contactForm['birthday_email']),
                        language: contactForm['language'] ?? "pt",
                        active: Boolean(contactForm['active']),
                        notes: contactForm['notes'] ?? "",
                      } as any,
                    }),
                  () => setContactForm(null),
                );
              }}
            >
              {busy ? "Salvando…" : "Salvar pessoa"}
            </button>
            <button className={btnGhost} onClick={() => setContactForm(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* FORM DATA */}
      {dateForm && selected && (
        <Modal title={dateForm['id'] ? "Editar data" : "Nova data importante"} onClose={() => setDateForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Descrição *</span>
              <input
                className={field}
                value={dateForm['label'] ?? ""}
                onChange={(e) => setDateForm({ ...dateForm, label: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Data *</span>
              <input
                type="date"
                className={field}
                value={dateForm['event_date'] ?? ""}
                onChange={(e) => setDateForm({ ...dateForm, event_date: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Pessoa relacionada</span>
              <select
                className={field}
                value={dateForm['contact_id'] ?? ""}
                onChange={(e) => setDateForm({ ...dateForm, contact_id: e.target.value })}
              >
                <option value="">—</option>
                {(d?.contacts ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1 block text-muted-foreground">Observações</span>
              <textarea
                rows={3}
                className={field}
                value={dateForm['notes'] ?? ""}
                onChange={(e) => setDateForm({ ...dateForm, notes: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(dateForm['recurring'])}
                onChange={(e) => setDateForm({ ...dateForm, recurring: e.target.checked })}
              />
              Repete todo ano
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(dateForm['notify_email'])}
                onChange={(e) => setDateForm({ ...dateForm, notify_email: e.target.checked })}
              />
              Lembrar por e-mail
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className={btn}
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    saveCrmDate({
                      data: {
                        ...(dateForm['id'] ? { id: dateForm['id'] } : {}),
                        company_id: selected,
                        contact_id: dateForm['contact_id'] || null,
                        label: dateForm['label'] ?? "",
                        event_date: dateForm['event_date'] ?? "",
                        recurring: Boolean(dateForm['recurring']),
                        notify_email: Boolean(dateForm['notify_email']),
                        notes: dateForm['notes'] ?? "",
                      } as any,
                    }),
                  () => setDateForm(null),
                )
              }
            >
              {busy ? "Salvando…" : "Salvar data"}
            </button>
            <button className={btnGhost} onClick={() => setDateForm(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* FORM INTERAÇÃO */}
      {noteForm && selected && (
        <Modal title="Registrar interação" onClose={() => setNoteForm(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Tipo</span>
              <select
                className={field}
                value={noteForm['kind']}
                onChange={(e) => setNoteForm({ ...noteForm, kind: e.target.value })}
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Quando</span>
              <input
                type="datetime-local"
                className={field}
                value={noteForm['occurred_at'] ?? ""}
                onChange={(e) => setNoteForm({ ...noteForm, occurred_at: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Pessoa</span>
              <select
                className={field}
                value={noteForm['contact_id'] ?? ""}
                onChange={(e) => setNoteForm({ ...noteForm, contact_id: e.target.value })}
              >
                <option value="">—</option>
                {(d?.contacts ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Assunto *</span>
              <input
                className={field}
                value={noteForm['title'] ?? ""}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              />
            </label>
            <label className="sm:col-span-2 text-sm">
              <span className="mb-1 block text-muted-foreground">Detalhes</span>
              <textarea
                rows={5}
                className={field}
                value={noteForm['body'] ?? ""}
                onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              className={btn}
              disabled={busy}
              onClick={() =>
                run(
                  () =>
                    saveCrmInteraction({
                      data: {
                        company_id: selected,
                        contact_id: noteForm['contact_id'] || null,
                        kind: noteForm['kind'] ?? "nota",
                        title: noteForm['title'] ?? "",
                        body: noteForm['body'] ?? "",
                        occurred_at: new Date(noteForm['occurred_at'] || Date.now()).toISOString(),
                      } as any,
                    }),
                  () => setNoteForm(null),
                )
              }
            >
              {busy ? "Salvando…" : "Salvar interação"}
            </button>
            <button className={btnGhost} onClick={() => setNoteForm(null)}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}
