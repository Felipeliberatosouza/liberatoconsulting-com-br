import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/services/")({
  head: () => ({
    meta: [
      { title: "Serviços | Services — Liberato Consulting" },
      {
        name: "description",
        content:
          "Gestão estratégica de negócios, empreendedorismo e pesquisas de mercado sobre o Brasil — sempre com inteligência artificial embarcada.",
      },
      { property: "og:title", content: "Serviços — Liberato Consulting" },
      {
        property: "og:description",
        content:
          "Quatro frentes de consultoria com inteligência artificial embarcada, do diagnóstico à execução.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLanguage();
  const c = t.services;
  const groups = t.megaMenu.groups;
  const pages = t.serviceDetail.pages;
  const [filter, setFilter] = useState<string>("all");

  const groupTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) map[g.id] = g.title;
    return map;
  }, [groups]);

  const items = pages.filter((p) => {
    if (filter === "all") return true;
    return p.group === filter;
  });

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{c.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-foreground/75">{c.body}</p>
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
            {t.content.allLabel}
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
              className="flex flex-col overflow-hidden border-t-2 border-ink pt-6 transition-colors hover:border-accent"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {groupTitleById[item.group] ?? item.group}
              </p>
              <h2 className="mt-3 font-display text-xl font-bold leading-snug">{item.title}</h2>
              <p className="mt-3 flex-1 text-sm text-muted-foreground">{item.lead}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Link
                  to="/services/$slug"
                  params={{ slug: item.id }}
                  className="text-sm font-semibold text-accent hover:underline"
                >
                  {t.content.readMore}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">{t.content.emptyNote}</p>
      </section>

      <CtaBand />
    </div>
  );
}
