import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Objetivos possíveis para a peça de propaganda. */
export const AD_GOALS = [
  { id: "leads", label: "Gerar leads" },
  { id: "brasil", label: "Receba dados do Brasil semanalmente" },
  { id: "conteudos", label: "Receba conteúdos sobre gestão" },
  { id: "servicos", label: "Conheça os serviços da Liberato Consulting" },
  { id: "insights", label: "Insights da Liberato Consulting" },
  { id: "seguidor", label: "Seja seguidor da Liberato Consulting" },
  { id: "trabalhe-conosco", label: "Trabalhe conosco na Liberato Consulting" },
] as const;

export type AdGoalId = (typeof AD_GOALS)[number]["id"];

const input = z.object({
  service: z.string().trim().min(2).max(120),
  topic: z.string().trim().max(200).default(""),
  goal: z.string().trim().min(2).max(120),
});

/** Gera as quatro frases curtas (PT, EN, ZH, ES) que vão sobre a imagem. */
export const generateAdCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");

    type Out = { pt: string; en: string; zh: string; es: string };
    try {
      const out = await askJson<Out>(
        "Você é redator publicitário da Liberato Consulting, consultoria brasileira de gestão. " +
          "Tom executivo, direto, sem exageros nem emojis.",
        JSON.stringify({
          servico: data.service,
          tema: data.topic,
          objetivo: data.goal,
          instrucao:
            "Crie UMA frase curta de propaganda (máximo 60 caracteres) alinhada ao objetivo, " +
            "e devolva a MESMA mensagem nos quatro idiomas.",
          formato: {
            pt: "frase em português do Brasil",
            en: "mesma frase em inglês",
            zh: "mesma frase em chinês simplificado",
            es: "mesma frase em espanhol",
          },
        }),
      );
      const cut = (v: unknown) => String(v ?? "").trim().slice(0, 90);
      return {
        ok: true as const,
        pt: cut(out.pt),
        en: cut(out.en),
        zh: cut(out.zh),
        es: cut(out.es),
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Imagem de fundo (sem texto) para a peça de propaganda. */
export const generateAdBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askImage } = await import("./ai.server");
    try {
      const url = await askImage(
        `Imagem de fundo para peça publicitária de consultoria de gestão sobre "${data.service}"` +
          `${data.topic ? `, tema "${data.topic}"` : ""}, objetivo: ${data.goal}. ` +
          `Fotografia editorial corporativa sóbria ou composição abstrata de dados, paleta ` +
          `azul-petróleo e laranja queimado, luz uniforme, amplo espaço livre no centro e à ` +
          `esquerda para receber texto, sem nenhuma letra, número, logotipo ou marca d'água.`,
      );
      if (!url) return { ok: false as const, error: "A IA não retornou imagem." };
      return { ok: true as const, imageUrl: url };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

const articleInput = z.object({
  title: z.string().trim().min(2).max(300),
  summary: z.string().trim().max(1000).default(""),
});

/** Traduz o nome do artigo para os quatro idiomas da peça "conteúdo novo". */
export const generateArticlePostCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => articleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");

    type Out = { pt: string; en: string; zh: string; es: string };
    try {
      const out = await askJson<Out>(
        "Você traduz títulos de artigos de uma consultoria brasileira de gestão. " +
          "Mantenha o sentido, tom executivo, sem emojis e sem aspas.",
        JSON.stringify({
          titulo: data.title,
          resumo: data.summary,
          instrucao:
            "Devolva o título do artigo (máximo 90 caracteres) nos quatro idiomas. " +
            "Em português, apenas ajuste a pontuação se necessário.",
          formato: {
            pt: "título em português do Brasil",
            en: "título em inglês",
            zh: "título em chinês simplificado",
            es: "título em espanhol",
          },
        }),
      );
      const cut = (v: unknown) => String(v ?? "").trim().slice(0, 120);
      return {
        ok: true as const,
        pt: cut(out.pt) || data.title,
        en: cut(out.en),
        zh: cut(out.zh),
        es: cut(out.es),
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

