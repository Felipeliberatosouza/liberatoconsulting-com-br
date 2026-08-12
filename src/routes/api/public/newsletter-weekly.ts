import { createFileRoute } from "@tanstack/react-router";

/**
 * Disparo automático da Newsletter (chamado pelo agendador toda quarta-feira às 10h).
 * Envia a campanha em rascunho mais antiga para todos os inscritos ativos.
 * Protegido pela chave publicável do projeto no cabeçalho `apikey`.
 */
export const Route = createFileRoute("/api/public/newsletter-weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? "";
        const provided =
          request.headers.get("apikey") ??
          (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { dispatchCampaign } = await import("@/lib/newsletter.server");

          const { data: campaign } = await supabaseAdmin
            .from("newsletter_campaigns")
            .select("id")
            .eq("status", "draft")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          if (!campaign) {
            return Response.json({ ok: true, skipped: "Nenhuma campanha em rascunho." });
          }

          const result = await dispatchCampaign(campaign.id);
          return Response.json(result, { status: result.ok ? 200 : 500 });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "Falha no envio." },
            { status: 500 },
          );
        }
      },
    },
  },
});
