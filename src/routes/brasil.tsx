import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { BulletinSignup } from "@/components/BulletinSignup";
import { useLanguage } from "@/i18n";
import { FilterScopeBadge, SiteFilterBar } from "@/components/SiteFilterBar";
import {
  ALL_REGIONS,
  ALL_SEGMENTS,
  ALL_STATES,
  useAudienceFilters,
} from "@/lib/audience-filters";
import { listPublicIndicatorsI18n } from "@/lib/indicators.functions";
import { compareIndicator } from "@/lib/indicator-compare";

import { pt } from "@/i18n/pt";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, itemList, jsonLd, webPageSchema } from "@/lib/schema";
import { getScopedBrazilSections } from "@/lib/brazil-scope.functions";

export const Route = createFileRoute("/brasil")({
  head: (ctx) => ({
    meta: [
      { title: "Dados do Brasil para investidores — Liberato Consulting" },
      {
        name: "description",
        content:
          "Economia brasileira: PIB, inflação, Selic, setores estratégicos, investimento estrangeiro, tributos e infraestrutura em um só lugar.",
      },
      {
        property: "og:title",
        content: "Dados do Brasil para investidores internacionais",
      },
      {
        property: "og:description",
        content:
          "Panorama econômico, setores estratégicos, IED, tributos, Mercosul, mercado consumidor e infraestrutura do Brasil.",
      },
      { property: "og:url", content: "https://liberatoconsulting.com.br/brasil" },
      { property: "og:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dados do Brasil para investidores internacionais" },
      { name: "twitter:description", content: "Panorama econômico, setores estratégicos, IED, tributos, Mercosul, mercado consumidor e infraestrutura do Brasil." },
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/brasil", headLang(ctx)),
    scripts: [
      jsonLd(
        breadcrumb([
          { name: "Início", path: "/" },
          { name: "Dados do Brasil", path: "/brasil" },
        ]),
      ),
      jsonLd(
        webPageSchema({
          name: "Dados do Brasil para investidores",
          description:
            "Panorama econômico, setores estratégicos, investimento estrangeiro, tributos e infraestrutura do Brasil.",
          path: "/brasil",
          type: "CollectionPage",
        }),
      ),
      jsonLd(
        itemList({
          name: "Temas sobre o Brasil",
          items: pt.brazil.sections.map((s) => ({
            name: s.title,
            path: `/brasil/${s.id}`,
          })),
        }),
      ),
    ],
  }),
  component: BrazilPage,
});

function BrazilPage() {
  const { t, lang } = useLanguage();
  const scope = useAudienceFilters();
  const b = t.brazil;

  const scoped = useQuery({
    queryKey: ["brazil-scoped", lang, scope.filters, b.sections.map((s) => s.id).join(",")],
    enabled: scope.applied,
    staleTime: 600_000,
    queryFn: () =>
      getScopedBrazilSections({
        data: {
          segment: scope.filters.segment,
          region: scope.filters.region,
          uf: scope.filters.state,
          lang,
          sections: b.sections.map((s) => ({ id: s.id, title: s.title })),
        },
      }),
  });
  const scopedMap = new Map((scoped.data ?? []).map((s) => [s.section_id, s]));

  return (
    <div>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {b.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-3xl font-bold leading-tight md:text-5xl">
            {b.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-ink-foreground/75">{b.body}</p>
          <FilterScopeBadge className="mt-6" />
        </div>
      </section>

      <SiteFilterBar />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {b.sectionsLabel}
          </p>
          <ul className="mt-4 space-y-2 border-l border-border pl-4">
            {b.sections.map((s) => (
              <li key={s.id}>
                <Link
                  to="/brasil/$slug"
                  params={{ slug: s.id }}
                  className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 space-y-14">
          {scope.applied && (
            <p className="rounded-md border-l-4 border-accent bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Observação: os dados e textos desta seção correspondem aos filtros aplicados —{" "}
              <span className="font-semibold text-foreground">{scope.label}</span>
              {scoped.isFetching ? " (atualizando os textos para este recorte...)" : "."}
            </p>
          )}

          <IndicatorsPanel />

          {b.sections.map((s) => {
            const custom = scopedMap.get(s.id);
            const title = custom?.title || s.title;
            const body = custom?.body || s.body;
            const bullets = custom && custom.bullets.length > 0 ? custom.bullets : s.bullets;
            return (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-border pt-8">
                <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
                {custom && (
                  <p className="mt-2 inline-flex rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                    {scope.label}
                  </p>
                )}
                {body.split(/\n{2,}/).map((p, i) => (
                  <p
                    key={i}
                    className="mt-4 max-w-3xl leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {bullets.map((item) => (
                    <li key={item} className="flex gap-3 text-sm">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                {custom && custom.sources.length > 0 && (
                  <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                    {custom.sources.map((src) => (
                      <li key={src}>Fonte: {src}</li>
                    ))}
                  </ul>
                )}
                <Link
                  to="/brasil/$slug"
                  params={{ slug: s.id }}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent"
                >
                  {s.title} <ArrowRight className="size-4" />
                </Link>
              </section>
            );
          })}

          <section className="border-t border-border pt-8">
            <h2 className="text-lg font-bold">{b.sourcesLabel}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {b.sources.map((src) => (
                <li key={src.url}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {src.label}
                    <ExternalLink className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t-2 border-ink bg-secondary p-8">
            <h2 className="text-xl font-bold">{b.ctaTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {b.ctaBody}
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90"
            >
              {t.nav.cta} <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <BulletinSignup />
      </section>

      <CtaBand />
    </div>
  );
}

function IndicatorsPanel() {
  const scope = useAudienceFilters();
  const { t, lang } = useLanguage();
  const labels = t.brazil.indicators;
  const indicators = useQuery({
    queryKey: ["public-indicators", lang],
    queryFn: () => listPublicIndicatorsI18n({ data: { lang } }),
    staleTime: 300_000,
  });
  const all = indicators.data ?? [];
  const f = scope.filters;

  // Compatíveis com os filtros: recorte igual ao filtro ou marcado como geral/nacional.
  const compatible = all.filter(
    (i) =>
      (i.segment === ALL_SEGMENTS || f.segment === ALL_SEGMENTS || i.segment === f.segment) &&
      (i.region === ALL_REGIONS || f.region === ALL_REGIONS || i.region === f.region) &&
      (i.uf === ALL_STATES || f.state === ALL_STATES || i.uf === f.state),
  );
  // Quando há filtros aplicados, priorizamos os indicadores específicos daquele recorte.
  const specific = scope.applied
    ? compatible.filter(
        (i) => i.segment !== ALL_SEGMENTS || i.region !== ALL_REGIONS || i.uf !== ALL_STATES,
      )
    : [];
  // Com filtros aplicados exibimos apenas os indicadores daquele recorte.
  const rows = scope.applied ? specific : compatible;

  if (rows.length === 0) {
    if (!scope.applied) return null;
    return (
      <section id="indicadores" className="scroll-mt-24">
        <h2 className="text-2xl font-bold md:text-3xl">{labels.title}</h2>
        <p className="mt-3 max-w-3xl rounded-md border-l-4 border-accent bg-secondary px-4 py-3 text-sm text-muted-foreground">
          {labels.empty} <span className="font-semibold text-foreground">{scope.label}</span>
        </p>
      </section>
    );
  }

  return (
    <section id="indicadores" className="scroll-mt-24">
      <h2 className="text-2xl font-bold md:text-3xl">{labels.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {labels.intro}
        {scope.applied && (
          <>
            {" "}
            {labels.scopeNote}{" "}
            <span className="font-semibold text-foreground">{scope.label}</span>.
          </>
        )}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((i) => {
          const delta = compareIndicator(i.value, i.previous_value, i.unit);
          return (
            <article key={i.id} className="rounded-lg border border-border bg-background p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {i.label}
              </p>
              <p className="mt-2 font-display text-2xl font-bold">
                {i.value}
                {i.unit ? <span className="ml-1 text-base font-semibold">{i.unit}</span> : null}
              </p>
              {i.reference_period && (
                <p className="mt-1 text-xs text-muted-foreground">{i.reference_period}</p>
              )}

              <dl className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
                {i.previous_value && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{labels.previous}</dt>
                    <dd className="text-right font-semibold">
                      {i.previous_value}
                      {i.unit ? ` ${i.unit}` : ""}
                      {i.previous_period ? (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({i.previous_period})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                )}
                {delta.direction !== "none" && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{labels.change}</dt>
                    <dd className="text-right font-semibold" style={{ color: delta.color }}>
                      {delta.arrow} {delta.label}
                    </dd>
                  </div>
                )}
                {i.forecast_value && (
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{labels.forecast}</dt>
                    <dd className="text-right font-semibold">
                      {i.forecast_value}
                      {i.unit ? ` ${i.unit}` : ""}
                      {i.forecast_period ? (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({i.forecast_period})
                        </span>
                      ) : null}
                    </dd>
                  </div>
                )}
              </dl>

              {i.note && <p className="mt-3 text-sm text-muted-foreground">{i.note}</p>}
              {i.source_name && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {labels.source}:{" "}
                  {i.source_url ? (
                    <a
                      href={i.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-accent hover:underline"
                    >
                      {i.source_name}
                    </a>
                  ) : (
                    i.source_name
                  )}
                </p>
              )}
              {i.forecast_value && i.forecast_source_name && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.forecastSource}:{" "}
                  {i.forecast_source_url ? (
                    <a
                      href={i.forecast_source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-accent hover:underline"
                    >
                      {i.forecast_source_name}
                    </a>
                  ) : (
                    i.forecast_source_name
                  )}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

