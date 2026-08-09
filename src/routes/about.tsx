import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
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
  const s = t.about.sections;

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

      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
          <nav className="hidden lg:block">
            <div className="sticky top-24 space-y-2 border-l border-border pl-5">
              {t.about.nav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <div className="space-y-20">
            <section id="sobre" className="scroll-mt-28">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                {t.about.eyebrow}
              </p>
              <h2 className="mt-4 text-3xl font-bold">{s.sobre.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.sobre.body}
              </p>
            </section>

            <section id="o-que-fazemos" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.oQueFazemos.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.oQueFazemos.body}
              </p>
              <ul className="mt-8 max-w-3xl space-y-4">
                {s.oQueFazemos.items.map((item) => (
                  <li key={item} className="flex gap-3 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="equipe" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.equipe.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.equipe.body}
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {s.equipe.members.map((m) => (
                  <div
                    key={m.role}
                    className="rounded-lg border border-border bg-secondary p-6"
                  >
                    <h3 className="font-semibold">{m.role}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="sustentabilidade-e-inclusao" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.sustentabilidadeEInclusao.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.sustentabilidadeEInclusao.body}
              </p>
            </section>

            <section id="etica" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.etica.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.etica.body}
              </p>
              <ul className="mt-8 max-w-3xl space-y-4">
                {s.etica.items.map((item) => (
                  <li key={item} className="flex gap-3 text-muted-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="trabalhe-conosco" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.trabalheConosco.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.trabalheConosco.body}
              </p>
              <div className="mt-8">
                <Link
                  to="/careers"
                  className="inline-flex items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-ink/90"
                >
                  {s.trabalheConosco.cta}
                </Link>
              </div>
            </section>

            <section id="fale-conosco" className="scroll-mt-28">
              <h2 className="text-3xl font-bold">{s.faleConosco.title}</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {s.faleConosco.body}
              </p>
              <div className="mt-8">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  {s.faleConosco.cta}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>

      <CtaBand />
    </div>
  );
}
