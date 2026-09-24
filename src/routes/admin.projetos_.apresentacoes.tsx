import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { deletePresentation, getPresentationFileUrl, listPresentations } from "@/lib/presentation.functions";

export const Route = createFileRoute("/admin/projetos_/apresentacoes")({
  head: () => ({
    meta: [
      { title: "Apresentações geradas — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PresentationsList,
});

function PresentationsList() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["presentations"], queryFn: () => listPresentations(), retry: false });
  const rows = list.data ?? [];

  async function remove(id: string) {
    if (!confirm("Remover este registro?")) return;
    try {
      await deletePresentation({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["presentations"] });
      toast.success("Registro removido.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function open(id: string, format: "pptx" | "pdf") {
    try {
      const { url } = await getPresentationFileUrl({ data: { id, format } });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <AdminShell title="Apresentações geradas" description="Histórico de todos os materiais de apresentação gerados." requireAdmin>
      <div className="mb-6 flex flex-wrap gap-4">
        <Link to="/admin/projetos" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
          <ArrowLeft className="size-4" /> Voltar para Projetos
        </Link>
        <Link to="/admin/projetos/apresentacao" className="text-sm text-accent hover:underline">
          Gerar nova apresentação
        </Link>
      </div>
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.error ? (
        <p className="text-sm text-destructive">{(list.error as Error).message}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma apresentação gerada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Serviço</th>
                <th className="p-3">Arquivos</th>
                <th className="p-3">Fontes usadas</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.client_name}</div>
                    {r.website ? <div className="text-xs text-muted-foreground">{r.website}</div> : null}
                  </td>
                  <td className="p-3">{r.service_title}</td>
                  <td className="p-3">
                    {r.pptx_path || r.pdf_path ? (
                      <div className="flex flex-wrap gap-2">
                        {r.pptx_path ? (
                          <button onClick={() => void open(r.id, "pptx")} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                            <Download className="size-3" /> PowerPoint
                          </button>
                        ) : null}
                        {r.pdf_path ? (
                          <button onClick={() => void open(r.id, "pdf")} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                            <Download className="size-3" /> PDF
                          </button>
                        ) : null}
                        <Link to="/admin/projetos/apresentacao" search={{ id: r.id }} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                          <Pencil className="size-3" /> Editar
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Registro antigo ({r.format.toUpperCase()}), sem arquivo salvo</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {[r.used_quote && "Orçamento", r.used_scope && "Escopo inicial", r.used_diagnostic && "Diagnóstico"].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => void remove(r.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                      <Trash2 className="size-4" />
                    </button>
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
