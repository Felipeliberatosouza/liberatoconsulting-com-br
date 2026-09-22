import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listServiceProducts } from "@/lib/services.functions";
import {
  deleteDiagnostic,
  listDiagnostics,
  saveDiagnostic,
  type DiagnosticRow,
} from "@/lib/projects.functions";
import {
  DEFAULT_BUDGET,
  DEFAULT_MODULES,
  SCORE_DIMENSIONS,
  computeTotals,
  moduleDays,
  questionsForFamily,
  scoreBand,
  weightedScore,
  type DiagnosticBudget,
  type ScopeModule,
} from "@/lib/diagnostic-catalog";

export const Route = createFileRoute("/admin/projetos_/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico detalhado — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DiagnosticPage,
});

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });

function DiagnosticPage() {
  const qc = useQueryClient();
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [serviceSlug, setServiceSlug] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consultantNotes, setConsultantNotes] = useState<Record<string, string>>({});
  const [scoreValues, setScoreValues] = useState<Record<string, number>>({});
  const [scoreWhy, setScoreWhy] = useState<Record<string, string>>({});
  const [modules, setModules] = useState<ScopeModule[]>(DEFAULT_MODULES);
  const [budget, setBudget] = useState<DiagnosticBudget>(DEFAULT_BUDGET);

  const services = useQuery({
    queryKey: ["admin-services"],
    queryFn: () => listServiceProducts(),
    retry: false,
  });
  const list = useQuery({
    queryKey: ["project-diagnostics"],
    queryFn: () => listDiagnostics(),
    retry: false,
  });

  const service = (services.data ?? []).find((s) => s.slug === serviceSlug);
  const questions = useMemo(
    () => questionsForFamily(service?.family_id ?? ""),
    [service?.family_id],
  );

  useEffect(() => {
    if (!serviceSlug && (services.data ?? []).length > 0) {
      setServiceSlug(services.data![0]!.slug);
    }
  }, [services.data, serviceSlug]);

  function reset() {
    setId(null);
    setTitle("");
    setClientName("");
    setAnswers({});
    setConsultantNotes({});
    setScoreValues({});
    setScoreWhy({});
    setModules(DEFAULT_MODULES);
    setBudget(DEFAULT_BUDGET);
  }

  function load(row: DiagnosticRow) {
    setId(row.id);
    setTitle(row.title);
    setClientName(row.client_name);
    setServiceSlug(row.service_slug);
    setAnswers(row.answers ?? {});
    setConsultantNotes(row.consultant_notes ?? {});
    const s = (row.scores ?? {}) as Record<string, number>;
    setScoreValues(s);
    setScoreWhy((row.consultant_notes?.["__why"] ? JSON.parse(row.consultant_notes["__why"]) : {}) as Record<string, string>);
    setModules(
      Array.isArray(row.modules) && row.modules.length > 0
        ? (row.modules as unknown as ScopeModule[])
        : DEFAULT_MODULES,
    );
    setBudget({ ...DEFAULT_BUDGET, ...(row.budget as unknown as DiagnosticBudget) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const save = useMutation({
    mutationFn: () =>
      saveDiagnostic({
        data: {
          ...(id ? { id } : {}),
          title: title || `${clientName || "Diagnóstico"} — ${service?.title ?? ""}`,
          client_name: clientName,
          service_slug: serviceSlug,
          service_title: service?.title ?? "",
          scope_submission_id: null,
          answers,
          consultant_notes: { ...consultantNotes, __why: JSON.stringify(scoreWhy) },
          scores: scoreValues,
          modules: modules as unknown as Array<Record<string, string | number | boolean>>,
          budget: budget as unknown as Record<string, number>,
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setId(res.id);
      toast.success("Diagnóstico salvo.");
      void qc.invalidateQueries({ queryKey: ["project-diagnostics"] });
    },
  });

  const remove = useMutation({
    mutationFn: (rowId: string) => deleteDiagnostic({ data: { id: rowId } }),
    onSuccess: () => {
      reset();
      toast.success("Diagnóstico excluído.");
      void qc.invalidateQueries({ queryKey: ["project-diagnostics"] });
    },
  });

  const totals = computeTotals(modules, budget);
  const avg = weightedScore(scoreValues);
  const answered = questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const pending = questions.filter((q) => q.required && !(answers[q.id] ?? "").trim()).length;

  function patchModule(mid: string, patch: Partial<ScopeModule>) {
    setModules((prev) => prev.map((m) => (m.id === mid ? { ...m, ...patch } : m)));
  }

  return (
    <AdminShell
      title="Etapa 2 — Diagnóstico Detalhado"
      description="Coleta das informações do cliente por serviço, avaliação de esforço, desenho do escopo e orçamento indicativo."
      requireAdmin
    >
      <Link
        to="/admin/projetos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="size-4" /> Voltar para Projetos
      </Link>

      <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-background p-5 md:grid-cols-4">
        <div>
          <Label>Cliente</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div>
          <Label>Título do diagnóstico</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Serviço</Label>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
          >
            {(services.data ?? []).map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {id ? "Salvar alterações" : "Salvar diagnóstico"}
          </Button>
          {id ? (
            <Button variant="outline" onClick={reset}>
              <Plus className="mr-1 size-4" /> Novo
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="leiame">
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="leiame">Leia-me</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="score">Score de esforço</TabsTrigger>
          <TabsTrigger value="escopo">Escopo e esforço</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        {/* ---------------- Leia-me ---------------- */}
        <TabsContent value="leiame" className="space-y-4 text-sm leading-6">
          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-display text-lg font-semibold">Como usar esta ferramenta</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>
                Escolha o serviço e conduza a conversa com o cliente usando as perguntas da aba
                Diagnóstico. Registre respostas completas, links e pontos ainda desconhecidos.
              </li>
              <li>
                Depois da conversa, atribua notas de 1 a 5 na aba Score de esforço. A nota mede
                ambiguidade, profundidade, volume e risco de execução — não a qualidade do cliente.
              </li>
              <li>
                Na aba Escopo e esforço, marque os módulos que respondem às perguntas do cliente e
                ajuste quantidade, dias e composição por perfil.
              </li>
              <li>
                Na aba Orçamento, revise taxas, custos de terceiros, contingência, impostos e
                desconto.
              </li>
              <li>
                Use o Resumo como revisão interna antes de gerar o orçamento final na etapa 4.
              </li>
            </ol>
          </section>
          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-display text-lg font-semibold">
              Princípios para não subestimar nem superestimar
            </h2>
            <ul className="mt-3 space-y-2 pl-5 text-muted-foreground [list-style:disc]">
              <li>Defina primeiro a decisão que o trabalho precisa suportar.</li>
              <li>
                Separe coleta de dados, análise, validação em campo e modelagem: cada bloco tem
                premissas, esforço e riscos diferentes.
              </li>
              <li>
                Registre sempre a fonte e a premissa de cada número apresentado ao cliente.
              </li>
              <li>
                Trabalho em campo depende de acesso, agenda e consentimento; havendo dependência do
                cliente, inclua contingência.
              </li>
              <li>
                O orçamento deve mostrar honorários, custos de terceiros, contingência e tributos de
                forma separada.
              </li>
            </ul>
          </section>
        </TabsContent>

        {/* ---------------- Diagnóstico ---------------- */}
        <TabsContent value="diagnostico" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Perguntas do serviço <strong>{service?.title ?? "—"}</strong> ·{" "}
            {service?.family_title ?? ""} · {answered} de {questions.length} respondidas ·{" "}
            {pending} obrigatórias pendentes.
          </p>
          {Array.from(new Set(questions.map((q) => q.block))).map((block) => (
            <section key={block} className="rounded-2xl border border-border bg-background p-6">
              <h3 className="font-display text-base font-semibold">{block}</h3>
              <div className="mt-4 space-y-5">
                {questions
                  .filter((q) => q.block === block)
                  .map((q) => (
                    <div key={q.id} className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">
                          {q.question}{" "}
                          {q.required ? (
                            <span className="text-destructive">*</span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {q.id} · {q.format} · impacto {q.impact.toLowerCase()}
                        </p>
                        <Textarea
                          className="mt-2"
                          rows={3}
                          placeholder="Resposta do cliente"
                          value={answers[q.id] ?? ""}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Observações do consultor</p>
                        <Textarea
                          className="mt-2"
                          rows={3}
                          value={consultantNotes[q.id] ?? ""}
                          onChange={(e) =>
                            setConsultantNotes({ ...consultantNotes, [q.id]: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          ))}
        </TabsContent>

        {/* ---------------- Score ---------------- */}
        <TabsContent value="score" className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-4 py-3">Dimensão</th>
                  <th className="px-4 py-3">O que observar</th>
                  <th className="px-4 py-3">Nota (1–5)</th>
                  <th className="px-4 py-3">Peso</th>
                  <th className="px-4 py-3">Pontos</th>
                  <th className="px-4 py-3">Evidência / motivo</th>
                </tr>
              </thead>
              <tbody>
                {SCORE_DIMENSIONS.map((d) => (
                  <tr key={d.id} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-medium">{d.label}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.hint}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step={1}
                        className="w-20"
                        value={scoreValues[d.id] ?? 0}
                        onChange={(e) =>
                          setScoreValues({ ...scoreValues, [d.id]: Number(e.target.value) || 0 })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">{(d.weight * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">
                      {num((scoreValues[d.id] ?? 0) * d.weight)}
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={scoreWhy[d.id] ?? ""}
                        onChange={(e) => setScoreWhy({ ...scoreWhy, [d.id]: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Média ponderada: <strong>{num(avg)}</strong> — {scoreBand(avg)}. Use a faixa como sinal
            para revisar contingência, gates de escopo e cronograma; nunca converta a nota
            diretamente em preço.
          </p>
        </TabsContent>

        {/* ---------------- Escopo e esforço ---------------- */}
        <TabsContent value="escopo" className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-3 py-3">Incluir</th>
                  <th className="px-3 py-3">Módulo</th>
                  <th className="px-3 py-3">Fase</th>
                  <th className="px-3 py-3">Qtd.</th>
                  <th className="px-3 py-3">Dias un.</th>
                  <th className="px-3 py-3">Sênior</th>
                  <th className="px-3 py-3">Analista</th>
                  <th className="px-3 py-3">PM</th>
                  <th className="px-3 py-3">Custo direto</th>
                  <th className="px-3 py-3">Dias por perfil</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => {
                  const d = moduleDays(m);
                  return (
                    <tr key={m.id} className="border-t border-border align-top">
                      <td className="px-3 py-3">
                        <Checkbox
                          checked={m.include}
                          onCheckedChange={(v) => patchModule(m.id, { include: Boolean(v) })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.deliverable}</p>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{m.phase}</td>
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          className="w-20"
                          value={m.qty}
                          onChange={(e) => patchModule(m.id, { qty: Number(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={0.25}
                          className="w-20"
                          value={m.unitDays}
                          onChange={(e) =>
                            patchModule(m.id, { unitDays: Number(e.target.value) || 0 })
                          }
                        />
                      </td>
                      {(["senior", "analyst", "pm"] as const).map((k) => (
                        <td key={k} className="px-3 py-3">
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            className="w-20"
                            value={m[k]}
                            onChange={(e) =>
                              patchModule(m.id, { [k]: Number(e.target.value) || 0 } as Partial<ScopeModule>)
                            }
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          className="w-28"
                          value={m.directCost}
                          onChange={(e) =>
                            patchModule(m.id, { directCost: Number(e.target.value) || 0 })
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {num(d.senior)} / {num(d.analyst)} / {num(d.pm)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-sm">
            Totais: <strong>{num(totals.days.senior)}</strong> dias sênior ·{" "}
            <strong>{num(totals.days.analyst)}</strong> dias analista ·{" "}
            <strong>{num(totals.days.pm)}</strong> dias PM · custos diretos{" "}
            <strong>{brl(totals.days.direct)}</strong>.
          </p>
        </TabsContent>

        {/* ---------------- Orçamento ---------------- */}
        <TabsContent value="orcamento" className="space-y-6">
          <section className="rounded-2xl border border-border bg-background p-6">
            <h3 className="font-display text-base font-semibold">Premissas de preço</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {(
                [
                  ["rateSenior", "Taxa diária — Sênior (R$)"],
                  ["rateAnalyst", "Taxa diária — Analista (R$)"],
                  ["ratePm", "Taxa diária — PM (R$)"],
                  ["contingencyPct", "Contingência (%)"],
                  ["taxPct", "Impostos / encargos (%)"],
                  ["discountPct", "Desconto comercial (%)"],
                ] as Array<[keyof DiagnosticBudget, string]>
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={budget[key]}
                    onChange={(e) =>
                      setBudget({ ...budget, [key]: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6">
            <h3 className="font-display text-base font-semibold">Cálculo do preço</h3>
            <table className="mt-4 w-full text-sm">
              <tbody>
                {[
                  ["Honorários sênior", totals.days.senior * budget.rateSenior],
                  ["Honorários analista", totals.days.analyst * budget.rateAnalyst],
                  ["Honorários PM", totals.days.pm * budget.ratePm],
                  ["Serviços profissionais", totals.fees],
                  ["Custos diretos", totals.days.direct],
                  ["Subtotal antes da contingência", totals.subtotal],
                  ["Contingência", totals.contingency],
                  ["Subtotal com contingência", totals.withContingency],
                  ["Impostos / encargos", totals.tax],
                  ["Preço antes do desconto", totals.beforeDiscount],
                  ["Desconto comercial", -totals.discount],
                ].map(([label, value]) => (
                  <tr key={label as string} className="border-b border-border">
                    <td className="py-2">{label as string}</td>
                    <td className="py-2 text-right">{brl(value as number)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-3 font-semibold">Preço indicativo final</td>
                  <td className="py-3 text-right font-semibold">{brl(totals.final)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6">
            <h3 className="font-display text-base font-semibold">
              Faixa de negociação e marcos de pagamento
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                ["Piso controlado", 0.85, "Escopo bem delimitado e dependências controladas."],
                ["Base recomendada", 1, "Preço alinhado às premissas registradas."],
                ["Expansão / risco alto", 1.15, "Campo intenso, prazo crítico ou acesso incerto."],
              ].map(([label, factor, note]) => (
                <div key={label as string} className="rounded-xl border border-border p-4">
                  <p className="text-sm font-medium">{label as string}</p>
                  <p className="mt-1 font-display text-lg font-bold">
                    {brl(totals.final * (factor as number))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{note as string}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                ["Assinatura / início", 0.4],
                ["Entrega intermediária", 0.4],
                ["Entrega final", 0.2],
              ].map(([label, pct]) => (
                <div key={label as string} className="rounded-xl bg-secondary p-4 text-sm">
                  <p className="font-medium">{label as string}</p>
                  <p className="mt-1">
                    {((pct as number) * 100).toFixed(0)}% · {brl(totals.final * (pct as number))}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* ---------------- Resumo ---------------- */}
        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Perguntas respondidas", `${answered} de ${questions.length}`],
              ["Obrigatórias pendentes", String(pending)],
              ["Média ponderada de esforço", `${num(avg)} — ${scoreBand(avg)}`],
              ["Dias sênior", num(totals.days.senior)],
              ["Dias analista", num(totals.days.analyst)],
              ["Dias PM", num(totals.days.pm)],
              ["Custos diretos", brl(totals.days.direct)],
              ["Contingência", brl(totals.contingency)],
              ["Preço indicativo", brl(totals.final)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border bg-background p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                <p className="mt-2 font-display text-lg font-bold">{value}</p>
              </div>
            ))}
          </div>
          {pending > 0 ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
              Existem {pending} perguntas obrigatórias sem resposta. Trate-as como pendência,
              condição ou exclusão antes de fechar o preço.
            </p>
          ) : (
            <p className="rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm">
              Todas as perguntas obrigatórias foram respondidas. Você pode avançar para a etapa 3 e
              gerar o orçamento.
            </p>
          )}
          <Link
            to="/admin/precificacao"
            search={{ aba: "quote" } as never}
            className="inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Ir para Gerar orçamento
          </Link>
        </TabsContent>
      </Tabs>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Diagnósticos salvos</h2>
        {list.isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
        ) : (list.data ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum diagnóstico salvo ainda.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Serviço</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.title}</td>
                    <td className="px-4 py-3">{row.client_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.service_title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.updated_at).toLocaleString("pt-BR", { dateStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-accent hover:underline" onClick={() => load(row)}>
                        Abrir
                      </button>
                      <button
                        className="ml-4 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir este diagnóstico?")) remove.mutate(row.id);
                        }}
                      >
                        <Trash2 className="inline size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
