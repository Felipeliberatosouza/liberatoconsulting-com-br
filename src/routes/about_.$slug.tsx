import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Sparkles, Users } from "lucide-react";
import { ResultBanner } from "@/components/ResultBanner";
import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";

const SLUGS = pt.aboutDetail.pages.map((p) => p.id);

export const Route = createFileRoute("/about_/$slug")({
  loader: ({ params }) => {
    if (!SLUGS.includes(params.slug)) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const page = pt.aboutDetail.pages.find((p) => p.id === params.slug);
    if (!page) {
      return {
        meta: [
          { title: "Página não encontrada — Liberato Consulting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${page.title} | Quem somos — Liberato Consulting`;
    return {
      meta: [
        { title },
        { name: "description", content: page.lead },
        { property: "og:title", content: title },
        { property: "og:description", content: page.lead },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: AboutDetailPage,
});

function AboutDetailPage() {
  const { slug } = Route.useParams();
  const { t } = useLanguage();
  const L = t.aboutDetail.labels;
  const page = t.aboutDetail.pages.find((p) => p.id === slug) ?? t.aboutDetail.pages[0]!;
  const related = t.aboutDetail.pages.filter((p) => p.id !== page.id);

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {L.breadcrumb}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{page.title}</h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{page.lead}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-lg leading-relaxed text-muted-foreground">{page.body}</p>

          <div className="mt-10 rounded-2xl border border-border p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Users className="size-4" />
              {L.audience}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{page.audience}</p>
          </div>

          <h2 className="mt-14 text-2xl font-bold">{L.highlights}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {b}
              </li>
            ))}
          </ul>

          {page.id === "o-que-fazemos" && (
            <div className="mt-12">
              <ResultBanner />
            </div>
          )}

          {page.id === "equipe" && <ConsultantsTeam />}


          <div className="mt-12 rounded-2xl bg-ink p-8 text-ink-foreground">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="size-4" />
              {L.ai}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-foreground/80">{page.ai}</p>
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm text-muted-foreground">{L.ctaBody}</p>
            <Link
              to="/contact"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {L.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {related.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {L.related}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/about/$slug"
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
            <Link to="/about" className="text-sm font-semibold text-accent">
              ← {L.back}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
