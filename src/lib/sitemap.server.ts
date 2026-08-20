/**
 * Geração dos sitemaps por idioma.
 *
 * `/sitemap.xml` é um índice que aponta para um sitemap por idioma
 * (`/sitemap-pt.xml`, `/sitemap-en.xml`, `/sitemap-es.xml`, `/sitemap-zh.xml`).
 * Cada sitemap lista as URLs daquele idioma com os alternates hreflang
 * recíprocos, o que reduz conflitos de rastreamento.
 */

import { pt } from "@/i18n/pt";
import { HREFLANGS, localizedUrl, SITE_URL, absoluteUrl } from "@/lib/seo";

export interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const SITEMAP_LANGS = HREFLANGS.map(([lang]) => lang);

/** Rotas públicas fixas + conteúdo dinâmico publicado. */
export async function collectEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/services", changefreq: "weekly", priority: "0.9" },
    { path: "/about", changefreq: "monthly", priority: "0.7" },
    { path: "/brasil", changefreq: "weekly", priority: "0.9" },
    { path: "/content", changefreq: "weekly", priority: "0.8" },
    { path: "/contact", changefreq: "monthly", priority: "0.7" },
    { path: "/careers", changefreq: "monthly", priority: "0.5" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ];

  for (const page of pt.serviceDetail.pages) {
    entries.push({ path: `/services/${page.id}`, changefreq: "monthly", priority: "0.8" });
  }
  for (const page of pt.aboutDetail.pages) {
    entries.push({ path: `/about/${page.id}`, changefreq: "monthly", priority: "0.6" });
  }
  for (const section of pt.brazil.sections) {
    entries.push({ path: `/brasil/${section.id}`, changefreq: "monthly", priority: "0.7" });
    section.bullets.forEach((label, index) => {
      entries.push({
        path: `/brasil/${section.id}/${topicSlug(index, label)}`,
        changefreq: "monthly",
        priority: "0.6",
      });
    });
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: articles }, { data: campaigns }] = await Promise.all([
      supabaseAdmin.from("content_articles").select("slug").eq("published", true),
      supabaseAdmin.from("newsletter_campaigns").select("slug").not("published_at", "is", null),
    ]);
    for (const a of articles ?? []) {
      if (a?.slug) entries.push({ path: `/content/${a.slug}`, changefreq: "monthly", priority: "0.6" });
    }
    for (const c of campaigns ?? []) {
      if (c?.slug) entries.push({ path: `/newsletter/${c.slug}`, changefreq: "monthly", priority: "0.5" });
    }
  } catch {
    // Banco indisponível: o sitemap segue válido apenas com as rotas fixas.
  }

  return entries;
}

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Sitemap de um idioma, com alternates hreflang recíprocos. */
export async function buildLanguageSitemap(lang: string, origin: string = SITE_URL): Promise<Response> {
  const entries = await collectEntries();

  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${localizedUrl(e.path, lang, origin)}</loc>`,
      ...HREFLANGS.map(
        ([code, hreflang]) =>
          `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${localizedUrl(e.path, code, origin)}" />`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(e.path, origin)}" />`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return xmlResponse(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
      ...urls,
      `</urlset>`,
    ].join("\n"),
  );
}

/** Índice apontando para os sitemaps de cada idioma. */
export function buildSitemapIndex(origin: string = SITE_URL): Response {
  return xmlResponse(
    [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...SITEMAP_LANGS.map((lang) =>
        [`  <sitemap>`, `    <loc>${origin}/sitemap-${lang}.xml</loc>`, `  </sitemap>`].join("\n"),
      ),
      `</sitemapindex>`,
    ].join("\n"),
  );
}
