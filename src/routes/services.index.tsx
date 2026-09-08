import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowRight, Clock } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { pt } from "@/i18n/pt";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, itemList, jsonLd } from "@/lib/schema";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/services/")({
  head: (ctx) => ({
    meta: [
      { title: "Serviços de consultoria empresarial | Liberato Consulting" },
      {
        name: "description",
        content:
          "Consultoria em gestão empresarial no Brasil: eficiência operacional, crescimento, digital e IA, finanças, vendas, ESG, pessoas e inteligência de mercado.",
      },
      { property: "og:title", content: "Serviços de consultoria empresarial — Liberato Consulting" },
      {
        property: "og:description",
        content:
          "Produtos de consultoria com escopo, prazo e indicadores definidos, com inteligência artificial aplicada ao método.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Serviços de consultoria empresarial — Liberato Consulting" },
      {
        name: "twitter:description",
        content:
          "Produtos de consultoria com escopo, prazo e indicadores definidos, com inteligência artificial aplicada ao método.",
      },
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/services", headLang(ctx)),
    scripts: [
      jsonLd(
        breadcrumb([
          { name: "Início", path: "/" },
          { name: "Serviços", path: "/services" },
        ]),
      ),
      jsonLd(
        itemList({
          name: "Produtos de consultoria",
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
  const fam = t.serviceFamilies;
  const groups = t.megaMenu.groups;
  const pages = t.serviceDetail.pages;

  const familiesByGroup = useMemo(() => {
    const map: Record<string, typeof fam.items> = {};
    for (const g of groups) map[g.id] = fam.items.filter((f) => f.groups.includes(g.id));
    return map;
  }, [groups, fam.items]);

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{c.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{fam.title}</h1>
          <p className="mt-6 max-w-3xl text-lg text-ink-foreground/75">{fam.body}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col">
              <h2 className="mb-6 border-b-2 border-accent pb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                {group.title}
              </h2>
              <div className="flex flex-col gap-6">
                {familiesByGroup[group.id]?.map((f) => (
                  <article key={`${group.id}-${f.id}`} className="border-t border-border pt-5 first:border-t-0 first:pt-0">
                    <h3 className="font-display text-lg font-bold leading-snug">
                      <Link to="/services/$slug" params={{ slug: f.id }} className="hover:text-accent">
                        {f.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.problem}</p>
                    <ul className="mt-3 flex flex-col gap-1">
                      {f.products.map((pid) => {
                        const p = pages.find((x) => x.id === pid);
                        if (!p) return null;
                        return (
                          <li key={pid}>
                            <Link
                              to="/services/$slug"
                              params={{ slug: pid }}
                              className="text-sm text-muted-foreground transition-colors hover:text-accent"
                            >
                              → {p.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <h2 className="mt-20 text-2xl font-bold">{fam.labels.products}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.id}
              to="/services/$slug"
              params={{ slug: p.id }}
              className="flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-accent"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{p.family}</p>
              <h3 className="mt-3 font-display text-lg font-bold leading-snug">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.lead}</p>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-accent" />
                {p.duration}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent">
                {t.content.readMore}
                <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-16 text-sm text-muted-foreground">{t.content.emptyNote}</p>
      </section>

      <CtaBand />
    </div>
  );
}
