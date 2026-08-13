/**
 * Helpers de dados estruturados (schema.org / JSON-LD).
 *
 * Cada rota monta o seu bloco com estas funções e injeta em `head().scripts`
 * usando `type: "application/ld+json"`.
 */

import { SITE_URL, absoluteUrl } from "./seo";

export const ORG_ID = `${SITE_URL}/#organization`;

/** Referência curta à organização (evita repetir o objeto inteiro). */
export const orgRef = { "@id": ORG_ID };

/** Imagem padrão usada quando a página não tem capa própria. */
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

/**
 * Organização explícita (nome + logo). O Rich Results Test exige `name` e
 * `logo` visíveis em `publisher`, então não basta apenas a referência `@id`.
 */
export const publisherOrg = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "Liberato Consulting",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
    width: 1400,
    height: 395,
  },
};

/** Rótulos legíveis para as categorias de serviço. */
const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  estrategia: "Gestão estratégica",
  operacoes: "Excelência operacional",
  empreendedorismo: "Empreendedorismo e novos negócios",
  pesquisas: "Pesquisas de mercado",
  mercado: "Pesquisas de mercado",
};


/** Cria um script JSON-LD pronto para o array `scripts` do head(). */
export function jsonLd(data: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

/** Trilha de navegação (aparece como breadcrumb nos resultados do Google). */
export function breadcrumb(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Serviço oferecido pela consultoria. */
export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  category?: string;
}) {
  const category = input.category
    ? (SERVICE_CATEGORY_LABELS[input.category] ?? input.category)
    : "Consultoria em gestão empresarial";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: category,
    category,
    provider: publisherOrg,
    areaServed: [
      { "@type": "Country", name: "Brasil" },
      { "@type": "Place", name: "Global" },
    ],
    audience: { "@type": "BusinessAudience", name: "Empresas e investidores" },
  };
}

/** Lista de itens (usada nas páginas índice de serviços e conteúdos). */
export function itemList(input: {
  name: string;
  items: Array<{ name: string; path: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: input.items.length,
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
      item: absoluteUrl(item.path),
    })),
  };
}

/** Artigo / publicação editorial. */
export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string | null;
  dateModified?: string | null;
  image?: string | null;
  authorName?: string | null;
  inLanguage?: string;
}) {
  const url = absoluteUrl(input.path);
  const published = input.datePublished || input.dateModified || null;
  const modified = input.dateModified || input.datePublished || null;
  const authors = (input.authorName ?? "")
    .split(/\s*(?:,| e |&|\/)\s*/)
    .map((n) => n.trim())
    .filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline.slice(0, 110),
    name: input.headline.slice(0, 110),
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: input.inLanguage ?? "pt-BR",
    publisher: publisherOrg,
    author:
      authors.length > 0
        ? authors.map((name) => ({ "@type": "Person", name, url: `${SITE_URL}/about/equipe` }))
        : [publisherOrg],
    image: [input.image || DEFAULT_IMAGE],
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
}


/** Página institucional genérica (Quem somos, Dados do Brasil, etc.). */
export function webPageSchema(input: {
  name: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage";
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "WebPage",
    name: input.name,
    description: input.description,
    url,
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
    about: orgRef,
    inLanguage: "pt-BR",
  };
}

/** Vaga/candidatura espontânea na página Trabalhe Conosco. */
export function jobBoardSchema(input: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntity: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "Liberato Consulting",
    },
  };
}
