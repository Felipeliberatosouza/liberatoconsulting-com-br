import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { CtaBand } from "@/components/CtaBand";
import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, jsonLd, webPageSchema } from "@/lib/schema";
import { getBrazilTopic } from "@/lib/brazil-topic.functions";
import { topicIndexFromSlug, topicSlug } from "@/lib/brazil-topic";

export const Route = createFileRoute("/brasil_/$slug_/$topic")({
  loader: ({ params }) => {
    const section = pt.brazil.sections.find((s) => s.id === params.slug);
    const index = topicIndexFromSlug(params.topic);
    if (!section || index === null || index >= section.bullets.length) throw notFound();
    return null;
  },
  head: ({ params, ...ctx }) => {
    const section = pt.brazil.sections.find((s) => s.id === params.slug);
    const index = topicIndexFromSlug(params.topic) ?? 0;
    const label = section?.bullets[index] ?? "Dados do Brasil";
    const title = `${label} | ${section?.title ?? "Dados do Brasil"} — Liberato Consulting`;
    const description =
      `Análise detalhada sobre ${label.toLowerCase()}, com dados de fontes oficiais brasileiras.`.slice(
        0,
        155,
      );
    return {
      meta: [
        { title: title.slice(0, 120) },
        { name: "description", content: description },
        { property: "og:title", content: title.slice(0, 120) },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title.slice(0, 120) },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: OG_IMAGE },
        ...seoLocaleMeta(headLang(ctx)),
      ],
      links: seoLinks(`/brasil/${params.slug}/${params.topic}`, headLang(ctx)),
      scripts: [
        jsonLd(
          breadcrumb([
            { name: "Início", path: "/" },
            { name: "Dados do Brasil", path: "/brasil" },
            { name: section?.title ?? "", path: `/brasil/${params.slug}` },
            { name: label, path: `/brasil/${params.slug}/${params.topic}` },
          ]),
        ),
        jsonLd(
          webPageSchema({
            name: label,
            description,
            path: `/brasil/${params.slug}/${params.topic}`,
          }),
        ),
      ],
    };
  },
  component: BrazilTopicPage,
});

function BrazilTopicPage() {
  const { slug, topic } = Route.useParams();
  const { t, lang } = useLanguage();
  const b = t.brazil;
  const section = b.sections.find((s) => s.id === slug) ?? b.sections[0]!;
  const index = topicIndexFromSlug(topic) ?? 0;
  const label = section.bullets[index] ?? section.title;
  const others = section.bullets
    .map((item, i) => ({ item, i }))
    .filter((x) => x.i !== index);

  const content = useQuery({
    queryKey: ["brazil-topic", slug, index, lang],
    queryFn: () =>
      getBrazilTopic({
        data: {
          sectionId: slug,
          sectionTitle: section.title,
          topicIndex: index,
          topicLabel: label,
          lang,
        },
      }),
    staleTime: 600_000,
  });
  const data = content.data;

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/brasil/$slug"
            params={{ slug }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {section.title}
          </Link>
          <h1 className="mt-6 text-3xl font-bold leading-tight md:text-4xl">
            {data?.title || label}
          </h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{label}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          {content.isPending && (
            <p className="text-sm text-muted-foreground">
              Reunindo dados atualizados em fontes oficiais brasileiras…
            </p>
          )}

          {!content.isPending && !data && (
            <p className="rounded-md border-l-4 border-accent bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Este detalhamento ainda está sendo preparado. Fale com a nossa equipe para receber o
              estudo completo sobre este item.
            </p>
          )}

          {data && (
            <>
              {data.body.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="mt-4 leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}

              {data.bullets.length > 0 && (
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {data.bullets.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {data.sources.length > 0 && (
                <div className="mt-10 rounded-lg border border-border p-6 text-sm">
                  <strong>{b.sourcesLabel}</strong>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {data.sources.map((src) => {
                      const url = /https?:\/\/\S+/.exec(src)?.[0];
                      return (
                        <li key={src}>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="hover:text-accent"
                            >
                              {src}
                            </a>
                          ) : (
                            src
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {data.updated_at && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Atualizado em {new Date(data.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              )}
            </>
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

          {others.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {section.title}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {others.map((o) => (
                  <Link
                    key={o.i}
                    to="/brasil/$slug/$topic"
                    params={{ slug, topic: topicSlug(o.i, o.item) }}
                    className="text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {o.item}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
