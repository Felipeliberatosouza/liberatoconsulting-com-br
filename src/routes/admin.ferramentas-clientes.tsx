import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { listToolClients } from "@/lib/tools.functions";

export const Route = createFileRoute("/admin/ferramentas-clientes")({
  head: () => ({
    meta: [
      { title: "Clientes de materiais — Painel Liberato" },
      { name: "description", content: "Gestão de quem se cadastrou para receber as ferramentas gratuitas." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Clientes de materiais — Painel Liberato" },
      { property: "og:description", content: "Cadastro de quem recebe os materiais gratuitos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ToolClients,
});

function fmt(date: string | null) {
  return date ? new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
}

function ToolClients() {
  const [q, setQ] = useState("");
  const clients = useQuery({ queryKey: ["tool-clients"], queryFn: () => listToolClients(), retry: false });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = clients.data ?? [];
    if (!term) return list;
    return list.filter((c: any) =>
      [c.first_name, c.last_name, c.email, c.company, c.job_title, c.segment, c.state]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(term)),
    );
  }, [clients.data, q]);

  return (
    <AdminShell
      title="Clientes de materiais"
      requireAdmin
      description="Pessoas que criaram conta para baixar as ferramentas gratuitas. Todas recebem o e-mail de boas-vindas, a Newsletter e o Boletim Semanal."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, e-mail, empresa ou segmento"
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <span className="text-sm text-muted-foreground">{rows.length} cadastro(s)</span>
        <Link to="/admin/ferramentas" className="ml-auto text-sm font-semibold text-accent hover:underline">
          Ir para Ferramentas gratuitas
        </Link>
      </div>

      {clients.isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando cadastros…</p>}
      {clients.isError && <p className="mt-6 text-sm text-destructive">Não foi possível carregar os cadastros.</p>}
      {!clients.isLoading && rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum cadastro encontrado.</p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cadastro</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Celular</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Downloads</th>
                <th className="px-4 py-3">Boas-vindas</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c: any) => (
                <tr key={c.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmt(c.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{`${c.first_name} ${c.last_name}`.trim()}</td>
                  <td className="px-4 py-3">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className="text-accent hover:underline">
                        {c.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">{c.company}</td>
                  <td className="px-4 py-3">{c.job_title}</td>
                  <td className="px-4 py-3">{c.segment}</td>
                  <td className="px-4 py-3">{c.state}</td>
                  <td className="px-4 py-3">{c.downloads}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmt(c.welcome_sent_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
