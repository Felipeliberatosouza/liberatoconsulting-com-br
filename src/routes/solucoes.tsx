import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SolutionCards, StartLadder } from "@/components/SolutionBlocks";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { itemList, jsonLd } from "@/lib/schema";
import { fechouCopy } from "@/lib/fechou-copy";
import { SOLUTIONS, SOLUTION_UI as U, pick } from "@/lib/solutions";

export const Route = createFileRoute("/solucoes")({
  head: (ctx) => {
    const lang = headLang(ctx);
    const title = `${pick(U.question, lang)} | Liberato Consulting`;
    const description = `${pick(U.slogan, lang)} ${pick(U.support, lang)}`;
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
      links: seoLinks("/solucoes", lang),
      scripts: [
        jsonLd(itemList({ name: pick(U.solutionsTitle, lang), items: SOLUTIONS.map((s) => ({ name: pick(s.title, lang), path: `/solucoes/${s.slug}` })) })),
      ],
    };
  },
  component: SolucoesPage,
});

function SolucoesPage() {
  const { lang } = useLanguage();
  const crm = fechouCopy[lang];
  return (
    <div>
      <section className="mx-auto max-w-7xl px-6 pb-12 pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.solutionsEyebrow, lang)}</p>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">{pick(U.question, lang)}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{pick(U.support, lang)}</p>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <SolutionCards />
        <div className="mt-8 border-t border-border pt-7"><span className="text-sm font-semibold text-accent">Fechou! CRM</span><h2 className="my-2 text-2xl font-bold">{crm.title}</h2><p className="mb-3 text-muted-foreground">{crm.body}</p><Link to="/crm" className="inline-flex items-center gap-2 font-semibold hover:text-accent">{crm.details}<ArrowRight className="size-4"/></Link></div>
      </section>
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-3xl font-bold">{pick(U.ladderTitle, lang)}</h2>
          <StartLadder />
          <Link to="/contact" className="mt-12 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground hover:opacity-90">
            {pick(U.talk, lang)} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
