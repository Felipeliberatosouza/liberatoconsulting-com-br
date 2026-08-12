import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getSiteConfig, saveTexts } from "@/lib/admin.functions";
import { flattenTexts, type TextOverrides } from "@/lib/site-config";
import { pt } from "@/i18n/pt";

export const Route = createFileRoute("/admin/texts")({
  head: () => ({
    meta: [
      { title: "Textos do site — Painel Liberato" },
      { name: "description", content: "Edite os textos do site em português, com tradução automática." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Textos do site — Painel Liberato" },
      { property: "og:description", content: "Edição de textos com tradução automática." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTexts,
});

const SECTION_LABELS: Record<string, string> = {
  nav: "Menu",
  hero: "Home — destaque",
  home: "Home",
  services: "Serviços",
  serviceDetail: "Páginas de serviço",
  megaMenu: "Menu de serviços",
  contentMenu: "Menu de conteúdo",
  aboutMenu: "Menu Quem somos",
  aboutDetail: "Páginas Quem somos",
  about: "Quem somos",
  contact: "Contato",
  content: "Conteúdo",
  brazil: "Dados do Brasil",
  careers: "Trabalhe conosco",
  footer: "Rodapé",
  cta: "Chamada final",
  leadForm: "Formulário de contato",
  newsletter: "Newsletter",
};

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  subtitle: "Subtítulo",
  eyebrow: "Chapéu",
  heading: "Título",
  description: "Descrição",
  body: "Texto",
  lead: "Introdução",
  cta: "Botão",
  label: "Rótulo",
  name: "Nome",
  summary: "Resumo",
  audience: "Público-alvo",
  timeline: "Prazo",
  placeholder: "Texto de apoio",
  button: "Botão",
};

function humanize(path: string) {
  const parts = path.split(".");
  const last = parts[parts.length - 1]!;
  const known = FIELD_LABELS[last];
  const base =
    known ??
    last
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^\w/, (c) => c.toUpperCase());
  const parent = parts.length > 2 ? parts.slice(1, -1).join(" › ") : "";
  return { base, parent };
}

function AdminTexts() {
  const all = useMemo(() => flattenTexts(pt), []);
  const sections = useMemo(
    () => Array.from(new Set(all.map((i) => i.path.split(".")[0]!))),
    [all],
  );

  const [section, setSection] = useState(sections[0] ?? "");
  const [search, setSearch] = useState("");
  const [onlyChanged, setOnlyChanged] = useState(false);
  const [overrides, setOverrides] = useState<TextOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((c) => setOverrides(c.texts ?? {}))
      .catch(() => undefined);
  }, []);

  const query = search.trim().toLowerCase();
  const changed = Object.keys(drafts);

  const items = all.filter((i) => {
    if (onlyChanged) return changed.includes(i.path);
    if (query) return i.value.toLowerCase().includes(query) || i.path.toLowerCase().includes(query);
    return i.path.split(".")[0] === section;
  });

  // Agrupa por subseção para facilitar a leitura.
  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const parts = item.path.split(".");
      const key = parts.length > 2 ? `${parts[0]}.${parts[1]}` : parts[0]!;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const customCount = (s: string) =>
    Object.keys(overrides).filter((p) => p.startsWith(`${s}.`) && overrides[p]?.pt).length;

  async function onSave() {
    setBusy(true);
    try {
      const changes = changed.map((path) => ({ path, pt: drafts[path]! }));
      const r = await saveTexts({ data: { changes } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Textos salvos e traduzidos para EN, ES e ZH.");
      const c = await getSiteConfig();
      setOverrides(c.texts ?? {});
      setDrafts({});
    } catch {
      toast.error("Não foi possível salvar os textos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="Textos do site"
      description="Escolha a área do site, edite em português e salve. As versões em inglês, espanhol e mandarim são geradas automaticamente."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Navegação lateral por área */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOnlyChanged(false);
            }}
            placeholder="Buscar em todos os textos…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 flex flex-col gap-1 lg:max-h-[60vh] lg:overflow-auto">
            {sections.map((s) => {
              const custom = customCount(s);
              const active = !query && !onlyChanged && section === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setSection(s);
                    setSearch("");
                    setOnlyChanged(false);
                  }}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active ? "bg-ink text-ink-foreground" : "hover:bg-secondary"
                  }`}
                >
                  <span>{SECTION_LABELS[s] ?? s}</span>
                  {custom > 0 && (
                    <span
                      className={`rounded-full px-1.5 text-[11px] ${
                        active ? "bg-ink-foreground/20" : "bg-accent/10 text-accent"
                      }`}
                    >
                      {custom}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Editor */}
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <p className="text-muted-foreground">
              {query
                ? `Resultados para “${search}”`
                : onlyChanged
                  ? "Somente alterações pendentes"
                  : SECTION_LABELS[section] ?? section}{" "}
              · {items.length} campo(s)
            </p>
            <button
              onClick={() => setOnlyChanged((v) => !v)}
              disabled={changed.length === 0}
              className="ml-auto rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-40"
            >
              {onlyChanged ? "Ver todos" : `Ver pendentes (${changed.length})`}
            </button>
          </div>

          <div className="space-y-8">
            {groups.map(([groupKey, groupItems]) => (
              <section key={groupKey}>
                {groupKey.includes(".") && (
                  <h3 className="mb-3 border-b border-border pb-2 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {groupKey.split(".")[1]}
                  </h3>
                )}
                <div className="space-y-3">
                  {groupItems.slice(0, 200).map((item) => {
                    const current = drafts[item.path] ?? overrides[item.path]?.pt ?? item.value;
                    const isCustom = Boolean(overrides[item.path]?.pt);
                    const isDirty = item.path in drafts;
                    const { base, parent } = humanize(item.path);
                    const long = current.length > 110;
                    return (
                      <div
                        key={item.path}
                        className={`rounded-lg border bg-background p-4 transition-colors ${
                          isDirty ? "border-accent" : "border-border"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{base}</span>
                          {parent && (
                            <span className="text-xs text-muted-foreground">{parent}</span>
                          )}
                          {isCustom && (
                            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                              personalizado
                            </span>
                          )}
                          {isDirty && (
                            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                              não salvo
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-3">
                            {isDirty && (
                              <button
                                className="text-xs text-muted-foreground hover:text-accent"
                                onClick={() =>
                                  setDrafts((d) => {
                                    const n = { ...d };
                                    delete n[item.path];
                                    return n;
                                  })
                                }
                              >
                                Desfazer
                              </button>
                            )}
                            {(isCustom || isDirty) && (
                              <button
                                className="text-xs text-muted-foreground hover:text-accent"
                                onClick={() =>
                                  setDrafts((d) => ({ ...d, [item.path]: item.value }))
                                }
                              >
                                Restaurar original
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={current}
                          rows={long ? 4 : 2}
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [item.path]: e.target.value }))
                          }
                          className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span>{current.length} caracteres</span>
                          {isCustom && <span>Original: {item.value.slice(0, 120)}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum texto encontrado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-background p-4 shadow-lg">
        <p className="text-sm text-muted-foreground">
          {changed.length === 0
            ? "Nenhuma alteração pendente."
            : `${changed.length} texto(s) alterado(s).`}
        </p>
        {changed.length > 0 && (
          <button
            onClick={() => setDrafts({})}
            className="text-sm text-muted-foreground hover:text-accent"
          >
            Descartar alterações
          </button>
        )}
        <button
          disabled={busy || changed.length === 0}
          onClick={onSave}
          className="ml-auto rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          {busy ? "Salvando e traduzindo…" : "Salvar e traduzir"}
        </button>
      </div>
    </AdminShell>
  );
}
