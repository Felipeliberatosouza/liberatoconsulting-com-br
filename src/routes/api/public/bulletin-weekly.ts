import { createFileRoute } from "@tanstack/react-router";

/**
 * Disparo automático do Boletim Semanal (chamado pelo agendador toda segunda-feira).
 * Protegido pela chave publicável do projeto no cabeçalho `apikey`.
 */
export const Route = createFileRoute("/api/public/bulletin-weekly")({
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

        const { dispatchBulletin } = await import("@/lib/bulletin.server");
        try {
          const result = await dispatchBulletin();
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
