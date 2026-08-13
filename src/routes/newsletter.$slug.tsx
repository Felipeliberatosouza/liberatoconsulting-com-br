import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";
import { getPublishedNewsletter } from "@/lib/newsletter-public.functions";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { articleSchema, breadcrumb, jsonLd } from "@/lib/schema";


const SITE = "https://liberatoconsulting.com.br";

export const Route = createFileRoute("/newsletter/$slug")({
  loader: async ({ params }) => {
    const data = await getPublishedNewsletter({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params, ...ctx }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Newsletter — Liberato Consulting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.subject} — Liberato Consulting`;
    const description =
      loaderData.preheader || loaderData.body.replace(/\s+/g, " ").slice(0, 155);
    const image = loaderData.hasImage
      ? `${SITE}/api/public/newsletter-image/${params.slug}`
      : undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        ...seoLocaleMeta(headLang(ctx)),
      ],
      links: seoLinks(`/newsletter/${params.slug}`, headLang(ctx)),
      scripts: [
        jsonLd(
          breadcrumb([
            { name: "Início", path: "/" },
            { name: "Conteúdo", path: "/content" },
            { name: loaderData.subject, path: `/newsletter/${params.slug}` },
          ]),
        ),
        jsonLd(
          articleSchema({
            headline: loaderData.subject,
            description,
            path: `/newsletter/${params.slug}`,
            datePublished: loaderData.referenceDate,
            image: image ?? null,
            authorName: loaderData.authors || null,
          }),
        ),
      ],
    };
  },
  notFoundComponent: NewsletterNotFound,
  component: NewsletterPage,
});

function NewsletterNotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl px-6 py-32">
      <p className="text-sm text-muted-foreground">{t.newsletterPage.notFound}</p>
      <Link to="/content" className="mt-4 inline-block text-sm font-semibold text-accent">
        {t.newsletterPage.seeContent}
      </Link>
    </div>
  );
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function NewsletterPage() {
  const loaded = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { lang, t } = useLanguage();

  // Conteúdo traduzido por IA quando o visitante não está em português.
  const translated = useQuery({
    queryKey: ["newsletter-public", slug, lang],
    queryFn: () => getPublishedNewsletter({ data: { slug, lang } }),
    enabled: lang !== "pt",
    staleTime: 1000 * 60 * 60,
  });

  const data = (lang !== "pt" && translated.data) || loaded;
  const cover = data.hasImage ? `/api/public/newsletter-image/${slug}` : "";
  const text = data.fullText.trim() || data.body;

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        {cover && (
          <img
            src={cover}
            alt={data.subject}
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto flex min-h-[340px] max-w-4xl flex-col justify-end px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.newsletterPage.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">
            {data.subject}
          </h1>
          {data.authors && (
            <p className="mt-4 text-sm text-ink-foreground/80">
              {t.newsletterPage.by} <span className="font-semibold">{data.authors}</span>
            </p>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14">
        {translated.isFetching && (
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {t.newsletterPage.translating}
          </p>
        )}
        {data.preheader && (
          <div className="border-l-4 border-accent bg-secondary/50 p-6">
            <p className="text-sm leading-relaxed">{data.preheader}</p>
          </div>
        )}
        <div className="mt-8 space-y-5 text-base leading-relaxed">
          {paragraphs(text).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {data.sources.trim() && (
          <div className="mt-10 border-t border-border pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t.newsletterPage.sources}
            </p>

            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {paragraphs(data.sources).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </article>

      <CtaBand />
    </div>
  );
}
