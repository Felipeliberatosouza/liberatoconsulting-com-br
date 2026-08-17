/** Textos fixos das peças de divulgação de novos artigos, nos quatro idiomas. */

export const ARTICLE_POST_LANGS = ["pt", "en", "zh", "es"] as const;
export type ArticlePostLang = (typeof ARTICLE_POST_LANGS)[number];

export const ARTICLE_POST_HEADLINES: Record<ArticlePostLang, string> = {
  pt: "Tem conteúdo novo na Liberato Consulting!",
  en: "There is new content at Liberato Consulting!",
  zh: "利伯拉托咨询 有新内容发布！",
  es: "¡Hay contenido nuevo en Liberato Consulting!",
};
