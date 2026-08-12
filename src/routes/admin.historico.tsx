import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getPublicationBody, getPublicationHistory } from "@/lib/history.functions";

export const Route = createFileRoute("/admin/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de publicações — Painel Liberato Consulting" },
      {
        name: "description",
        content: "Newsletters, boletins semanais e conteúdos já publicados pela consultoria.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Histórico de publicações — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Newsletters, boletins semanais e conteúdos já publicados pela consultoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

const TABS = [
  { id: "newsletters", label: "Newsletter" },
  { id: "bulletins", label: "Boletim Semanal" },
  { id: "contents", label: "Conteúdos" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
}

function HistoryPage() {
  const [tab, setTab] = useState<TabId>("newsletters");
  const [open, setOpen] = useState<{ title: string; html: string; text: string } | null>(null);
  const q = useQuery({
    queryKey: ["publication-history"],
    queryFn: () => getPublicationHistory(),
  });

  async function openItem(kind: "newsletter" | "bulletin", id: string) {
    try {
      const res = await getPublicationBody({ data: { kind, id } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setOpen({ title: res.title, html: res.html, text: res.text });
    } catch {
      toast.error("Não foi possível abrir a publicação.");
    }
  }

  const data = q.data;

  return (
    <AdminShell
      title="Histórico de publicações"
      requireAdmin
      description="Tudo que já foi publicado: newsletters enviadas, boletins semanais disparados e conteúdos cadastrados."
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-background hover:border-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando histórico…</p>
      ) : q.error ? (
        <p className="mt-8 text-sm text-destructive">Não foi possível carregar o histórico.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-background">
          {tab === "newsletters" && (
            <Table
              head={["Assunto", "Situação", "Envio", "Enviados", "Falhas", ""]}
              rows={(data?.newsletters ?? []).map((n) => [
                n.subject || "(sem assunto)",
                n.status === "sent" ? "Enviada" : n.status === "draft" ? "Rascunho" : n.status,
                fmt(n.sentAt ?? n.createdAt),
                String(n.sentCount),
                String(n.failedCount),
                <button
                  key="open"
                  type="button"
                  className="font-semibold text-accent hover:underline"
                  onClick={() => openItem("newsletter", n.id)}
                >
                  Abrir
                </button>,
              ])}
              empty="Nenhuma newsletter registrada."
            />
          )}

          {tab === "bulletins" && (
            <Table
              head={["Assunto", "Referência", "Data", "E-mails", "WhatsApp", ""]}
              rows={(data?.bulletins ?? []).map((b) => [
                `${b.subject}${b.isTest ? " (teste)" : ""}`,
                b.dateLabel || "—",
                fmt(b.createdAt),
                String(b.sentEmail),
                String(b.sentWhatsApp),
                <button
                  key="open"
                  type="button"
                  className="font-semibold text-accent hover:underline"
                  onClick={() => openItem("bulletin", b.id)}
                >
                  Abrir
                </button>,
              ])}
              empty="Nenhum boletim enviado até agora."
            />
          )}

          {tab === "contents" && (
            <Table
              head={["Título", "Tipo", "Situação", "Cadastro", ""]}
              rows={(data?.contents ?? []).map((c) => [
                c.title,
                c.kind || "—",
                c.published ? "Publicado" : "Rascunho",
                fmt(c.createdAt),
                <Link
                  key="open"
                  to="/content/$slug"
                  params={{ slug: c.slug }}
                  target="_blank"
                  className="font-semibold text-accent hover:underline"
                >
                  Abrir
                </Link>,
              ])}
              empty="Nenhum conteúdo cadastrado."
            />
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="my-8 w-full max-w-3xl rounded-lg border border-border bg-background p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-lg font-bold">{open.title}</h2>
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-md border border-border px-3 py-1 text-sm hover:border-accent"
              >
                Fechar
              </button>
            </div>
            {open.html ? (
              <iframe
                title={open.title}
                srcDoc={open.html}
                className="mt-4 h-[70vh] w-full rounded-md border border-border bg-white"
              />
            ) : (
              <pre className="mt-4 max-h-[70vh] overflow-auto whitespace-pre-wrap text-sm">
                {open.text || "Sem conteúdo registrado."}
              </pre>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="p-6 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-border bg-muted/40">
        <tr>
          {head.map((h, i) => (
            <th key={i} className="px-4 py-3 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            {r.map((cell, j) => (
              <td key={j} className="px-4 py-3 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
