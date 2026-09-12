import { Link } from "@tanstack/react-router";

import { KEYWORD_THEMES } from "@/lib/keywords";

type Props = {
  /** Temas exibidos; vazio mostra todos. */
  themeIds?: string[];
  title?: string;
  intro?: string;
  className?: string;
};

/**
 * Bloco de links internos por tema de busca. Dá ao Google texto âncora
 * descritivo apontando para as páginas de serviço e de dados do Brasil.
 */
export function SeoKeywordLinks({
  themeIds,
  title = "O que as empresas procuram na Liberato Consulting",
  intro = "Temas de consultoria que atendemos, com a página correspondente de cada frente de trabalho.",
  className = "",
}: Props) {
  const themes = themeIds
    ? KEYWORD_THEMES.filter((t) => themeIds.includes(t.id))
    : KEYWORD_THEMES;

  if (themes.length === 0) return null;

  return (
    <section className={`border-t border-border bg-secondary py-16 ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-2xl font-bold leading-tight md:text-3xl">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{intro}</p>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <div key={theme.id} className="border-t border-border pt-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-accent">
                {theme.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {theme.terms.map((k) => (
                  <li key={`${theme.id}-${k.term}`}>
                    <Link
                      to={k.path as never}
                      className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {k.term}
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
