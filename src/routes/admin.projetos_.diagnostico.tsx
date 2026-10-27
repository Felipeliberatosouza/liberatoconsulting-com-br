import { listScopeSubmissions } from "@/lib/projects.functions";
import { ProjectFlowGuide } from "@/components/ProjectFlowGuide";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Copy, HelpCircle, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listServiceProducts } from "@/lib/services.functions";
import {
  createDiagnosticLink,
  deleteDiagnostic,
  listDiagnostics,
  listProjectClients,
  saveDiagnostic,
  type DiagnosticRow,
} from "@/lib/projects.functions";
import { answerText, diagnosticLink, toEditable, type ClientAnswer, type EditableQuestion } from "@/lib/diagnostic-form";
import { parseDiagnosticOptions } from "@/lib/diagnostic-options";
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
  validateSearch: (s: Record<string, unknown>): { escopo?: string } =>
    typeof s["escopo"] === "string" ? { escopo: s["escopo"] } : {},
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
  const navigate = useNavigate();
  const [id, setId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const clientList = useQuery({ queryKey: ["project-clients"], queryFn: () => listProjectClients() });
  const [serviceSlug, setServiceSlug] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consultantNotes, setConsultantNotes] = useState<Record<string, string>>({});
  const [scoreValues, setScoreValues] = useState<Record<string, number>>({});
  const [scoreWhy, setScoreWhy] = useState<Record<string, string>>({});
  const [modules, setModules] = useState<ScopeModule[]>(DEFAULT_MODULES);
  const [budget, setBudget] = useState<DiagnosticBudget>(DEFAULT_BUDGET);
  const [editQs, setEditQs] = useState<EditableQuestion[]>([]);
  const [optionDrafts, setOptionDrafts] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [clientAnswers, setClientAnswers] = useState<Record<string, ClientAnswer>>({});
  const [respondent, setRespondent] = useState<Record<string, string>>({});
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [tab, setTab] = useState("leiame");
  const [scopeId, setScopeId] = useState<string | null>(null);
  const { escopo } = Route.useSearch();
  const scopes = useQuery({ queryKey: ["scope-submissions"], queryFn: () => listScopeSubmissions(), enabled: !!escopo, retry: false });
  // Vindo da etapa 1: o cliente do escopo já entra preenchido e o diagnóstico fica ligado a ele.
  useEffect(() => {
    const s = escopo ? scopes.data?.find((x) => x.id === escopo) : undefined;
    if (!s) return;
    setScopeId(s.id);
    setClientName((c) => c || s.company);
    setTitle((t) => t || `Diagnóstico — ${s.company}`);
  }, [escopo, scopes.data]);
  const keepQs = useRef(false);

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

  // Ao trocar de serviço gera as perguntas padrão; um diagnóstico aberto mantém as suas.
  useEffect(() => {
    if (keepQs.current) {
      keepQs.current = false;
      return;
    }
    setEditQs(toEditable(questions));
    setOptionDrafts({});
  }, [questions]);

  function reset() {
    setId(null);
    setScopeId(null);
    setTitle("");
    setClientName("");
    setAnswers({});
    setConsultantNotes({});
    setScoreValues({});
    setScoreWhy({});
    setModules(DEFAULT_MODULES);
    setBudget(DEFAULT_BUDGET);
    setEditQs(toEditable(questions));
    setOptionDrafts({});
    setToken(null);
    setClientAnswers({});
    setRespondent({});
    setSubmittedAt(null);
  }

  function load(row: DiagnosticRow) {
    setOptionDrafts({});
    setId(row.id);
    setScopeId(row.scope_submission_id ?? null);
    setTitle(row.title);
    setClientName(row.client_name);
    const sameService = row.service_slug === serviceSlug;
    if (row.questions?.length && !sameService) keepQs.current = true;
    setServiceSlug(row.service_slug);
    setEditQs(row.questions?.length ? row.questions : toEditable(questionsForFamily((services.data ?? []).find((s) => s.slug === row.service_slug)?.family_id ?? "")));
    setToken(row.public_slug ?? null);
    setClientAnswers(row.client_answers ?? {});
    setRespondent(row.client_respondent ?? {});
    setSubmittedAt(row.client_submitted_at);
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
    setTab("diagnostico");
    toast.success(`Diagnóstico "${row.title}" aberto.`);
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
          scope_submission_id: scopeId,
          answers,
          consultant_notes: { ...consultantNotes, __why: JSON.stringify(scoreWhy) },
          scores: scoreValues,
          modules: modules as unknown as Array<Record<string, string | number | boolean>>,
          budget: budget as unknown as Record<string, number>,
          questions: editQs,
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

  const genLink = useMutation({
    mutationFn: async () => {
      const saved = await save.mutateAsync();
      if (!saved.ok) throw new Error(saved.error);
      const r = await createDiagnosticLink({ data: { id: saved.id } });
      if (!r.ok) throw new Error(r.error);
      return r.token;
    },
    onSuccess: (t) => {
      setToken(t);
      void navigator.clipboard?.writeText(diagnosticLink(t)).catch(() => {});
      toast.success("Link gerado e copiado. Envie ao cliente.");
      void qc.invalidateQueries({ queryKey: ["project-diagnostics"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const totals = computeTotals(modules, budget);
  const avg = weightedScore(scoreValues);
  const answered = editQs.filter((q) => (answers[q.id] ?? "").trim().length > 0).length;
  const pending = editQs.filter((q) => q.required && !(answers[q.id] ?? "").trim()).length;

  function patchModule(mid: string, patch: Partial<ScopeModule>) {
    setModules((prev) => prev.map((m) => (m.id === mid ? { ...m, ...patch } : m)));
  }
  function patchQ(qid: string, patch: Partial<EditableQuestion>) {
    setEditQs((prev) => prev.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  }

  return (
    <AdminShell
      title="2. Diagnóstico Detalhado"
      description="Coleta das informações do cliente por serviço, avaliação de esforço, desenho do escopo e orçamento indicativo."
      requireAdmin
    >
      <ProjectFlowGuide
        current={2}
        nextLabel="Salvar e avançar: Precificação"
        nextPending={save.isPending}
        onNext={async () => {
          // O planejamento salvo aqui vira o orçamento da etapa 3.
          const res = await save.mutateAsync();
          if (!res.ok) return;
          void navigate({ to: "/admin/precificacao", search: { aba: "quote", diag: res.id } as never });
        }}
      />
      <Link
        to="/admin/projetos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="size-4" /> Voltar para Projetos
      </Link>

      <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-background p-5 md:grid-cols-4">
        <div>
          <Label>Cliente</Label>
          <select
            className="mb-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value=""
            onChange={(e) => {
              const c = (clientList.data ?? []).find((x) => x.key === e.target.value);
              // Diagnóstico existente do cliente é aberto para continuar a mesma linha de trabalho.
              const existing = c?.diagId ? (list.data ?? []).find((r) => r.id === c.diagId) : null;
              if (existing && !id) { load(existing); return; }
              if (c) setClientName(c.name);
            }}
          >
            <option value="">Selecionar do CRM, escopos ou diagnósticos…</option>
            {(clientList.data ?? []).map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <Input placeholder="Ou digite / ajuste o nome" value={clientName} onChange={(e) => setClientName(e.target.value)} />
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 flex-wrap">
          <TabsTrigger value="leiame">Leia-me</TabsTrigger>
          <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
          <TabsTrigger value="score">Score de esforço</TabsTrigger>
          <TabsTrigger value="escopo">Escopo e esforço</TabsTrigger>
          <TabsTrigger value="resumo">Resumo e premissas de preço</TabsTrigger>
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
                Na aba Resumo e premissas de preço, revise taxas, custos de terceiros,
                contingência, impostos e desconto.
              </li>
              <li>
                Use o Resumo como revisão interna antes de gerar o orçamento final na etapa 3.
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
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-4 text-sm">
            <span className="font-medium">Link do formulário para o cliente:</span>
            {token ? (
              <>
                <code className="rounded bg-secondary px-2 py-1 text-xs">{diagnosticLink(token)}</code>
                <button type="button" className="inline-flex items-center gap-1 text-accent hover:underline" onClick={() => { void navigator.clipboard.writeText(diagnosticLink(token)); toast.success("Link copiado."); }}>
                  <Copy className="size-4" /> Copiar
                </button>
              </>
            ) : (
              <span className="text-muted-foreground">ainda não gerado</span>
            )}
            <Button size="sm" onClick={() => genLink.mutate()} disabled={genLink.isPending}>
              <LinkIcon className="mr-1 size-4" /> {token ? "Salvar perguntas e atualizar link" : "Gerar link do formulário"}
            </Button>
            {submittedAt ? (
              <span className="text-xs text-accent">Respondido pelo cliente em {new Date(submittedAt).toLocaleString("pt-BR")}{respondent["name"] ? ` por ${respondent["name"]}${respondent["email"] ? ` (${respondent["email"]})` : ""}` : ""}</span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Perguntas do serviço <strong>{service?.title ?? "—"}</strong> · {answered} de {editQs.length} respondidas · {pending} obrigatórias pendentes. Edite o texto, a explicação (?) e as alternativas; inclua ou exclua perguntas antes de gerar o link.
          </p>
          {Array.from(new Set(editQs.map((q) => q.block))).map((block) => (
            <section key={block} className="rounded-2xl border border-border bg-background p-6">
              <h3 className="font-display text-base font-semibold">{block}</h3>
              <div className="mt-4 space-y-6">
                {editQs.filter((q) => q.block === block).map((q) => {
                  const ca = clientAnswers[q.id];
                  return (
                    <div key={q.id} className="grid gap-3 border-b border-border pb-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Textarea rows={2} value={q.question} onChange={(e) => patchQ(q.id, { question: e.target.value })} />
                          <button type="button" title="Excluir pergunta" className="mt-2 text-muted-foreground hover:text-destructive" onClick={() => setEditQs(editQs.filter((x) => x.id !== q.id))}>
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <Label className="flex items-center gap-1 text-xs text-muted-foreground"><HelpCircle className="size-3" /> Motivo da pergunta (aparece no ? para o cliente)</Label>
                        <Input value={q.purpose} onChange={(e) => patchQ(q.id, { purpose: e.target.value })} />
                        <Label className="text-xs text-muted-foreground">Alternativas (separe por ponto e vírgula; vazio = só texto)</Label>
                        <Input aria-label={`Alternativas: ${q.question}`} value={optionDrafts[q.id] ?? q.options.join("; ")} onChange={(e) => {
                          const text = e.target.value;
                          setOptionDrafts(prev => ({ ...prev, [q.id]: text }));
                          patchQ(q.id, { options: parseDiagnosticOptions(text) });
                        }} />
                        <div className="flex gap-4 text-xs">
                          <label className="flex items-center gap-1"><Checkbox checked={q.multi} onCheckedChange={(v) => patchQ(q.id, { multi: Boolean(v) })} /> Permite várias</label>
                          <label className="flex items-center gap-1"><Checkbox checked={q.required} onCheckedChange={(v) => patchQ(q.id, { required: Boolean(v) })} /> Obrigatória</label>
                        </div>
                        {ca ? (
                          <p className="rounded-md bg-accent/10 p-2 text-xs"><strong>Resposta do cliente:</strong> {answerText(ca)}</p>
                        ) : null}
                        <Textarea rows={2} placeholder="Resposta (preenchida pelo cliente ou pelo consultor)" value={answers[q.id] ?? ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Observações do consultor</p>
                        <Textarea className="mt-2" rows={4} value={consultantNotes[q.id] ?? ""} onChange={(e) => setConsultantNotes({ ...consultantNotes, [q.id]: e.target.value })} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditQs([...editQs, { id: `NEW-${Date.now().toString(36).slice(-5)}`, block, question: "Nova pergunta", purpose: "", options: [], multi: false, required: true }])}>
                <Plus className="mr-1 size-4" /> Incluir pergunta neste bloco
              </Button>
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
          <button
            type="button"
            disabled={save.isPending}
            onClick={async () => {
              // Salva antes de seguir: o orçamento é montado a partir deste diagnóstico.
              const res = await save.mutateAsync();
              if (!res.ok) return;
              void navigate({ to: "/admin/precificacao", search: { aba: "quote", diag: res.id } as never });
            }}
            className="inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {save.isPending ? "Salvando…" : "Salvar e avançar: Precificação e orçamento"}
          </button>
          <div className="space-y-6 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Premissas de preço deste diagnóstico. Elas seguem para a etapa 3 (Precificação e
              orçamento), onde o orçamento final é gerado com o mesmo total.
            </p>
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
                  <FormattedNumberInput
                    kind={String(key).endsWith("Pct") ? "percent" : "currency"}
                    value={budget[key]}
                    onChange={(v) => setBudget((b) => ({ ...b, [key]: Math.max(0, v) }))}
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
                  </div>
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
