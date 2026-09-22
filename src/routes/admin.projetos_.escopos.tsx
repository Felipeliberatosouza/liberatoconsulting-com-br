import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteScopeSubmission,
  listScopeSubmissions,
  saveScopeNotes,
  type ScopeSubmission,
} from "@/lib/projects.functions";
import { SCOPE_QUESTIONS } from "@/lib/scope-form";
import {
  activeSignals,
  SCOPE_CHECKLIST,
  SCOPE_MIGRATE_NOTE,
  SCOPE_SIGNALS,
} from "@/lib/scope-guide";

export const Route = createFileRoute("/admin/projetos_/escopos")({
  head: () => ({
    meta: [
      { title: "Escopos recebidos — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScopesPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function ScopesPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const list = useQuery({
    queryKey: ["scope-submissions"],
    queryFn: () => listScopeSubmissions(),
    retry: false,
  });

  const rows = useMemo(() => {
    const all = list.data ?? [];
    const term = query.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (r) =>
        r.company.toLowerCase().includes(term) ||
        r.respondent_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term),
    );
  }, [list.data, query]);

  const open = rows.find((r) => r.id === openId) ?? null;

  const saveNotes = useMutation({
    mutationFn: (row: ScopeSubmission) => saveScopeNotes({ data: { id: row.id, notes } }),
    onSuccess: () => {
      toast.success("Anotações salvas.");
      void qc.invalidateQueries({ queryKey: ["scope-submissions"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteScopeSubmission({ data: { id } }),
    onSuccess: () => {
      setOpenId(null);
      toast.success("Escopo excluído.");
      void qc.invalidateQueries({ queryKey: ["scope-submissions"] });
    },
  });

  return (
    <AdminShell
      title="Etapa 1 — Escopos recebidos de clientes"
      description="Respostas enviadas pelo formulário público de escopo inicial, com o guia do consultor para leitura rápida."
      requireAdmin
    >
      <Link
        to="/admin/projetos"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="size-4" /> Voltar para Projetos
      </Link>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por empresa, respondente ou e-mail"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {list.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum escopo recebido até o momento.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-left">
              <tr>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Respondente</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Recebido em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.company}</td>
                  <td className="px-4 py-3">{r.respondent_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.respondent_role}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-accent hover:underline"
                      onClick={() => {
                        setOpenId(r.id === openId ? null : r.id);
                        setNotes(r.notes ?? "");
                      }}
                    >
                      {r.id === openId ? "Fechar" : "Abrir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-display text-lg font-semibold">
              Respostas — {open.company}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {open.respondent_name}
              {open.respondent_role ? ` · ${open.respondent_role}` : ""} · {open.email}
              {open.phone ? ` · ${open.phone}` : ""} · {formatDate(open.created_at)}
            </p>
            <div className="mt-5 space-y-4">
              {SCOPE_QUESTIONS.map((q) => (
                <div key={q.id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                    {q.index}. {q.theme}
                  </p>
                  <p className="text-sm">{q.question}</p>
                  <p className="mt-1 text-sm font-medium">
                    {open.answers?.[q.id] ?? "—"}
                  </p>
                  {open.comments?.[q.id] ? (
                    <p className="mt-1 text-sm italic text-muted-foreground">
                      “{open.comments[q.id]}”
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Anotações internas</p>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="mt-3 flex gap-3">
                <Button onClick={() => saveNotes.mutate(open)} disabled={saveNotes.isPending}>
                  Salvar anotações
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Excluir este escopo recebido?")) remove.mutate(open.id);
                  }}
                >
                  <Trash2 className="mr-2 size-4" /> Excluir
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-background p-6">
            <h2 className="font-display text-lg font-semibold">Guia do consultor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leitura rápida das respostas para decidir entre proposta preliminar e fase de
              definição.
            </p>

            <h3 className="mt-5 text-sm font-semibold">Sinais observados neste escopo</h3>
            <div className="mt-3 space-y-3">
              {activeSignals(open.answers ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum sinal de atenção acionado pelas respostas.
                </p>
              ) : (
                activeSignals(open.answers ?? {}).map((s) => (
                  <div key={s.id} className="rounded-xl border border-accent/40 bg-accent/5 p-4">
                    <p className="text-sm font-semibold">{s.signal}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.meaning}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Ação sugerida: </span>
                      {s.action}
                    </p>
                  </div>
                ))
              )}
            </div>

            <details className="mt-5 text-sm">
              <summary className="cursor-pointer text-accent">
                Ver todos os sinais de referência
              </summary>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                {SCOPE_SIGNALS.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium text-foreground">{s.signal}</span> — {s.action}
                  </li>
                ))}
              </ul>
            </details>

            <h3 className="mt-6 text-sm font-semibold">Checklist antes de preparar a proposta</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {SCOPE_CHECKLIST.map((item) => (
                <li key={item}>☐ {item}</li>
              ))}
            </ul>

            <h3 className="mt-6 text-sm font-semibold">Quando migrar para o diagnóstico completo</h3>
            <p className="mt-2 text-sm text-muted-foreground">{SCOPE_MIGRATE_NOTE}</p>
            <Link
              to="/admin/projetos/diagnostico"
              className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Abrir Diagnóstico Detalhado
            </Link>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
