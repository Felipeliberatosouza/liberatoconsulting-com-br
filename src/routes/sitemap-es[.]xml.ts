import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildLanguageSitemap } from "@/lib/sitemap.server";
import { requestOrigin } from "@/lib/seo";

export const Route = createFileRoute("/sitemap-es.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => buildLanguageSitemap("es", requestOrigin(request)),
    },
  },
});
