import { createFileRoute } from "@tanstack/react-router";
import { assertCronCaller } from "@/lib/cron-auth.server";

/**
 * Disparo automático do Boletim Semanal (chamado pelo agendador toda segunda-feira).
 * Protegido por um segredo exclusivo do agendador (nunca enviado ao navegador).
 */
export const Route = createFileRoute("/api/public/bulletin-weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await assertCronCaller(request))) {
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
