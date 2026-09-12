import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";
import { legal } from "@/i18n/legal";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { EmailText } from "@/components/EmailText";

export const Route = createFileRoute("/privacy")({
  head: (ctx) => ({
    meta: [
      ...seoPageMeta("/privacy", headLang(ctx), { ogType: "article" }),
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/privacy", headLang(ctx)),
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
