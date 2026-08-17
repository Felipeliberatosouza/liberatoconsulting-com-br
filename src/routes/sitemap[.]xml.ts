import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildLanguageSitemap } from "@/lib/sitemap.server";
import { requestOrigin } from "@/lib/seo";

/** Sitemap único: URLs padrão (pt) com alternates hreflang de todos os idiomas. */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildLanguageSitemap("pt", requestOrigin(request)),
    },
  },
});
