import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/brasil")({
  head: () => ({
    meta: [
      { title: "Dados do Brasil para investidores internacionais — Liberato Consulting" },
      {
        name: "description",
        content:
          "Economia brasileira em um só lugar: PIB, inflação, Selic, setores estratégicos, investimento estrangeiro direto, tributos, comércio exterior, consumidor e infraestrutura no Brasil.",
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
    ],
  }),
  component: BrazilPage,
});

function BrazilPage() {
  const { t } = useLanguage();
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
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {b.sectionsLabel}
          </p>
          <ul className="mt-4 space-y-2 border-l border-border pl-4">
            {b.sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 space-y-14">
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
