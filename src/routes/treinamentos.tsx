import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { TrainingBadges, TrainingCards } from "@/components/SolutionBlocks";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { itemList, jsonLd } from "@/lib/schema";
import { SOLUTION_UI as U, TRAININGS, pick } from "@/lib/solutions";

export const Route = createFileRoute("/treinamentos")({
  head: (ctx) => {
    const lang = headLang(ctx);
    const title = `${pick(U.trainingsEyebrow, lang)}: ${pick(U.trainingsTitle, lang)} | Liberato Consulting`;
    const description = pick(U.trainingsBody, lang);
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
      links: seoLinks("/treinamentos", lang),
      scripts: [jsonLd(itemList({ name: pick(U.trainingsEyebrow, lang), items: TRAININGS.map((t) => ({ name: pick(t.title, lang), path: `/treinamentos/${t.slug}` })) }))],
    };
  },
  component: TreinamentosPage,
});

function TreinamentosPage() {
  const { lang } = useLanguage();
  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.trainingsEyebrow, lang)}</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">{pick(U.trainingsTitle, lang)}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{pick(U.trainingsBody, lang)}</p>
      </section>
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-6">
          <TrainingBadges />
          <div className="mt-10"><TrainingCards /></div>
          <Link to="/contact" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground hover:opacity-90">
            {pick(U.talk, lang)} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
