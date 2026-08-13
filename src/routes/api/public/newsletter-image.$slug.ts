import { createFileRoute } from "@tanstack/react-router";

/**
 * Serve a imagem de capa da newsletter publicada em um endereço público e estável,
 * para que as redes sociais mostrem a arte correta ao compartilhar o link.
 */
export const Route = createFileRoute("/api/public/newsletter-image/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = String(params.slug ?? "").replace(/\.(jpg|jpeg|png|webp)$/i, "");
        if (!slug) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("newsletter_campaigns")
          .select("image_url")
          .eq("slug", slug)
          .not("published_at", "is", null)
          .maybeSingle();

        const src = (row?.image_url ?? "") as string;
        if (!src) return new Response("Not found", { status: 404 });

        if (/^data:/i.test(src)) {
          const match = /^data:([^;,]+)?(;base64)?,(.*)$/is.exec(src);
          if (!match) return new Response("Not found", { status: 404 });
          const mime = match[1] || "image/jpeg";
          const isB64 = Boolean(match[2]);
          const payload = match[3] ?? "";
          const bytes = isB64
            ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
            : new TextEncoder().encode(decodeURIComponent(payload));
          return new Response(bytes, {
            headers: {
              "content-type": mime,
              "cache-control": "public, max-age=86400",
            },
          });
        }

        const upstream = await fetch(src);
        if (!upstream.ok || !upstream.body) return new Response("Not found", { status: 404 });
        return new Response(upstream.body, {
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
