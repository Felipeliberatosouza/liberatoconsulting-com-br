/**
 * Geração automática da edição da Newsletter quando o horário agendado chega
 * e não existe nenhuma campanha em rascunho no painel.
 *
 * A edição é montada com IA a partir dos conteúdos publicados desde o último
 * envio. Sem conteúdo novo, nada é criado (o disparo simplesmente é pulado).
 */

export type AutoResult =
  | { ok: true; campaignId: string }
  | { ok: false; skipped: string }
  | { ok: false; error: string; blocked?: boolean };

/**
 * Cria (em rascunho) a próxima edição da newsletter "Liberato Insights" em
 * formato de jornal: 1) último artigo, 2) última ferramenta (ou guia + outra
 * ferramenta), 3) radar econômico/político do Brasil com contato, e por fim
 * links para o Boletim Semanal e o destaque rotativo.
 */
export async function autoCreateCampaign(_since: string | null): Promise<AutoResult> {
  const ed = await import("./editorial.server");
  const { newsletterToolSection } = await import("./editorial-rules");
  const article = await ed.latestArticle();
  if (!article) {
    return { ok: false as const, skipped: "Nenhum artigo publicado." };
  }

  const origin = process.env["PUBLIC_SITE_URL"] || "https://liberatoconsulting.com.br";
  const [tools, rot] = await Promise.all([ed.publishedTools(), ed.getRotation()]);
  const section = newsletterToolSection(tools, rot.newsletterTool ?? null);
  const footer = await ed.rotatingFeature(origin);
  const { askJson, askJsonGrounded } = await import("./ai.server");

  type Out = {
    articleHeadline: string; articleSummary: string;
    toolHeadline: string; toolSummary: string;
    preheader: string;
  };
  type News = { headline: string; summary: string };
  const system =
    "Você é editor sênior da Liberato Consulting (consultoria de gestão brasileira). " +
    "Escreve para executivos. Português do Brasil, claro, sem exageros.";
  const [out, news] = await Promise.all([
    askJson<Out>(system, JSON.stringify({
      artigo: { titulo: article.title, resumo: article.summary },
      ferramenta: section.tool ? { titulo: section.tool.title, resumo: section.tool.summary } : null,
      guia_incluido: section.guide,
      formato: {
        articleHeadline: "frase chamativa sobre o artigo, até 90 caracteres",
        articleSummary: "resumo de 2 a 3 frases do artigo",
        toolHeadline: "título chamativo para a ferramenta (e o guia, se incluído), até 90 caracteres",
        toolSummary: "resumo de 2 frases do que o leitor ganha usando",
        preheader: "chamada de até 160 caracteres",
      },
    })).catch(() => null),
    askJsonGrounded<News>(system, JSON.stringify({
      tarefa:
        "Escolha UMA notícia econômica ou política do Brasil desta semana relevante para empresas. " +
        "Escreva um título chamativo ligando a notícia ao impacto nos negócios e um resumo de 3 a 4 frases " +
        "com alertas práticos de impacto, terminando com uma frase dizendo que a Liberato Consulting pode " +
        "ajudar a empresa a se preparar para esses impactos. Sem links.",
      formato: { headline: "até 100 caracteres", summary: "texto simples" },
    })).catch(() => null),
  ]);

  const toolUrl = section.tool ? `${origin}/ferramentas/${section.tool.slug}` : "";
  const toolBlock = section.tool || section.guide
    ? [
        section.guide ? "## Guia de Gestão e Ferramenta" : "## Nova ferramenta de gestão",
        `### ${out?.toolHeadline || section.tool?.title || "Guia de Gestão Liberato"}`,
        out?.toolSummary || section.tool?.summary || "",
        section.guide ? `Acesse o Guia de Gestão: ${origin}/guia-gestao` : "",
        section.tool ? `Acesse a ferramenta: ${toolUrl}` : "",
      ].filter(Boolean).join("\n\n")
    : "";
  const newsBlock = news?.headline
    ? [
        "## Radar Brasil",
        `### ${news.headline}`,
        news.summary,
        `Fale com a Liberato Consulting: ${origin}/contact`,
      ].join("\n\n")
    : "";
  const body = [
    "## Artigo em destaque",
    `### ${out?.articleHeadline || article.title}`,
    out?.articleSummary || article.summary,
    `Leia o artigo completo: ${origin}/content/${article.slug}`,
    toolBlock,
    newsBlock,
    "## Continue acompanhando",
    `Veja como os principais indicadores da economia se moveram nesta semana no Boletim Semanal: ${origin}/boletins`,
    `${footer.feature.kind === "tool" ? "Coloque os números da sua empresa à prova com" : "Organize a gestão da sua empresa com o"} ${footer.title}: ${footer.url}`,
  ].filter(Boolean).join("\n\n");

  const subject = `Liberato Insights: ${out?.articleHeadline || article.title}`;
  await ed.saveRotation({ newsletterTool: section.tool?.slug ?? null });

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
