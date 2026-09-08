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

        // Antes de enviar, buscamos a leitura mais recente de cada indicador:
        // o dado atual vira o anterior automaticamente.
        try {
          const { refreshIndicatorsFromSources } = await import("@/lib/indicators.server");
          await refreshIndicatorsFromSources();
        } catch {
          // Sem atualização disponível, o boletim segue com os dados já cadastrados.
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
