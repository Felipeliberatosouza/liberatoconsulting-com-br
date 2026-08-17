import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { analyzeArticleFile, generateArticleCover } from "@/lib/content-ai.functions";
import { listAuthorOptions } from "@/lib/users.functions";
import { useAuthReady } from "@/hooks/useAuthReady";
import { stampLogo } from "@/lib/social-image";
import type { ArticleRecord } from "@/lib/site-config";
import { READ_COUNT_BASE } from "@/lib/site-config";
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
  article_date: string;
  chart_data: string;
  table_data: string;
};

const today = () => new Date().toISOString().slice(0, 10);

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
  article_date: today(),
  chart_data: "",
  table_data: "",
};

function slugify(v: string) {
  return shortSlug(v);
}


/** Endereço público do conteúdo, gerado a partir do título (igual à Newsletter). */
function contentLink(slug: string) {
  return slug ? `https://liberatoconsulting.com.br/content/${slug}` : "";
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
  const authReady = useAuthReady();
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
      phone?: string;
      cpf?: string;
      role_label?: string;
      institution?: string;
    }>
  >([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [linkTouched, setLinkTouched] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [fileKey, setFileKey] = useState(0);


  const authorOptions = useQuery({
    queryKey: ["content-authors"],
    queryFn: () => listAuthorOptions(),
    retry: false,
    enabled: authReady,
  });

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
    if (!authReady) return;
    void refresh();
  }, [authReady]);

  // O link acompanha o título (ou o slug) enquanto não for editado manualmente.
  // Também é regerado sempre que o campo estiver vazio, mesmo após uma edição anterior.
  useEffect(() => {
    const auto = contentLink(draft.slug || slugify(draft.title));
    if (!auto) return;
    setDraft((d) => {
      const keepManual = linkTouched && d.link_url.trim() !== "";
      if (keepManual || d.link_url === auto) return d;
      return { ...d, link_url: auto };
    });
  }, [draft.slug, draft.title, linkTouched]);


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

  const history = useMemo(
    () =>
      [...items].sort((a, b) =>
        (b.article_date ?? "").localeCompare(a.article_date ?? ""),
      ),
    [items],
  );

  const serviceOptions = services.filter((s) => groupFilter === "all" || s.group === groupFilter);
  const serviceLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) map[s.id] = s.label;
    return map;
  }, [services]);
  const groupLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) map[g.id] = g.title;
    return map;
  }, [groups]);

  function edit(a: ArticleRecord) {
    setLinkTouched(true);
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
      article_date: a.article_date ?? today(),
      chart_data: a.chart_data ?? "",
      table_data: a.table_data ?? "",
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

  async function onGenerateCover() {
    if (draft.title.trim().length < 5) {
      toast.error("Informe o título antes de gerar a imagem.");
      return;
    }
    setCoverBusy(true);
    try {
      const r = await generateArticleCover({
        data: { title: draft.title, summary: draft.summary.slice(0, 900) },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const stamped = await stampLogo(r.imageUrl).catch(() => r.imageUrl);
      setDraft((d) => ({ ...d, cover_url: stamped }));
      toast.success("Imagem de capa gerada.");
    } catch {
      toast.error("Não foi possível gerar a imagem.");
    } finally {
      setCoverBusy(false);
    }
  }

  /** Upload do artigo completo: envia o arquivo e preenche os demais campos. */
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
      const nextPosition =
        items.reduce((max, a) => Math.max(max, a.position ?? 0), 0) + 1;
      setDraft((d) => ({
        ...d,
        file_path: r.path,
        file_name: r.name,
        article_date: d.article_date || today(),
        position: d.id ? d.position : nextPosition,
      }));
      toast.success("Arquivo enviado. Lendo o conteúdo…");

      const a = await analyzeArticleFile({
        data: {
          name: file.name,
          dataUrl,
          groups: groups.map((g) => ({ id: g.id, title: g.title })),
          services: services.map((s) => ({ id: s.id, label: s.label })),
        },
      });
      if (!a.ok) {
        toast.error(a.error);
        return;
      }
      setDraft((d) => ({
        ...d,
        title: d.title || a.title,
        slug: d.slug || slugify(a.title),
        summary: d.summary || a.summary,
        body: d.body || a.body,
        group_id: a.group_id || d.group_id,
        service: d.service || a.service,
        kind: d.kind || a.kind,
        table_data: d.table_data || a.table_data,
        chart_data: d.chart_data || a.chart_data,
        article_date: d.article_date || today(),
      }));
      toast.success("Campos preenchidos a partir do arquivo. Revise antes de publicar.");
    } catch {
      toast.error("Não foi possível ler o arquivo automaticamente.");
    } finally {
      setUploading(false);
    }
  }

  async function openFile(path: string) {
    const r = await getContentFileUrl({ data: { path } });
    if (r.ok) window.open(r.url, "_blank", "noopener,noreferrer");
    else toast.error(r.error);
  }

  function validateDraft(d: Draft) {
    const next: Record<string, boolean> = {};
    if (!d.title.trim() || d.title.trim().length < 3) next["title"] = true;
    if (!d.summary.trim()) next["summary"] = true;
    if (!d.body.trim()) next["body"] = true;
    if (!d.group_id) next["group_id"] = true;
    if (!d.kind) next["kind"] = true;
    if (!d.service) next["service"] = true;
    if (!d.article_date) next["article_date"] = true;
    if (!d.cover_url.trim()) next["cover_url"] = true;
    if (!d.authors.trim()) next["authors"] = true;
    if (!d.author_contact.trim()) next["author_contact"] = true;
    if (!d.file_path.trim()) next["file_path"] = true;
    return next;
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (overLimit) {
      toast.error("O texto do artigo deve ter no máximo 500 palavras.");
      return;
    }
    const validation = validateDraft(draft);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Informações ausentes. Preencha todos os campos obrigatórios destacados.");
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
        article_date: draft.article_date || null,
        chart_data: draft.chart_data,
        table_data: draft.table_data,
      };
      const r = await saveArticle({ data: payload });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Processo de publicação concluído. Conteúdo salvo e traduzido para EN, ES e ZH.");
      setDraft(EMPTY);
      setFileKey((k) => k + 1);
      setLinkTouched(false);
      setErrors({});
      await refresh();
    } catch {
      toast.error("Não foi possível salvar o conteúdo.");
    } finally {
      setBusy(false);
    }
  }


  function inputClass(error?: boolean) {
    return [
      "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent",
      error ? "border-destructive" : "border-input",
    ].join(" ");
  }

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };


  const authorList = draft.authors
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <AdminShell
      title="Conteúdos"
      description="Comece pelo upload do artigo completo: os demais campos são preenchidos automaticamente e podem ser editados. Ao salvar, as traduções para inglês, espanhol e mandarim são geradas."
    >
      <form noValidate onSubmit={onSubmit} className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">
          {draft.id ? "Editar conteúdo" : "Novo conteúdo"}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* 1) Arquivo completo — primeira informação da tela */}
          <div
            className={`rounded-md border p-4 text-sm font-medium md:col-span-2 ${
              errors["file_path"]
                ? "border-destructive bg-destructive/5"
                : "border-accent/40 bg-accent/5"
            }`}
          >
            1. Artigo completo para download (PDF ou DOC, até 10 MB) *
            <input
              key={fileKey}
              type="file"
              accept=".pdf,.doc,.docx,.rtf,.odt"
              onChange={(e) => {
                clearError("file_path");
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
              onFocus={() => clearError("file_path")}
              className={inputClass(errors["file_path"])}
            />
            {errors["file_path"] && !draft.file_path && (
              <p className="mt-1 text-xs text-destructive">Anexe o artigo completo (PDF ou DOC).</p>
            )}
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              Ao enviar um PDF, a leitura automática preenche título, resumo, texto, categoria,
              serviço, tabela, gráfico e a data do artigo.
            </p>

            {uploading && (
              <span className="text-xs text-muted-foreground">Enviando e lendo o arquivo…</span>
            )}
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
                  onClick={() => {
                    setDraft((d) => ({ ...d, file_path: "", file_name: "" }));
                    setFileKey((k) => k + 1);
                  }}
                  className="text-destructive hover:underline"
                >
                  Remover
                </button>
              </div>
            )}
          </div>


          <label className="text-sm font-medium md:col-span-2">
            Título *
            <input
              required
              value={draft.title}
              onChange={(e) => {
                clearError("title");
                setDraft((d) => ({
                  ...d,
                  title: e.target.value,
                  slug: d.id ? d.slug : slugify(e.target.value),
                }));
              }}
              className={inputClass(errors["title"])}
            />
          </label>


          {/* 2) Autores (seleção) + e-mails automáticos */}
          <div className="text-sm font-medium">
            Autores *
            <div
              className={`mt-1 max-h-40 space-y-1 overflow-auto rounded-md border p-2 text-sm font-normal ${
                errors["authors"] ? "border-destructive bg-destructive/5" : "border-input bg-background"
              }`}
            >
              {(authorOptions.data ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {authorOptions.isLoading
                    ? "Carregando…"
                    : "Nenhum usuário com papel de administrador, autor ou consultor."}
                </p>
              )}
              {(authorOptions.data ?? []).map((a) => (
                <label key={a.userId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={authorList.includes(a.name)}
                    onChange={(e) => {
                      clearError("authors");
                      const next = e.target.checked
                        ? [...authorList, a.name]
                        : authorList.filter((n) => n !== a.name);
                      const emails = (authorOptions.data ?? [])
                        .filter((o) => next.includes(o.name) && o.email)
                        .map((o) => o.email);
                      setDraft((d) => ({
                        ...d,
                        authors: next.join(", "),
                        author_contact: emails.join(", "),
                      }));
                    }}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>


          <label className="text-sm font-medium">
            E-mail dos autores *
            <input
              value={draft.author_contact}
              onChange={(e) => {
                clearError("author_contact");
                setDraft((d) => ({ ...d, author_contact: e.target.value }));
              }}
              placeholder="contato@liberatoconsulting.com.br"
              className={inputClass(errors["author_contact"])}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Preenchido a partir dos autores selecionados e editável.
            </span>
          </label>


          <label className="text-sm font-medium">
            Categoria (subitem do menu Conteúdo) *
            <select
              value={draft.group_id}
              onChange={(e) => {
                clearError("group_id");
                setDraft((d) => ({ ...d, group_id: e.target.value }));
              }}
              className={inputClass(errors["group_id"])}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          </label>


          <label className="text-sm font-medium">
            Tipo *
            <select
              value={draft.kind}
              onChange={(e) => {
                clearError("kind");
                setDraft((d) => ({ ...d, kind: e.target.value }));
              }}
              className={inputClass(errors["kind"])}
            >
              {["Artigo", "Guia", "Estudo", "Case", "Vídeo"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            {draft.kind === "Vídeo" && (
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Para vídeo, informe no campo de link o endereço do YouTube, Vimeo ou de um arquivo
                MP4: o player é exibido dentro da página do conteúdo.
              </span>
            )}
          </label>


          <label className="text-sm font-medium">
            Serviço relacionado *
            <select
              value={draft.service}
              onChange={(e) => {
                clearError("service");
                setDraft((d) => ({ ...d, service: e.target.value }));
              }}
              className={inputClass(errors["service"])}
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
            {draft.kind === "Vídeo" ? "Link do vídeo" : "Link do conteúdo"} (gerado a partir do
            título, pode ser editado)
            <input
              value={draft.link_url}
              onChange={(e) => {
                setLinkTouched(true);
                setDraft((d) => ({ ...d, link_url: e.target.value }));
              }}
              placeholder="https://…"
              className={inputClass()}
            />
          </label>


          <label className="text-sm font-medium">
            Data do artigo *
            <input
              type="date"
              value={draft.article_date}
              onChange={(e) => {
                clearError("article_date");
                setDraft((d) => ({ ...d, article_date: e.target.value }));
              }}
              className={inputClass(errors["article_date"])}
            />
          </label>


          {/* Capa: geração por IA ou upload */}
          <div className="text-sm font-medium md:col-span-2">
            Imagem de capa (o título aparece sobreposto a ela) *
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void onGenerateCover()}
                disabled={coverBusy}
                className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
              >
                {coverBusy ? "Criando imagem…" : "Gerar imagem com IA"}
              </button>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  clearError("cover_url");
                  const f = e.target.files?.[0];
                  if (f) void onCover(f);
                }}
                onFocus={() => clearError("cover_url")}
                className={`rounded-md border bg-background px-3 py-2 text-sm ${
                  errors["cover_url"] ? "border-destructive" : "border-input"
                }`}
              />
            </div>
            {errors["cover_url"] && !draft.cover_url && (
              <p className="mt-1 text-xs text-destructive">Adicione uma imagem de capa.</p>
            )}
            {draft.cover_url && (
              <div className="mt-3 flex items-center gap-3">
                <img src={draft.cover_url} alt="Capa" className="h-20 w-36 rounded object-cover" />
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
            Resumo (aparece abaixo da imagem) *
            <textarea
              rows={3}
              value={draft.summary}
              onChange={(e) => {
                clearError("summary");
                setDraft((d) => ({ ...d, summary: e.target.value }));
              }}
              className={inputClass(errors["summary"])}
            />
          </label>


          <label className="text-sm font-medium md:col-span-2">
            Texto do artigo (máximo 500 palavras) *
            <textarea
              rows={10}
              value={draft.body}
              onChange={(e) => {
                clearError("body");
                setDraft((d) => ({ ...d, body: e.target.value }));
              }}
              className={inputClass(errors["body"] || overLimit)}
            />

            <span
              className={`mt-1 block text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
            >
              {words} / 500 palavras
            </span>
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Tabela (opcional, em markdown)
            <textarea
              rows={5}
              value={draft.table_data}
              onChange={(e) => setDraft((d) => ({ ...d, table_data: e.target.value }))}
              placeholder={"| Camada | Pergunta |\n|---|---|\n| Objetivo anual | O que muda? |"}
              className={inputClass()}
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Gráfico (opcional)
            <textarea
              rows={5}
              value={draft.chart_data}
              onChange={(e) => setDraft((d) => ({ ...d, chart_data: e.target.value }))}
              placeholder={"titulo: Evolução das metas\nPlanejamento | 30\nExecução | 45"}
              className={inputClass()}
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">
              Primeira linha “titulo: …” e uma linha por barra no formato “Rótulo | número”.
            </span>
          </label>

          <label className="text-sm font-medium">
            Ordem
            <input
              type="number"
              min={0}
              value={draft.position}
              onChange={(e) => setDraft((d) => ({ ...d, position: Number(e.target.value) }))}
              className={inputClass()}
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
              onClick={() => {
                setDraft(EMPTY);
                setFileKey((k) => k + 1);
                setLinkTouched(false);
              }}
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
                {a.published ? "publicado" : "rascunho"} · {a.read_count ?? READ_COUNT_BASE} leituras ·{" "}
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
        <p className="text-sm text-muted-foreground">
          Os leitores enviam artigos pela página{" "}
          <a href="/content/enviar" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            Envie seu artigo
          </a>
          .
        </p>
        {submissions.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum envio recebido até agora.</p>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="rounded-lg border border-border bg-background p-4">
            <p className="font-medium">{s.title}</p>
            <p className="text-xs text-muted-foreground">
              {s.full_name}
              {s.role_label ? ` · ${s.role_label}` : ""} · {s.email}
              {s.phone ? ` · ${s.phone}` : ""}
              {s.cpf ? ` · CPF ${s.cpf}` : ""}
              {s.institution ? ` · ${s.institution}` : ""} ·{" "}
              {new Date(s.created_at).toLocaleString("pt-BR")}
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

      <div className="mt-12 space-y-3">
        <h2 className="font-display text-lg font-bold">
          Histórico de Conteúdos Publicados ({history.length})
        </h2>
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Autores</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-muted-foreground">
                    Nenhum conteúdo publicado até agora.
                  </td>
                </tr>
              )}
              {history.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.authors || "—"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`/content/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      /content/{a.slug}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {groupLabel[a.group_id] ?? a.group_id}
                    {a.service ? ` · ${serviceLabel[a.service] ?? a.service}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    {a.file_path ? (
                      <button
                        onClick={() => void openFile(a.file_path!)}
                        className="text-accent hover:underline"
                      >
                        Baixar
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.article_date
                      ? new Date(`${a.article_date}T12:00:00`).toLocaleDateString("pt-BR")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
