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
  megaMenu: "Menu de serviços",
  aboutMenu: "Menu Quem somos",
  about: "Quem somos",
  contact: "Contato",
  content: "Conteúdo",
  careers: "Trabalhe conosco",
  footer: "Rodapé",
  cta: "Chamada final",
  leadForm: "Formulário de contato",
};

function AdminTexts() {
  const all = useMemo(() => flattenTexts(pt), []);
  const sections = useMemo(
    () => Array.from(new Set(all.map((i) => i.path.split(".")[0]!))),
    [all],
  );

  const [section, setSection] = useState(sections[0] ?? "");
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<TextOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((c) => setOverrides(c.texts ?? {}))
      .catch(() => undefined);
  }, []);

  const query = search.trim().toLowerCase();
  const items = all.filter((i) => {
    if (query) return i.value.toLowerCase().includes(query) || i.path.toLowerCase().includes(query);
    return i.path.split(".")[0] === section;
  });

  const changed = Object.keys(drafts);

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
      description="Edite em português. Ao salvar, as versões em inglês, espanhol e mandarim são geradas automaticamente. Deixe o campo vazio para voltar ao texto original."
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar texto…"
          className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {!query &&
          sections.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                section === s ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-accent"
              }`}
            >
              {SECTION_LABELS[s] ?? s}
            </button>
          ))}
      </div>

      <div className="space-y-4">
        {items.slice(0, 200).map((item) => {
          const current = drafts[item.path] ?? overrides[item.path]?.pt ?? item.value;
          const isCustom = Boolean(overrides[item.path]?.pt);
          return (
            <div key={item.path} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[11px] text-muted-foreground">{item.path}</p>
                {isCustom && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                    personalizado
                  </span>
                )}
              </div>
              <textarea
                value={current}
                rows={current.length > 120 ? 4 : 2}
                onChange={(e) => setDrafts((d) => ({ ...d, [item.path]: e.target.value }))}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {isCustom && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Original: {item.value.slice(0, 160)}
                </p>
              )}
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum texto encontrado.</p>
        )}
      </div>

      <div className="sticky bottom-4 mt-8 flex items-center gap-4 rounded-lg border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">
          {changed.length === 0 ? "Nenhuma alteração pendente." : `${changed.length} texto(s) alterado(s).`}
        </p>
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
