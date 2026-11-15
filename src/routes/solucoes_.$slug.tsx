import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, jsonLd, serviceSchema } from "@/lib/schema";
import { SOLUTION_UI as U, findSolution, findTraining, pick, pickList } from "@/lib/solutions";

export const Route = createFileRoute("/solucoes_/$slug")({
  loader: ({ params }) => {
    const s = findSolution(params.slug);
    if (!s) throw notFound();
    return { slug: s.slug };
  },
  head: (ctx) => {
    const lang = headLang(ctx);
    const s = findSolution(ctx.params.slug);
    if (!s) return { meta: [{ title: "Página não encontrada | Liberato Consulting" }, { name: "robots", content: "noindex" }] };
    const title = `${pick(s.title, lang)} | Liberato Consulting`;
    const description = `${pick(s.pain, lang).replace(/[“”]/g, "")} ${pick(s.promise, lang)}`;
    const path = `/solucoes/${s.slug}`;
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
        jsonLd(serviceSchema({ name: pick(s.title, lang), description, path })),
        jsonLd(breadcrumb([{ name: "Liberato Consulting", path: "/" }, { name: pick(U.solutionsEyebrow, lang), path: "/solucoes" }, { name: pick(s.title, lang), path }])),
      ],
    };
  },
  component: SolutionPage,
});

function SolutionPage() {
  const { slug } = Route.useLoaderData();
  const { lang } = useLanguage();
  const s = findSolution(slug)!;
  const training = s.trainingSlug ? findTraining(s.trainingSlug) : undefined;
  return (
    <div>
      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Link to="/solucoes" className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.solutionsEyebrow, lang)}</Link>
          <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">{pick(s.title, lang)}</h1>
          <p className="mt-6 text-xl italic opacity-80">{pick(s.pain, lang)}</p>
          <p className="mt-6 text-lg font-semibold text-accent">{pick(s.slogan, lang)}</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{pick(U.deliver, lang)}</h2>
          <p className="mt-4 text-lg leading-relaxed">{pick(s.promise, lang)}</p>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{pick(U.measure, lang)}</h2>
          <ul className="mt-4 space-y-2">
            {pickList(s.kpi, lang).map((k) => (
              <li key={k} className="flex gap-2 text-sm font-medium"><Check className="size-4 shrink-0 text-accent" />{k}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{pick(U.method, lang)}</h2>
          <ul className="mt-4 space-y-3 border-t border-border pt-4">
            {pickList(s.tools, lang).map((t) => (
              <li key={t} className="text-sm text-muted-foreground">{t}</li>
            ))}
          </ul>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-20">
        {training && (
          <Link to="/treinamentos/$slug" params={{ slug: training.slug }} className="mb-8 block rounded-lg border border-border bg-secondary p-6 hover:border-accent">
            <p className="text-sm text-muted-foreground">{pick(U.linkedTraining, lang)}</p>
            <p className="mt-1 font-bold">{pick(U.trainingsEyebrow, lang)}: {pick(training.title, lang)} →</p>
          </Link>
        )}
        <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground hover:opacity-90">
          {pick(U.talk, lang)} <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
