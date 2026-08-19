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

          // Frequência configurada no painel: semanal, quinzenal ou mensal.
          const { data: settings } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", "newsletter_schedule")
            .maybeSingle();
          const frequency =
            ((settings?.value ?? {}) as { frequency?: string }).frequency ?? "weekly";
          const minDays = frequency === "monthly" ? 27 : frequency === "biweekly" ? 13 : 0;

          if (minDays > 0) {
            const { data: last } = await supabaseAdmin
              .from("newsletter_campaigns")
              .select("sent_at")
              .not("sent_at", "is", null)
              .order("sent_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            if (last?.sent_at) {
              const days = (Date.now() - new Date(last.sent_at).getTime()) / 86_400_000;
              if (days < minDays) {
                return Response.json({ ok: true, skipped: `Frequência ${frequency}.` });
              }
            }
          }

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
