import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Indicator = {
  id: string;
  slug: string;
  label: string;
  value: string;
  unit: string;
  reference_period: string;
  previous_value: string;
  previous_period: string;
  trend: string;
  note: string;
  source_name: string;
  source_url: string;
  position: number;
  published: boolean;
  segment: string;
  region: string;
  uf: string;
  last_checked_at: string | null;
  updated_at: string;
};

const SELECT =
  "id, slug, label, value, unit, reference_period, previous_value, previous_period, trend, note, source_name, source_url, position, published, segment, region, uf, last_checked_at, updated_at";

/** Indicadores econômicos publicados (leitura pública do site). */
export const listPublicIndicators = createServerFn({ method: "GET" }).handler(
  async (): Promise<Indicator[]> => {
    const { publicClient } = await import("./admin.server");
    const { data } = await publicClient()
      .from("economic_indicators")
      .select(SELECT)
      .eq("published", true)
      .order("position", { ascending: true });
    return (data ?? []) as Indicator[];
  },
);

export const listIndicators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Indicator[]> => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { data, error } = await context.supabase
      .from("economic_indicators")
      .select(SELECT)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Indicator[];
  });

const indicatorSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(2).max(160),
  value: z.string().trim().max(60).default(""),
  unit: z.string().trim().max(40).default(""),
  reference_period: z.string().trim().max(60).default(""),
  previous_value: z.string().trim().max(60).default(""),
  previous_period: z.string().trim().max(60).default(""),
  trend: z.string().trim().max(40).default(""),
  note: z.string().trim().max(600).default(""),
  source_name: z.string().trim().max(160).default(""),
  source_url: z.string().trim().max(500).default(""),
  position: z.number().int().min(0).max(999).default(0),
  published: z.boolean().default(true),
  segment: z.string().trim().max(80).default("geral"),
  region: z.string().trim().max(40).default("todas"),
  uf: z.string().trim().max(10).default("todos"),
});

export const saveIndicator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => indicatorSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAnyRole, isAdmin, queueChangeRequest } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { id, ...row } = data;
    if (!(await isAdmin(context))) {
      return queueChangeRequest(context, {
        kind: "indicator",
        action: id ? "update" : "create",
        targetId: id ?? null,
        title: `Indicador: ${data.label}`,
        summary: `${data.value} ${data.unit} (${data.reference_period})`,
        payload: row,
      });
    }
    const { error } = id
      ? await context.supabase.from("economic_indicators").update(row).eq("id", id)
      : await context.supabase.from("economic_indicators").insert(row);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteIndicator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("economic_indicators")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/**
 * Usa IA para buscar os valores mais recentes dos indicadores nas fontes
 * oficiais (IBGE, Banco Central, MDIC, Ipeadata) e atualizar a tabela.
 */
export const refreshIndicatorsAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");

    const { data: rows } = await context.supabase
      .from("economic_indicators")
      .select("id, slug, label, unit, value, reference_period");
    const list = (rows ?? []) as Array<{
      id: string;
      slug: string;
      label: string;
      unit: string;
      value: string;
      reference_period: string;
    }>;
    if (list.length === 0) return { ok: false as const, error: "Nenhum indicador cadastrado." };

    type Out = {
      indicators: Array<{
        slug: string;
        value: string;
        unit?: string;
        reference_period: string;
        previous_value?: string;
        previous_period?: string;
        trend?: string;
        note?: string;
        source_name: string;
        source_url: string;
      }>;
    };

    try {
      const out = await askJson<Out>(
        "Você é um economista sênior brasileiro. Informe os dados macroeconômicos mais " +
          "recentes que você conhece do Brasil, sempre citando a fonte oficial (IBGE, Banco " +
          "Central do Brasil, MDIC/Comex Stat, Ipeadata) e o período de referência exato. " +
          "Para CADA indicador é obrigatório informar também a leitura imediatamente anterior " +
          "da mesma série oficial (previous_value) e o período dessa leitura (previous_period). " +
          "Nunca deixe previous_value ou previous_period em branco: se a leitura anterior for " +
          "a do período anterior da série (mês, trimestre ou ano), informe-a mesmo assim. " +
          "Use vírgula como separador decimal. Não invente fontes.",
        JSON.stringify({
          formato: {
            indicators: [
              {
                slug: "string",
                value: "string",
                unit: "string",
                reference_period: "string",
                previous_value: "string (obrigatório)",
                previous_period: "string (obrigatório)",
                trend: "alta|baixa|estável",
                note: "1 frase de contexto",
                source_name: "string",
                source_url: "string",
              },
            ],
          },
          indicadores: list.map((i) => ({ slug: i.slug, label: i.label, unit: i.unit })),
        }),
      );

      const now = new Date().toISOString();
      let updated = 0;
      for (const item of out.indicators ?? []) {
        const target = list.find((i) => i.slug === item.slug);
        if (!target) continue;
        // Preferência: leitura anterior informada pela fonte; senão, arquiva o valor atual.
        const previous =
          item.previous_value && item.previous_value.trim()
            ? { previous_value: item.previous_value, previous_period: item.previous_period ?? "" }
            : item.value && item.value !== target.value && target.value
              ? { previous_value: target.value, previous_period: target.reference_period ?? "" }
              : {};
        const { error } = await context.supabase
          .from("economic_indicators")
          .update({
            ...previous,
            value: item.value ?? "",
            unit: item.unit ?? target.unit,
            reference_period: item.reference_period ?? "",
            trend: item.trend ?? "",
            note: item.note ?? "",
            source_name: item.source_name ?? "",
            source_url: item.source_url ?? "",
            updated_by_ai: true,
            last_checked_at: now,
          })
          .eq("id", target.id);
        if (!error) updated += 1;
      }
      return { ok: true as const, updated };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/**
 * Preenche com IA apenas o "valor anterior" e o "período anterior" dos indicadores
 * que estão em branco, buscando a leitura imediatamente anterior da série oficial.
 */
export const fillPreviousIndicatorsAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    try {
      const { fillMissingPreviousIndicators } = await import("./indicators.server");
      return await fillMissingPreviousIndicators();
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });



/**
 * Gera com IA um texto acadêmico atualizado para um subitem de "Dados do Brasil",
 * com fontes de pesquisa e data de atualização.
 */
export const generateBrazilSectionAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().trim().min(1).max(80),
        topic: z.string().trim().min(2).max(200),
        hint: z.string().trim().max(1000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { askJson } = await import("./ai.server");

    type Out = { title: string; body: string; bullets: string[]; sources: string[] };
    try {
      const out = await askJson<Out>(
        "Você é pesquisador sênior em economia brasileira e escreve para investidores " +
          "internacionais. Padrão acadêmico: afirmações apoiadas em dados, com fonte e ano. " +
          "Português do Brasil, tom institucional, sem exageros de marketing.",
        JSON.stringify({
          tema: data.topic,
          instrucoes: data.hint,
          formato: {
            title: "título curto",
            body: "3 a 5 parágrafos, até 2500 caracteres",
            bullets: ["4 a 6 dados-chave curtos, cada um com fonte e ano"],
            sources: ["referências no padrão: Instituição (ano). Título. URL"],
          },
        }),
      );
      const sources = (out.sources ?? []).slice(0, 8);
      return {
        ok: true as const,
        title: out.title ?? "",
        body: out.body ?? "",
        bullets: (out.bullets ?? []).slice(0, 10),
        sources,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });
