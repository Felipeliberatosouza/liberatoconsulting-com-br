import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Sugestões de IA para o cadastro de empresas do CRM. */

export const draftCrmCompanyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tradeName: z.string().trim().min(2).max(200),
        legalName: z.string().trim().max(200).default(""),
        segment: z.string().trim().max(160).default(""),
        city: z.string().trim().max(120).default(""),
        country: z.string().trim().max(80).default("Brasil"),
        website: z.string().trim().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");

    try {
      const draft = await askJson<{ revenue_range?: string; tags?: string[] }>(
        "Você é analista de inteligência de mercado de uma consultoria brasileira. Estime dados públicos de empresas.",
        `Empresa: ${data.tradeName}${data.legalName ? ` (razão social: ${data.legalName})` : ""}.
Segmento: ${data.segment || "não informado"}. Local: ${[data.city, data.country].filter(Boolean).join(", ")}. Site: ${data.website || "não informado"}.

Responda com JSON no formato:
{"revenue_range":"<faixa de FATURAMENTO MENSAL em reais, média estimada dos últimos 12 meses, ex.: 'R$ 500 mil a R$ 1 milhão/mês'>","tags":["até 8 tags curtas em português sobre atuação, produtos, mercado e porte"]}

Se não encontrar a empresa exata, estime pela média do segmento e porte equivalente.`,
      );
      const tags = (draft.tags ?? [])
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 8);
      return {
        ok: true as const,
        revenue_range: String(draft.revenue_range ?? "").trim().slice(0, 120),
        tags,
      };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha na sugestão de IA." };
    }
  });
