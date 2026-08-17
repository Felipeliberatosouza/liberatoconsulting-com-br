/** Textos fixos das peças de divulgação de novos artigos, nos quatro idiomas. */

export const ARTICLE_POST_LANGS = ["pt", "en", "zh", "es"] as const;
export type ArticlePostLang = (typeof ARTICLE_POST_LANGS)[number];

export const ARTICLE_POST_HEADLINES: Record<ArticlePostLang, string> = {
  pt: "Tem conteúdo novo na Liberato Consulting!",
  en: "There is new content at Liberato Consulting!",
  zh: "利伯拉托咨询 有新内容发布！",
  es: "¡Hay contenido nuevo en Liberato Consulting!",
};

/** As quatro áreas de serviço da consultoria, com rótulos nos quatro idiomas. */
export const SERVICE_AREAS = [
  {
    id: "estrategia",
    labels: { pt: "Estratégia", en: "Strategy", zh: "战略", es: "Estrategia" },
  },
  {
    id: "empreendedorismo",
    labels: {
      pt: "Empreendedorismo",
      en: "Entrepreneurship",
      zh: "创业",
      es: "Emprendimiento",
    },
  },
  {
    id: "operacoes",
    labels: { pt: "Operações", en: "Operations", zh: "运营", es: "Operaciones" },
  },
  {
    id: "pesquisas",
    labels: {
      pt: "Pesquisa de Mercado",
      en: "Market Research",
      zh: "市场调研",
      es: "Investigación de Mercado",
    },
  },
] as const;

export type ServiceAreaId = (typeof SERVICE_AREAS)[number]["id"];

/** Título fixo da peça que reúne as quatro áreas. */
export const AREAS_POST_HEADLINES: Record<ArticlePostLang, string> = {
  pt: "Quatro frentes de consultoria na Liberato Consulting",
  en: "Four consulting fronts at Liberato Consulting",
  zh: "利伯拉托咨询 的四大咨询领域",
  es: "Cuatro frentes de consultoría en Liberato Consulting",
};
