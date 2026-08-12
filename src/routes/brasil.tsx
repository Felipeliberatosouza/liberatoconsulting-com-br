import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";
import { FilterScopeBadge, SiteFilterBar } from "@/components/SiteFilterBar";
import {
  ALL_REGIONS,
  ALL_SEGMENTS,
  ALL_STATES,
  useAudienceFilters,
} from "@/lib/audience-filters";
import { listPublicIndicators } from "@/lib/indicators.functions";

export const Route = createFileRoute("/brasil")({
  head: () => ({
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
      { property: "og:url", content: "https://liberato-ai-insight.lovable.app/brasil" },
    ],
    links: [{ rel: "canonical", href: "https://liberato-ai-insight.lovable.app/brasil" }],
  }),
  component: BrazilPage,
});

function BrazilPage() {
  const { t } = useLanguage();
  const scope = useAudienceFilters();
  const b = t.brazil;

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
              <span className="font-semibold text-foreground">{scope.label}</span>.
            </p>
          )}

          <IndicatorsPanel />

          {b.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-border pt-8">
              <h2 className="text-2xl font-bold md:text-3xl">{s.title}</h2>
              <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">{s.body}</p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {s.bullets.map((item) => (
                  <li key={item} className="flex gap-3 text-sm">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/brasil/$slug"
                params={{ slug: s.id }}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent"
              >
                {s.title} <ArrowRight className="size-4" />
              </Link>
            </section>
          ))}

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

      <CtaBand />
    </div>
  );
}

function IndicatorsPanel() {
  const scope = useAudienceFilters();
  const indicators = useQuery({
    queryKey: ["public-indicators"],
    queryFn: () => listPublicIndicators(),
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
        (i) =>
          i.segment !== ALL_SEGMENTS || i.region !== ALL_REGIONS || i.uf !== ALL_STATES,
      )
    : [];
  const rows = specific.length > 0 ? specific : compatible;
  const onlyNational = scope.applied && specific.length === 0;

  if (rows.length === 0) {
    if (!scope.applied) return null;
    return (
      <section id="indicadores" className="scroll-mt-24">
        <h2 className="text-2xl font-bold md:text-3xl">Indicadores econômicos</h2>
        <p className="mt-3 max-w-3xl rounded-md border-l-4 border-accent bg-secondary px-4 py-3 text-sm text-muted-foreground">
          Ainda não há indicadores publicados para o recorte selecionado (
          <span className="font-semibold text-foreground">{scope.label}</span>). Ajuste os
          filtros acima ou fale com a nossa equipe para uma pesquisa sob medida.
        </p>
      </section>
    );
  }

  return (
    <section id="indicadores" className="scroll-mt-24">
      <h2 className="text-2xl font-bold md:text-3xl">Indicadores econômicos</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Números macroeconômicos monitorados nas fontes oficiais brasileiras e revisados pela
        nossa equipe.
        {scope.applied && (
          <>
            {" "}
            Exibindo apenas os dados do recorte{" "}
            <span className="font-semibold text-foreground">{scope.label}</span>
            {onlyNational ? " — no momento, com indicadores nacionais de referência." : "."}
          </>
        )}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((i) => (
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
            {i.note && <p className="mt-3 text-sm text-muted-foreground">{i.note}</p>}
            {i.source_name && (
              <p className="mt-3 text-xs text-muted-foreground">
                Fonte:{" "}
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
          </article>
        ))}
      </div>
    </section>
  );
}
