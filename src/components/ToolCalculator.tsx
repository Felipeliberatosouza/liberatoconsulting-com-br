import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileDown, Presentation, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { formatValue, runTool, type ToolSpec } from "@/lib/tool-engine";
import { parseBrazilianNumber, prefillCompany, validateIntake } from "@/lib/tool-intake";
import { getToolsAccount } from "@/lib/tools.functions";
import { ToolContextInput } from "./ToolContextInput";
import { ToolNumberInput } from "./ToolNumberInput";
import { exportTool } from "@/lib/tool-export";
import { saveToolRun, getToolBranding } from "@/lib/interactive-tools.functions";
const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const COLORS = ["var(--color-accent)", "var(--color-foreground)", "var(--color-accent)", "var(--color-foreground)"];
const TT = {
  pt: { signTitle: "Entre para usar a ferramenta", signBody: "As ferramentas de gestão estão disponíveis para clientes cadastrados.", signCta: "Entrar ou criar conta", notFound: "Ferramenta não encontrada", back: "Voltar às ferramentas", tools: "Ferramentas de Gestão", calc: "Calcular resultados", fill: "Preencha os dados do seu negócio.", fileErr: "Não foi possível gerar o arquivo.", ok: "Os resultados estão dentro dos parâmetros esperados para os dados informados." },
  en: { signTitle: "Sign in to use the tool", signBody: "Management tools are available to registered clients.", signCta: "Sign in or create account", notFound: "Tool not found", back: "Back to tools", tools: "Management Tools", calc: "Calculate results", fill: "Fill in your business data.", fileErr: "Could not generate the file.", ok: "Results are within the expected parameters for the data entered." },
  es: { signTitle: "Inicie sesión para usar la herramienta", signBody: "Las herramientas de gestión están disponibles para clientes registrados.", signCta: "Entrar o crear cuenta", notFound: "Herramienta no encontrada", back: "Volver a las herramientas", tools: "Herramientas de Gestión", calc: "Calcular resultados", fill: "Complete los datos de su negocio.", fileErr: "No fue posible generar el archivo.", ok: "Los resultados están dentro de los parámetros esperados para los datos informados." },
  zh: { signTitle: "登录以使用该工具", signBody: "管理工具仅向注册客户开放。", signCta: "登录或创建账户", notFound: "未找到该工具", back: "返回工具列表", tools: "管理工具", calc: "计算结果", fill: "请填写您的企业数据。", fileErr: "无法生成文件。", ok: "根据所填数据，结果处于预期范围内。" },
} as const;
function useTT() { const { lang } = useLanguage(); return TT[lang] ?? TT.pt; }

export function ToolCalculator({ toolId, spec, guest = false }: { toolId: string; spec: ToolSpec; guest?: boolean }) {
  const tt = useTT();
  const { lang: clang } = useLanguage();
  const [contextEdits, setCtx] = useState<Record<string, string>>({});
  const account = useQuery({ queryKey: ["tools-account"], queryFn: () => getToolsAccount(), retry: false, enabled: !guest });
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
        if (!guest) void save({ data: { toolId, inputs, context: ctx } });
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
        <p className="mt-4 text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" />{({pt:"Metodologia",en:"Methodology",es:"Metodología",zh:"方法"} as const)[clang] ?? "Metodologia"}: {spec.methodology}</p>
      </div>
    </section>
  );
}

