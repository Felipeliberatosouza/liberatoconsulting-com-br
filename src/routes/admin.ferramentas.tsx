import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import {
  deleteAdminTool,
  listAdminTools,
  saveAdminTool,
  setToolWelcomeAttachment,
} from "@/lib/tools.functions";

export const Route = createFileRoute("/admin/ferramentas")({
  head: () => ({
    meta: [
      { title: "Ferramentas gratuitas — Painel Liberato" },
      { name: "description", content: "Cadastre materiais da biblioteca gratuita." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Ferramentas gratuitas — Painel Liberato" },
      { property: "og:description", content: "Gestão da biblioteca de materiais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTools,
});

const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function AdminTools() {
  const query = useQuery({ queryKey: ["admin-tools"], queryFn: () => listAdminTools() });
  const [editing, setEditing] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Guia");
  const [file, setFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [welcome, setWelcome] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setEditing(null);
    setTitle("");
    setSummary("");
    setCategory("Guia");
    setFile(null);
    setPublished(true);
    setWelcome(false);
  }

  function startEdit(tool: any) {
    setEditing(tool);
    setTitle(tool.title ?? "");
    setSummary(tool.summary ?? "");
    setCategory(tool.category ?? "Guia");
    setFile(null);
    setPublished(Boolean(tool.published));
    setWelcome(Boolean(tool.welcome_attachment));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AdminShell
      title="Ferramentas gratuitas"
      requireAdmin
      description="Cadastre PDFs e planilhas. Os arquivos ficam privados e são liberados por links temporários após o login."
    >
      <p className="mb-6 text-sm">
        <Link to="/admin/ferramentas-clientes" className="font-semibold text-accent hover:underline">
          Ver clientes cadastrados para receber materiais →
        </Link>
      </p>

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="space-y-4 rounded-lg border border-border bg-background p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            let contentType: string | null = null;
            if (file) {
              if (file.size > 20 * 1024 * 1024) {
                toast.error("O arquivo deve ter no máximo 20 MB.");
                return;
              }
              const extension = file.name.toLowerCase().split(".").pop();
              contentType =
                extension === "pdf"
                  ? "application/pdf"
                  : extension === "xls"
                    ? "application/vnd.ms-excel"
                    : extension === "xlsx"
                      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      : null;
              if (!contentType) {
                toast.error("Envie um arquivo PDF, XLS ou XLSX.");
                return;
              }
            } else if (!editing) {
              toast.error("Selecione um arquivo.");
              return;
            }
            setBusy(true);
            try {
              const base64 = file
                ? await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
                    reader.onerror = () => reject(new Error("read"));
                    reader.readAsDataURL(file);
                  })
                : undefined;
              const result = await saveAdminTool({
                data: {
                  ...(editing ? { id: editing.id as string } : {}),
                  title,
                  summary,
                  category,
                  position: editing ? (editing.position ?? 0) : (query.data?.length ?? 0) + 1,
                  published,
                  welcome_attachment: welcome,
                  ...(file && base64
                    ? { file_name: file.name, content_type: contentType as any, base64 }
                    : {}),
                },
              });
              if (result.ok) {
                toast.success(editing ? "Material atualizado." : "Material cadastrado.");
                reset();
                void query.refetch();
              } else toast.error(result.error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{editing ? "Editar material" : "Novo material"}</h2>
            {editing ? (
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent">
                <X className="size-4" /> Cancelar
              </button>
            ) : null}
          </div>
          <label className="block text-sm font-medium">
            Título *
            <input required className={field} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Resumo
            <textarea className={field} rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Categoria
            <input required className={field} value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            {editing ? "Substituir arquivo (opcional)" : "Arquivo PDF ou Excel *"}
            <input
              required={!editing}
              className={field}
              type="file"
              accept="application/pdf,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {editing ? (
              <span className="mt-1 block text-xs text-muted-foreground">Arquivo atual: {editing.file_name}</span>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Publicar imediatamente
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={welcome} onChange={(e) => setWelcome(e.target.checked)} className="mt-1" />
            <span>
              Enviar este material no e-mail de boas-vindas
              <span className="block text-xs text-muted-foreground">
                Apenas um material por vez. O nome dele entra automaticamente no texto do e-mail.
              </span>
            </span>
          </label>
          <Button disabled={busy}>
            <Upload />
            {busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar material"}
          </Button>
        </form>

        <section>
          <h2 className="text-xl font-bold">Materiais cadastrados</h2>
          <div className="mt-4 space-y-3">
            {query.data?.length ? (
              query.data.map((tool: any) => (
                <article key={tool.id} className="flex items-start gap-4 border border-border bg-background p-5">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent">
                      {tool.category} · {tool.published ? "Publicado" : "Rascunho"}
                    </p>
                    <h3 className="mt-1 font-bold">{tool.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tool.file_name}</p>
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(tool.welcome_attachment)}
                        onChange={async (e) => {
                          const result = await setToolWelcomeAttachment({
                            data: { id: tool.id, welcome_attachment: e.target.checked },
                          });
                          if (result.ok) {
                            toast.success(
                              e.target.checked
                                ? "Material escolhido para o e-mail de boas-vindas."
                                : "Material retirado do e-mail de boas-vindas.",
                            );
                            void query.refetch();
                          } else toast.error(result.error);
                        }}
                      />
                      Enviar no e-mail de boas-vindas
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" title="Editar" onClick={() => startEdit(tool)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir"
                      onClick={async () => {
                        if (!confirm("Excluir este material?")) return;
                        const result = await deleteAdminTool({ data: { id: tool.id } });
                        if (result.ok) {
                          if (editing?.id === tool.id) reset();
                          void query.refetch();
                        } else toast.error(result.error);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </article>
              ))
            ) : (
              <p className="border border-dashed border-border p-8 text-sm text-muted-foreground">
                A biblioteca está pronta e ainda não possui materiais.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
