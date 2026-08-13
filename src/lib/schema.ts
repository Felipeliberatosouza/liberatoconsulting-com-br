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
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    serviceType: input.category ?? "Consultoria em gestão empresarial",
    provider: orgRef,
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
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

/** Artigo / publicação editorial. */
export function articleSchema(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string | null;
  image?: string | null;
  authorName?: string | null;
  inLanguage?: string;
}) {
  const url = absoluteUrl(input.path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline.slice(0, 110),
    description: input.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: input.inLanguage ?? "pt-BR",
    publisher: orgRef,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : orgRef,
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.image ? { image: input.image } : {}),
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
