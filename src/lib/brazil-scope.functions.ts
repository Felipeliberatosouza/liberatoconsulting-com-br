import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type ScopedSection = {
  section_id: string;
  title: string;
  body: string;
  bullets: string[];
  sources: string[];
};

const inputSchema = z.object({
  segment: z.string().trim().max(80).default("geral"),
  region: z.string().trim().max(40).default("todas"),
  uf: z.string().trim().max(10).default("todos"),
  lang: z.enum(["pt", "en", "es", "zh"]).default("pt"),
  sections: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(80),
        title: z.string().trim().min(1).max(200),
      }),
    )
    .min(1)
    .max(12),
});

const SELECT = "section_id, title, body, bullets, sources";

/**
 * Conteúdo de "Dados do Brasil" adaptado ao recorte escolhido (segmento,
 * região e UF). Usa cache no banco; o que faltar é gerado com IA e salvo.
 */
export const getScopedBrazilSections = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ScopedSection[]> => {
    const { segment, region, uf, lang, sections } = data;
    if (segment === "geral" && region === "todas" && uf === "todos") return [];

    const scopeKey = `${segment}|${region}|${uf}`;
    const { publicClient } = await import("./admin.server");
    const ids = sections.map((s) => s.id);

    const { data: cached } = await publicClient()
      .from("brazil_scope_content")
      .select(SELECT)
      .eq("scope_key", scopeKey)
      .eq("lang", lang)
      .in("section_id", ids);

    const rows = (cached ?? []) as unknown as Array<{
      section_id: string;
      title: string;
      body: string;
      bullets: unknown;
      sources: unknown;
    }>;
    const have = new Map(rows.map((r) => [r.section_id, r]));
    const missing = sections.filter((s) => !have.has(s.id));

    const toScoped = (r: {
      section_id: string;
      title: string;
      body: string;
      bullets: unknown;
      sources: unknown;
    }): ScopedSection => ({
      section_id: r.section_id,
      title: r.title,
      body: r.body,
      bullets: Array.isArray(r.bullets) ? (r.bullets as string[]) : [],
      sources: Array.isArray(r.sources) ? (r.sources as string[]) : [],
    });

    if (missing.length === 0) return rows.map(toScoped);

    // Geração com IA limita-se a combinações válidas e a poucos temas por chamada,
    // evitando que requisições públicas consumam o serviço pago sem limite.
    const { SEGMENTS, REGIONS, UFS } = await import("./brazil-scope-allowlist");
    if (!SEGMENTS.includes(segment) || !REGIONS.includes(region) || !UFS.includes(uf)) {
      return rows.map(toScoped);
    }
    const { supabaseAdmin: counter } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await counter
      .from("brazil_scope_content")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if ((recent ?? 0) >= 60) return rows.map(toScoped);

    try {
      const { askJson } = await import("./ai.server");
      const langName = { pt: "português do Brasil", en: "inglês", es: "espanhol", zh: "mandarim" }[
        lang
      ];
      type Out = {
        sections: Array<{
          id: string;
          title: string;
          body: string;
          bullets: string[];
          sources: string[];
        }>;
      };
      const out = await askJson<Out>(
        "Você é pesquisador sênior em economia brasileira e escreve para investidores " +
          "internacionais. Padrão acadêmico: afirmações apoiadas em dados, com fonte e ano. " +
          `Escreva em ${langName}, tom institucional, sem exageros de marketing.`,
        JSON.stringify({
          recorte: {
            segmento: segment === "geral" ? "todos os segmentos" : segment,
            regiao: region === "todas" ? "Brasil (nacional)" : region,
            uf: uf === "todos" ? "todos os estados" : uf,
          },
          instrucao:
            "Reescreva cada tema abaixo especificamente para o recorte informado, citando " +
            "dados, players e políticas do segmento/região/estado quando existirem.",
          formato: {
            sections: [
              {
                id: "id do tema",
                title: "título curto contextualizado ao recorte",
                body: "2 a 4 parágrafos, até 1600 caracteres",
                bullets: ["4 a 6 dados-chave curtos do recorte, com fonte e ano"],
                sources: ["Instituição (ano). Título. URL"],
              },
            ],
          },
          temas: missing,
        }),
      );

      const generated = (out.sections ?? []).filter((s) => ids.includes(s.id));
      if (generated.length > 0) {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("brazil_scope_content").upsert(
          generated.map((s) => ({
            scope_key: scopeKey,
            section_id: s.id,
            lang,
            segment,
            region,
            uf,
            title: (s.title ?? "").slice(0, 200),
            body: (s.body ?? "").slice(0, 6000),
            bullets: (s.bullets ?? []).slice(0, 10),
            sources: (s.sources ?? []).slice(0, 8),
          })),
          { onConflict: "scope_key,section_id,lang" },
        );
      }

      return [
        ...rows.map(toScoped),
        ...generated.map((s) => ({
          section_id: s.id,
          title: s.title ?? "",
          body: s.body ?? "",
          bullets: s.bullets ?? [],
          sources: s.sources ?? [],
        })),
      ];
    } catch {
      return rows.map(toScoped);
    }
  });
