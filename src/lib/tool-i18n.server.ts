import type { ToolSpec } from "./tool-engine";
import { translateContent } from "./ai-translate.server";

type Lang = "pt" | "en" | "es" | "zh";

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

/** Traduz somente textos visíveis da ferramenta; ids, fórmulas e condições nunca são enviados à IA. */
export async function translateTool<T extends { id: string; title: string; summary: string; category?: string }>(lang: Lang, tool: T, spec: ToolSpec | null): Promise<{ tool: T; spec: ToolSpec | null }> {
  if (lang === "pt") return { tool, spec };
  const src = {
    title: tool.title, summary: tool.summary ?? "", category: tool.category ?? "",
    s: spec ? {
      title: spec.title, methodology: spec.methodology,
      ctx: spec.context_fields.map((f) => f.label),
      inp: spec.inputs.map((i) => [i.label, i.unit, i.help]),
      out: spec.outputs.map((o) => [o.label, o.unit, o.explanation]),
      rec: spec.recommendations.map((r) => r.text),
      chart: spec.chart ? [spec.chart.title, spec.chart.x_label, ...spec.chart.series.map((x) => x.label)] : [],
    } : null,
  };
  const t = await translateContent(`tool:${tool.id}:${hash(JSON.stringify(src))}`, lang, src);
  try {
    const outTool = { ...tool, title: t.title || tool.title, summary: t.summary || tool.summary, ...(tool.category !== undefined ? { category: t.category || tool.category } : {}) };
    if (!spec || !t.s) return { tool: outTool, spec };
    const s = t.s;
    const outSpec: ToolSpec = {
      ...spec, title: s.title || spec.title, methodology: s.methodology || spec.methodology,
      context_fields: spec.context_fields.map((f, i) => ({ ...f, label: s.ctx?.[i] || f.label })),
      inputs: spec.inputs.map((x, i) => ({ ...x, label: s.inp?.[i]?.[0] || x.label, unit: s.inp?.[i]?.[1] ?? x.unit, help: s.inp?.[i]?.[2] ?? x.help })),
      outputs: spec.outputs.map((x, i) => ({ ...x, label: s.out?.[i]?.[0] || x.label, unit: s.out?.[i]?.[1] ?? x.unit, explanation: s.out?.[i]?.[2] ?? x.explanation })),
      recommendations: spec.recommendations.map((r, i) => ({ ...r, text: s.rec?.[i] || r.text })),
      chart: spec.chart ? { ...spec.chart, title: s.chart?.[0] || spec.chart.title, x_label: s.chart?.[1] || spec.chart.x_label, series: spec.chart.series.map((x, i) => ({ ...x, label: s.chart?.[2 + i] || x.label })) } : spec.chart,
    };
    return { tool: outTool, spec: outSpec };
  } catch { return { tool, spec }; }
}
