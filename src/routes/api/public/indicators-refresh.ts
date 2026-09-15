import { createFileRoute } from "@tanstack/react-router";
import { assertCronCaller } from "@/lib/cron-auth.server";

/**
 * Atualização semanal dos indicadores econômicos (toda segunda-feira, 10h de Brasília).
 * Alimenta tanto a página pública de Dados do Brasil quanto o Boletim Semanal.
 * Protegido por um segredo exclusivo do agendador (nunca enviado ao navegador).
 */
export const Route = createFileRoute("/api/public/indicators-refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await assertCronCaller(request))) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { refreshIndicatorsFromSources, fillMissingIndicatorSeries } = await import(
            "@/lib/indicators.server"
          );
          const refreshed = await refreshIndicatorsFromSources();
          let filled: unknown = null;
          try {
            filled = await fillMissingIndicatorSeries();
          } catch {
            // Sem estimativa disponível, os dados atuais já foram atualizados.
          }
          return Response.json({ ok: true, refreshed, filled });
        } catch (err) {
          return Response.json(
            { ok: false, error: err instanceof Error ? err.message : "Falha na atualização." },
            { status: 500 },
          );
        }
      },
    },
  },
});
