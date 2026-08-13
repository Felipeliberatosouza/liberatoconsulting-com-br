import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildLanguageSitemap } from "@/lib/sitemap.server";

export const Route = createFileRoute("/sitemap-es.xml")({
  server: {
    handlers: {
      GET: async () => buildLanguageSitemap("es"),
    },
  },
});
