import { createFileRoute } from "@tanstack/react-router";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Quem somos | About — Liberato Consulting" },
      {
        name: "description",
        content:
          "Consultoria brasileira com leitura global: método de gestão, resultado medido e transferência de conhecimento, com IA como propósito central.",
      },
      { property: "og:title", content: "Quem somos — Liberato Consulting" },
      {
        property: "og:description",
        content: "Método de gestão, resultado medido e inteligência artificial como propósito.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.about.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            {t.about.title}
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-2">
        <p className="text-xl leading-relaxed">{t.about.body}</p>
        <p className="text-lg leading-relaxed text-muted-foreground">{t.about.body2}</p>
      </section>

      <section className="border-y border-border bg-secondary py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-3">
          {t.about.values.map((v) => (
            <div key={v.t} className="border-t-2 border-ink pt-5">
              <h2 className="text-lg font-bold">{v.t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          {t.purpose.eyebrow}
        </p>
        <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">{t.purpose.title}</h2>
        <p className="mt-5 text-muted-foreground">{t.purpose.body}</p>
      </section>

      <CtaBand />
    </div>
  );
}
