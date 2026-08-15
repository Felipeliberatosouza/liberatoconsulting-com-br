import { createFileRoute } from "@tanstack/react-router";
import { createEmailWebhookHandler } from "@lovable.dev/email-js";

async function optOut(recipient: string) {
  const email = recipient.trim().toLowerCase();
  if (!email) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("bulletin_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .ilike("email", email);

  await supabaseAdmin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed" })
    .ilike("email", email);
}

async function optIn(recipient: string) {
  const email = recipient.trim().toLowerCase();
  if (!email) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("bulletin_subscribers")
    .update({ status: "active", unsubscribed_at: null })
    .ilike("email", email);

  await supabaseAdmin
    .from("newsletter_subscribers")
    .update({ status: "active" })
    .ilike("email", email);
}

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Email webhook unavailable", { status: 503 });
        const handler = createEmailWebhookHandler({
          apiKey,
          on: {
            "email.unsubscribed": async (event) => optOut(event.data.recipient),
            "email.resubscribed": async (event) => optIn(event.data.recipient),
            "email.bounced": async (event) => optOut(event.data.recipient),
            "email.complaint": async (event) => optOut(event.data.recipient),
          },
        });
        return handler(request);
      },
    },
  },
});
