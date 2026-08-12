import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type NewsletterHistoryItem = {
  id: string;
  subject: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  sentCount: number;
  failedCount: number;
};

export type BulletinHistoryItem = {
  id: string;
  subject: string;
  dateLabel: string;
  createdAt: string;
  sentEmail: number;
  sentWhatsApp: number;
  failed: number;
  isTest: boolean;
};

export type ContentHistoryItem = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  published: boolean;
  createdAt: string;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Histórico de publicações: newsletters, boletins e conteúdos. */
export const getPublicationHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [campaigns, bulletins, articles] = await Promise.all([
      supabaseAdmin
        .from("newsletter_campaigns")
        .select("id, subject, status, sent_at, created_at, sent_count, failed_count")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("bulletin_dispatches")
        .select("id, subject, date_label, created_at, sent_email, sent_whatsapp, failed, is_test")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("content_articles")
        .select("id, slug, title, kind, published, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    return {
      newsletters: (campaigns.data ?? []).map((c) => ({
        id: c.id,
        subject: c.subject,
        status: c.status,
        sentAt: c.sent_at,
        createdAt: c.created_at,
        sentCount: c.sent_count ?? 0,
        failedCount: c.failed_count ?? 0,
      })) as NewsletterHistoryItem[],
      bulletins: (bulletins.data ?? []).map((b) => ({
        id: b.id,
        subject: b.subject,
        dateLabel: b.date_label,
        createdAt: b.created_at,
        sentEmail: b.sent_email ?? 0,
        sentWhatsApp: b.sent_whatsapp ?? 0,
        failed: b.failed ?? 0,
        isTest: b.is_test,
      })) as BulletinHistoryItem[],
      contents: (articles.data ?? []).map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        kind: a.kind,
        published: a.published,
        createdAt: a.created_at,
      })) as ContentHistoryItem[],
    };
  });

/** Conteúdo enviado em uma newsletter ou boletim, para abrir no painel. */
export const getPublicationBody = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ kind: z.enum(["newsletter", "bulletin"]), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.kind === "bulletin") {
      const { data: row } = await supabaseAdmin
        .from("bulletin_dispatches")
        .select("subject, body_html")
        .eq("id", data.id)
        .maybeSingle();
      if (!row) return { ok: false as const, error: "Registro não encontrado." };
      return { ok: true as const, title: row.subject, html: row.body_html, text: "" };
    }

    const { data: row } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("subject, preheader, body, full_text")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Registro não encontrado." };
    return {
      ok: true as const,
      title: row.subject,
      html: "",
      text: [row.preheader, row.body, row.full_text].filter(Boolean).join("\n\n"),
    };
  });
