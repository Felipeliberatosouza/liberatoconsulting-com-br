import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Leitura pública de uma newsletter já publicada, pelo endereço amigável (slug). */
export const getPublishedNewsletter = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(160) }).parse(d))
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
