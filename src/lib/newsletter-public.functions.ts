import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Leitura pública de uma newsletter já publicada, pelo endereço amigável (slug). */
export const getPublishedNewsletter = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("subject, preheader, body, full_text, sources, authors, image_url, reference_date, published_at, slug")
      .eq("slug", data.slug)
      .not("published_at", "is", null)
      .maybeSingle();
    if (!row) return null;
    return {
      subject: row.subject as string,
      preheader: (row.preheader ?? "") as string,
      body: (row.body ?? "") as string,
      fullText: (row.full_text ?? "") as string,
      sources: (row.sources ?? "") as string,
      authors: (row.authors ?? "") as string,
      hasImage: Boolean(row.image_url),
      referenceDate: (row.reference_date ?? null) as string | null,
      slug: row.slug as string,
    };
  });
