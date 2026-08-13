import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";
import { seoLinks } from "@/lib/seo";
import { getSiteConfig } from "@/lib/admin.functions";

const SLUGS = pt.brazil.sections.map((s) => s.id);

export const Route = createFileRoute("/brasil_/$slug")({
  loader: ({ params }) => {
    if (!SLUGS.includes(params.slug)) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const section = pt.brazil.sections.find((s) => s.id === params.slug);
    if (!section) {
      return {
        meta: [
          { title: "Página não encontrada — Liberato Consulting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${section.title} | Dados do Brasil — Liberato Consulting`;
    const description = section.body.slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks(`/brasil/${params.slug}`),
    };
  },
  component: BrazilDetailPage,
});

function BrazilDetailPage() {
  const { slug } = Route.useParams();
  const { t } = useLanguage();
  const b = t.brazil;
  const section = b.sections.find((s) => s.id === slug) ?? b.sections[0]!;
  const related = b.sections.filter((s) => s.id !== section.id);
  const config = useQuery({
    queryKey: ["site-config-public"],
    queryFn: () => getSiteConfig(),
    staleTime: 300_000,
  });
  const meta = config.data?.brazil?.[slug]?.meta;

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/brasil"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {b.eyebrow}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{section.title}</h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{section.body}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-2xl font-bold">{b.sectionsLabel}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {section.bullets.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>

          {meta && (meta.sources || meta.authors || meta.updatedAt) && (
            <div className="mt-10 rounded-lg border border-border p-6 text-sm">
              {meta.updatedAt && (
                <p className="text-muted-foreground">
                  Atualizado em {new Date(meta.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              )}
              {meta.authors && (
                <p className="mt-2">
                  <strong>Autores:</strong> {meta.authors}
                  {meta.authorContact ? ` — ${meta.authorContact}` : ""}
                </p>
              )}
              {meta.sources && (
                <div className="mt-3">
                  <strong>Fontes de pesquisa</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {meta.sources
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mt-12 rounded-2xl border border-border bg-secondary p-8">
            <h2 className="text-xl font-bold">{b.ctaTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.ctaBody}</p>
            <Link
              to="/contact"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {t.nav.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-14 border-t border-border pt-8">
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
          </div>

          {related.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {b.sectionsLabel}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/brasil/$slug"
                    params={{ slug: r.id }}
                    className="text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <Link to="/brasil" className="text-sm font-semibold text-accent">
              ← {b.eyebrow}
            </Link>
          </div>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
