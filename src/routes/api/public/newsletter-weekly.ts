import { createFileRoute } from "@tanstack/react-router";
import { assertCronCaller } from "@/lib/cron-auth.server";

/**
 * Disparo automático da Newsletter (chamado pelo agendador toda quarta-feira às 10h).
 * Envia a campanha em rascunho mais antiga para todos os inscritos ativos.
 * Protegido por um segredo exclusivo do agendador (nunca enviado ao navegador).
 */
export const Route = createFileRoute("/api/public/newsletter-weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await assertCronCaller(request))) {
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { dispatchCampaign } = await import("@/lib/newsletter.server");

          const { autoCreateCampaign, recordNewsletterRun } = await import(
            "@/lib/newsletter-auto.server"
          );

          // Frequência configurada no painel: semanal, quinzenal ou mensal.
          const { data: settings } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "newsletter_schedule")
            .maybeSingle();
          const stored = (settings?.value ?? {}) as {
            frequency?: string;
            autoGenerate?: boolean;
            paused?: boolean;
          };
          const frequency = stored.frequency ?? "weekly";
          const autoGenerate = stored.autoGenerate !== false;
          const minDays = frequency === "monthly" ? 27 : frequency === "biweekly" ? 13 : 0;

          // Interrompido por falta de créditos/permissão de IA: só o painel reativa.
          if (stored.paused) {
            return Response.json({ ok: true, skipped: "Geração automática pausada." });
          }

          const { data: last } = await supabaseAdmin
            .from("newsletter_campaigns")
            .select("sent_at")
            .not("sent_at", "is", null)
            .order("sent_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (minDays > 0 && last?.sent_at) {
            const days = (Date.now() - new Date(last.sent_at).getTime()) / 86_400_000;
            if (days < minDays) {
              const skipped = `Frequência ${frequency}: intervalo mínimo ainda não cumprido.`;
              await recordNewsletterRun(skipped);
              return Response.json({ ok: true, skipped });
            }
          }

          const { data: campaign } = await supabaseAdmin
            .from("newsletter_campaigns")
            .select("id")
            .eq("status", "draft")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          let campaignId = campaign?.id as string | undefined;

          if (!campaignId) {
            if (!autoGenerate) {
              const skipped = "Nenhuma campanha em rascunho (geração automática desligada).";
              await recordNewsletterRun(skipped);
              return Response.json({ ok: true, skipped });
            }
            const auto = await autoCreateCampaign(last?.sent_at ?? null);
            if (!auto.ok && "skipped" in auto) {
              await recordNewsletterRun(auto.skipped);
              return Response.json({ ok: true, skipped: auto.skipped });
            }
            if (!auto.ok) {
              if (auto.blocked) {
                // Circuit breaker: pausa até o administrador reativar no painel.
                const { supabaseAdmin: admin } = await import(
                  "@/integrations/supabase/client.server"
                );
                await admin
                  .from("site_settings")
                  .upsert(
                    { key: "newsletter_schedule", value: { ...stored, paused: true } },
                    { onConflict: "key" },
                  );
              }
              await recordNewsletterRun(`Falha ao gerar com IA: ${auto.error}`);
              return Response.json({ ok: false, error: auto.error }, { status: 500 });
            }
            campaignId = auto.campaignId;
          }

          const result = await dispatchCampaign(campaignId);
          await recordNewsletterRun(
            result.ok ? `Enviada para ${result.sent} inscrito(s).` : `Falha: ${result.error}`,
          );
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
