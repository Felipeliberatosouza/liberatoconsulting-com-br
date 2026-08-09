import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { deleteArticle, listArticles, saveArticle } from "@/lib/admin.functions";
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

function AdminContent() {
  const groups = pt.megaMenu.groups;
  const services = groups.flatMap((g) => g.items.map((i) => ({ id: i.id, label: i.label })));

  const [items, setItems] = useState<ArticleRecord[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setItems(await listArticles());
    } catch {
      /* sem permissão ou sessão expirada */
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

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
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      description="Cada conteúdo aparece na seção Conteúdo do site. Ao salvar, as traduções para inglês, espanhol e mandarim são geradas automaticamente."
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
            Categoria
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

          <label className="text-sm font-medium md:col-span-2">
            Resumo
            <textarea
              rows={3}
              value={draft.summary}
              onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
              className={input}
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Texto completo (opcional)
            <textarea
              rows={8}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              className={input}
            />
          </label>

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
        <h2 className="font-display text-lg font-bold">Conteúdos cadastrados ({items.length})</h2>
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum conteúdo cadastrado ainda. Enquanto isso, o site exibe os conteúdos padrão.
          </p>
        )}
        {items.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.title}</p>
              <p className="text-xs text-muted-foreground">
                {a.kind} · {a.group_id} · ordem {a.position} ·{" "}
                {a.published ? "publicado" : "rascunho"}
              </p>
            </div>
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
    </AdminShell>
  );
}
