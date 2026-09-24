import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Globe, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  analyzeClientSite,
  draftPresentationContent,
  prefillFromScope,
  getPresentationContext,
  savePresentation,
  getPresentation,
  getPresentationFileUrl,
  type PresentationDraft,
} from "@/lib/presentation.functions";
import { SCOPE_QUESTIONS } from "@/lib/scope-form";
import { activeSignals } from "@/lib/scope-guide";
import { BASE_BLOCKS, FAMILY_BLOCKS, DEFAULT_MODULES } from "@/lib/diagnostic-catalog";
import { buildDeckFiles, prepareImage, type DeckInput } from "@/lib/presentation-deck";
import { buildProjectClients } from "@/lib/projects.functions";

export const Route = createFileRoute("/admin/projetos_/apresentacao")({
  head: () => ({
    meta: [
      { title: "Material para Apresentação — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s["id"] === "string" ? { id: s["id"] } : {}),
  component: PresentationPage,
});

const DIAG_Q = new Map([...BASE_BLOCKS, ...Object.values(FAMILY_BLOCKS).flat()].map((q) => [q.id, q.question]));
const MOD_LABEL = new Map(DEFAULT_MODULES.map((m) => [m.id, m.label]));
const txt = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v)).trim();

function scopeText(s: any): string {
  const answers = (s?.answers ?? {}) as Record<string, string>;
  const comments = (s?.comments ?? {}) as Record<string, string>;
  const out: string[] = ["Escopo Inicial — respostas:"];
  for (const q of SCOPE_QUESTIONS) {
    const a = answers[q.id];
    if (a) out.push(`- ${q.question} ${a}${comments[q.id] ? ` (comentário: ${comments[q.id]})` : ""}`);
  }
  const sig = activeSignals(answers);
  if (sig.length) {
    out.push("Guia do Consultor — sinais e ações:");
    for (const g of sig) out.push(`- ${g.signal}: ${g.meaning} Ação: ${g.action}`);
  }
  if (txt(s?.notes)) out.push(`Análise do consultor: ${txt(s.notes)}`);
  return out.join("\n");
}

function diagText(d: any): string {
  const out: string[] = [`Diagnóstico Detalhado (${d?.service_title || d?.title || ""}):`];
  const answers = (d?.answers ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(answers)) {
    const a = txt(v);
    if (a) out.push(`- ${DIAG_Q.get(k) ?? k} ${a}`);
  }
  const notes = d?.consultant_notes;
  if (notes && typeof notes === "object") {
    for (const [k, v] of Object.entries(notes)) if (txt(v)) out.push(`- Nota do consultor (${DIAG_Q.get(k) ?? k}): ${txt(v)}`);
  } else if (txt(notes)) out.push(`Notas do consultor: ${txt(notes)}`);
  const mods = Array.isArray(d?.modules) ? d.modules.filter((m: any) => m?.include) : [];
  if (mods.length) out.push(`Módulos previstos: ${mods.map((m: any) => m.label || MOD_LABEL.get(m.id) || m.id).join("; ")}`);
  return out.join("\n");
}

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function PresentationPage() {
  const ctx = useQuery({ queryKey: ["presentation-context"], queryFn: () => getPresentationContext(), retry: false });
  const [site, setSite] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [offerings, setOfferings] = useState("");
  const [highlights, setHighlights] = useState("");
  const [audience, setAudience] = useState("");
  const [logo, setLogo] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [useQuote, setUseQuote] = useState(false);
  const [quoteId, setQuoteId] = useState("");
  const [draft, setDraft] = useState<PresentationDraft | null>(null);
  const [pick, setPick] = useState("");
  const [useScope, setUseScope] = useState(false);
  const [scopeId, setScopeId] = useState("");
  const [useDiag, setUseDiag] = useState(false);
  const [diagId, setDiagId] = useState("");

  const clientOptions = useMemo(() => {
    const d = ctx.data;
    if (!d) return [];
    return buildProjectClients(d.crm, d.scopes, d.diagnostics);
  }, [ctx.data]);

  const search = Route.useSearch();
  const [savedId, setSavedId] = useState<string | undefined>(search.id);
  const [saved, setSaved] = useState(false);
  const [loadedId, setLoadedId] = useState("");
  useEffect(() => {
    if (!search.id || loadedId === search.id) return;
    setLoadedId(search.id);
    void getPresentation({ data: { id: search.id } }).then((r) => {
      const p = r?.payload as any;
      if (!p || !p.name) { toast.info("Esta apresentação é antiga e não tem dados salvos para edição."); return; }
      setSite(p.site ?? ""); setName(p.name ?? ""); setSector(p.sector ?? ""); setLocation(p.location ?? "");
      setDescription(p.description ?? ""); setOfferings(p.offerings ?? ""); setHighlights(p.highlights ?? "");
      setAudience(p.audience ?? ""); setLogo(p.logo ?? ""); setServiceSlug(p.serviceSlug ?? "");
      setUseQuote(!!p.useQuote); setQuoteId(p.quoteId ?? ""); setUseScope(!!p.useScope); setScopeId(p.scopeId ?? "");
      setUseDiag(!!p.useDiag); setDiagId(p.diagId ?? ""); setDraft(p.draft ?? null); setSavedId(search.id); setSaved(true);
      toast.success("Apresentação carregada para edição.");
    }).catch((e) => toast.error((e as Error).message));
  }, [search.id, loadedId]);

  async function openFile(format: "pptx" | "pdf") {
    if (!savedId) return;
    try {
      const { url } = await getPresentationFileUrl({ data: { id: savedId, format } });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function pickClient(key: string) {
    setPick(key);
    const o = clientOptions.find((x) => x.key === key);
    if (!o) return;
    setName(o.name);
    if (o.sector) setSector(o.sector);
    if (o.location) setLocation(o.location);
    if (o.website && !site) setSite(o.website);
    const [kind, id] = key.split(":");
    const n = o.name.trim().toLowerCase();
    const sc = kind === "scope" ? id : ctx.data?.scopes.find((s: any) => String(s.company).trim().toLowerCase() === n)?.id;
    const dg = kind === "diag" ? id : ctx.data?.diagnostics.find((g: any) => String(g.client_name).trim().toLowerCase() === n)?.id;
    if (sc) { setScopeId(sc); setUseScope(true); }
    if (dg) { setDiagId(dg); setUseDiag(true); }
    setDraft(null);
    if (sc) void fillFromScope(sc, o.name, o.website || site);
  }

  async function fillFromScope(id: string, company?: string, website?: string) {
    const s = ctx.data?.scopes.find((x: any) => x.id === id);
    if (!s) return;
    const n = (company || name || s.company || "").trim();
    if (!n) return;
    if (!name.trim()) setName(n);
    setBusy("site");
    const t = toast.loading("Preenchendo com o Escopo Inicial, o Guia do Consultor e dados da internet…");
    try {
      const r = await prefillFromScope({ data: { company: n, context: scopeText(s).slice(0, 12000), website: website || undefined } });
      if (r.website && !site) setSite(r.website);
      if (r.sector) setSector(r.sector);
      if (r.location) setLocation(r.location);
      if (r.description) setDescription(r.description);
      if (r.offerings.length) setOfferings(r.offerings.join("\n"));
      if (r.highlights.length) setHighlights(r.highlights.join("\n"));
      if (r.audience) setAudience(r.audience);
      if (r.logo && !logo) {
        const img = await prepareImage(r.logo, true);
        if (img) setLogo(img.data);
      }
      toast.success(r.website ? "Campos preenchidos. Revise e ajuste." : "Campos preenchidos com o escopo (site não encontrado na internet).", { id: t });
    } catch {
      toast.error("Não foi possível preencher automaticamente. Complete à mão.", { id: t });
    } finally {
      setBusy("");
    }
  }

  function extraContext(): string {
    const parts: string[] = [];
    if (useScope && scopeId) {
      const s = ctx.data?.scopes.find((x: any) => x.id === scopeId);
      if (s) parts.push(scopeText(s));
    }
    if (useDiag && diagId) {
      const g = ctx.data?.diagnostics.find((x: any) => x.id === diagId);
      if (g) parts.push(diagText(g));
    }
    return parts.join("\n\n").slice(0, 12000);
  }
  const [busy, setBusy] = useState<"" | "site" | "draft" | "files">("");

  const services = ctx.data?.services ?? [];
  const service = services.find((s) => s.slug === serviceSlug);
  const quotes = useMemo(() => {
    const all = ctx.data?.quotes ?? [];
    const n = name.trim().toLowerCase();
    return [...all].sort((a, b) => {
      const ma = n && String(a.client_name).toLowerCase().includes(n) ? 0 : 1;
      const mb = n && String(b.client_name).toLowerCase().includes(n) ? 0 : 1;
      return ma - mb;
    });
  }, [ctx.data?.quotes, name]);

  async function readSite() {
    if (!site.trim()) { toast.error("Informe o site do cliente."); return; }
    setBusy("site");
    try {
      const r = await analyzeClientSite({ data: { url: site } });
      if (!r.ok) { toast.error(r.error); return; }
      setName(r.name || name);
      setSector(r.sector || sector);
      setLocation(r.location || location);
      setDescription(r.description);
      setOfferings(r.offerings.join("\n"));
      setHighlights(r.highlights.join("\n"));
      setAudience(r.audience);
      if (r.logo) {
        const img = await prepareImage(r.logo, true);
        if (img) setLogo(img.data);
      }
      toast.success("Informações preenchidas a partir do site. Revise e ajuste.");
    } finally {
      setBusy("");
    }
  }

  async function onLogoFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const img = await prepareImage(String(reader.result), true);
      if (img) setLogo(img.data);
      else toast.error("Não foi possível ler a imagem.");
    };
    reader.readAsDataURL(file);
  }

  async function makeDraft() {
    const scopeCompany = useScope && scopeId ? String(ctx.data?.scopes.find((x: any) => x.id === scopeId)?.company ?? "") : "";
    const clientName = name.trim() || scopeCompany.trim();
    if (!clientName) { toast.error("Informe o nome do cliente."); return null; }
    if (!name.trim()) setName(clientName);
    if (!service) { toast.error("Selecione o serviço a ser apresentado."); return null; }
    setBusy("draft");
    try {
      const r = await draftPresentationContent({
        data: {
          clientName,
          sector,
          location,
          description,
          offerings: lines(offerings).slice(0, 10),
          highlights: lines(highlights).slice(0, 10),
          audience,
          extra: extraContext() || undefined,
          service: {
            title: service.title ?? "",
            lead: service.lead ?? "",
            problem: service.problem ?? "",
            body: (service.body ?? "").slice(0, 5000),
            results: (service.results ?? []).slice(0, 20),
            modules: (service.modules ?? []).slice(0, 20),
          },
        },
      });
      if (!r.ok) {
        toast.error(r.error);
        return null;
      }
      setDraft(r.draft);
      return r.draft;
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    if (!ctx.data || !service) { toast.error("Selecione o serviço."); return; }
    if (useQuote && !quoteId) { toast.error("Selecione o orçamento a usar ou desmarque a opção."); return; }
    if (useScope && !scopeId) { toast.error("Selecione o escopo inicial ou desmarque a opção."); return; }
    if (useDiag && !diagId) { toast.error("Selecione o diagnóstico ou desmarque a opção."); return; }
    const d: PresentationDraft | null = draft ?? (await makeDraft()) ?? null;
    if (!d) return;
    setBusy("files");
    try {
      const [clientLogo, libLogo, libLight, ...clientImgs] = await Promise.all([
        logo ? prepareImage(logo, false) : Promise.resolve(null),
        prepareImage(ctx.data.liberatoLogo, false),
        prepareImage(ctx.data.liberatoLogoLight, false),
        ...ctx.data.institutional.clients.map((c) => prepareImage(c.logo, false)),
      ]);
      const q = useQuote ? ctx.data.quotes.find((x) => x.id === quoteId) : null;
      const payload = (q?.payload ?? {}) as any;
      const ratio = q && Number(q.total_brl) > 0 ? Number(q.total_currency) / Number(q.total_brl) : 1;
      const deck: DeckInput = {
        clientName: name.trim() || String(ctx.data.scopes.find((x: any) => x.id === scopeId)?.company ?? ""),
        sector,
        location,
        website: site,
        description,
        offerings: lines(offerings),
        highlights: lines(highlights),
        clientLogo,
        liberatoLogo: libLogo,
        liberatoLogoLight: libLight,
        service: {
          title: service.title ?? "",
          family: service.family_title ?? "",
          lead: service.lead ?? "",
          bullets: service.bullets ?? [],
          results: service.results ?? [],
          modules: service.modules ?? [],
          duration: service.duration ?? "",
          ai: service.ai ?? "",
        },
        draft: d,
        institutional: {
          ...ctx.data.institutional,
          clients: ctx.data.institutional.clients.map((c, i) => ({ name: c.name, logo: clientImgs[i] ?? null })),
        },
        tools: ctx.data.tools,
        identity: ctx.data.identity,
        quote: q
          ? {
              currency: q.currency,
              total: Number(q.total_currency),
              start: q.start_date,
              end: q.end_date,
              discountPct: Number(q.discount_pct) || 0,
              totalDays: Number(payload.quote?.totalDays) || 0,
              phases: (payload.quote?.phases ?? []).map((p: any) => ({
                title: p.title,
                days: Number(p.days) || 0,
                price: (Number(p.priceBrl) || 0) * ratio,
              })),
            }
          : null,
      };
      const files = await buildDeckFiles(deck);
      const r = await savePresentation({
        data: {
          id: savedId,
          client_name: deck.clientName || "Cliente",
          service_title: service.title ?? "",
          website: site.slice(0, 300),
          sector: sector.slice(0, 200),
          used_quote: !!q,
          used_scope: useScope && !!scopeId,
          used_diagnostic: useDiag && !!diagId,
          pptx: files.pptx,
          pdf: files.pdf,
          payload: { site, name, sector, location, description, offerings, highlights, audience, logo, serviceSlug, useQuote, quoteId, useScope, scopeId, useDiag, diagId, draft: d },
        },
      });
      setSavedId(r.id);
      setSaved(true);
      toast.success(savedId ? "Apresentação atualizada (PowerPoint e PDF)." : "Apresentação gerada (PowerPoint e PDF).");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar os arquivos.");
    } finally {
      setBusy("");
    }
  }

  const setList = (key: keyof PresentationDraft, value: string) =>
    setDraft((d) => (d ? { ...d, [key]: lines(value) } : d));
  const setText = (key: keyof PresentationDraft, value: string) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  return (
    <AdminShell
      title="Material para Apresentação"
      description="Etapa 4 · Gere uma apresentação comercial personalizada em PowerPoint e PDF."
      requireAdmin
    >
      <Link to="/admin/projetos" className="mb-6 inline-flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft className="size-4" /> Voltar para Projetos
      </Link>

      {ctx.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando dados da plataforma…</p>
      ) : ctx.error ? (
        <p className="text-sm text-destructive">Não foi possível carregar os dados: {(ctx.error as Error).message}</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-background p-5">
            <h2 className="font-display text-lg font-semibold">1. Site do cliente</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe o site e as informações serão preenchidas automaticamente. Tudo fica editável.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input className={`${input} max-w-md`} placeholder="www.cliente.com.br" value={site} onChange={(e) => setSite(e.target.value)} />
              <button
                onClick={readSite}
                disabled={busy !== ""}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent disabled:opacity-60"
              >
                {busy === "site" ? <Loader2 className="size-4 animate-spin" /> : <Globe className="size-4" />}
                Ler site e preencher
              </button>
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border border-border bg-background p-5 md:grid-cols-2">
            <h2 className="font-display text-lg font-semibold md:col-span-2">2. Dados do cliente e do serviço</h2>
            <Field label="Serviço a ser apresentado">
              <select className={input} value={serviceSlug} onChange={(e) => { setServiceSlug(e.target.value); setDraft(null); }}>
                <option value="">Selecione…</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Nome do cliente">
              <select className={`${input} mb-2`} value={pick} onChange={(e) => pickClient(e.target.value)}>
                <option value="">Selecionar do CRM, escopos iniciais ou diagnósticos…</option>
                {clientOptions.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <input className={input} placeholder="Ou digite / ajuste o nome" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Setor (segmento de mercado)">
              <input className={input} value={sector} onChange={(e) => setSector(e.target.value)} />
            </Field>
            <Field label="Localização geográfica">
              <input className={input} value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            <Field label="Logomarca do cliente (fundo removido automaticamente)">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-32 items-center justify-center rounded-lg border border-dashed border-border bg-[repeating-conic-gradient(var(--color-secondary)_0_25%,transparent_0_50%)] bg-[length:12px_12px]">
                  {logo ? <img src={logo} alt="Logomarca" className="max-h-14 max-w-28 object-contain" /> : <span className="text-xs text-muted-foreground">sem logo</span>}
                </div>
                <input type="file" accept="image/*" onChange={(e) => onLogoFile(e.target.files?.[0])} className="text-sm" />
              </div>
            </Field>
            <Field label="Público-alvo do cliente">
              <input className={input} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </Field>
            <Field label="Sobre o cliente">
              <textarea className={input} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Produtos e serviços do cliente (um por linha)">
              <textarea className={input} rows={4} value={offerings} onChange={(e) => setOfferings(e.target.value)} />
            </Field>
            <Field label="Destaques e diferenciais do cliente (um por linha)">
              <textarea className={input} rows={4} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
            </Field>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={useQuote} onChange={(e) => setUseQuote(e.target.checked)} />
                Usar orçamento gerado em Projetos
              </label>
              {useQuote ? (
                <select className={input} value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
                  <option value="">Selecione o orçamento…</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.client_name || "Sem cliente"} · {q.service_title} · {new Date(q.created_at).toLocaleDateString("pt-BR")}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-muted-foreground">Sem orçamento, o material terá um slide avisando que a proposta será enviada.</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={useScope} onChange={(e) => { setUseScope(e.target.checked); setDraft(null); }} />
                Usar informações do Guia do Consultor (Escopo Inicial)
              </label>
              {useScope ? (
                <select className={input} value={scopeId} onChange={(e) => { setScopeId(e.target.value); setDraft(null); if (e.target.value) void fillFromScope(e.target.value); }}>
                  <option value="">Selecione o escopo inicial…</option>
                  {(ctx.data?.scopes ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.company} · {s.respondent_name} · {new Date(s.created_at).toLocaleDateString("pt-BR")}</option>
                  ))}
                </select>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={useDiag} onChange={(e) => { setUseDiag(e.target.checked); setDraft(null); }} />
                Usar informações do Diagnóstico Detalhado
              </label>
              {useDiag ? (
                <select className={input} value={diagId} onChange={(e) => { setDiagId(e.target.value); setDraft(null); }}>
                  <option value="">Selecione o diagnóstico…</option>
                  {(ctx.data?.diagnostics ?? []).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.client_name || g.title} · {g.service_title} · {new Date(g.updated_at).toLocaleDateString("pt-BR")}</option>
                  ))}
                </select>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-display text-lg font-semibold">3. Textos personalizados</h2>
              <button
                onClick={() => void makeDraft()}
                disabled={busy !== ""}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent disabled:opacity-60"
              >
                {busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {draft ? "Gerar novamente" : "Gerar textos com IA"}
              </button>
            </div>
            {draft ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Título da capa"><input className={input} value={draft.headline} onChange={(e) => setText("headline", e.target.value)} /></Field>
                <Field label="O que entendemos sobre o cliente"><textarea className={input} rows={3} value={draft.aboutClient} onChange={(e) => setText("aboutClient", e.target.value)} /></Field>
                <Field label="Contexto do setor e região"><textarea className={input} rows={3} value={draft.sectorContext} onChange={(e) => setText("sectorContext", e.target.value)} /></Field>
                <Field label="Oportunidades do setor (uma por linha)"><textarea className={input} rows={4} value={draft.sectorTrends.join("\n")} onChange={(e) => setList("sectorTrends", e.target.value)} /></Field>
                <Field label="Desafios (um por linha)"><textarea className={input} rows={4} value={draft.challenges.join("\n")} onChange={(e) => setList("challenges", e.target.value)} /></Field>
                <Field label="Como o serviço será adaptado"><textarea className={input} rows={4} value={draft.approach} onChange={(e) => setText("approach", e.target.value)} /></Field>
                <Field label="Impactos (título | descrição, um por linha)">
                  <textarea
                    className={input}
                    rows={4}
                    value={draft.impacts.map((i) => `${i.title} | ${i.body}`).join("\n")}
                    onChange={(e) =>
                      setDraft((d) => d ? { ...d, impacts: lines(e.target.value).map((l) => { const [t, ...b] = l.split("|"); return { title: (t ?? "").trim(), body: b.join("|").trim() }; }) } : d)
                    }
                  />
                </Field>
                <Field label="Por que a Liberato (um por linha)"><textarea className={input} rows={4} value={draft.whyLiberato.join("\n")} onChange={(e) => setList("whyLiberato", e.target.value)} /></Field>
                <Field label="Próximos passos (um por linha)"><textarea className={input} rows={4} value={draft.nextSteps.join("\n")} onChange={(e) => setList("nextSteps", e.target.value)} /></Field>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                A IA escreve os textos sobre o setor, a região, os desafios e os impactos, citando o nome do cliente. Você pode revisar antes de baixar.
              </p>
            )}
          </section>

          <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-5">
            <p className="mr-auto text-sm text-muted-foreground">
              15 slides: capa, agenda, cliente, mercado, desafios, Liberato, resultados, casos, serviço, jornada, impactos, ferramentas, diferenciais, proposta e próximos passos.
            </p>
            <button
              onClick={() => void generate()}
              disabled={busy !== ""}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
            >
              {busy === "files" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {savedId ? "Salvar alterações e gerar de novo" : "Gerar apresentação"}
            </button>
            {saved && savedId
              ? (["pptx", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => void openFile(f)}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent"
                  >
                    <Download className="size-4" /> {f === "pptx" ? "PowerPoint" : "PDF"}
                  </button>
                ))
              : null}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
