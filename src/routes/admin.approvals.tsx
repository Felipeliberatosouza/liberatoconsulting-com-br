import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { listChangeRequests, reviewChangeRequest } from "@/lib/users.functions";

export const Route = createFileRoute("/admin/approvals")({
  head: () => ({
    meta: [
      { title: "Aprovações — Painel Liberato Consulting" },
      { name: "description", content: "Fila de alterações enviadas por consultores e autores." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Aprovações — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Fila de alterações enviadas por consultores e autores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApprovalsPage,
});

const KIND_LABEL: Record<string, string> = {
  article: "Conteúdo",
  brazil: "Dados do Brasil",
  indicator: "Indicador econômico",
  campaign: "Newsletter",
};

function ApprovalsPage() {
  const q = useQuery({
    queryKey: ["change-requests"],
    queryFn: () => listChangeRequests(),
    retry: false,
  });
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const review = async (id: string, approve: boolean) => {
    const r = await reviewChangeRequest({ data: { id, approve, note } });
    if (!r.ok) toast.error(r.error);
    else {
      toast.success(approve ? "Alteração aprovada e publicada." : "Pedido recusado.");
      setNote("");
      await q.refetch();
    }
  };

  const rows = q.data ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");

  return (
    <AdminShell
      title="Aprovações"
      requireAdmin
      description="Toda alteração feita por consultores e autores fica aqui aguardando sua aprovação. Ao aprovar, a alteração é publicada automaticamente."
    >
      <h2 className="font-display text-lg font-bold">Pendentes ({pending.length})</h2>
      <div className="mt-4 space-y-4">
        {pending.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-background p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                {KIND_LABEL[r.kind] ?? r.kind}
              </span>
              <strong className="font-display">{r.title}</strong>
              <span className="text-xs text-muted-foreground">
                por {r.requester_name || "—"} em{" "}
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </span>
            </div>
            {r.summary && <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>}

            <button
              onClick={() => setOpen(open === r.id ? null : r.id)}
              className="mt-3 text-xs text-accent hover:underline"
            >
              {open === r.id ? "ocultar detalhes" : "ver detalhes da alteração"}
            </button>
            {open === r.id && (
              <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-secondary/60 p-4 text-xs">
                {JSON.stringify(JSON.parse(r.payload_json), null, 2)}
              </pre>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                value={open === r.id ? note : ""}
                onChange={(e) => {
                  setOpen(r.id);
                  setNote(e.target.value);
                }}
                placeholder="Observação para quem enviou (opcional)"
                className="min-w-64 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={() => review(r.id, true)}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Aprovar e publicar
              </button>
              <button
                onClick={() => review(r.id, false)}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                Recusar
              </button>
            </div>
          </div>
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum pedido aguardando revisão.</p>
        )}
      </div>

      <h2 className="mt-12 font-display text-lg font-bold">Histórico</h2>
      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Enviado por</th>
              <th className="px-4 py-3">Resultado</th>
              <th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {done.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-3">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td className="px-4 py-3">{r.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.requester_name || "—"}</td>
                <td className="px-4 py-3">
                  {r.status === "approved" ? "aprovado" : "recusado"}
                  {r.review_note ? ` — ${r.review_note}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
            {done.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  Nada revisado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
