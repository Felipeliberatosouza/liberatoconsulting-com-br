import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TrainingBadges } from "@/components/SolutionBlocks";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, courseSchema, jsonLd } from "@/lib/schema";
import { SOLUTION_UI as U, findSolution, findTraining, pick, pickList } from "@/lib/solutions";

const IN_LANG: Record<string, string> = { pt: "pt-BR", en: "en", es: "es", zh: "zh-CN" };

export const Route = createFileRoute("/treinamentos_/$slug")({
  loader: ({ params }) => {
    const t = findTraining(params.slug);
    if (!t) throw notFound();
    return { slug: t.slug };
  },
  head: (ctx) => {
    const lang = headLang(ctx);
    const t = findTraining(ctx.params.slug);
    if (!t) return { meta: [{ title: "Página não encontrada | Liberato Consulting" }, { name: "robots", content: "noindex" }] };
    const name = `${pick(U.trainingsEyebrow, lang)}: ${pick(t.title, lang)}`;
    const title = `${name} | Liberato Consulting`;
    const description = `${pick(t.outcome, lang)} ${pick(U.forWho, lang)}: ${pick(t.audience, lang)}.`;
    const path = `/treinamentos/${t.slug}`;
    const sol = findSolution(t.solutionSlug);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seoLocaleMeta(lang),
      ],
      links: seoLinks(path, lang),
      scripts: [
        jsonLd(courseSchema({ name, description, path, audience: pick(t.audience, lang), teaches: sol ? pickList(sol.tools, lang) : [], inLanguage: IN_LANG[lang] ?? "pt-BR" })),
        jsonLd(breadcrumb([{ name: "Liberato Consulting", path: "/" }, { name: pick(U.trainingsEyebrow, lang), path: "/treinamentos" }, { name: pick(t.title, lang), path }])),
      ],
    };
  },
  component: TrainingPage,
});

function TrainingPage() {
  const { slug } = Route.useLoaderData();
  const { lang } = useLanguage();
  const t = findTraining(slug)!;
  const sol = findSolution(t.solutionSlug);
  return (
    <div>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Link to="/treinamentos" className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.trainingsEyebrow, lang)}</Link>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">{pick(t.title, lang)}</h1>
          <p className="mt-6 text-lg opacity-80">{pick(t.outcome, lang)}</p>
          <p className="mt-4 text-sm"><span className="font-semibold">{pick(U.forWho, lang)}:</span> {pick(t.audience, lang)}</p>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="max-w-2xl text-lg text-muted-foreground">{pick(U.trainingsBody, lang)}</p>
        <div className="mt-8"><TrainingBadges /></div>
        {sol && (
          <>
            <h2 className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{pick(U.method, lang)}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {pickList(sol.tools, lang).map((x) => <li key={x} className="text-sm">{x}</li>)}
            </ul>
            <Link to="/solucoes/$slug" params={{ slug: sol.slug }} className="mt-12 block rounded-lg border border-border bg-secondary p-6 hover:border-accent">
              <p className="text-sm text-muted-foreground">{pick(U.linkedSolution, lang)}</p>
              <p className="mt-1 font-bold">{pick(sol.title, lang)} →</p>
            </Link>
          </>
        )}
        <Link to="/contact" className="mt-10 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground hover:opacity-90">
          {pick(U.talk, lang)} <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
