import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, Check, Sparkles } from "lucide-react";
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
          "Três frentes de consultoria com inteligência artificial embarcada, do diagnóstico à execução.",
      },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLanguage();
  const L = t.services.labels;

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.services.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            {t.services.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-foreground/75">{t.services.body}</p>

          <nav className="mt-12 grid gap-px border-t border-ink-foreground/15 sm:grid-cols-3">
            {t.services.items.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="group flex items-start justify-between gap-4 border-b border-ink-foreground/15 py-5 pr-4 sm:border-b-0"
              >
                <span>
                  <span className="font-display text-xs font-bold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{s.title}</span>
                </span>
                <ArrowDown className="mt-4 size-4 shrink-0 text-ink-foreground/40 transition-transform group-hover:translate-y-1" />
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        {t.services.items.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 border-b border-border py-20 last:border-b-0"
          >
            <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
              <div className="md:sticky md:top-28 md:self-start">
                <span className="font-display text-sm font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{s.title}</h2>
                <p className="mt-4 text-lg text-muted-foreground">{s.lead}</p>

                <dl className="mt-8 grid gap-5 border-t border-border pt-6 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {L.audience}
                    </dt>
                    <dd className="mt-1.5 text-muted-foreground">{s.audience}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {L.duration}
                    </dt>
                    <dd className="mt-1.5 text-muted-foreground">{s.duration}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <p className="text-lg leading-relaxed">{s.body}</p>

                <h3 className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {L.scope}
                </h3>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm font-medium">
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      {b}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 rounded-2xl bg-ink p-7 text-ink-foreground md:p-9">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-accent" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {L.ai}
                    </h3>
                  </div>
                  <p className="mt-4 text-base leading-relaxed text-ink-foreground/80">
                    {s.ai.body}
                  </p>
                  <ul className="mt-6 grid gap-4">
                    {s.ai.items.map((a) => (
                      <li
                        key={a}
                        className="border-t border-ink-foreground/15 pt-4 text-sm leading-relaxed"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <h3 className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {L.deliverables}
                </h3>
                <ol className="mt-4 grid gap-4 sm:grid-cols-2">
                  {s.deliverables.map((d, j) => (
                    <li key={d} className="border-t-2 border-ink pt-3 text-sm font-medium">
                      <span className="font-display text-xs text-accent">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      <span className="mt-1.5 block">{d}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        ))}
      </div>


      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="max-w-2xl text-2xl font-bold md:text-3xl">{t.approach.title}</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.approach.steps.map((s) => (
            <div key={s.n} className="border-t border-border pt-5">
              <span className="font-display text-sm font-bold text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
