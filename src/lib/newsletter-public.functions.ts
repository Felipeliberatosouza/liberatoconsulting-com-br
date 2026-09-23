import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { LANGS, type Lang } from "@/i18n/config";

/** Leitura pública de uma newsletter já publicada, pelo endereço amigável (slug). */
export const getPublishedNewsletter = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(160),
        lang: z.enum(LANGS as unknown as [Lang, ...Lang[]]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cols =
      "subject, preheader, body, full_text, sources, authors, image_url, reference_date, published_at, slug";
    const { data: exact } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select(cols)
      .eq("slug", data.slug)
      .not("published_at", "is", null)
      .maybeSingle();
    // Compatibilidade: links antigos podem apontar para o endereço sem o sufixo numérico.
    let row = exact;
    if (!row) {
      const { data: similar } = await supabaseAdmin
        .from("newsletter_campaigns")
        .select(cols)
        .like("slug", `${data.slug}%`)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(1);
      row = similar?.[0] ?? null;
    }
    if (!row) return null;
    const base = {
      subject: row.subject as string,
      preheader: (row.preheader ?? "") as string,
      fullText: ((row.full_text || row.body) ?? "") as string,
      sources: (row.sources ?? "") as string,
    };
    const lang = (data.lang ?? "pt") as Lang;
    const translated =
      lang === "pt"
        ? base
        : await (async () => {
            const { translateNewsletter } = await import("./newsletter-translate.server");
            return translateNewsletter(row!.slug as string, lang, base);
          })();
    return {
      ...translated,
      body: (row.body ?? "") as string,
      authors: (row.authors ?? "") as string,
      hasImage: Boolean(row.image_url),
      referenceDate: (row.reference_date ?? null) as string | null,
      slug: row.slug as string,
      lang,
    };

  });

/** Arquivo público das newsletters publicadas nos últimos três meses. */
export const listRecentNewsletters = createServerFn({ method: "GET" }).handler(async () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 3);
  const { publicClient } = await import("./admin.server");
  const { data, error } = await publicClient()
    .from("newsletter_campaigns")
    .select("id, slug, subject, preheader, reference_date, published_at, sent_at, created_at")
    .or("published_at.not.is.null,status.eq.sent")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Histórico público, sem dados de destinatários, dos boletins dos últimos três meses. */
export const listRecentBulletins = createServerFn({ method: "GET" }).handler(async () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 3);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("bulletin_dispatches")
    .select("id, subject, date_label, created_at")
    .in("status", ["sent", "enviado"])
    .eq("is_test", false)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});
