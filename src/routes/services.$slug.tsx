import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock, Sparkles, Users } from "lucide-react";
import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";

const SLUGS = pt.serviceDetail.pages.map((p) => p.id);

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    if (!SLUGS.includes(params.slug)) throw notFound();
    return null;
  },
  head: ({ params }) => {
    const page = pt.serviceDetail.pages.find((p) => p.id === params.slug);
    if (!page) {
      return { meta: [{ title: "Serviço não encontrado — Liberato Consulting" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${page.title} — Liberato Consulting`;
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
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { slug } = Route.useParams();
  const { t } = useLanguage();
  const L = t.serviceDetail.labels;
  const page = t.serviceDetail.pages.find((p) => p.id === slug) ?? t.serviceDetail.pages[0];
  const group = t.megaMenu.groups.find((g) => g.id === page.group);
  const related = t.serviceDetail.pages.filter((p) => p.group === page.group && p.id !== page.id);

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {L.breadcrumb}
            {group ? ` · ${group.title}` : ""}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{page.title}</h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{page.lead}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-lg leading-relaxed text-muted-foreground">{page.body}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <Users className="size-4" />
                {L.audience}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{page.audience}</p>
            </div>
            <div className="rounded-2xl border border-border p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                <Clock className="size-4" />
                {L.duration}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{page.duration}</p>
            </div>
          </div>

          <h2 className="mt-14 text-2xl font-bold">{L.scope}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {b}
              </li>
            ))}
          </ul>

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
                    to="/services/$slug"
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
            <Link to="/services" className="text-sm font-semibold text-accent">
              ← {L.back}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
