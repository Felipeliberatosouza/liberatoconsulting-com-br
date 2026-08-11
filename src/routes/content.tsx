import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";

type ContentSearch = {
  category?: string;
  service?: string;
};

export const Route = createFileRoute("/content")({
  validateSearch: (search: Record<string, unknown>): ContentSearch => ({
    category: typeof search.category === "string" ? search.category : undefined,
    service: typeof search.service === "string" ? search.service : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Conteúdo | Insights — Liberato Consulting" },
      {
        name: "description",
        content:
          "Artigos, guias e estudos sobre gestão estratégica, operações, empreendedorismo, pesquisas de mercado no Brasil e inteligência artificial aplicada.",
      },
      { property: "og:title", content: "Conteúdo — Liberato Consulting" },
      {
        property: "og:description",
        content: "Conhecimento aplicado em gestão empresarial e inteligência artificial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const { t, lang, articles } = useLanguage();
  const c = t.content;
  const groups = t.megaMenu.groups;
  const [filter, setFilter] = useState<string>("all");

  const serviceLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) for (const i of g.items) map[i.id] = i.label;
    return map;
  }, [groups]);

  // Conteúdos cadastrados no painel têm prioridade sobre os conteúdos padrão.
  const all =
    articles.length > 0
      ? articles.map((a) => {
          const tr = (lang === "pt" ? undefined : a.translations?.[lang]) ?? {};
          return {
            id: a.slug,
            group: a.group_id,
            kind: tr.kind ?? a.kind,
            title: tr.title ?? a.title,
            summary: tr.summary ?? a.summary,
            service: a.service,
            link: a.link_url ?? null,
          };
        })
      : c.items.map((i) => ({ ...i, link: null as string | null }));

  const items = all.filter((i) => filter === "all" || i.group === filter);

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{c.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-foreground/75">{c.lead}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "border-ink bg-ink text-ink-foreground"
                : "border-border text-muted-foreground hover:text-accent"
            }`}
          >
            {c.allLabel}
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                filter === g.id
                  ? "border-ink bg-ink text-ink-foreground"
                  : "border-border text-muted-foreground hover:text-accent"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col border-t-2 border-ink pt-6 transition-colors hover:border-accent"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {item.kind}
              </p>
              <h2 className="mt-3 font-display text-xl font-bold leading-snug">{item.title}</h2>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{item.summary}</p>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-semibold text-accent hover:underline"
                >
                  {c.readMore}
                </a>
              )}
              {serviceLabel[item.service] && (
                <p className="mt-5 text-xs text-muted-foreground">
                  {c.relatedService}:{" "}
                  <Link
                    to="/services/$slug"
                    params={{ slug: item.service }}
                    className="font-semibold text-foreground hover:text-accent"
                  >
                    {serviceLabel[item.service]}
                  </Link>
                </p>
              )}
            </article>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">{c.emptyNote}</p>
      </section>

      <CtaBand />
    </div>
  );
}
