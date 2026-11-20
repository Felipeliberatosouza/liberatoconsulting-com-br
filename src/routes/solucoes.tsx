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

const CUSTOM: Record<string, string> = {
  pt: "Personalizável: as etapas do funil, campos, metas e alertas seguem as regras e o processo de vendas da sua empresa — sem licença por vendedor.",
  en: "Customizable: funnel stages, fields, goals and alerts follow your company's own sales rules and process — no per-seller license.",
  es: "Personalizable: etapas del embudo, campos, metas y alertas siguen las reglas y el proceso de ventas de su empresa — sin licencia por vendedor.",
  zh: "可定制：漏斗阶段、字段、目标和提醒都按贵公司的销售规则和流程设置——不按销售人员收费。",
};

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
        <div className="mt-8 rounded-2xl border border-accent bg-secondary p-7">
          <span className="text-sm font-semibold text-accent">Fechou! CRM</span>
          <h2 className="my-2 text-2xl font-bold">{crm.title}</h2>
          <p className="mb-2 text-muted-foreground">{crm.body}</p>
          <p className="mb-4 text-sm text-muted-foreground">{CUSTOM[lang] ?? CUSTOM["pt"]}</p>
          <div className="flex flex-wrap gap-5">
            <Link to="/demo/crm" className="inline-flex items-center gap-2 font-semibold text-accent hover:opacity-80">{crm.demo}<ArrowRight className="size-4"/></Link>
            <Link to="/crm" className="inline-flex items-center gap-2 font-semibold hover:text-accent">{crm.details}<ArrowRight className="size-4"/></Link>
          </div>
        </div>
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
