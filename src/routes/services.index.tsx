import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CtaBand } from "@/components/CtaBand";
import { pt } from "@/i18n/pt";
import { seoLinks } from "@/lib/seo";
import { breadcrumb, itemList, jsonLd } from "@/lib/schema";
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
    links: seoLinks("/services"),
    scripts: [
      jsonLd(
        breadcrumb([
          { name: "Início", path: "/" },
          { name: "Serviços", path: "/services" },
        ]),
      ),
      jsonLd(
        itemList({
          name: "Serviços de consultoria",
          items: pt.serviceDetail.pages.map((p) => ({
            name: p.title,
            path: `/services/${p.id}`,
          })),
        }),
      ),
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLanguage();
  const c = t.services;
  const groups = t.megaMenu.groups;
  const pages = t.serviceDetail.pages;

  const pagesByGroup = useMemo(() => {
    const map: Record<string, typeof pages> = {};
    for (const g of groups) map[g.id] = pages.filter((p) => p.group === g.id);
    return map;
  }, [groups, pages]);

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
        <div className="grid gap-8 md:grid-cols-4">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col">
              <h2 className="mb-6 border-b-2 border-accent pb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                {group.title}
              </h2>
              <div className="flex flex-col gap-6">
                {pagesByGroup[group.id]?.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col border-t border-border pt-5 transition-colors first:border-t-0 first:pt-0"
                  >
                    <h3 className="font-display text-lg font-bold leading-snug">{item.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">{item.lead}</p>
                    <Link
                      to="/services/$slug"
                      params={{ slug: item.id }}
                      className="mt-3 text-sm font-semibold text-accent hover:underline"
                    >
                      {t.content.readMore}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-sm text-muted-foreground">{t.content.emptyNote}</p>
      </section>

      <CtaBand />
    </div>
  );
}
