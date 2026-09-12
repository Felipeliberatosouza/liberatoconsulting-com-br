import { Link } from "@tanstack/react-router";

import { useLanguage } from "@/i18n";
import { keywordTerm, keywordThemes, themeTitle, type KeywordLang } from "@/lib/keywords";

type Props = {
  /** Temas exibidos; vazio mostra todos. */
  themeIds?: string[];
  title?: string;
  intro?: string;
  className?: string;
};

const HEADING: Record<KeywordLang, { title: string; intro: string }> = {
  pt: {
    title: "O que as empresas procuram na Liberato Consulting",
    intro:
      "Temas de consultoria que atendemos, com a página correspondente de cada frente de trabalho.",
  },
  en: {
    title: "What companies look for at Liberato Consulting",
    intro: "Consulting topics we cover, each linked to the page that answers it.",
  },
  es: {
    title: "Lo que las empresas buscan en Liberato Consulting",
    intro: "Temas de consultoría que atendemos, con la página correspondiente de cada frente.",
  },
  zh: {
    title: "企业在 Liberato Consulting 寻找的服务",
    intro: "我们覆盖的咨询主题，每个主题都链接到对应的页面。",
  },
};

/**
 * Bloco de links internos por tema de busca, no idioma servido ao visitante.
 * Dá ao Google texto âncora descritivo apontando para as páginas de serviço
 * e de dados do Brasil em cada mercado.
 */
export function SeoKeywordLinks({ themeIds, title, intro, className = "" }: Props) {
  const { lang } = useLanguage();
  const l = (["pt", "en", "es", "zh"].includes(lang) ? lang : "pt") as KeywordLang;
  const labels = HEADING[l];
  const themes = keywordThemes(themeIds);

  if (themes.length === 0) return null;

  return (
    <section className={`border-t border-border bg-secondary py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold leading-tight md:text-3xl">{title ?? labels.title}</h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{intro ?? labels.intro}</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <div key={theme.id} className="border-t border-border pt-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-accent">
                {themeTitle(theme, l)}
              </h3>
              <ul className="mt-3 space-y-2">
                {theme.terms.map((k) => (
                  <li key={`${theme.id}-${k.term}`}>
                    <Link
                      to={k.path as never}
                      search={((prev: Record<string, unknown>) => prev) as never}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {keywordTerm(k, l)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
