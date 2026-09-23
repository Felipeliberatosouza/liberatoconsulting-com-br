import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Globe, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  analyzeClientSite,
  draftPresentationContent,
  getPresentationContext,
  type PresentationDraft,
} from "@/lib/presentation.functions";
import { exportDeck, prepareImage, type DeckInput } from "@/lib/presentation-deck";

export const Route = createFileRoute("/admin/projetos_/apresentacao")({
  head: () => ({
    meta: [
      { title: "Material para Apresentação — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresentationPage,
});

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
  const [busy, setBusy] = useState<"" | "site" | "draft" | "pptx" | "pdf">("");

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
    if (!name.trim()) { toast.error("Informe o nome do cliente."); return null; }
    if (!service) { toast.error("Selecione o serviço a ser apresentado."); return null; }
    setBusy("draft");
    try {
      const r = await draftPresentationContent({
        data: {
          clientName: name,
          sector,
          location,
          description,
          offerings: lines(offerings).slice(0, 10),
          highlights: lines(highlights).slice(0, 10),
          audience,
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

  async function download(format: "pptx" | "pdf") {
    if (!ctx.data || !service) { toast.error("Selecione o serviço."); return; }
    if (useQuote && !quoteId) { toast.error("Selecione o orçamento a usar ou desmarque a opção."); return; }
    const d: PresentationDraft | null = draft ?? (await makeDraft()) ?? null;
    if (!d) return;
    setBusy(format);
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
        clientName: name.trim(),
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
      await exportDeck(deck, format);
      toast.success(format === "pptx" ? "PowerPoint gerado." : "PDF gerado.");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar o arquivo.");
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
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
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
            {(["pptx", "pdf"] as const).map((f) => (
              <button
                key={f}
                onClick={() => void download(f)}
                disabled={busy !== ""}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
              >
                {busy === f ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Baixar {f === "pptx" ? "PowerPoint" : "PDF"}
              </button>
            ))}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
