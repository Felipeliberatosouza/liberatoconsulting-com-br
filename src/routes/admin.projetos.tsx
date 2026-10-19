import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, FileSpreadsheet, Presentation, Receipt, Wallet, Inbox, FileSearch, Smile } from "lucide-react";

import { AdminShell } from "@/components/AdminShell";
import { getProjectsOverview } from "@/lib/projects.functions";
import { FormLinkBar } from "@/components/SendFormLinkDialog";

export const Route = createFileRoute("/admin/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProjectsPage,
});


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
      items: ["Valor do homem-hora", "Etapas por serviço", "Gerar orçamento", "Material para Apresentação"],
    },
    {
      n: 5,
      title: "Satisfação do Cliente",
      description: "Pesquisas de serviço executado e não executado, com dashboard de resultados.",
      icon: Smile,
      to: "/admin/projetos/satisfacao",
      search: undefined as never,
      badge: "",
      items: ["Pesquisa por serviço executado", "Pesquisa por serviço não executado", "Dashboard de satisfação"],
    },
  ];

  return (
    <AdminShell
      title="Projetos"
      description="Atendimento às solicitações de clientes em cinco etapas, do primeiro contato ao orçamento enviado."
      requireAdmin
    >
      <div className="grid gap-4 lg:grid-cols-5">
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

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-5">
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

      {[
        { icon: Presentation, title: "Apresentações geradas", text: `Listagem de todos os materiais de apresentação gerados${counts ? ` (${counts.presentations})` : ""}.`, to: "/admin/projetos/apresentacoes" },
        { icon: Inbox, title: "Escopos iniciais recebidos", text: `Formulários de escopo enviados pelos clientes${counts ? ` (${counts.scopes})` : ""}.`, to: "/admin/projetos/escopos" },
        { icon: Smile, title: "Dashboard de satisfação do cliente", text: "Resultados das pesquisas de satisfação (NPS, notas e motivos).", to: "/admin/projetos/satisfacao" },
        { icon: FileSearch, title: "Diagnósticos recebidos", text: `Diagnósticos detalhados registrados${counts ? ` (${counts.diagnostics})` : ""}.`, to: "/admin/projetos/diagnostico" },
      ].map((row) => (
        <div key={row.to} className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-background p-5">
          <row.icon className="size-5 text-accent" />
          <div className="mr-auto">
            <p className="font-medium">{row.title}</p>
            <p className="text-sm text-muted-foreground">{row.text}</p>
          </div>
          <Link
            to={row.to as never}
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-ink-foreground hover:bg-accent hover:text-accent-foreground"
          >
            Abrir
          </Link>
        </div>
      ))}

      <div className="mt-6 grid gap-3">
        <FormLinkBar form="escopo" />
        <FormLinkBar form="executado" />
        <FormLinkBar form="nao_executado" />
      </div>
    </AdminShell>
  );
}
