import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildSitemapIndex } from "@/lib/sitemap.server";

/** Índice de sitemaps: aponta para um sitemap por idioma. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => buildSitemapIndex(),
    },
  },
});
