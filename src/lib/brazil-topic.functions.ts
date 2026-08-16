import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type BrazilTopicContent = {
  section_id: string;
  topic_index: number;
  topic_label: string;
  title: string;
  body: string;
  bullets: string[];
  sources: string[];
  updated_at: string | null;
};

const inputSchema = z.object({
  sectionId: z.string().trim().min(1).max(80),
  sectionTitle: z.string().trim().max(200).default(""),
  topicIndex: z.number().int().min(0).max(39),
  topicLabel: z.string().trim().min(2).max(400),
  lang: z.enum(["pt", "en", "es", "zh"]).default("pt"),
  refresh: z.boolean().default(false),
});

const SELECT = "section_id, topic_index, topic_label, title, body, bullets, sources, updated_at";

const LANG_NAME = {
  pt: "português do Brasil",
  en: "inglês",
  es: "espanhol",
  zh: "mandarim",
} as const;

/**
 * Conteúdo explicativo de um item de "Dados e destaques". Usa o cache do banco;
 * quando não existe (ou quando é pedida atualização), gera com IA a partir de
 * fontes oficiais brasileiras (.gov.br) e acadêmicas, e salva.
 */
export const getBrazilTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<BrazilTopicContent | null> => {
    const { sectionId, sectionTitle, topicIndex, topicLabel, lang, refresh } = data;
    const { publicClient } = await import("./admin.server");

    if (!refresh) {
      const { data: rows } = await publicClient()
        .from("brazil_topic_content")
        .select(SELECT)
        .eq("section_id", sectionId)
        .eq("topic_index", topicIndex)
        .eq("lang", lang)
        .limit(1);
      const row = (rows ?? [])[0] as
        | {
            section_id: string;
            topic_index: number;
            topic_label: string;
            title: string;
            body: string;
            bullets: unknown;
            sources: unknown;
            updated_at: string;
          }
        | undefined;
      if (row && row.body) {
        return {
          section_id: row.section_id,
          topic_index: row.topic_index,
          topic_label: row.topic_label,
          title: row.title,
          body: row.body,
          bullets: Array.isArray(row.bullets) ? (row.bullets as string[]) : [],
          sources: Array.isArray(row.sources) ? (row.sources as string[]) : [],
          updated_at: row.updated_at,
        };
      }
    }

    try {
      const { askJson } = await import("./ai.server");
      type Out = { title: string; body: string; bullets: string[]; sources: string[] };
      const out = await askJson<Out>(
        "Você é pesquisador sênior em economia brasileira e escreve para investidores " +
          "internacionais, em padrão acadêmico. Toda afirmação relevante deve vir acompanhada " +
          "da fonte e do ano dentro do próprio texto, no formato (Instituição, ano). " +
          "Use preferencialmente fontes oficiais brasileiras (IBGE, Banco Central do Brasil, " +
          "IPEA, Ministério da Fazenda, MDIC/Comex Stat, ANP, ANEEL, EPE, Receita Federal, " +
          "CONAB, EMBRAPA e demais sites .gov.br) e instituições acadêmicas brasileiras " +
          "(USP, FGV, Unicamp, UFRJ). Não invente dados nem links: se não tiver certeza do " +
          "número, descreva a ordem de grandeza e a fonte onde ele é publicado. " +
          `Escreva em ${LANG_NAME[lang]}, tom institucional, sem exageros de marketing.`,
        JSON.stringify({
          tema: sectionTitle || sectionId,
          item: topicLabel,
          instrucao:
            "Escreva uma seção explicativa e aprofundada exclusivamente sobre este item, " +
            "com dados atualizados, contexto regulatório e implicações práticas para " +
            "empresas estrangeiras que avaliam o Brasil.",
          formato: {
            title: "título curto do item",
            body: "4 a 6 parágrafos separados por linha em branco, até 3500 caracteres, com fontes citadas no texto",
            bullets: ["5 a 8 dados-chave curtos, cada um com fonte e ano"],
            sources: [
              "referências completas: Instituição (ano). Título. URL (prefira domínios .gov.br ou acadêmicos)",
            ],
          },
        }),
      );

      const result: BrazilTopicContent = {
        section_id: sectionId,
        topic_index: topicIndex,
        topic_label: topicLabel,
        title: (out.title ?? topicLabel).slice(0, 200),
        body: (out.body ?? "").slice(0, 8000),
        bullets: (out.bullets ?? []).slice(0, 12),
        sources: (out.sources ?? []).slice(0, 10),
        updated_at: new Date().toISOString(),
      };
      if (!result.body) return null;

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("brazil_topic_content").upsert(
        {
          section_id: sectionId,
          topic_index: topicIndex,
          lang,
          topic_label: topicLabel.slice(0, 400),
          title: result.title,
          body: result.body,
          bullets: result.bullets,
          sources: result.sources,
          updated_at: result.updated_at,
        },
        { onConflict: "section_id,topic_index,lang" },
      );

      return result;
    } catch {
      return null;
    }
  });
