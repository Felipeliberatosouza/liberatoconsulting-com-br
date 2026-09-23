import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Copy, FileSpreadsheet, Presentation, Receipt, Wallet } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getProjectsOverview } from "@/lib/projects.functions";

export const Route = createFileRoute("/admin/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});

const PUBLIC_LINK = "https://liberatoconsulting.com.br/escopoinicial";

function ProjectsPage() {
  const overview = useQuery({
    queryKey: ["projects-overview"],
    queryFn: () => getProjectsOverview(),
    retry: false,
  });
  const counts = overview.data;

  const steps = [
    {
      n: 1,
      title: "Escopo Inicial de Necessidade do Cliente",
      description: "Formulário curto enviado ao cliente para abrir a conversa.",
      icon: ClipboardList,
      to: "/admin/projetos/escopos",
      search: undefined as never,
      badge: counts ? `${counts.scopes} escopos recebidos` : "",
      items: ["Escopos recebidos de clientes", "Guia do consultor"],
    },
    {
      n: 2,
      title: "Diagnóstico Detalhado",
      description: "Perguntas por serviço, esforço, escopo, orçamento e resumo.",
      icon: FileSpreadsheet,
      to: "/admin/projetos/diagnostico",
      search: undefined as never,
      badge: counts ? `${counts.diagnostics} diagnósticos` : "",
      items: ["Leia-me", "Diagnóstico", "Score de esforço", "Escopo e esforço", "Orçamento", "Resumo"],
    },
    {
      n: 3,
      title: "Organização e Precificação do Projeto",
      description: "Parâmetros de custo e desenho das etapas de cada serviço.",
      icon: Wallet,
      to: "/admin/precificacao",
      search: { aba: "rates" } as never,
      badge: "",
      items: ["Valor do homem-hora", "Etapas por serviço"],
    },
    {
      n: 4,
      title: "Apresentação e Orçamento",
      description: "Orçamento em PDF e material de apresentação comercial personalizado.",
      icon: Receipt,
      to: "/admin/precificacao",
      search: { aba: "quote" } as never,
      badge: "",
      items: ["Gerar orçamento", "Material para Apresentação"],
    },
  ];

  return (
    <AdminShell
      title="Projetos"
      description="Atendimento às solicitações de clientes em quatro etapas, do primeiro contato ao orçamento enviado."
      requireAdmin
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div key={step.n} className="relative">
            <Link
              to={step.to}
              search={step.search}
              className="flex h-full flex-col rounded-2xl border border-border bg-background p-5 shadow-sm transition-colors hover:border-accent"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-ink-foreground">
                  {step.n}
                </span>
                <step.icon className="size-5 text-accent" />
              </div>
              <h2 className="mt-4 font-display text-base font-semibold leading-snug">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {step.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              {step.badge ? (
                <span className="mt-4 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  {step.badge}
                </span>
              ) : null}
            </Link>
            {i < steps.length - 1 ? (
              <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-muted-foreground lg:block" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-5">
        <Presentation className="size-5 text-accent" />
        <div className="mr-auto">
          <p className="font-medium">Etapa 4 · Material para Apresentação</p>
          <p className="text-sm text-muted-foreground">
            Gere uma apresentação comercial personalizada (PowerPoint e PDF) para o cliente.
          </p>
        </div>
        <Link
          to="/admin/projetos/apresentacao"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Abrir
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-5">
        <Receipt className="size-5 text-accent" />
        <div className="mr-auto">
          <p className="font-medium">Orçamentos emitidos</p>
          <p className="text-sm text-muted-foreground">
            Histórico de todos os orçamentos gerados{counts ? ` (${counts.quotes})` : ""}.
          </p>
        </div>
        <Link
          to="/admin/precificacao"
          search={{ aba: "history" } as never}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Abrir
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-border p-5 text-sm">
        <span className="text-muted-foreground">Link do formulário para enviar ao cliente:</span>
        <code className="rounded bg-secondary px-2 py-1">{PUBLIC_LINK}</code>
        <button
          className="inline-flex items-center gap-1 text-accent hover:underline"
          onClick={() => {
            void navigator.clipboard.writeText(PUBLIC_LINK);
            toast.success("Link copiado.");
          }}
        >
          <Copy className="size-4" /> Copiar
        </button>
      </div>
    </AdminShell>
  );
}
