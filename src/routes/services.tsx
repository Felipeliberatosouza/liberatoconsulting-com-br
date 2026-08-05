import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/services")({
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
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6">
        {t.services.items.map((s, i) => (
          <section
            key={s.title}
            className="grid gap-10 border-b border-border py-20 md:grid-cols-[1fr_1.2fr]"
          >
            <div>
              <span className="font-display text-sm font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{s.title}</h2>
            </div>
            <div>
              <p className="text-lg leading-relaxed text-muted-foreground">{s.body}</p>
              <ul className="mt-8 grid gap-4">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm font-medium">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    {b}
                  </li>
                ))}
              </ul>
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
