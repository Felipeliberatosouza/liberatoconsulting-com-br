import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { requestOrigin } from "@/lib/seo";

/**
 * robots.txt dinâmico: as diretivas `Sitemap:` apontam para o mesmo host
 * que está sendo rastreado (domínio próprio ou domínio do projeto).
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = requestOrigin(request);
        const body = [
          "User-agent: Googlebot",
          "Allow: /",
          "",
          "User-agent: Bingbot",
          "Allow: /",
          "",
          "User-agent: Twitterbot",
          "Allow: /",
          "",
          "User-agent: facebookexternalhit",
          "Allow: /",
          "",
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin/",
          "Disallow: /api/",
          "Disallow: /boletim/cancelar",
          "Disallow: /newsletter/unsubscribe",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
