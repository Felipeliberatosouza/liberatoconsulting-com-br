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

const handler = createEmailWebhookHandler({
  apiKey: process.env["LOVABLE_API_KEY"]!,
  on: {
    "email.unsubscribed": async (event) => {
      await optOut(event.data.recipient);
    },
    "email.bounced": async (event) => {
      await optOut(event.data.recipient);
    },
    "email.complaint": async (event) => {
      await optOut(event.data.recipient);
    },
  },
});

export const Route = createFileRoute("/lovable/email/events")({
  server: {
    handlers: {
      POST: ({ request }) => handler(request),
    },
  },
});
