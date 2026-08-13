import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";
import { legal } from "@/i18n/legal";
import { seoLinks } from "@/lib/seo";
import { EmailText } from "@/components/EmailText";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Liberato Consulting" },
      {
        name: "description",
        content:
          "Como a Liberato Consulting coleta, usa, compartilha e protege dados pessoais no site, conforme a LGPD.",
      },
      { property: "og:title", content: "Política de Privacidade — Liberato Consulting" },
      {
        property: "og:description",
        content: "Tratamento de dados pessoais, cookies e direitos do titular.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: seoLinks("/privacy"),
  }),
  component: () => <LegalPage doc="privacy" />,
});

export function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const { lang } = useLanguage();
  const d = (legal[lang] ?? legal.pt)[doc];

  return (
    <div className="bg-background">
      <header className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{d.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-accent">{d.updated}</p>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground"><EmailText>{d.intro}</EmailText></p>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-14">
        {d.sections.map((s) => (
          <section key={s.heading} className="mb-10">
            <h2 className="text-xl font-semibold text-foreground">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">
                <EmailText>{p}</EmailText>
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
