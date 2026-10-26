import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, ExternalLink, FileSpreadsheet, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { priceFromCost } from "@/lib/tool-engine";
import { deleteInteractiveTool, generateInteractiveTool, listInteractiveToolsAdmin, updateInteractiveTool, type InteractiveToolRow } from "@/lib/interactive-tools.functions";

export const Route = createFileRoute("/admin/ferramentas-interativas")({
  head: () => ({
    meta: [
      { title: "Ferramentas de gestão com IA — Painel Liberato" },
      { name: "description", content: "Crie ferramentas de gestão interativas com IA ou a partir de planilhas." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ferramentas de gestão com IA — Painel Liberato" },
      { property: "og:description", content: "Criação, precificação e publicação de ferramentas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInteractiveTools,
});

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const brl = (v: number, digits = 2) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Lê a planilha no navegador e transforma células, valores e fórmulas em texto para a IA. */
async function spreadsheetToText(file: File): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { cellFormula: true });
  const parts: string[] = [];
  let count = 0;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    parts.push(`### Aba: ${name}`);
    for (const addr of Object.keys(ws)) {
      if (addr.startsWith("!")) continue;
      const c = ws[addr] as { v?: unknown; f?: string };
      if (c.v === undefined && !c.f) continue;
      parts.push(`${addr}: ${c.f ? `=${c.f} → ` : ""}${String(c.v ?? "")}`);
      if (++count > 1500) return parts.join("\n").slice(0, 58000);
    }
  }
  return parts.join("\n").slice(0, 58000);
}

function AdminInteractiveTools() {
  const q = useQuery({ queryKey: ["admin-interactive-tools"], queryFn: () => listInteractiveToolsAdmin() });
  const generate = useServerFn(generateInteractiveTool);
  const [prompt, setPrompt] = useState("");
  const [pricingMode, setPricingMode] = useState<"free" | "paid" | "referral">("free");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (toolId?: string, extra?: string) => {
    const text = extra ?? prompt;
    if (text.trim().length < 10) { toast.error("Descreva a ferramenta com mais detalhes."); return; }
    setBusy(true);
    try {
      const spreadsheet = file ? await spreadsheetToText(file) : undefined;
      const r = await generate({ data: { prompt: text, spreadsheet, toolId, pricing_mode: pricingMode } });
      if (!r.ok) { toast.error(r.error); return; }
      if (r.issues.length) toast.warning("A ferramenta foi criada, mas não passou em todos os testes de cálculo. Revise antes de publicar.");
      else if (r.reviewIssues.length) toast.warning("Testes aprovados; o auditor deixou observações.");
      else toast.success(`Ferramenta criada e verificada. Custo de IA: ${brl(r.cost, 4)}`);
      setPrompt(""); setFile(null);
      void q.refetch();
    } finally { setBusy(false); }
  };

  const tools = q.data?.tools ?? [];
  const orders = q.data?.orders ?? [];
  return (
    <AdminShell title="Ferramentas de gestão com IA" requireAdmin description="Crie, verifique, precifique e publique ferramentas interativas para clientes.">
      <section className="border border-border bg-card p-6">
        <h2 className="text-xl font-bold">Criar nova ferramenta</h2>
        <p className="mt-1 text-sm text-muted-foreground">Um agente de IA desenha a ferramenta; o sistema executa os cálculos em código e roda casos de teste; um segundo agente audita conceitos e fórmulas. Só ferramentas aprovadas nos testes podem ser publicadas.</p>
        <label className="mt-4 block text-sm font-medium">Forma de acesso<select className={field} value={pricingMode} onChange={e => setPricingMode(e.target.value as "free" | "paid" | "referral")}><option value="free">Gratuita</option><option value="paid">Paga</option><option value="referral">Gratuita com indicação de amigo</option></select></label>
        <label className="mt-4 block text-sm font-medium">O que a ferramenta deve fazer? *
          <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} className={field} placeholder="Ex.: Ferramenta de Ponto de Equilíbrio de um produto: coletar custo fixo mensal, preço e custo variável unitário, e mostrar a quantidade mínima a vender e o preço mínimo para não ter prejuízo, com gráfico." />
        </label>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium"><FileSpreadsheet className="size-4 text-accent" /> {file ? file.name : "Anexar planilha Excel como base (opcional)"}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-4"><Button disabled={busy} onClick={() => void create()}><Sparkles /> {busy ? "Criando e verificando (pode levar 1–2 min)…" : "Criar com IA"}</Button></div>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Ferramentas ({tools.length})</h2>
        {tools.map((t) => <ToolCard key={t.id} tool={t} sales={orders.filter((o) => o.tool_id === t.id)} busy={busy} onChanged={() => void q.refetch()} onRegenerate={(txt) => void create(t.id, txt)} />)}
        {!tools.length && !q.isLoading ? <p className="text-sm text-muted-foreground">Nenhuma ferramenta criada ainda.</p> : null}
      </section>
    </AdminShell>
  );
}

function ToolCard({ tool, sales, busy, onChanged, onRegenerate }: { tool: InteractiveToolRow; sales: Array<{ status: string; amount_brl: number }>; busy: boolean; onChanged: () => void; onRegenerate: (t: string) => void }) {
  const update = useServerFn(updateInteractiveTool);
  const remove = useServerFn(deleteInteractiveTool);
  const [f, setF] = useState({ title: tool.title, summary: tool.summary, category: tool.category, status: tool.status as "draft" | "published", pricing_mode: tool.pricing_mode, markup_pct: Number(tool.markup_pct), price_brl: Number(tool.price_brl) });
  const [fix, setFix] = useState("");
  const cost = Number(tool.ai_cost_brl);
  const suggested = priceFromCost(cost, f.markup_pct);
  const v = tool.verification ?? {};
  const failed = (v.issues?.length ?? 0) > 0;
  const paid = sales.filter((s) => s.status === "paid");
  const url = typeof window !== "undefined" ? `${window.location.origin}/ferramentas/${tool.slug}` : `/ferramentas/${tool.slug}`;
  const save = async () => { const r = await update({ data: { id: tool.id, ...f } }); if (r.ok) { toast.success("Ferramenta atualizada."); onChanged(); } else toast.error(r.error); };
  return (
    <article className="border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{tool.category} · {tool.status === "published" ? "Publicada" : "Rascunho"}</p>
          <h3 className="mt-1 text-lg font-bold">{tool.title}</h3>
          <p className={`mt-1 text-xs font-semibold ${failed ? "text-destructive" : "text-accent"}`}>{failed ? `Reprovada nos testes de cálculo (${v.issues?.length ?? 0} problema(s))` : `Aprovada em ${tool.spec.test_cases?.length ?? 0} casos de teste${v.reviewIssues?.length ? " · auditor com observações" : " · auditoria sem ressalvas"}`}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Link copiado."); }}><Copy /> Copiar link</Button>
          <Button size="sm" variant="outline" asChild><Link to="/ferramentas/$slug" params={{ slug: tool.slug }} target="_blank"><ExternalLink /> Abrir</Link></Button>
          <Button size="sm" variant="ghost" onClick={async () => { if (!confirm("Excluir esta ferramenta?")) return; await remove({ data: { id: tool.id } }); onChanged(); }}><Trash2 /></Button>
        </div>
      </div>
      {(v.issues?.length || v.reviewIssues?.length) ? <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground">{[...(v.issues ?? []), ...(v.reviewIssues ?? [])].slice(0, 8).map((i) => <li key={i}>{i}</li>)}</ul> : null}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-sm font-medium md:col-span-2">Título<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={field} /></label>
        <label className="text-sm font-medium">Categoria<input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={field} /></label>
        <label className="text-sm font-medium md:col-span-3">Resumo<textarea rows={2} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} className={field} /></label>
      </div>

      <div className="mt-4 grid gap-3 rounded-md bg-secondary/50 p-4 md:grid-cols-5">
        <div><p className="text-xs text-muted-foreground">Custo de IA (estimado)</p><p className="text-lg font-bold">{brl(cost, 4)}</p><p className="text-[11px] text-muted-foreground">{v.usage?.length ?? 0} chamadas de agentes</p></div>
        <label className="text-sm font-medium">Cobrança<select value={f.pricing_mode} onChange={(e) => setF({ ...f, pricing_mode: e.target.value as "free" | "paid" | "referral" })} className={field}><option value="free">Gratuita</option><option value="paid">Paga</option><option value="referral">Gratuita com indicação de amigo</option></select></label>
        <label className="text-sm font-medium">Markup (%)<input type="number" min={0} value={f.markup_pct} onChange={(e) => setF({ ...f, markup_pct: Number(e.target.value) })} className={field} /><span className="text-[11px] font-normal text-muted-foreground">Sugerido: {brl(suggested)}</span></label>
        <label className="text-sm font-medium">Preço de venda (R$)<input type="number" min={0} step="0.01" value={f.price_brl} disabled={f.pricing_mode !== "paid"} onChange={(e) => setF({ ...f, price_brl: Number(e.target.value) })} className={field} /><button type="button" className="text-[11px] text-accent underline" onClick={() => setF({ ...f, price_brl: Math.max(5, suggested) })}>Usar custo + markup</button></label>
        <div><p className="text-xs text-muted-foreground">Vendas</p><p className="text-lg font-bold">{paid.length}</p><p className="text-[11px] text-muted-foreground">{brl(paid.reduce((s, o) => s + Number(o.amount_brl), 0))} recebidos</p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as "draft" | "published" })} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="draft">Rascunho (oculta)</option><option value="published">Publicada para clientes</option></select>
        <Button onClick={() => void save()}>Salvar</Button>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-semibold">Campos, fórmulas e ajustes com IA</summary>
        <div className="mt-3 grid gap-4 text-xs md:grid-cols-2">
          <div><p className="font-semibold">Dados coletados</p><ul className="mt-1 list-disc pl-4">{tool.spec.context_fields?.map((c) => <li key={c.id}>{c.label}</li>)}{tool.spec.inputs?.map((i) => <li key={i.id}>{i.label} ({i.unit}) — <code>{i.id}</code></li>)}</ul></div>
          <div><p className="font-semibold">Resultados</p><ul className="mt-1 list-disc pl-4">{tool.spec.outputs?.map((o) => <li key={o.id}>{o.label}: <code>{o.formula}</code></li>)}</ul></div>
          <p className="md:col-span-2"><span className="font-semibold">Metodologia:</span> {tool.spec.methodology}</p>
        </div>
        <label className="mt-3 block text-sm font-medium">Pedir ajuste à IA (o custo é somado ao da ferramenta)<textarea rows={2} value={fix} onChange={(e) => setFix(e.target.value)} className={field} placeholder="Ex.: incluir impostos sobre a venda em % e margem de lucro desejada." /></label>
        <Button size="sm" className="mt-2" variant="outline" disabled={busy} onClick={() => onRegenerate(`${tool.title}. ${tool.summary}\nAjuste solicitado: ${fix}`)}><Sparkles /> Refazer com ajuste</Button>
      </details>
    </article>
  );
}
