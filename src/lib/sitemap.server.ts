/**
 * Geração dos sitemaps por idioma.
 *
 * `/sitemap.xml` lista as páginas em português com alternates recíprocos;
 * os sitemaps por idioma mantêm as mesmas páginas públicas.
 */

import { pt } from "@/i18n/pt";
import { HREFLANGS, localizedUrl, SITE_URL, absoluteUrl } from "@/lib/seo";
import { topicSlug } from "@/lib/brazil-topic";
import { collectSitemapRows } from "./sitemap-pagination";

export interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
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
    { path: "/ferramentas", changefreq: "weekly", priority: "0.8" },
    { path: "/guia-gestao", changefreq: "monthly", priority: "0.7" },
    { path: "/newsletters", changefreq: "weekly", priority: "0.6" },
    { path: "/boletins", changefreq: "weekly", priority: "0.6" },
    { path: "/careers", changefreq: "monthly", priority: "0.5" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ];

  for (const family of pt.serviceFamilies.items) {
    entries.push({ path: `/services/${family.id}`, changefreq: "monthly", priority: "0.85" });
  }
  for (const page of pt.serviceDetail.pages) {
    entries.push({ path: `/services/${page.id}`, changefreq: "monthly", priority: "0.8" });
  }
  // Serviços e famílias cadastrados no painel que ainda não estão no dicionário.
  {
    const { publicClient } = await import("./admin.server");
    const db = publicClient();
    const data = await collectSitemapRows((from, to) => db
      .from("service_products").select("slug, family_id")
      .eq("published", true).order("id").range(from, to));
    const seen = new Set(entries.map((e) => e.path));
    for (const r of (data ?? []) as { slug: string; family_id: string }[]) {
      for (const slug of [r.family_id, r.slug]) {
        const path = `/services/${slug}`;
        if (slug && !seen.has(path)) {
          seen.add(path);
          entries.push({ path, changefreq: "monthly", priority: "0.8" });
        }
      }
    }
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

  {
    const { publicClient } = await import("./admin.server");
    const db = publicClient();
    const [articles, campaigns] = await Promise.all([
      collectSitemapRows((from, to) => db.from("content_articles").select("slug, updated_at").eq("published", true).order("id").range(from, to)),
      collectSitemapRows((from, to) => db.from("newsletter_campaigns").select("slug, published_at").not("published_at", "is", null).order("id").range(from, to)),
    ]);
    // Individual calculators require an account; advertise the public catalog,
    // never bypass their access policies to enumerate restricted tool records.
    for (const a of articles ?? []) {
      if (a?.slug) entries.push({ path: `/content/${a.slug}`, changefreq: "monthly", priority: "0.6", lastmod: (a as any).updated_at });
    }
    for (const c of campaigns ?? []) {
      if (c?.slug) entries.push({ path: `/newsletter/${c.slug}`, changefreq: "monthly", priority: "0.5", lastmod: (c as any).published_at });
    }
  }

  return [...new Map(entries.map((entry) => [entry.path, entry])).values()];
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
      e.lastmod && Number.isFinite(Date.parse(e.lastmod)) ? `    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
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
