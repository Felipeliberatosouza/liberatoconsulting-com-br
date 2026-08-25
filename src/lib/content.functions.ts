import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isValidPhone } from "./validation";

import type { ArticleRecord } from "./site-config";
import { READ_COUNT_BASE } from "./site-config";

/** Artigo publicado, visível para qualquer visitante (já traduzido para o idioma pedido). */
export const getPublicArticle = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(160),
        lang: z.enum(["pt", "en", "es", "zh"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<ArticleRecord | null> => {
    const { publicClient } = await import("./admin.server");
    const { data: row } = await publicClient()
      .from("content_articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    const article = (row ?? null) as unknown as ArticleRecord | null;
    if (!article || !data.lang || data.lang === "pt") return article;
    const { ensureArticleTranslations } = await import("./article-i18n.server");
    return ensureArticleTranslations(article, data.lang);
  });


/** Contabiliza uma leitura do artigo (chamado uma vez por visitante). */
export const registerArticleRead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(160) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("content_articles")
      .select("id, read_count")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!row) return { ok: false as const, reads: 0 };
    const reads = Math.max(row.read_count ?? READ_COUNT_BASE, READ_COUNT_BASE) + 1;
    await supabaseAdmin.from("content_articles").update({ read_count: reads }).eq("id", row.id);
    return { ok: true as const, reads };
  });

/** Avaliação simples do conteúdo (1 a 5 estrelas). */
export const rateArticle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ slug: z.string().trim().min(1).max(160), rating: z.number().int().min(1).max(5) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("content_articles")
      .select("id, rating_sum, rating_count")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!row) return { ok: false as const, average: 0, count: 0 };
    const sum = (row.rating_sum ?? 0) + data.rating;
    const count = (row.rating_count ?? 0) + 1;
    await supabaseAdmin
      .from("content_articles")
      .update({ rating_sum: sum, rating_count: count })
      .eq("id", row.id);
    return { ok: true as const, average: sum / count, count };
  });

/** Link temporário para baixar o artigo completo no idioma do visitante. */
export const getArticleFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(160),
        lang: z.enum(["pt", "en", "es", "zh"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("content_articles")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (!row) return { ok: false as const, error: "Arquivo indisponível." };

    const { ensureTranslatedPdf } = await import("./article-i18n.server");
    const file = await ensureTranslatedPdf(
      row as unknown as import("./site-config").ArticleRecord,
      data.lang ?? "pt",
    );
    if (!file?.path) return { ok: false as const, error: "Arquivo indisponível." };

    const { data: signed, error } = await supabaseAdmin.storage
      .from("content")
      .createSignedUrl(file.path, 300, file.name ? { download: file.name } : undefined);
    if (error || !signed) return { ok: false as const, error: "Falha ao gerar link." };
    return { ok: true as const, url: signed.signedUrl };
  });


const submissionSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255),
  title: z.string().trim().min(3).max(300),
  summary: z.string().trim().max(2000),
  message: z.string().trim().max(4000),
  language: z.string().trim().max(8).optional(),
  phone: z.string().trim().refine(isValidPhone, "Use o formato +55 (11) 9999-9999."),
  cpf: z.string().trim().max(20).optional(),
  role_label: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(160).optional(),
  group_id: z.string().trim().max(60).optional(),
  service: z.string().trim().max(120).optional(),
  website: z.string().max(200).optional(), // honeypot
  file: z
    .object({
      name: z.string().trim().min(1).max(200),
      dataUrl: z.string().max(5_600_000),
    })
    .nullable()
    .optional(),
});


/** "Publique você também": envio de artigo por visitantes. */
export const submitArticle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => submissionSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website) return { ok: true as const }; // bot
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let file_path: string | null = null;
    let file_name: string | null = null;
    if (data.file?.dataUrl) {
      const match = /^data:([^;]+);base64,(.+)$/.exec(data.file.dataUrl);
      if (!match) return { ok: false as const, error: "Arquivo inválido." };
      const bytes = Buffer.from(match[2]!, "base64");
      if (bytes.byteLength > 4_000_000) return { ok: false as const, error: "Arquivo acima de 4 MB." };
      const safe = data.file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `submissions/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabaseAdmin.storage
        .from("content")
        .upload(path, bytes, { contentType: match[1]!, upsert: false });
      if (error) return { ok: false as const, error: "Falha ao enviar o arquivo." };
      file_path = path;
      file_name = data.file.name;
    }

    const { error } = await supabaseAdmin.from("article_submissions").insert({
      full_name: data.full_name,
      email: data.email,
      title: data.title,
      summary: data.summary,
      message: data.message,
      language: data.language ?? null,
      phone: data.phone ?? "",
      cpf: data.cpf ?? "",
      role_label: data.role_label ?? "",
      institution: data.institution ?? "",
      group_id: data.group_id ?? "",
      service: data.service ?? "",
      file_path,
      file_name,

    });
    if (error) return { ok: false as const, error: "Não foi possível registrar o envio." };
    return { ok: true as const };
  });

/**
 * Resolve endereços antigos de conteúdo (título completo) para o endereço
 * curto atual. Usado para redirecionar em vez de responder 404.
 */
export const resolveContentSlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(200) }).parse(d))
  .handler(async ({ data }): Promise<{ kind: "content" | "newsletter"; slug: string } | null> => {
    const { slugMatches } = await import("./slug-alias");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: articles } = await supabaseAdmin
      .from("content_articles")
      .select("slug, title")
      .eq("published", true);
    for (const a of (articles ?? []) as Array<{ slug: string; title: string }>) {
      if (a.slug && a.title && slugMatches(data.slug, a.title, a.slug)) {
        return { kind: "content", slug: a.slug };
      }
    }

    const { data: campaigns } = await supabaseAdmin
      .from("newsletter_campaigns")
      .select("slug, subject")
      .not("published_at", "is", null);
    for (const c of (campaigns ?? []) as Array<{ slug: string; subject: string }>) {
      if (c.slug && c.subject && slugMatches(data.slug, c.subject, c.slug)) {
        return { kind: "newsletter", slug: c.slug };
      }
    }
    return null;
  });
