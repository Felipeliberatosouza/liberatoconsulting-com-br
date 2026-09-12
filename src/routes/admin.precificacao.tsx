import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Sparkles, FileDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listServiceProducts } from "@/lib/services.functions";
import {
  buildQuotePdf,
  getFxRate,
  getPricingSettings,
  getServicePricing,
  listQuotes,
  quoteFileUrl,
  savePricingSettings,
  saveServicePricing,
  suggestHourlyRates,
  suggestServiceStages,
} from "@/lib/pricing.functions";
import {
  CATALOG,
  COUNTRIES,
  CURRENCIES,
  DEFAULT_PRICING,
  PHASES,
  buildQuote,
  formatMoney,
  fromCatalog,
  type PricedActivity,
  type PricingSettings,
} from "@/lib/pricing-catalog";

export const Route = createFileRoute("/admin/precificacao")({
  head: () => ({
    meta: [
      { title: "Precificação e orçamentos — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

const today = () => new Date().toISOString().slice(0, 10);

function Num({
  value,
  onChange,
  className = "w-24",
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <Input
      type="number"
      step="0.5"
      min={0}
      className={className}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

function PricingPage() {
  const [settings, setSettings] = useState<PricingSettings>(DEFAULT_PRICING);
  const [slug, setSlug] = useState("");
  const [activities, setActivities] = useState<PricedActivity[]>([]);
  const [notes, setNotes] = useState("");
  const [rationale, setRationale] = useState("");
  const [busy, setBusy] = useState("");

  const [companyType, setCompanyType] = useState<"sme" | "corporate">("sme");
  const [country, setCountry] = useState("BR");
  const [currency, setCurrency] = useState("BRL");
  const [startDate, setStartDate] = useState(today());
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [clientName, setClientName] = useState("");
  const [fx, setFx] = useState({ rate: 1, source: "—" });

  const products = useQuery({ queryKey: ["admin-service-products"], queryFn: () => listServiceProducts() });
  const stored = useQuery({ queryKey: ["pricing-settings"], queryFn: () => getPricingSettings() });
  const history = useQuery({ queryKey: ["quotes"], queryFn: () => listQuotes() });

  useEffect(() => {
    if (stored.data) setSettings(stored.data);
  }, [stored.data]);

  const product = useMemo(
    () => (products.data ?? []).find((p) => p.slug === slug),
    [products.data, slug],
  );

  useEffect(() => {
    if (!slug) return;
    getServicePricing({ data: { slug } }).then((r) => {
      setActivities(
        r.activities.length > 0 ? r.activities : CATALOG.map((c) => fromCatalog(c, false)),
      );
      setNotes(r.notes);
      setRationale(r.aiRationale);
    });
  }, [slug]);

  useEffect(() => {
    getFxRate({ data: { currency: currency as "BRL" } }).then((r) =>
      setFx({ rate: r.rate, source: r.source }),
    );
  }, [currency]);

  const quote = useMemo(
    () =>
      buildQuote(activities, settings, {
        companyType,
        country,
        currency,
        startDate,
        remoteOnly,
        discountPct,
        fxRate: fx.rate,
      }),
    [activities, settings, companyType, country, currency, startDate, remoteOnly, discountPct, fx.rate],
  );

  const enabledCount = useMemo(() => activities.filter((a) => a.enabled).length, [activities]);

  function patch(id: string, data: Partial<PricedActivity>) {
    setActivities((list) => list.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }

  async function saveSettings() {
    setBusy("settings");
    const res = await savePricingSettings({ data: settings });
    setBusy("");
    if (res.ok) toast.success("Valores-hora salvos.");
    else toast.error(res.error);
  }

  async function aiRates() {
    setBusy("ai-rates");
    const res = await suggestHourlyRates({});
    setBusy("");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setSettings((s) => ({
      ...s,
      rates: { sme: res.sme, corporate: res.corporate },
      countryFactors: { ...s.countryFactors, ...res.countryFactors },
      aiSuggestion: { text: res.rationale, sources: res.sources, updatedAt: new Date().toISOString() },
    }));
    toast.success("Sugestão da IA aplicada. Revise e salve.");
  }

  async function aiStages(): Promise<PricedActivity[] | null> {
    if (!product) {
      toast.error("Escolha um serviço primeiro.");
      return null;
    }
    setBusy("ai-stages");
    const res = await suggestServiceStages({
      data: {
        slug: product.slug,
        title: product.title,
        lead: product.lead ?? "",
        body: product.body ?? "",
        bullets: product.bullets ?? [],
        duration: product.duration ?? "",
      },
    });
    setBusy("");
    if (!res.ok) {
      toast.error(res.error);
      return null;
    }
    setActivities(res.activities);
    setRationale(res.rationale);
    toast.success("A IA montou as etapas. Revise as horas e salve.");
    return res.activities;
  }

  async function saveStages(list: PricedActivity[] = activities) {
    if (!slug) return;
    setBusy("stages");
    const res = await saveServicePricing({
      data: { slug, activities: list, notes, aiRationale: rationale, updateCatalogPrices: true },
    });
    setBusy("");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(
      res.prices
        ? `Etapas salvas. Preços do cadastro: PME ${res.prices.sme} · corporativo ${res.prices.corporate}.`
        : "Etapas salvas.",
    );
  }

  /** Monta as etapas com IA e já salva, para o orçamento sair preenchido. */
  async function autoStages() {
    const list = await aiStages();
    if (list) await saveStages(list);
  }

  async function generatePdf() {
    if (!product) {
      toast.error("Escolha um serviço primeiro.");
      return;
    }
    setBusy("pdf");
    const res = await buildQuotePdf({
      data: {
        slug: product.slug,
        serviceTitle: product.title,
        clientName,
        activities,
        notes,
        options: { companyType, country, currency: currency as "BRL", startDate, remoteOnly, discountPct, fxRate: fx.rate },
      },
    });
    setBusy("");
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    window.open(res.url, "_blank");
    history.refetch();
    toast.success("Orçamento em PDF gerado.");
  }

  const money = (brl: number) => formatMoney(brl * fx.rate, currency);

  return (
    <AdminShell
      title="Precificação e orçamentos"
      description="Defina o valor do homem-hora, as etapas de cada serviço e gere o orçamento com cronograma em PDF para enviar ao cliente. O valor calculado alimenta automaticamente os preços do Cadastro de serviços."
      requireAdmin
    >
      <Tabs defaultValue="rates">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="rates">Valor do homem-hora</TabsTrigger>
          <TabsTrigger value="stages">Etapas por serviço</TabsTrigger>
          <TabsTrigger value="quote">Gerar orçamento</TabsTrigger>
          <TabsTrigger value="history">Orçamentos emitidos</TabsTrigger>
        </TabsList>

        {/* ---------------- Valor-hora ---------------- */}
        <TabsContent value="rates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {(["sme", "corporate"] as const).map((kind) => (
              <section key={kind} className="rounded-xl border border-border p-5">
                <h3 className="mb-4 font-semibold">
                  {kind === "sme" ? "Pequenas empresas e startups" : "Corporações"}
                </h3>
                <div className="grid gap-3">
                  {(["consultant", "assistant", "freelancer"] as const).map((role) => (
                    <div key={role} className="flex items-center justify-between gap-3">
                      <Label className="text-sm">
                        {role === "consultant" ? "Consultor" : role === "assistant" ? "Assistente" : "Freelancer"} (R$/h)
                      </Label>
                      <Num
                        value={settings.rates[kind][role]}
                        onChange={(v) =>
                          setSettings((s) => ({
                            ...s,
                            rates: { ...s.rates, [kind]: { ...s.rates[kind], [role]: v } },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="rounded-xl border border-border p-5">
            <h3 className="mb-4 font-semibold">Ajustes gerais</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Margem sobre serviços de terceiros</Label>
                <Num
                  value={settings.thirdPartyMarkup}
                  onChange={(v) => setSettings((s) => ({ ...s, thirdPartyMarkup: v }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">0,25 = 25% de margem.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Horas por dia útil</Label>
                <Num
                  value={settings.hoursPerDay}
                  onChange={(v) => setSettings((s) => ({ ...s, hoursPerDay: v || 8 }))}
                  className="w-full"
                />
              </div>
            </div>
            <h4 className="mb-3 mt-6 text-sm font-semibold">Ajuste de preço por país do cliente</h4>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {COUNTRIES.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2">
                  <Label className="text-sm">{c.label}</Label>
                  <Num
                    value={settings.countryFactors[c.id] ?? 1}
                    onChange={(v) =>
                      setSettings((s) => ({ ...s, countryFactors: { ...s.countryFactors, [c.id]: v } }))
                    }
                    className="w-20"
                  />
                </div>
              ))}
            </div>
          </section>

          {settings.aiSuggestion?.text && (
            <section className="rounded-xl border border-border bg-muted/40 p-5">
              <h3 className="mb-2 font-semibold">Sugestão da inteligência artificial</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {settings.aiSuggestion.text}
              </p>
              {settings.aiSuggestion.sources && (
                <p className="mt-3 whitespace-pre-line text-xs text-muted-foreground">
                  {settings.aiSuggestion.sources}
                </p>
              )}
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={saveSettings} disabled={busy === "settings"}>
              {busy === "settings" ? "Salvando…" : "Salvar valores"}
            </Button>
            <Button variant="outline" onClick={aiRates} disabled={busy === "ai-rates"}>
              <Sparkles className="size-4" />
              {busy === "ai-rates" ? "Pesquisando…" : "Sugerir valores com IA"}
            </Button>
          </div>
        </TabsContent>

        {/* ---------------- Etapas por serviço ---------------- */}
        <TabsContent value="stages" className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <select
                className="h-10 w-80 max-w-full rounded-md border border-input bg-background px-3 text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              >
                <option value="">Escolha um serviço…</option>
                {(products.data ?? []).map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" onClick={() => aiStages()} disabled={!slug || busy === "ai-stages"}>
              <Sparkles className="size-4" />
              {busy === "ai-stages" ? "Analisando…" : "Sugerir etapas com IA"}
            </Button>
            <Button onClick={() => saveStages()} disabled={!slug || busy === "stages"}>
              {busy === "stages" ? "Salvando…" : "Salvar etapas e preço"}
            </Button>
          </div>

          {rationale && (
            <p className="whitespace-pre-line rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {rationale}
            </p>
          )}

          {slug &&
            PHASES.map((phase) => (
              <section key={phase.id} className="rounded-xl border border-border">
                <h3 className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {phase.title}
                </h3>
                <div className="divide-y divide-border">
                  {activities
                    .filter((a) => a.phase === phase.id)
                    .map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <Checkbox
                          checked={a.enabled}
                          onCheckedChange={(v) => patch(a.id, { enabled: Boolean(v) })}
                        />
                        <span className="min-w-56 flex-1 text-sm">
                          {a.label}
                          {a.onsite && (
                            <span className="ml-2 text-xs text-muted-foreground">presencial</span>
                          )}
                        </span>
                        <label className="text-xs text-muted-foreground">
                          Consultor
                          <Num value={a.consultant} onChange={(v) => patch(a.id, { consultant: v })} className="mt-1 w-20" />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Assistente
                          <Num value={a.assistant} onChange={(v) => patch(a.id, { assistant: v })} className="mt-1 w-20" />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Freelancer
                          <Num value={a.freelancer} onChange={(v) => patch(a.id, { freelancer: v })} className="mt-1 w-20" />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Terceiros (R$)
                          <Num value={a.thirdParty} onChange={(v) => patch(a.id, { thirdParty: v })} className="mt-1 w-24" />
                        </label>
                        <label className="text-xs text-muted-foreground">
                          Realizações
                          <Num value={a.reps} onChange={(v) => patch(a.id, { reps: v })} className="mt-1 w-20" />
                        </label>
                      </div>
                    ))}
                </div>
              </section>
            ))}

          {slug && (
            <div className="space-y-1.5">
              <Label>Observações que aparecem no orçamento</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          )}
        </TabsContent>

        {/* ---------------- Orçamento ---------------- */}
        <TabsContent value="quote" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Serviço</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              >
                <option value="">Escolha um serviço…</option>
                {(products.data ?? []).map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de empresa</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value as "sme" | "corporate")}
              >
                <option value="sme">Pequena empresa / startup</option>
                <option value="corporate">Corporação</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Data de início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>País do cliente</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  const c = COUNTRIES.find((x) => x.id === e.target.value);
                  if (c) setCurrency(c.currency);
                  if (e.target.value !== "BR") setRemoteOnly(true);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Moeda do orçamento</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {currency === "BRL"
                  ? "Valores em reais."
                  : `1 R$ = ${fx.rate.toFixed(4)} ${currency} · ${fx.source}`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Desconto comercial (%)</Label>
              <Num value={discountPct} onChange={setDiscountPct} className="w-full" />
            </div>
            <label className="flex items-center gap-3 self-end pb-2 text-sm">
              <Switch checked={remoteOnly} onCheckedChange={(v) => setRemoteOnly(Boolean(v))} />
              Encontros presenciais realizados on-line
            </label>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  getFxRate({ data: { currency: currency as "BRL" } }).then((r) =>
                    setFx({ rate: r.rate, source: r.source }),
                  )
                }
              >
                <RefreshCw className="size-4" />
                Atualizar cotação
              </Button>
            </div>
          </div>

          {slug ? (
            <section className="rounded-xl border border-border">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <p className="font-semibold">{product?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(`${quote.start}T12:00:00`).toLocaleDateString("pt-BR")} a{" "}
                    {new Date(`${quote.end}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
                    {quote.totalDays.toFixed(0)} dias úteis · {quote.totalHours} horas
                  </p>
                </div>
                <p className="text-xl font-semibold">{money(quote.totalBrl)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2">Etapa</th>
                      <th className="px-4 py-2">Início</th>
                      <th className="px-4 py-2">Dias úteis</th>
                      <th className="px-4 py-2">Conclusão</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.phases.map((p) => (
                      <Fragment key={p.id}>
                        <tr className="border-t border-border bg-muted/40 font-medium">
                          <td className="px-4 py-2">{p.title}</td>
                          <td className="px-4 py-2">{new Date(`${p.start}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                          <td className="px-4 py-2">{p.days.toFixed(1)}</td>
                          <td className="px-4 py-2">{new Date(`${p.end}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                          <td className="px-4 py-2 text-right">{money(p.priceBrl)}</td>
                        </tr>
                        {p.items.map((i) => (
                          <tr key={`${p.id}-${i.id}`} className="border-t border-border/60">
                            <td className="px-4 py-2 pl-8 text-muted-foreground">
                              {i.label}
                              {i.remoteNote && <span className="ml-2 text-xs">(on-line)</span>}
                            </td>
                            <td className="px-4 py-2">{new Date(`${i.start}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                            <td className="px-4 py-2">{i.days.toFixed(1)}</td>
                            <td className="px-4 py-2">{new Date(`${i.end}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                            <td className="px-4 py-2 text-right">{money(i.priceBrl)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Subtotal {money(quote.subtotalBrl)}
                  {quote.discountBrl > 0 ? ` · desconto -${money(quote.discountBrl)}` : ""}
                </p>
                <Button onClick={generatePdf} disabled={busy === "pdf"}>
                  <FileDown className="size-4" />
                  {busy === "pdf" ? "Gerando…" : "Gerar PDF do orçamento"}
                </Button>
              </div>
            </section>
          ) : (
            <p className="text-sm text-muted-foreground">
              Escolha um serviço com etapas cadastradas para montar o orçamento.
            </p>
          )}
        </TabsContent>

        {/* ---------------- Histórico ---------------- */}
        <TabsContent value="history" className="space-y-3">
          {(history.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum orçamento emitido ainda.</p>
          )}
          {(history.data ?? []).map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{q.service_title}</p>
                <p className="text-sm text-muted-foreground">
                  {q.client_name || "sem cliente"} · {q.country} ·{" "}
                  {q.company_type === "sme" ? "PME" : "Corporação"} ·{" "}
                  {formatMoney(Number(q.total_currency), q.currency)} ·{" "}
                  {new Date(q.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const r = await quoteFileUrl({ data: { path: q.file_path, name: q.file_name } });
                  if (r.url) window.open(r.url, "_blank");
                  else toast.error("Arquivo indisponível.");
                }}
              >
                Baixar PDF
              </Button>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
