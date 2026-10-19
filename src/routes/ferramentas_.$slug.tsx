import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Copy, FileDown, Presentation, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatValue, runTool } from "@/lib/tool-engine";
import { exportTool } from "@/lib/tool-export";
import {
  createToolOrder, getInteractiveTool, getToolBranding, refreshToolOrder, saveBillingProfile, saveToolRun, sendPhoneCode, verifyPhoneCode,
} from "@/lib/interactive-tools.functions";

export const Route = createFileRoute("/ferramentas_/$slug")({
  head: () => ({
    meta: [
      { title: "Ferramenta de gestão — Liberato Consulting" },
      { name: "description", content: "Ferramenta interativa de gestão personalizada para o seu negócio." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Ferramenta de gestão — Liberato Consulting" },
      { property: "og:description", content: "Informe os dados do seu negócio e receba resultados e relatório." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolRunner,
});

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const COLORS = ["var(--color-accent)", "var(--color-foreground)", "#3B82F6", "#10B981"];

function ToolRunner() {
  const { slug } = Route.useParams();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setReady(true); }); }, []);
  const q = useQuery({ queryKey: ["interactive-tool", slug], queryFn: () => getInteractiveTool({ data: { slug } }), enabled: signedIn, retry: false });
  if (!ready || (signedIn && q.isLoading)) return <div className="mx-auto max-w-5xl px-6 py-24 text-muted-foreground">Carregando…</div>;
  if (!signedIn) return <div className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-3xl font-bold">Entre para usar a ferramenta</h1><p className="mt-3 text-muted-foreground">As ferramentas de gestão estão disponíveis para clientes cadastrados.</p><Button asChild className="mt-6"><Link to="/ferramentas" search={{ modo: undefined }}>Entrar ou criar conta</Link></Button></div>;
  const d = q.data;
  if (!d || !d.found) return <div className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-3xl font-bold">Ferramenta não encontrada</h1><Button asChild variant="outline" className="mt-6"><Link to="/ferramentas" search={{ modo: undefined }}>Voltar às ferramentas</Link></Button></div>;
  return (
    <div className="bg-secondary/40 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <Link to="/ferramentas" search={{ modo: undefined }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="size-4" /> Ferramentas de Gestão</Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-accent">{d.tool.category}</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">{d.tool.title}</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{d.tool.summary}</p>
        {d.access && d.spec ? <Calculator toolId={d.tool.id} spec={d.spec} /> : <Checkout data={d} onPaid={() => void q.refetch()} />}
      </div>
    </div>
  );
}

type Loaded = Extract<Awaited<ReturnType<typeof getInteractiveTool>>, { found: true }>;

function Calculator({ toolId, spec }: { toolId: string; spec: NonNullable<Loaded["spec"]> }) {
  const [ctx, setCtx] = useState<Record<string, string>>({});
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"intake" | "result">("intake");
  const [busy, setBusy] = useState<"" | "pdf" | "pptx">("");
  const save = useServerFn(saveToolRun);
  const brandingQ = useQuery({ queryKey: ["tool-branding"], queryFn: () => getToolBranding() });
  const inputs = useMemo(() => Object.fromEntries(spec.inputs.map((i) => [i.id, Number(String(raw[i.id] ?? "").replace(/\./g, "").replace(",", "."))])), [raw, spec.inputs]);
  const result = useMemo(() => runTool(spec, inputs), [spec, inputs]);
  const ctxOk = spec.context_fields.every((f) => (ctx[f.id] ?? "").trim());

  if (step === "intake") {
    return (
      <form className="mt-10 grid gap-5 bg-background p-6 md:grid-cols-2" onSubmit={async (e) => {
        e.preventDefault();
        if (!ctxOk) { toast.error("Preencha os dados do seu negócio."); return; }
        if (!result.ok) { toast.error(result.error); return; }
        setStep("result");
        void save({ data: { toolId, inputs, context: ctx } });
      }}>
        <div className="md:col-span-2"><h2 className="text-2xl font-bold">1. Dados do seu negócio</h2><p className="mt-1 text-sm text-muted-foreground">Essas informações personalizam a ferramenta e o relatório.</p></div>
        {spec.context_fields.map((f) => <label key={f.id} className="text-sm font-medium">{f.label} *<input required value={ctx[f.id] ?? ""} onChange={(e) => setCtx({ ...ctx, [f.id]: e.target.value })} className={field} maxLength={200} /></label>)}
        <div className="md:col-span-2 mt-4"><h2 className="text-2xl font-bold">2. Números para o cálculo</h2></div>
        {spec.inputs.map((i) => (
          <label key={i.id} className="text-sm font-medium">{i.label}{i.unit ? ` (${i.unit})` : ""} *
            <input required inputMode="decimal" value={raw[i.id] ?? ""} onChange={(e) => setRaw({ ...raw, [i.id]: e.target.value.replace(/[^0-9.,-]/g, "") })} className={field} />
            {i.help ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{i.help}</span> : null}
          </label>
        ))}
        {!result.ok && Object.keys(raw).length === spec.inputs.length ? <p className="text-sm text-destructive md:col-span-2">{result.error}</p> : null}
        <Button type="submit" className="md:col-span-2 md:w-fit">Calcular resultados</Button>
      </form>
    );
  }
  if (!result.ok) return null;
  const data = { spec, context: ctx, inputs, values: result.values, recommendations: result.recommendations, chart: result.chart };
  const download = async (kind: "pdf" | "pptx") => {
    if (!brandingQ.data) return;
    setBusy(kind);
    try { await exportTool(kind, data, brandingQ.data); } catch (e) { console.error(e); toast.error("Não foi possível gerar o arquivo."); } finally { setBusy(""); }
  };
  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void download("pdf")} disabled={!!busy || !brandingQ.data}><FileDown /> {busy === "pdf" ? "Gerando PDF…" : "Baixar PDF"}</Button>
        <Button variant="outline" onClick={() => void download("pptx")} disabled={!!busy || !brandingQ.data}><Presentation /> {busy === "pptx" ? "Gerando PPT…" : "Baixar PowerPoint"}</Button>
        <Button variant="ghost" onClick={() => setStep("intake")}>Alterar dados</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {spec.outputs.map((o) => (
          <article key={o.id} className="border-t-2 border-accent bg-background p-5">
            <p className="text-sm font-semibold">{o.label}</p>
            <p className="mt-2 text-3xl font-bold text-accent">{formatValue(result.values[o.id] ?? 0, o.format, o.unit === "R$" || o.unit === "%" ? "" : o.unit)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{o.explanation}</p>
          </article>
        ))}
      </div>
      {result.chart ? (
        <div className="bg-background p-5">
          <h3 className="font-bold">{spec.chart.title}</h3>
          <div className="mt-4 h-80"><ResponsiveContainer><LineChart data={result.chart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="x" tickFormatter={(v) => Math.round(v).toLocaleString("pt-BR")} label={{ value: spec.chart.x_label, position: "insideBottom", offset: -4 }} /><YAxis tickFormatter={(v) => Number(v).toLocaleString("pt-BR", { notation: "compact" })} /><Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} labelFormatter={(v) => Math.round(Number(v)).toLocaleString("pt-BR")} /><Legend />{spec.chart.series.map((s, i) => <Line key={i} dataKey={`s${i}`} name={s.label} stroke={COLORS[i % 4]} dot={false} strokeWidth={2} />)}</LineChart></ResponsiveContainer></div>
        </div>
      ) : null}
      <div className="bg-background p-5">
        <h3 className="font-bold">Conclusões e recomendações</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{(result.recommendations.length ? result.recommendations : ["Os resultados estão dentro dos parâmetros esperados para os dados informados."]).map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="mt-4 text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" />Metodologia: {spec.methodology}</p>
      </div>
    </section>
  );
}

function Checkout({ data, onPaid }: { data: Loaded; onPaid: () => void }) {
  const saveProfile = useServerFn(saveBillingProfile);
  const sendCode = useServerFn(sendPhoneCode);
  const verify = useServerFn(verifyPhoneCode);
  const createOrder = useServerFn(createToolOrder);
  const refresh = useServerFn(refreshToolOrder);
  const [form, setForm] = useState({ full_name: data.billing?.full_name ?? "", cpf_cnpj: data.billing?.cpf_cnpj ?? "", phone: data.billing?.phone ?? "+55", postal_code: data.billing?.postal_code ?? "", address_number: data.billing?.address_number ?? "" });
  const [hasProfile, setHasProfile] = useState(Boolean(data.billing));
  const [verified, setVerified] = useState(Boolean(data.billing?.phone_verified));
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = data.pendingOrder;
  const [order, setOrder] = useState<{ orderId: string; invoiceUrl: string | null; bankSlipUrl: string | null; pixPayload: string | null; pixImage: string | null } | null>(p ? { orderId: p.id, invoiceUrl: p.invoice_url, bankSlipUrl: p.bank_slip_url, pixPayload: p.pix_payload, pixImage: p.pix_image } : null);

  useEffect(() => {
    if (!order) return;
    const t = setInterval(async () => { const r = await refresh({ data: { orderId: order.orderId } }); if (r.status === "paid") { clearInterval(t); toast.success("Pagamento confirmado! Ferramenta liberada."); onPaid(); } }, 8000);
    return () => clearInterval(t);
  }, [order, refresh, onPaid]);

  const price = Number(data.tool.price_brl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro inesperado."); } finally { setBusy(false); } };

  return (
    <section className="mt-10 grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6 bg-background p-6">
        {order ? (
          <div>
            <h2 className="text-2xl font-bold">Aguardando pagamento</h2>
            {order.pixImage ? <><img src={`data:image/png;base64,${order.pixImage}`} alt="QR Code PIX" className="mt-4 size-56" /><Button variant="outline" className="mt-3" onClick={() => { void navigator.clipboard.writeText(order.pixPayload ?? ""); toast.success("Código PIX copiado."); }}><Copy /> Copiar PIX copia e cola</Button></> : null}
            {order.bankSlipUrl ? <p className="mt-4"><a className="font-semibold text-accent underline" href={order.bankSlipUrl} target="_blank" rel="noreferrer">Abrir boleto</a></p> : null}
            {order.invoiceUrl && !order.pixImage && !order.bankSlipUrl ? <p className="mt-4"><a className="font-semibold text-accent underline" href={order.invoiceUrl} target="_blank" rel="noreferrer">Pagar com cartão no ambiente seguro do Asaas</a></p> : null}
            <p className="mt-4 text-sm text-muted-foreground">A ferramenta é liberada automaticamente assim que o pagamento for confirmado.</p>
            <Button variant="ghost" className="mt-2" onClick={() => setOrder(null)}>Escolher outra forma de pagamento</Button>
          </div>
        ) : !hasProfile || !verified ? (
          <>
            <div><h2 className="text-2xl font-bold">Cadastro para compra</h2><p className="mt-1 text-sm text-muted-foreground">Seu cadastro atual não muda. Estes dados são usados só para emitir a cobrança. Os dados de cartão são digitados no ambiente seguro do Asaas e nunca ficam salvos aqui.</p></div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void run(async () => { const r = await saveProfile({ data: form }); if (!r.ok) throw new Error(r.error); setHasProfile(true); toast.success("Cadastro salvo. Agora confirme seu celular."); }); }}>
              <label className="text-sm font-medium md:col-span-2">Nome completo ou razão social *<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">CPF ou CNPJ *<input required value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">Celular (WhatsApp) *<input required value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setVerified(false); }} className={field} /></label>
              <label className="text-sm font-medium">CEP *<input required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">Número do endereço *<input required value={form.address_number} onChange={(e) => setForm({ ...form, address_number: e.target.value })} className={field} /></label>
              <p className="text-xs text-muted-foreground md:col-span-2">E-mail confirmado: {data.email}</p>
              <Button type="submit" disabled={busy} className="md:w-fit">Salvar cadastro</Button>
            </form>
            {hasProfile && !verified ? (
              <div className="border-t border-border pt-5">
                <h3 className="font-bold">Confirmação do celular</h3>
                <p className="mt-1 text-sm text-muted-foreground">Enviaremos um código de 6 dígitos pelo WhatsApp.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button variant="outline" disabled={busy} onClick={() => void run(async () => { const r = await sendCode(); if (!r.ok) throw new Error(r.error); setCodeSent(true); toast.success("Código enviado."); })}>{codeSent ? "Reenviar código" : "Enviar código"}</Button>
                  {codeSent ? <><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button disabled={busy || code.length !== 6} onClick={() => void run(async () => { const r = await verify({ data: { code } }); if (!r.ok) throw new Error(r.error); setVerified(true); toast.success("Celular confirmado."); })}>Confirmar</Button></> : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-bold">Forma de pagamento</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([["PIX", "PIX", "Liberação imediata"], ["BOLETO", "Boleto", "Até 3 dias úteis"], ["CREDIT_CARD", "Cartão de crédito", "Ambiente seguro"]] as const).map(([id, label, hint]) => (
                <button key={id} disabled={busy} onClick={() => void run(async () => { const r = await createOrder({ data: { toolId: data.tool.id, billingType: id } }); if (!r.ok) throw new Error(r.error); setOrder(r); if (id === "CREDIT_CARD") window.open(r.invoiceUrl, "_blank", "noopener"); })} className="border border-border p-4 text-left transition-colors hover:border-accent">
                  <p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{hint}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <aside className="h-fit border-t-2 border-accent bg-background p-6">
        <p className="text-sm text-muted-foreground">Acesso à ferramenta + downloads em PDF e PowerPoint</p>
        <p className="mt-2 text-4xl font-bold">{price}</p>
        <p className="mt-4 text-xs text-muted-foreground">Pagamento processado pelo Asaas.</p>
      </aside>
    </section>
  );
}
