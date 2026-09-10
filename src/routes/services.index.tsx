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

  const tree = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        families: fam.items
          .map((f) => ({
            ...f,
            products: pages.filter((p) => p.family === f.title && p.groups.includes(group.id)),
          }))
          .filter((f) => f.products.length > 0),
      })),
    [groups, fam.items, pages],
  );

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
        <div className="flex flex-col gap-20">
          {tree.map((group) => (
            <div key={group.id}>
              <h2 className="border-b-2 border-accent pb-3 font-display text-2xl font-bold md:text-3xl">
                {group.title}
              </h2>

              <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {group.families.map((f) => (
                  <article
                    key={`${group.id}-${f.id}`}
                    className="flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-accent"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {fam.labels.products}
                    </p>
                    <h3 className="mt-2 font-display text-lg font-bold leading-snug">
                      <Link to="/services/$slug" params={{ slug: f.id }} className="hover:text-accent">
                        {f.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.problem}</p>

                    <ul className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                      {f.products.map((p) => (
                        <li key={p.id}>
                          <Link
                            to="/services/$slug"
                            params={{ slug: p.id }}
                            className="group flex flex-col gap-1"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold transition-colors group-hover:text-accent">
                              <ArrowRight className="size-3.5 shrink-0 text-accent" />
                              {p.title}
                            </span>
                            <span className="pl-5 text-xs text-muted-foreground">{p.lead}</span>
                            <span className="flex items-center gap-1.5 pl-5 text-xs text-muted-foreground">
                              <Clock className="size-3 text-accent" />
                              {p.duration}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
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
