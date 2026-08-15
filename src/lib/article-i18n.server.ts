/**
 * Tradução automática de conteúdos publicados (texto e PDF).
 * O português é a fonte; EN/ES/ZH são gerados sob demanda e guardados no banco,
 * de forma que cada visitante vê o artigo — e baixa o arquivo — no seu idioma.
 */
import type { Lang } from "@/i18n/config";
import type { ArticleRecord } from "./site-config";

type TargetLang = Exclude<Lang, "pt">;
const TARGETS: TargetLang[] = ["en", "es", "zh"];

const FIELDS = ["kind", "title", "summary", "body", "table_data", "chart_data"] as const;

/** Garante que o artigo tenha a tradução do idioma pedido, gerando e salvando se faltar. */
export async function ensureArticleTranslations(
  article: ArticleRecord,
  lang: Lang,
): Promise<ArticleRecord> {
  if (lang === "pt") return article;
  const current = (article.translations ?? {}) as Record<string, Record<string, string>>;
  const missing = TARGETS.filter((l) => !current[l]?.["title"]);
  if (!missing.includes(lang as TargetLang)) return article;

  const source: Record<string, string> = {};
  for (const f of FIELDS) {
    const value = (article as unknown as Record<string, string | null>)[f];
    if (value && String(value).trim()) source[f] = String(value);
  }
  if (!source["title"]) return article;

  try {
    const { translateRecord } = await import("./admin.server");
    const t = await translateRecord(source);
    const merged = { ...current };
    for (const l of TARGETS) if (t[l] && Object.keys(t[l]).length) merged[l] = t[l];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("content_articles")
      .update({ translations: merged })
      .eq("id", article.id);
    return { ...article, translations: merged } as ArticleRecord;
  } catch (err) {
    console.error("[content i18n] falha ao traduzir artigo", err);
    return article;
  }
}

function camel(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .slice(0, max);
}

/**
 * Devolve o caminho do PDF no idioma pedido, gerando-o na primeira vez.
 * Idiomas com alfabeto latino (EN/ES) ganham um PDF institucional traduzido;
 * demais idiomas continuam recebendo o arquivo original enviado pelo autor.
 */
export async function ensureTranslatedPdf(
  article: ArticleRecord,
  lang: Lang,
): Promise<{ path: string; name: string } | null> {
  const original = article.file_path
    ? { path: article.file_path, name: article.file_name || "artigo.pdf" }
    : null;
  if (lang === "pt" || lang === "zh") return original;

  const stored = ((article as unknown as Record<string, unknown>)["translated_files"] ?? {}) as
    Record<string, { path: string; name: string }>;
  if (stored[lang]?.path) return stored[lang]!;

  const withTr = await ensureArticleTranslations(article, lang);
  const tr = (withTr.translations?.[lang] ?? {}) as Record<string, string>;
  if (!tr["title"]) return original;

  try {
    const { buildBrandedPdf } = await import("./pdf.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { formatCompanyAddress } = await import("./company-footer.server");
    const { siteOrigin } = await import("./bulletin.server");

    const [{ data: branding }, { data: company }] = await Promise.all([
      supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
      supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
    ]);
    const c = (company ?? {}) as Record<string, string>;
    const logoUrl =
      ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl ||
      c["logo_url"] ||
      `${siteOrigin()}/logo.png`;
    const companyName = c["trade_name"] || c["legal_name"] || "Liberato Consulting";

    const bodyParts = [tr["body"] ?? "", tr["table_data"] ?? ""].filter(Boolean);
    const bytes = await buildBrandedPdf({
      title: tr["title"]!,
      subtitle: tr["summary"] ?? "",
      authors: article.authors ?? "",
      authorContact: article.author_contact ?? "",
      referenceDate: article.article_date ?? "",
      body: bodyParts.join("\n\n"),
      logoDataUrl: logoUrl,
      coverImageUrl: article.cover_url || null,
      contact: {
        name: companyName,
        line1:
          [c["phone"], c["email"]].filter(Boolean).join("  |  ") ||
          "contato@liberatoconsulting.com.br",
        line2:
          [formatCompanyAddress(c), c["cnpj"] ? `CNPJ ${c["cnpj"]}` : ""]
            .filter(Boolean)
            .join("  |  ") || "Consultoria em gestão empresarial",
        website: c["website"] || "www.liberatoconsulting.com.br",
      },
    });

    const name = `${camel(tr["title"]!, 60) || "Article"}_${lang.toUpperCase()}_${camel(companyName, 40)}.pdf`;
    const path = `articles/${article.slug}-${lang}.pdf`;
    const { error } = await supabaseAdmin.storage
      .from("content")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (error) return original;

    await supabaseAdmin
      .from("content_articles")
      .update({ translated_files: { ...stored, [lang]: { path, name } } })
      .eq("id", article.id);
    return { path, name };
  } catch (err) {
    console.error("[content i18n] falha ao gerar PDF traduzido", err);
    return original;
  }
}
