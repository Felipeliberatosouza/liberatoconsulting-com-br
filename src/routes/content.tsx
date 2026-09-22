import { AreaBannerSection } from "@/components/AreaBannerSection";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CtaBand } from "@/components/CtaBand";
import { BulletinSignup } from "@/components/BulletinSignup";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { seoPageMeta } from "@/lib/seo-meta";
import { breadcrumb, jsonLd, webPageSchema } from "@/lib/schema";
import { useLanguage } from "@/i18n";
import { READ_COUNT_BASE } from "@/lib/site-config";

type ContentSearch = {
  category?: string | undefined;
  service?: string | undefined;
  q?: string | undefined;
};

export const Route = createFileRoute("/content")({
  validateSearch: (search: Record<string, unknown>): ContentSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
    service: typeof search["service"] === "string" ? search["service"] : undefined,
    q: typeof search["q"] === "string" ? search["q"].slice(0, 100) : undefined,
  }),
  head: (ctx) => ({
    meta: [
      ...seoPageMeta("/content", headLang(ctx)),
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/content", headLang(ctx)),
    scripts: [
      jsonLd(
        breadcrumb([
          { name: "Início", path: "/" },
          { name: "Conteúdo", path: "/content" },
        ]),
      ),
      jsonLd(
        webPageSchema({
          name: "Conteúdo — Liberato Consulting",
          description:
            "Artigos, guias e estudos sobre gestão estratégica, operações, empreendedorismo e inteligência artificial aplicada.",
          path: "/content",
          type: "CollectionPage",
        }),
      ),
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const { t, lang, articles } = useLanguage();
  const c = t.content;
  const groups = t.megaMenu.groups;
  const search = useSearch({ from: "/content" });
  const [filter, setFilter] = useState<string>(search.category || "all");
  const [serviceFilter, setServiceFilter] = useState<string | null>(search.service || null);
  const [query, setQuery] = useState(search.q || "");

  useEffect(() => {
    setFilter(search.category || "all");
    setServiceFilter(search.service || null);
    setQuery(search.q || "");
  }, [search.category, search.service, search.q]);

  const serviceLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of groups) for (const i of g.items) map[i.id] = i.label;
    return map;
  }, [groups]);

  // Conteúdos cadastrados no painel têm prioridade sobre os conteúdos padrão.
  const all =
    articles.length > 0
      ? articles.map((a) => {
          const tr = (lang === "pt" ? undefined : a.translations?.[lang]) ?? {};
          return {
            id: a.slug,
            group: a.group_id,
            kind: tr.kind ?? a.kind,
            title: tr.title ?? a.title,
            summary: tr.summary ?? a.summary,
            service: a.service,
            link: a.link_url ?? null,
            cover: a.cover_url ?? null,
            authors: a.authors ?? "",
            reads: a.read_count ?? READ_COUNT_BASE,
            slug: a.slug as string | null,
          };
        })
      : c.items.map((i) => ({
          ...i,
          link: null as string | null,
          cover: null as string | null,
          authors: "",
          reads: 0,
          slug: null as string | null,
        }));

  const items = all.filter((i) => {
    if (filter !== "all" && i.group !== filter) return false;
    if (serviceFilter && i.service !== serviceFilter) return false;
    const needle = query.trim().toLocaleLowerCase();
    if (needle && !`${i.title} ${i.summary} ${i.authors}`.toLocaleLowerCase().includes(needle)) return false;
    return true;
  });


  return (
    <div>
      <AreaBannerSection area="content">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{c.eyebrow}</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg text-ink-foreground/75">{c.lead}</p>
        </div>
      </AreaBannerSection>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <label className="mb-6 block max-w-xl text-sm font-medium">{pageText(lang).misc.searchLabel}<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={pageText(lang).misc.searchPlaceholder} className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 outline-none focus:border-accent" /></label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === "all"
                ? "border-ink bg-ink text-ink-foreground"
                : "border-border text-muted-foreground hover:text-accent"
            }`}
          >
            {c.allLabel}
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                filter === g.id
                  ? "border-ink bg-ink text-ink-foreground"
                  : "border-border text-muted-foreground hover:text-accent"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            // Regra: imagem, título e resumo sempre levam à leitura do conteúdo.
            const ReadLink = ({
              children,
              className,
            }: {
              children: ReactNode;
              className?: string;
            }) =>
              item.slug ? (
                <Link to="/content/$slug" params={{ slug: item.slug }} className={className}>
                  {children}
                </Link>
              ) : item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {children}
                </a>
              ) : (
                <span className={className}>{children}</span>
              );

            return (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden border-t-2 border-ink pt-6 transition-colors hover:border-accent"
            >
              {item.cover && (
                <ReadLink className="relative mb-5 block aspect-[16/9] overflow-hidden rounded-md">
                  <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-3 text-sm font-semibold text-ink-foreground">
                    {item.title}
                  </span>
                </ReadLink>
              )}
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {item.kind}
              </p>
              <h2 className="mt-3 font-display text-xl font-bold leading-snug">
                <ReadLink className="hover:text-accent">{item.title}</ReadLink>
              </h2>
              {item.authors && (
                <p className="mt-1 text-xs text-muted-foreground">{item.authors}</p>
              )}
              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                <ReadLink className="hover:text-accent">{item.summary}</ReadLink>
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                {item.slug ? (
                  <Link
                    to="/content/$slug"
                    params={{ slug: item.slug }}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {c.readMore}
                  </Link>
                ) : (
                  item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-accent hover:underline"
                    >
                      {c.readMore}
                    </a>
                  )
                )}
                {item.reads > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {item.reads} {c.article.reads}
                  </span>
                )}
              </div>
              {serviceLabel[item.service] && (
                <p className="mt-5 text-xs text-muted-foreground">
                  {c.relatedService}:{" "}
                  <Link
                    to="/services/$slug"
                    params={{ slug: item.service }}
                    className="font-semibold text-foreground hover:text-accent"
                  >
                    {serviceLabel[item.service]}
                  </Link>
                </p>
              )}
            </article>
            );
          })}


        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">{c.emptyNote}</p>
          <Link
            to="/content/enviar"
            className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
          >
            {c.article.publishCta}
          </Link>
        </div>

      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <BulletinSignup />
      </section>

      <CtaBand />
    </div>
  );
}
