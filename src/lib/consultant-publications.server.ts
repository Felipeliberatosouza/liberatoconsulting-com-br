/**
 * Vincula automaticamente os artigos publicados no site a cada consultor,
 * comparando o nome do consultor com a assinatura ("autores") do artigo.
 */
import type { Lang } from "@/i18n/config";
import type { ConsultantPublication, PublicConsultant } from "./consultants.functions";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type ArticleRow = {
  slug: string;
  title: string;
  authors: string | null;
  article_date: string | null;
  created_at: string;
  translations: Record<string, { title?: string }> | null;
};

export async function attachConsultantPublications(
  consultants: PublicConsultant[],
  lang: Lang,
): Promise<PublicConsultant[]> {
  if (consultants.length === 0) return consultants;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("content_articles")
    .select("slug, title, authors, article_date, created_at, translations")
    .eq("published", true)
    .order("article_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !data) return consultants;

  const articles = data as unknown as ArticleRow[];

  return consultants.map((c) => {
    const name = normalize(c.full_name);
    if (!name) return c;
    const publications: ConsultantPublication[] = articles
      .filter((a) => normalize(a.authors ?? "").includes(name))
      .map((a) => ({
        slug: a.slug,
        title:
          (lang !== "pt" ? a.translations?.[lang]?.title : undefined)?.trim() || a.title,
        date: a.article_date ?? a.created_at.slice(0, 10),
      }));
    return { ...c, publications };
  });
}
