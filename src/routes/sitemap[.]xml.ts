import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { pt } from "@/i18n/pt";
import { HREFLANGS, localizedUrl, SITE_URL } from "@/lib/seo";

const BASE_URL = SITE_URL;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
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
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            ...HREFLANGS.map(
              ([lang, hreflang]) =>
                `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${localizedUrl(e.path, lang)}" />`,
            ),
            `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${e.path}" />`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
