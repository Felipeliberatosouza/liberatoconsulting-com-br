import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Copy, FileDown, Presentation, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { formatValue, runTool } from "@/lib/tool-engine";
import { parseBrazilianNumber, prefillCompany, validateIntake } from "@/lib/tool-intake";
import { getToolsAccount } from "@/lib/tools.functions";
import { ToolContextInput } from "@/components/ToolContextInput";
import { ToolNumberInput } from "@/components/ToolNumberInput";
import { exportTool } from "@/lib/tool-export";
import {
  createToolOrder, getInteractiveTool, getPublicToolMeta, getToolBranding, refreshToolOrder, saveBillingProfile, saveToolRun, sendPhoneCode, verifyPhoneCode,
} from "@/lib/interactive-tools.functions";

export const Route = createFileRoute("/ferramentas_/$slug")({
  loader: async ({ params }) => {
    try { return { meta: await getPublicToolMeta({ data: { slug: params.slug } }) }; } catch { return { meta: null }; }
  },
  head: ({ params, loaderData }) => {
    const m = loaderData?.meta;
    const title = m ? `${m.title} — Ferramenta | Liberato Consulting` : "Ferramenta de gestão — Liberato Consulting";
    const raw = m?.summary?.trim() || "Ferramenta interativa de gestão: informe os dados do seu negócio e receba resultados e relatório.";
    const description = raw.length > 160 ? raw.slice(0, 157).trimEnd() + "…" : raw;
    const url = `https://liberatoconsulting.com.br/ferramentas/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: m ? [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareApplication", name: m.title, description, applicationCategory: "BusinessApplication", operatingSystem: "Web", url, provider: { "@type": "Organization", name: "Liberato Consulting" } }) }] : [],
    };
  },
  component: ToolRunner,
});

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const COLORS = ["var(--color-accent)", "var(--color-foreground)", "#3B82F6", "#10B981"];

const TT = {
  pt: { signTitle: "Entre para usar a ferramenta", signBody: "As ferramentas de gestão estão disponíveis para clientes cadastrados.", signCta: "Entrar ou criar conta", notFound: "Ferramenta não encontrada", back: "Voltar às ferramentas", tools: "Ferramentas de Gestão", calc: "Calcular resultados", fill: "Preencha os dados do seu negócio.", fileErr: "Não foi possível gerar o arquivo.", ok: "Os resultados estão dentro dos parâmetros esperados para os dados informados." },
  en: { signTitle: "Sign in to use the tool", signBody: "Management tools are available to registered clients.", signCta: "Sign in or create account", notFound: "Tool not found", back: "Back to tools", tools: "Management Tools", calc: "Calculate results", fill: "Fill in your business data.", fileErr: "Could not generate the file.", ok: "Results are within the expected parameters for the data entered." },
  es: { signTitle: "Inicie sesión para usar la herramienta", signBody: "Las herramientas de gestión están disponibles para clientes registrados.", signCta: "Entrar o crear cuenta", notFound: "Herramienta no encontrada", back: "Volver a las herramientas", tools: "Herramientas de Gestión", calc: "Calcular resultados", fill: "Complete los datos de su negocio.", fileErr: "No fue posible generar el archivo.", ok: "Los resultados están dentro de los parámetros esperados para los datos informados." },
  zh: { signTitle: "登录以使用该工具", signBody: "管理工具仅向注册客户开放。", signCta: "登录或创建账户", notFound: "未找到该工具", back: "返回工具列表", tools: "管理工具", calc: "计算结果", fill: "请填写您的企业数据。", fileErr: "无法生成文件。", ok: "根据所填数据，结果处于预期范围内。" },
} as const;
function useTT() { const { lang } = useLanguage(); return TT[lang] ?? TT.pt; }

function ToolRunner() {
  const tt = useTT();
  const { lang } = useLanguage();
  const { slug } = Route.useParams();
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setReady(true); }); }, []);
  const q = useQuery({ queryKey: ["interactive-tool", slug, lang], queryFn: () => getInteractiveTool({ data: { slug, lang } }), enabled: signedIn, retry: false });
  if (!ready || (signedIn && q.isLoading)) return <div className="mx-auto max-w-5xl px-6 py-24 text-muted-foreground">Carregando…</div>;
  if (!signedIn) return <div className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-3xl font-bold">{tt.signTitle}</h1><p className="mt-3 text-muted-foreground">{tt.signBody}</p><Button asChild className="mt-6"><Link to="/ferramentas" search={{ modo: undefined }}>{tt.signCta}</Link></Button></div>;
  const d = q.data;
  if (!d || !d.found) return <div className="mx-auto max-w-3xl px-6 py-24"><h1 className="text-3xl font-bold">{tt.notFound}</h1><Button asChild variant="outline" className="mt-6"><Link to="/ferramentas" search={{ modo: undefined }}>{tt.back}</Link></Button></div>;
  return (
    <div className="bg-secondary/40 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <Link to="/ferramentas" search={{ modo: undefined }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="size-4" /> {tt.tools}</Link>
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
  const tt = useTT();
  const [contextEdits, setCtx] = useState<Record<string, string>>({});
  const account = useQuery({ queryKey: ["tools-account"], queryFn: () => getToolsAccount(), retry: false });
  const ctx = prefillCompany(spec.context_fields, contextEdits, account.data?.profile?.company);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"intake" | "result">("intake");
  const [busy, setBusy] = useState<"" | "pdf" | "pptx">("");
  const save = useServerFn(saveToolRun);
  const brandingQ = useQuery({ queryKey: ["tool-branding"], queryFn: () => getToolBranding() });
  const inputs = useMemo(() => Object.fromEntries(spec.inputs.map((i) => [i.id, parseBrazilianNumber(raw[i.id] ?? "")])), [raw, spec.inputs]);
  const result = useMemo(() => runTool(spec, inputs), [spec, inputs]);
  const ctxOk = spec.context_fields.every((f) => (ctx[f.id] ?? "").trim());

  if (step === "intake") {
    return (
      <form className="mt-10 grid gap-5 bg-background p-6 md:grid-cols-2" onSubmit={async (e) => {
        e.preventDefault();
        if (!ctxOk) { toast.error(tt.fill); return; }
        const intakeError = validateIntake(spec, ctx, inputs);
        if (intakeError) { toast.error(intakeError); return; }
        if (!result.ok) { toast.error(result.error); return; }
        setStep("result");
        void save({ data: { toolId, inputs, context: ctx } });
      }}>
        <div className="md:col-span-2"><h2 className="text-2xl font-bold">1. Dados do seu negócio</h2><p className="mt-1 text-sm text-muted-foreground">Essas informações personalizam a ferramenta e o relatório.</p></div>
        {spec.context_fields.map((f) => <label key={f.id} className="min-w-0 text-sm font-medium">{f.label} *<ToolContextInput field={f} value={ctx[f.id] ?? ""} onChange={value => setCtx(current => ({ ...current, [f.id]: value }))} className={field} /></label>)}
        <div className="md:col-span-2 mt-4"><h2 className="text-2xl font-bold">2. Números para o cálculo</h2></div>
        {spec.inputs.map((i) => (
          <label key={i.id} className="text-sm font-medium">{i.label}{i.unit ? ` (${i.unit})` : ""} *
            <ToolNumberInput input={i} value={raw[i.id] ?? ""} onChange={value => setRaw({ ...raw, [i.id]: value })} className={field} />
            {i.help ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{i.help}</span> : null}
          </label>
        ))}
        {!result.ok && Object.keys(raw).length === spec.inputs.length ? <p className="text-sm text-destructive md:col-span-2">{result.error}</p> : null}
        <Button type="submit" className="md:col-span-2 md:w-fit">{tt.calc}</Button>
      </form>
    );
  }
  if (!result.ok) return null;
  const data = { spec, context: ctx, inputs, values: result.values, recommendations: result.recommendations, chart: result.chart };
  const download = async (kind: "pdf" | "pptx") => {
    if (!brandingQ.data) return;
    setBusy(kind);
    try { await exportTool(kind, data, brandingQ.data); } catch (e) { console.error(e); toast.error(tt.fileErr); } finally { setBusy(""); }
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
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{(result.recommendations.length ? result.recommendations : [tt.ok]).map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="mt-4 text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" />{({pt:"Metodologia",en:"Methodology",es:"Metodología",zh:"方法"} as const)[useLanguage().lang] ?? "Metodologia"}: {spec.methodology}</p>
      </div>
    </section>
  );
}

const CO = {
  pt: { paid: "Pagamento confirmado! Ferramenta liberada.", err: c.err, wait: "Aguardando pagamento", pixCopied: "Código PIX copiado.", copyPix: "Copiar PIX copia e cola", slip: "Abrir boleto", card: "Pagar com cartão no ambiente seguro do Asaas", auto: "A ferramenta é liberada automaticamente assim que o pagamento for confirmado.", other: "Escolher outra forma de pagamento", reg: "Cadastro para compra", regBody: "Seu cadastro atual não muda. Estes dados são usados só para emitir a cobrança. Os dados de cartão são digitados no ambiente seguro do Asaas e nunca ficam salvos aqui.", saved: "Cadastro salvo. Agora confirme seu celular.", name: "Nome completo ou razão social *", doc: "CPF ou CNPJ *", phone: "Celular (WhatsApp) *", zip: "CEP *", num: "Número do endereço *", email: "E-mail confirmado", save: "Salvar cadastro", confirmPhone: "Confirmação do celular", codeInfo: "Enviaremos um código de 6 dígitos pelo WhatsApp.", codeSent: "Código enviado.", resend: "Reenviar código", send: "Enviar código", phoneOk: "Celular confirmado.", confirm: "Confirmar", method: "Forma de pagamento", pixHint: "Liberação imediata", slipL: "Boleto", slipHint: "Até 3 dias úteis", cardL: "Cartão de crédito", cardHint: "Ambiente seguro", access: "Acesso à ferramenta + downloads em PDF e PowerPoint", by: "Pagamento processado pelo Asaas." },
  en: { paid: "Payment confirmed! Tool unlocked.", err: "Unexpected error.", wait: "Awaiting payment", pixCopied: "PIX code copied.", copyPix: "Copy PIX code", slip: "Open bank slip (boleto)", card: "Pay by card in Asaas' secure checkout", auto: "The tool is unlocked automatically as soon as payment is confirmed.", other: "Choose another payment method", reg: "Purchase details", regBody: "Your current account does not change. These details are used only to issue the charge. Card details are entered in Asaas' secure checkout and are never stored here.", saved: "Details saved. Now confirm your mobile number.", name: "Full name or company name *", doc: "CPF or CNPJ (Brazilian tax ID) *", phone: "Mobile (WhatsApp) *", zip: "Postal code (CEP) *", num: "Street number *", email: "Confirmed email", save: "Save details", confirmPhone: "Mobile confirmation", codeInfo: "We will send a 6-digit code via WhatsApp.", codeSent: "Code sent.", resend: "Resend code", send: "Send code", phoneOk: "Mobile confirmed.", confirm: "Confirm", method: "Payment method", pixHint: "Instant release", slipL: "Bank slip (boleto)", slipHint: "Up to 3 business days", cardL: "Credit card", cardHint: "Secure checkout", access: "Tool access + PDF and PowerPoint downloads", by: "Payment processed by Asaas." },
  es: { paid: "¡Pago confirmado! Herramienta habilitada.", err: "Error inesperado.", wait: "Esperando el pago", pixCopied: "Código PIX copiado.", copyPix: "Copiar código PIX", slip: "Abrir boleto", card: "Pagar con tarjeta en el entorno seguro de Asaas", auto: "La herramienta se habilita automáticamente en cuanto se confirma el pago.", other: "Elegir otra forma de pago", reg: "Datos para la compra", regBody: "Su registro actual no cambia. Estos datos se usan solo para emitir el cobro. Los datos de la tarjeta se ingresan en el entorno seguro de Asaas y nunca se guardan aquí.", saved: "Datos guardados. Ahora confirme su celular.", name: "Nombre completo o razón social *", doc: "CPF o CNPJ *", phone: "Celular (WhatsApp) *", zip: "Código postal (CEP) *", num: "Número de la dirección *", email: "Correo confirmado", save: "Guardar datos", confirmPhone: "Confirmación del celular", codeInfo: "Le enviaremos un código de 6 dígitos por WhatsApp.", codeSent: "Código enviado.", resend: "Reenviar código", send: "Enviar código", phoneOk: "Celular confirmado.", confirm: "Confirmar", method: "Forma de pago", pixHint: "Habilitación inmediata", slipL: "Boleto", slipHint: "Hasta 3 días hábiles", cardL: "Tarjeta de crédito", cardHint: "Entorno seguro", access: "Acceso a la herramienta + descargas en PDF y PowerPoint", by: "Pago procesado por Asaas." },
  zh: { paid: "付款已确认！工具已开通。", err: "发生意外错误。", wait: "等待付款", pixCopied: "PIX 代码已复制。", copyPix: "复制 PIX 代码", slip: "打开银行付款单", card: "在 Asaas 安全页面使用银行卡支付", auto: "付款确认后，工具将自动开通。", other: "选择其他付款方式", reg: "购买信息", regBody: "您当前的账户不会改变。这些信息仅用于开具账单。银行卡信息在 Asaas 安全页面填写，绝不会保存在本站。", saved: "信息已保存，请确认您的手机号码。", name: "全名或公司名称 *", doc: "CPF 或 CNPJ（巴西税号）*", phone: "手机（WhatsApp）*", zip: "邮政编码（CEP）*", num: "门牌号 *", email: "已确认的邮箱", save: "保存信息", confirmPhone: "手机验证", codeInfo: "我们将通过 WhatsApp 发送 6 位验证码。", codeSent: "验证码已发送。", resend: "重新发送验证码", send: "发送验证码", phoneOk: "手机已确认。", confirm: "确认", method: "付款方式", pixHint: "即时开通", slipL: "银行付款单", slipHint: "最多 3 个工作日", cardL: "信用卡", cardHint: "安全支付", access: "工具使用权 + PDF 和 PowerPoint 下载", by: "付款由 Asaas 处理。" },
} as const;

function Checkout({ data, onPaid }: { data: Loaded; onPaid: () => void }) {
  const c = CO[useLanguage().lang] ?? CO.pt;
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
    const t = setInterval(async () => { const r = await refresh({ data: { orderId: order.orderId } }); if (r.status === "paid") { clearInterval(t); toast.success(c.paid); onPaid(); } }, 8000);
    return () => clearInterval(t);
  }, [order, refresh, onPaid]);

  const price = Number(data.tool.price_brl).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (e) { toast.error(e instanceof Error ? e.message : c.err); } finally { setBusy(false); } };

  return (
    <section className="mt-10 grid gap-6 md:grid-cols-[1fr_320px]">
      <div className="space-y-6 bg-background p-6">
        {order ? (
          <div>
            <h2 className="text-2xl font-bold">{c.wait}</h2>
            {order.pixImage ? <><img src={`data:image/png;base64,${order.pixImage}`} alt="QR Code PIX" className="mt-4 size-56" /><Button variant="outline" className="mt-3" onClick={() => { void navigator.clipboard.writeText(order.pixPayload ?? ""); toast.success(c.pixCopied); }}><Copy /> {c.copyPix}</Button></> : null}
            {order.bankSlipUrl ? <p className="mt-4"><a className="font-semibold text-accent underline" href={order.bankSlipUrl} target="_blank" rel="noreferrer">{c.slip}</a></p> : null}
            {order.invoiceUrl && !order.pixImage && !order.bankSlipUrl ? <p className="mt-4"><a className="font-semibold text-accent underline" href={order.invoiceUrl} target="_blank" rel="noreferrer">{c.card}</a></p> : null}
            <p className="mt-4 text-sm text-muted-foreground">{c.auto}</p>
            <Button variant="ghost" className="mt-2" onClick={() => setOrder(null)}>{c.other}</Button>
          </div>
        ) : !hasProfile || !verified ? (
          <>
            <div><h2 className="text-2xl font-bold">{c.reg}</h2><p className="mt-1 text-sm text-muted-foreground">{c.regBody}</p></div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void run(async () => { const r = await saveProfile({ data: form }); if (!r.ok) throw new Error(r.error); setHasProfile(true); toast.success(c.saved); }); }}>
              <label className="text-sm font-medium md:col-span-2">{c.name}<input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">{c.doc}<input required value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">{c.phone}<input required value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setVerified(false); }} className={field} /></label>
              <label className="text-sm font-medium">{c.zip}<input required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className={field} /></label>
              <label className="text-sm font-medium">{c.num}<input required value={form.address_number} onChange={(e) => setForm({ ...form, address_number: e.target.value })} className={field} /></label>
              <p className="text-xs text-muted-foreground md:col-span-2">{c.email}: {data.email}</p>
              <Button type="submit" disabled={busy} className="md:w-fit">{c.save}</Button>
            </form>
            {hasProfile && !verified ? (
              <div className="border-t border-border pt-5">
                <h3 className="font-bold">{c.confirmPhone}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.codeInfo}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button variant="outline" disabled={busy} onClick={() => void run(async () => { const r = await sendCode(); if (!r.ok) throw new Error(r.error); setCodeSent(true); toast.success(c.codeSent); })}>{codeSent ? c.resend : c.send}</Button>
                  {codeSent ? <><input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button disabled={busy || code.length !== 6} onClick={() => void run(async () => { const r = await verify({ data: { code } }); if (!r.ok) throw new Error(r.error); setVerified(true); toast.success(c.phoneOk); })}>{c.confirm}</Button></> : null}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <h2 className="text-2xl font-bold">{c.method}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {([["PIX", "PIX", c.pixHint], ["BOLETO", c.slipL, c.slipHint], ["CREDIT_CARD", c.cardL, c.cardHint]] as const).map(([id, label, hint]) => (
                <button key={id} disabled={busy} onClick={() => void run(async () => { const r = await createOrder({ data: { toolId: data.tool.id, billingType: id } }); if (!r.ok) throw new Error(r.error); setOrder(r); if (id === "CREDIT_CARD") window.open(r.invoiceUrl, "_blank", "noopener"); })} className="border border-border p-4 text-left transition-colors hover:border-accent">
                  <p className="font-semibold">{label}</p><p className="text-xs text-muted-foreground">{hint}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <aside className="h-fit border-t-2 border-accent bg-background p-6">
        <p className="text-sm text-muted-foreground">{c.access}</p>
        <p className="mt-2 text-4xl font-bold">{price}</p>
        <p className="mt-4 text-xs text-muted-foreground">{c.by}</p>
      </aside>
    </section>
  );
}
