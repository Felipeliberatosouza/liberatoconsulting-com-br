import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ArticleAnalysis = {
  title: string;
  summary: string;
  body: string;
  group_id: string;
  service: string;
  kind: string;
  table_data: string;
  chart_data: string;
};

/**
 * Lê o arquivo do artigo completo (PDF) e devolve os campos da tela Conteúdo
 * já preenchidos: título, resumo, texto, categoria, serviço, tabela e gráfico.
 */
export const analyzeArticleFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(200),
        dataUrl: z.string().max(14_000_000),
        groups: z.array(z.object({ id: z.string(), title: z.string() })).max(20),
        services: z.array(z.object({ id: z.string(), label: z.string() })).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    if (!/^data:application\/pdf;base64,/.test(data.dataUrl)) {
      return {
        ok: false as const,
        error: "A leitura automática funciona com arquivos PDF. Preencha os campos manualmente.",
      };
    }
    const { askJsonWithFile } = await import("./ai.server");
    try {
      const out = await askJsonWithFile<ArticleAnalysis>(
        "Você é editor sênior da Liberato Consulting, consultoria brasileira de gestão empresarial. " +
          "Escreve em português do Brasil, com padrão acadêmico-executivo, sem exageros.",
        JSON.stringify({
          tarefa:
            "Leia o artigo em anexo e devolva os campos para publicação no site da consultoria.",
          categorias_disponiveis: data.groups,
          servicos_disponiveis: data.services,
          formato: {
            title: "título do artigo, exatamente como no documento",
            summary: "resumo de até 3 frases (até 600 caracteres)",
            body: "resumo do artigo com NO MÁXIMO 450 palavras, em parágrafos curtos separados por linha em branco",
            group_id: "o id de uma das categorias disponíveis",
            service: "o id de um dos serviços disponíveis, ou string vazia",
            kind: "Artigo",
            table_data:
              "se houver uma tabela relevante, reproduza-a em markdown (| col | col | e |---|---|); senão string vazia",
            chart_data:
              "se houver dados comparáveis, devolva 'titulo: ...' na primeira linha e uma linha por série no formato 'Rótulo | número'; senão string vazia",
          },
        }),
        { name: data.name, dataUrl: data.dataUrl },
      );
      const groupIds = data.groups.map((g) => g.id);
      const serviceIds = data.services.map((s) => s.id);
      return {
        ok: true as const,
        title: (out.title ?? "").slice(0, 300),
        summary: (out.summary ?? "").slice(0, 2000),
        body: (out.body ?? "").slice(0, 20000),
        group_id: groupIds.includes(out.group_id ?? "") ? out.group_id : (groupIds[0] ?? ""),
        service: serviceIds.includes(out.service ?? "") ? out.service : "",
        kind: "Artigo",
        table_data: (out.table_data ?? "").slice(0, 8000),
        chart_data: (out.chart_data ?? "").slice(0, 4000),
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Gera a imagem de capa do conteúdo a partir do tema do artigo. */
export const generateArticleCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(5).max(300),
        summary: z.string().trim().max(1000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { askImage } = await import("./ai.server");
    try {
      const url = await askImage(
        `Imagem de capa editorial para um artigo de consultoria de gestão empresarial. ` +
          `Tema: "${data.title}". ${data.summary}. Estilo corporativo sóbrio, composição abstrata ` +
          `de dados e planejamento, paleta azul-petróleo e laranja queimado, formato panorâmico, ` +
          `sem nenhum texto na imagem.`,
      );
      if (!url) return { ok: false as const, error: "A IA não retornou imagem." };
      return { ok: true as const, imageUrl: url };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });
