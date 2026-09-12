import { createFileRoute } from "@tanstack/react-router";
import { assertCronCaller } from "@/lib/cron-auth.server";

/** Disparo diário dos e-mails de aniversário do CRM (empresas e pessoas). */
export const Route = createFileRoute("/api/public/crm-birthdays")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await assertCronCaller(request))) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const { dispatchCrmBirthdays } = await import("@/lib/crm-birthdays.server");
          const result = await dispatchCrmBirthdays();
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
