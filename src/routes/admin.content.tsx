import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  deleteArticle,
  getContentFileUrl,
  listArticles,
  listSubmissions,
  saveArticle,
  uploadArticleFile,
} from "@/lib/admin.functions";
import type { ArticleRecord } from "@/lib/site-config";
import { pt } from "@/i18n/pt";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Conteúdos — Painel Liberato" },
      { name: "description", content: "Publique artigos, guias e estudos da seção Conteúdo." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Conteúdos — Painel Liberato" },
      { property: "og:description", content: "Gerencie os conteúdos publicados no site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContent,
});

type Draft = {
  id?: string;
  slug: string;
  group_id: string;
  kind: string;
  title: string;
  summary: string;
  body: string;
  service: string;
  link_url: string;
  position: number;
  published: boolean;
  cover_url: string;
  authors: string;
  author_contact: string;
  file_path: string;
  file_name: string;
};

const EMPTY: Draft = {
  slug: "",
  group_id: pt.megaMenu.groups[0]?.id ?? "estrategia",
  kind: "Artigo",
  title: "",
  summary: "",
  body: "",
  service: "",
  link_url: "",
  position: 0,
  published: true,
  cover_url: "",
  authors: "",
  author_contact: "",
  file_path: "",
  file_name: "",
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function countWords(v: string) {
  return v.trim() ? v.trim().split(/\s+/).length : 0;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AdminContent() {
  const groups = pt.megaMenu.groups;
  const services = groups.flatMap((g) =>
    g.items.map((i) => ({ id: i.id, label: i.label, group: g.id })),
  );

  const [items, setItems] = useState<ArticleRecord[]>([]);
  const [submissions, setSubmissions] = useState<
    Array<{
      id: string;
      full_name: string;
      email: string;
      title: string;
      summary: string;
      message: string;
      file_path: string | null;
      file_name: string | null;
      created_at: string;
    }>
  >([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  async function refresh() {
    try {
      setItems(await listArticles());
    } catch {
      /* sem permissão ou sessão expirada */
    }
    try {
      setSubmissions((await listSubmissions()) as typeof submissions);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const words = countWords(draft.body);
  const overLimit = words > 500;

  const filtered = useMemo(
    () =>
      items.filter(
        (a) =>
          (groupFilter === "all" || a.group_id === groupFilter) &&
          (serviceFilter === "all" || a.service === serviceFilter),
      ),
    [items, groupFilter, serviceFilter],
  );

  const serviceOptions = services.filter(
    (s) => groupFilter === "all" || s.group === groupFilter,
  );

  function edit(a: ArticleRecord) {
    setDraft({
      id: a.id,
      slug: a.slug,
      group_id: a.group_id,
      kind: a.kind,
      title: a.title,
      summary: a.summary,
      body: a.body,
      service: a.service,
      link_url: a.link_url ?? "",
      position: a.position,
      published: a.published,
      cover_url: a.cover_url ?? "",
      authors: a.authors ?? "",
      author_contact: a.author_contact ?? "",
      file_path: a.file_path ?? "",
      file_name: a.file_name ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onCover(file: File) {
    if (file.size > 1_400_000) {
      toast.error("Imagem muito grande. Use um arquivo de até 1,4 MB.");
      return;
    }
    const dataUrl = await readAsDataUrl(file);
    setDraft((d) => ({ ...d, cover_url: dataUrl }));
  }

  async function onFile(file: File) {
    if (file.size > 10_000_000) {
      toast.error("Arquivo acima de 10 MB.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await uploadArticleFile({ data: { name: file.name, dataUrl } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDraft((d) => ({ ...d, file_path: r.path, file_name: r.name }));
      toast.success("Arquivo do artigo enviado.");
    } finally {
      setUploading(false);
    }
  }

  async function openFile(path: string) {
    const r = await getContentFileUrl({ data: { path } });
    if (r.ok) window.open(r.url, "_blank", "noopener,noreferrer");
    else toast.error(r.error);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overLimit) {
      toast.error("O texto do artigo deve ter no máximo 500 palavras.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...(draft.id ? { id: draft.id } : {}),
        slug: draft.slug || slugify(draft.title),
        group_id: draft.group_id,
        kind: draft.kind,
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        service: draft.service,
        link_url: draft.link_url || null,
        position: Number(draft.position) || 0,
        published: draft.published,
        cover_url: draft.cover_url || null,
        authors: draft.authors,
        author_contact: draft.author_contact,
        file_path: draft.file_path || null,
        file_name: draft.file_name || null,
      };
      const r = await saveArticle({ data: payload });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Conteúdo salvo e traduzido para EN, ES e ZH.");
      setDraft(EMPTY);
      await refresh();
    } catch {
      toast.error("Não foi possível salvar o conteúdo.");
    } finally {
      setBusy(false);
    }
  }

  const input =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AdminShell
      title="Conteúdos"
      description="Cada conteúdo aparece na seção Conteúdo do site, dentro da categoria e do serviço escolhidos. Ao salvar, as traduções para inglês, espanhol e mandarim são geradas automaticamente."
    >
      <form onSubmit={onSubmit} className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">
          {draft.id ? "Editar conteúdo" : "Novo conteúdo"}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium md:col-span-2">
            Título
            <input
              required
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  title: e.target.value,
                  slug: d.id ? d.slug : slugify(e.target.value),
                }))
              }
              className={input}
            />
          </label>

          <label className="text-sm font-medium">
            Autores
            <input
              value={draft.authors}
              onChange={(e) => setDraft((d) => ({ ...d, authors: e.target.value }))}
              placeholder="Ana Souza, João Lima"
              className={input}
            />
          </label>

          <label className="text-sm font-medium">
            Contato dos autores (e-mail ou link)
            <input
              value={draft.author_contact}
              onChange={(e) => setDraft((d) => ({ ...d, author_contact: e.target.value }))}
              placeholder="autores@liberatoconsulting.com.br"
              className={input}
            />
          </label>

          <label className="text-sm font-medium">
            Categoria (subitem do menu Conteúdo)
            <select
              value={draft.group_id}
              onChange={(e) => setDraft((d) => ({ ...d, group_id: e.target.value }))}
              className={input}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Tipo
            <select
              value={draft.kind}
              onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value }))}
              className={input}
            >
              {["Artigo", "Guia", "Estudo", "Case", "Vídeo"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Serviço relacionado
            <select
              value={draft.service}
              onChange={(e) => setDraft((d) => ({ ...d, service: e.target.value }))}
              className={input}
            >
              <option value="">Nenhum</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium">
            Link externo (opcional)
            <input
              value={draft.link_url}
              onChange={(e) => setDraft((d) => ({ ...d, link_url: e.target.value }))}
              placeholder="https://…"
              className={input}
            />
          </label>

          <div className="text-sm font-medium md:col-span-2">
            Imagem de capa (o título aparece sobreposto a ela)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onCover(f);
              }}
              className={input}
            />
            {draft.cover_url && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={draft.cover_url}
                  alt="Capa"
                  className="h-20 w-36 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, cover_url: "" }))}
                  className="text-sm text-destructive hover:underline"
                >
                  Remover imagem
                </button>
              </div>
            )}
          </div>

          <label className="text-sm font-medium md:col-span-2">
            Resumo (aparece abaixo da imagem)
            <textarea
              rows={3}
              value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              className={input}
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Texto do artigo (máximo 500 palavras)
            <textarea
              rows={10}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              className={input}
            />
            <span
              className={`mt-1 block text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
            >
              {words} / 500 palavras
            </span>
          </label>

          <div className="text-sm font-medium md:col-span-2">
            Artigo completo para download (PDF ou DOC, até 10 MB)
            <input
              type="file"
              accept=".pdf,.doc,.docx,.rtf,.odt"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
              className={input}
            />
            {uploading && <span className="text-xs text-muted-foreground">Enviando arquivo…</span>}
            {draft.file_path && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-muted-foreground">{draft.file_name}</span>
                <button
                  type="button"
                  onClick={() => void openFile(draft.file_path)}
                  className="font-medium text-accent hover:underline"
                >
                  Abrir
                </button>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, file_path: "", file_name: "" }))}
                  className="text-destructive hover:underline"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          <label className="text-sm font-medium">
            Ordem
            <input
              type="number"
              min={0}
              value={draft.position}
              onChange={(e) => setDraft((d) => ({ ...d, position: Number(e.target.value) }))}
              className={input}
            />
          </label>

          <label className="mt-7 flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
            />
            Publicado
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Salvando e traduzindo…" : draft.id ? "Salvar alterações" : "Publicar conteúdo"}
          </button>
          {draft.id && (
            <button
              type="button"
              onClick={() => setDraft(EMPTY)}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="mt-10 space-y-3">
        <h2 className="font-display text-lg font-bold">Conteúdos por subitem ({filtered.length})</h2>

        <div className="flex flex-wrap gap-3">
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setServiceFilter("all");
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todas as categorias</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Todos os serviços</option>
            {serviceOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum conteúdo neste filtro. Enquanto não houver conteúdos publicados, o site exibe os
            conteúdos padrão.
          </p>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-4"
          >
            {a.cover_url && (
              <img src={a.cover_url} alt="" className="h-12 w-20 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.kind} · {a.group_id}
                {a.service ? ` · ${a.service}` : ""} · ordem {a.position} ·{" "}
                {a.published ? "publicado" : "rascunho"} · {a.read_count ?? 0} leituras ·{" "}
                {a.rating_count ? (a.rating_sum / a.rating_count).toFixed(1) : "—"} ★
              </p>
            </div>
            <a
              href={`/content/${a.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-accent"
            >
              Ver no site
            </a>
            <button
              onClick={() => edit(a)}
              className="text-sm font-medium text-muted-foreground hover:text-accent"
            >
              Editar
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Excluir este conteúdo?")) return;
                const r = await deleteArticle({ data: { id: a.id } });
                if (r.ok) {
                  toast.success("Conteúdo excluído.");
                  await refresh();
                } else toast.error(r.error);
              }}
              className="text-sm font-medium text-destructive hover:underline"
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-3">
        <h2 className="font-display text-lg font-bold">
          Artigos enviados pelo público ({submissions.length})
        </h2>
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum envio recebido até agora.</p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-background p-4">
            <p className="font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">
              {s.full_name} · {s.email} · {new Date(s.created_at).toLocaleString("pt-BR")}
            </p>
            {s.summary && <p className="mt-2 text-sm text-muted-foreground">{s.summary}</p>}
            {s.message && <p className="mt-2 text-sm text-muted-foreground">{s.message}</p>}
            {s.file_path && (
              <button
                onClick={() => void openFile(s.file_path!)}
                className="mt-2 text-sm font-medium text-accent hover:underline"
              >
                Baixar arquivo {s.file_name ? `(${s.file_name})` : ""}
              </button>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
