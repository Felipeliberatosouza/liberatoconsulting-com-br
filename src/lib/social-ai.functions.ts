import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Gera o pacote de redes sociais: título em forma de pergunta, até 5 bullets
 * conceituais curtos e um texto longo para o LinkedIn.
 */
export const generateSocialPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(5).max(200),
        body: z.string().trim().max(40000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { askJson } = await import("./ai.server");

    type Out = { headline: string; bullets: string[]; linkedinText: string };
    try {
      const out = await askJson<Out>(
        "Você é editor de conteúdo da Liberato Consulting, consultoria de gestão brasileira. " +
          "Português do Brasil, tom executivo, sem exageros.",
        JSON.stringify({
          titulo: data.title,
          texto: data.body.slice(0, 12000),
          formato: {
            headline:
              "título curto (até 60 caracteres) em forma de pergunta, ex.: 'Você sabe o que é solopreneurship?'",
            bullets:
              "no máximo 5 bullets muito curtos (até 60 caracteres cada), apenas pontos conceituais",
            linkedinText:
              "texto longo para LinkedIn (1500 a 2500 caracteres), em parágrafos curtos, " +
              "sem hashtags e sem assinatura (serão acrescentadas depois)",
          },
        }),
      );
      return {
        ok: true as const,
        headline: (out.headline ?? "").slice(0, 120),
        bullets: (out.bullets ?? []).slice(0, 5).map((b) => String(b).slice(0, 90)),
        linkedinText: out.linkedinText ?? "",
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Imagem base (sem texto) usada em todas as redes, em formato panorâmico amplo. */
export const generateSocialImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ title: z.string().trim().min(5).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { askImage } = await import("./ai.server");
    try {
      const url = await askImage(
        `Imagem para post corporativo de consultoria de gestão sobre "${data.title}". ` +
          `Fotografia editorial sóbria ou composição abstrata de dados, paleta azul-petróleo e ` +
          `laranja queimado, luz uniforme, muito espaço livre no centro para receber texto, ` +
          `sem nenhuma letra, número, logotipo ou marca d'água na imagem.`,
      );
      if (!url) return { ok: false as const, error: "A IA não retornou imagem." };
      return { ok: true as const, imageUrl: url };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });
