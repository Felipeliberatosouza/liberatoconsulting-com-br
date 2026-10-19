import { createFileRoute } from "@tanstack/react-router";

/** Recebe avisos do Asaas e libera a ferramenta quando o pagamento é confirmado. */
export const Route = createFileRoute("/api/public/asaas-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["ASAAS_WEBHOOK_TOKEN"];
        if (!expected || request.headers.get("asaas-access-token") !== expected) return new Response("Unauthorized", { status: 401 });
        const body = (await request.json().catch(() => null)) as { event?: string; payment?: { id?: string; externalReference?: string } } | null;
        const payId = body?.payment?.id;
        if (!payId) return Response.json({ ok: true });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;
        const ev = body?.event ?? "";
        if (ev === "PAYMENT_RECEIVED" || ev === "PAYMENT_CONFIRMED") {
          await sb.from("interactive_tool_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("asaas_payment_id", payId).neq("status", "paid");
        } else if (["PAYMENT_OVERDUE", "PAYMENT_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"].includes(ev)) {
          await sb.from("interactive_tool_orders").update({ status: ev === "PAYMENT_REFUNDED" || ev.includes("CHARGEBACK") ? "refunded" : "canceled" }).eq("asaas_payment_id", payId).neq("status", "refunded");
        }
        return Response.json({ ok: true });
      },
    },
  },
});
