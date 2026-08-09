import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getResumeUrl, listApplications } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Candidaturas — Painel Liberato" },
      { name: "description", content: "Consulte os currículos enviados pelo formulário Trabalhe Conosco." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Candidaturas — Painel Liberato" },
      { property: "og:description", content: "Currículos enviados pelo formulário Trabalhe Conosco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminApplications,
});

function fmt(date: string) {
  return new Date(date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function AdminApplications() {
  const [q, setQ] = useState("");
  const apps = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => listApplications(),
    retry: false,
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = apps.data ?? [];
    if (!term) return list;
    return list.filter((a) =>
      [a.full_name, a.email, a.phone, a.interest_area]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [apps.data, q]);

  async function openResume(path: string) {
    try {
      const r = await getResumeUrl({ data: { path } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      window.open(r.url, "_blank", "noopener");
    } catch {
      toast.error("Não foi possível abrir o currículo.");
    }
  }

  return (
    <AdminShell
      title="Candidaturas"
      description="Currículos enviados pelo formulário Trabalhe Conosco, do mais recente para o mais antigo."
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, e-mail ou área de interesse"
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <span className="text-sm text-muted-foreground">{rows.length} registro(s)</span>
      </div>

      {apps.isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando candidaturas…</p>}
      {apps.isError && (
        <p className="mt-6 text-sm text-destructive">Não foi possível carregar as candidaturas.</p>
      )}

      {!apps.isLoading && rows.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Nenhuma candidatura encontrada.</p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3">LinkedIn</th>
                <th className="px-4 py-3">Currículo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmt(a.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{a.full_name}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${a.email}`} className="text-accent hover:underline">
                      {a.email}
                    </a>
                    <div className="text-muted-foreground">{a.phone}</div>
                  </td>
                  <td className="px-4 py-3">{a.interest_area}</td>
                  <td className="px-4 py-3">
                    {a.linkedin_url ? (
                      <a
                        href={a.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        Perfil
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.resume_path ? (
                      <button
                        onClick={() => openResume(a.resume_path!)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                      >
                        {a.resume_filename ?? "Baixar"}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
