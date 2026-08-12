import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/* ------------------------------------------------------------------ */
/* Público: inscrição e cancelamento                                    */
/* ------------------------------------------------------------------ */

const subscribeInput = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().max(120).optional().default(""),
  language: z.string().trim().max(8).optional().default("pt"),
  sourcePath: z.string().trim().max(300).optional().default(""),
  website: z.string().max(200).optional().default(""), // honeypot
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => subscribeInput.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert(
      {
        email,
        name: data.name ?? "",
        language: data.language ?? "pt",
        source_path: data.sourcePath ?? "",
        status: "active",
      },
      { onConflict: "email" },
    );
    if (error) return { ok: false as const, error: "Não foi possível concluir a inscrição." };
    return { ok: true as const };
  });

export const unsubscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed" })
      .eq("unsubscribe_token", data.token)
      .select("email")
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: "Link inválido ou expirado." };
    return { ok: true as const, email: row.email };
  });

/* ------------------------------------------------------------------ */
/* Admin: inscritos                                                     */
/* ------------------------------------------------------------------ */

export const listSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("id, email, name, language, source_path, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        name: z.string().trim().max(120).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert(
      { email: data.email.toLowerCase(), name: data.name ?? "", status: "active" },
      { onConflict: "email" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const setSubscriberStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "unsubscribed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("newsletter_subscribers")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("newsletter_subscribers")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Admin: campanhas                                                     */
/* ------------------------------------------------------------------ */

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("newsletter_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      subject: string;
      preheader: string;
      body: string;
      status: string;
      sent_at: string | null;
      sent_count: number;
      failed_count: number;
      last_error: string | null;
      created_at: string;
    }>;
  });

const campaignInput = z.object({
  id: z.string().uuid().optional(),
  subject: z.string().trim().min(3).max(200),
  preheader: z.string().trim().max(200).optional().default(""),
  body: z.string().trim().min(10).max(20000),
});

export const saveCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => campaignInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      subject: data.subject,
      preheader: data.preheader ?? "",
      body: data.body,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("newsletter_campaigns")
        .update(payload)
        .eq("id", data.id);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const, id: data.id };
    }
    const { data: row, error } = await context.supabase
      .from("newsletter_campaigns")
      .insert({ ...payload, status: "draft" })
      .select("id")
      .single();
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, id: row.id as string };
  });

export const deleteCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("newsletter_campaigns")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Dispara a campanha automaticamente para todos os inscritos ativos. */
export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), testEmail: z.string().trim().email().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { dispatchCampaign } = await import("./newsletter.server");
    return dispatchCampaign(data.id, data.testEmail);
  });

/* ------------------------------------------------------------------ */
/* Admin: configurações                                                 */
/* ------------------------------------------------------------------ */

export const getNewsletterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { DEFAULT_NEWSLETTER_SETTINGS } = await import("./newsletter.server");
    const { data } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "newsletter")
      .maybeSingle();
    return {
      ...DEFAULT_NEWSLETTER_SETTINGS,
      ...((data?.value ?? {}) as Partial<typeof DEFAULT_NEWSLETTER_SETTINGS>),
    };
  });

export const saveNewsletterSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        fromName: z.string().trim().min(2).max(80),
        fromEmail: z.string().trim().email().max(255).or(z.literal("")),
        autoSendOnPublish: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "newsletter", value: data }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
