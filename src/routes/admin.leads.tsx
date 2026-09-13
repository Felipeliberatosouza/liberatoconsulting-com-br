import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { CrmProspect } from "@/components/CrmProspect";
import { listLeads } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/leads")({
  head: () => ({
    meta: [
      { title: "Leads recebidos — Painel Liberato" },
      { name: "description", content: "Consulte os contatos enviados pelos formulários de serviço." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Leads recebidos — Painel Liberato" },
      { property: "og:description", content: "Contatos enviados pelos formulários de serviço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLeads,
});

function fmt(date: string) {
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function AdminLeads() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const leads = useQuery({ queryKey: ["admin-leads"], queryFn: () => listLeads(), retry: false });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = leads.data ?? [];
    if (!term) return list;
    return list.filter((l) =>
      [l.name, l.company, l.country, l.email, l.service_title, l.service_slug, l.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [leads.data, q]);

  return (
    <AdminShell
      title="Leads"
      description="Pesquise novos contatos com IA e consulte os contatos recebidos pelos formulários do site."
    >
      <CrmProspect
        onImported={() => {
          void queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
          void queryClient.invalidateQueries({ queryKey: ["crm-agenda"] });
        }}
      />

      <section className="mt-8">
        <h2 className="font-display text-base font-bold">Leads recebidos pelos formulários</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Contatos enviados pelas páginas de serviço, do mais recente para o mais antigo.
        </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, empresa, país ou serviço"
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <span className="text-sm text-muted-foreground">{rows.length} registro(s)</span>
      </div>

      {leads.isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando leads…</p>}
      {leads.isError && <p className="mt-6 text-sm text-destructive">Não foi possível carregar os leads.</p>}

      {!leads.isLoading && rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Nenhum lead encontrado.</p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">País</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmt(l.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3">{l.company}</td>
                  <td className="px-4 py-3">{l.country}</td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <a href={`mailto:${l.email}`} className="text-accent hover:underline">
                        {l.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{l.service_title ?? l.service_slug}</td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">{l.message || "—"}</td>
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
