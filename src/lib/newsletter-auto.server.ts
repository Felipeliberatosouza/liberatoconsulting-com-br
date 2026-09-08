/**
 * Geração automática da edição da Newsletter quando o horário agendado chega
 * e não existe nenhuma campanha em rascunho no painel.
 *
 * A edição é montada com IA a partir dos conteúdos publicados desde o último
 * envio. Sem conteúdo novo, nada é criado (o disparo simplesmente é pulado).
 */

type Article = {
  title: string;
  summary: string;
  slug: string;
  authors: string;
  article_date: string | null;
  updated_at: string;
};

export type AutoResult =
  | { ok: true; campaignId: string }
  | { ok: false; skipped: string }
  | { ok: false; error: string; blocked?: boolean };

/** Conteúdos publicados depois da data informada (ou os mais recentes). */
async function recentArticles(since: string | null): Promise<Article[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let query = supabaseAdmin
    .from("content_articles")
    .select("title, summary, slug, authors, article_date, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false })
    .limit(6);
  if (since) query = query.gt("updated_at", since);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Article[];
}

/**
 * Cria (em rascunho) a próxima edição da newsletter a partir dos conteúdos
 * publicados desde `since`. Retorna o id da campanha criada.
 */
export async function autoCreateCampaign(since: string | null): Promise<AutoResult> {
  const articles = await recentArticles(since);
  if (articles.length === 0) {
    return { ok: false as const, skipped: "Nenhum conteúdo novo publicado desde o último envio." };
  }

  const origin = process.env["PUBLIC_SITE_URL"] || "https://liberatoconsulting.com.br";
  const { askJson } = await import("./ai.server");

  type Out = { subject: string; preheader: string; body: string };
  let out: Out | null = null;
  try {
    out = await askJson<Out>(
      "Você é editor sênior de uma consultoria de gestão brasileira (Liberato Consulting), " +
        "escrevendo para executivos e investidores internacionais interessados no Brasil. " +
        "Padrão acadêmico-executivo: dados com fonte e ano, linguagem clara, sem exageros. " +
        "Português do Brasil.",
      JSON.stringify({
        tarefa:
          "Monte a edição da newsletter periódica reunindo os conteúdos publicados abaixo. " +
          "Cite cada conteúdo com seu link completo.",
        conteudos: articles.map((a) => ({
          titulo: a.title,
          resumo: a.summary,
          autores: a.authors,
          link: `${origin}/content/${a.slug}`,
        })),
        formato: {
          subject: "assunto do e-mail, até 90 caracteres",
          preheader: "chamada curta de até 160 caracteres",
          body:
            "texto da newsletter em parágrafos curtos, no máximo 400 palavras, " +
            "apresentando cada conteúdo com uma linha de contexto e o link completo. " +
            "Apenas texto simples, sem markdown e sem HTML.",
        },
      }),
    );
  } catch {
    // Sem IA disponível (créditos/limite), a edição é montada com os próprios
    // conteúdos publicados — o envio nunca fica em silêncio por causa disso.
    out = null;
  }

  const fallbackBody = [
    "Confira os conteúdos publicados recentemente pela Liberato Consulting:",
    ...articles.map((a) => `${a.title}\n${a.summary}\n${origin}/content/${a.slug}`),
  ].join("\n\n");

  const subject = (out?.subject ?? "").trim() || `Newsletter Liberato Consulting`;
  const body = (out?.body ?? "").trim() || fallbackBody;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: created, error } = await supabaseAdmin
    .from("newsletter_campaigns")
    .insert({
      subject: subject.slice(0, 200),
      preheader: (out?.preheader ?? "").slice(0, 400),
      body,
      status: "draft",
      reference_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !created) {
    return { ok: false as const, error: error?.message ?? "Não foi possível criar a campanha." };
  }
  return { ok: true as const, campaignId: created.id as string };
}

/** Grava o resultado do último disparo automático para exibição no painel. */
export async function recordNewsletterRun(result: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", "newsletter_schedule")
    .maybeSingle();
  const current = (row?.value ?? {}) as Record<string, unknown>;
  await supabaseAdmin.from("site_settings").upsert(
    {
      key: "newsletter_schedule",
      value: { ...current, lastRun: { at: new Date().toISOString(), result } },
    },
    { onConflict: "key" },
  );
}
