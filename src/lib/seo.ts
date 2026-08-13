/**
 * Helpers de SEO: URL canônica e alternativas hreflang.
 *
 * O site serve o mesmo caminho em todos os idiomas, alternando o conteúdo
 * pelo parâmetro `?lang=`. Por isso cada página declara:
 *  - canonical apontando para o próprio caminho (versão padrão, português);
 *  - hreflang para pt-BR, en, es e zh-Hans + x-default.
 */

export const SITE_URL = "https://liberatoconsulting.com.br";

/** Idiomas publicados e seus códigos hreflang. */
export const HREFLANGS = [
  ["pt", "pt-BR"],
  ["en", "en"],
  ["es", "es"],
  ["zh", "zh-Hans"],
] as const;

/** URL absoluta de um caminho interno. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "/" : p.replace(/\/$/, "")}`;
}

/** URL absoluta de um caminho em um idioma específico. */
export function localizedUrl(path: string, lang: string): string {
  const base = absoluteUrl(path);
  return lang === "pt" ? base : `${base}${base.includes("?") ? "&" : "?"}lang=${lang}`;
}

/** `links` do head(): canonical + alternates hreflang. */
export function seoLinks(path: string) {
  return [
    { rel: "canonical", href: absoluteUrl(path) },
    ...HREFLANGS.map(([lang, hreflang]) => ({
      rel: "alternate",
      hrefLang: hreflang,
      href: localizedUrl(path, lang),
    })),
    { rel: "alternate", hrefLang: "x-default", href: absoluteUrl(path) },
  ];
}
