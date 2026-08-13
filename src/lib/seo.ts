/**
 * Helpers de SEO: URL canônica e alternativas hreflang.
 *
 * O site serve o mesmo caminho em todos os idiomas, alternando o conteúdo
 * pelo parâmetro `?lang=`. Por isso cada página declara:
 *  - canonical apontando para o próprio caminho (versão padrão, português);
 *  - hreflang para pt-BR, en, es e zh-Hans + x-default.
 */

export const SITE_URL = "https://liberatoconsulting.com.br";

/** Imagem padrão de preview social (Open Graph / Twitter Card). */
export const OG_IMAGE = `${SITE_URL}/og-default.png`;

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

/** Códigos OG (`og:locale`) por idioma. */
export const OG_LOCALES: Record<string, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
  zh: "zh_CN",
};

/** Normaliza um valor arbitrário de `?lang=` para um idioma publicado. */
export function normalizeLang(value: unknown): string {
  const v = String(value ?? "").toLowerCase().slice(0, 2);
  return HREFLANGS.some(([lang]) => lang === v) ? v : "pt";
}

/**
 * Lê o idioma atual a partir do contexto do `head()` de uma rota
 * (`?lang=en`, `?lang=es`, `?lang=zh`); sem parâmetro, assume português.
 */
export function headLang(ctx?: { match?: { search?: Record<string, unknown> } }): string {
  return normalizeLang(ctx?.match?.search?.["lang"]);
}

/**
 * `links` do head(): canonical autorreferente ao idioma servido +
 * alternates hreflang recíprocos para todos os idiomas + x-default.
 *
 * O canonical precisa apontar para a própria URL do idioma (com `?lang=`),
 * caso contrário o Google descarta os hreflang por conflito de canonical.
 */
export function seoLinks(path: string, lang: string = "pt") {
  const current = normalizeLang(lang);
  return [
    { rel: "canonical", href: localizedUrl(path, current) },
    ...HREFLANGS.map(([code, hreflang]) => ({
      rel: "alternate",
      hrefLang: hreflang,
      href: localizedUrl(path, code),
    })),
    { rel: "alternate", hrefLang: "x-default", href: absoluteUrl(path) },
  ];
}

/** `meta` de idioma: og:locale da versão servida. */
export function seoLocaleMeta(lang: string = "pt") {
  const current = normalizeLang(lang);
  return [{ property: "og:locale", content: OG_LOCALES[current] ?? "pt_BR" }];
}
