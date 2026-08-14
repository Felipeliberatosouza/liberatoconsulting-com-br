import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildSitemapIndex } from "@/lib/sitemap.server";
import { requestOrigin } from "@/lib/seo";

/** Índice de sitemaps: aponta para um sitemap por idioma. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildSitemapIndex(requestOrigin(request)),
    },
  },
});
