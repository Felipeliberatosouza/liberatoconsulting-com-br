import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Gera com IA todo o conteúdo de uma nova newsletter a partir do título:
 * chamada curta, texto de até 500 palavras, material completo e fontes.
 */
export const generateNewsletterAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(5).max(200),
        authors: z.string().trim().max(300).optional().default(""),
        hint: z.string().trim().max(1500).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { askJson } = await import("./ai.server");

    type Out = { preheader: string; body: string; fullText: string; sources: string[] };
    try {
      const out = await askJson<Out>(
        "Você é editor sênior de uma consultoria de gestão brasileira (Liberato Consulting), " +
          "escrevendo para executivos e investidores internacionais interessados no Brasil. " +
          "Padrão acadêmico-executivo: dados com fonte e ano, linguagem clara, sem exageros. " +
          "Português do Brasil.",
        JSON.stringify({
          titulo: data.title,
          orientacoes: data.hint,
          formato: {
            preheader: "chamada curta de até 160 caracteres",
            body: "texto da newsletter com NO MÁXIMO 500 palavras, em parágrafos curtos",
            fullText:
              "material completo e aprofundado, de 8000 a 15000 palavras, em markdown: " +
              "subtítulos com ##, listas com -, tabelas em markdown (| col | col | e linha |---|---|). " +
              "Nunca escreva 'gráfico sugerido': sempre que houver dados comparáveis, insira o gráfico " +
              "no ponto exato do texto usando um bloco ```chart com 'titulo: ...' e uma linha por série " +
              "no formato 'Rótulo | número' (apenas números, sem % nem texto no valor).",
            sources: ["referências: Instituição (ano). Título. URL"],
          },

        }),
      );
      return {
        ok: true as const,
        preheader: (out.preheader ?? "").slice(0, 400),
        body: out.body ?? "",
        fullText: out.fullText ?? "",
        sources: (out.sources ?? []).join("\n"),
        referenceDate: new Date().toISOString().slice(0, 10),
      };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Gera a imagem de cabeçalho da newsletter. */
export const generateNewsletterImage = createServerFn({ method: "POST" })
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
        `Imagem de cabeçalho para newsletter corporativa de consultoria de gestão. ` +
          `Tema: "${data.title}". Estilo editorial sóbrio, fotografia corporativa brasileira ` +
          `ou composição abstrata de dados, paleta azul-petróleo e laranja queimado, ` +
          `formato panorâmico, sem nenhum texto na imagem.`,
      );
      if (!url) return { ok: false as const, error: "A IA não retornou imagem." };
      return { ok: true as const, imageUrl: url };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/**
 * Monta o PDF do material completo (marca d'água com a logomarca, cabeçalho e
 * rodapé institucionais) e devolve um link temporário para download.
 */
export const buildNewsletterPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        campaignId: z.string().uuid().optional(),
        title: z.string().trim().min(3).max(300),
        subtitle: z.string().trim().max(2000).optional().default(""),
        authors: z.string().trim().max(500).optional().default(""),
        authorContact: z.string().trim().max(500).optional().default(""),
        body: z.string().trim().min(20).max(400000),
        sources: z.string().trim().max(100000).optional().default(""),
        // A imagem pode chegar como data URL (base64), portanto o limite precisa
        // acompanhar o permitido no cadastro da campanha, e não o de uma URL curta.
        imageUrl: z.string().trim().max(3_000_000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      const { assertAnyRole } = await import("./access.server");
      await assertAnyRole(context, ["consultor", "autor"]);
      const { buildBrandedPdf } = await import("./pdf.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const [{ data: branding }, { data: company }] = await Promise.all([
        supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
        supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
      ]);
      const { formatCompanyAddress } = await import("./company-footer.server");
      const { siteOrigin } = await import("./bulletin.server");
      const c = (company ?? {}) as Record<string, string>;
      // Cabeçalho sempre com a logomarca: painel → marca, depois dados da consultoria,
      // e por fim a logomarca padrão publicada no site.
      const logoUrl =
        ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl ||
        c["logo_url"] ||
        `${siteOrigin()}/logo.png`;
      const contactLine1 = [c["phone"], c["email"]].filter(Boolean).join("  |  ");
      const contactLine2 = [formatCompanyAddress(c), c["cnpj"] ? `CNPJ ${c["cnpj"]}` : ""]
        .filter(Boolean)
        .join("  |  ");
      const companyName = c["trade_name"] || c["legal_name"] || "Liberato Consulting";

      const bytes = await buildBrandedPdf({
        title: data.title,
        subtitle: data.subtitle ?? "",
        authors: data.authors ?? "",
        authorContact: data.authorContact ?? "",
        body: data.body,
        sources: data.sources ?? "",
        logoDataUrl: logoUrl,
        coverImageUrl: data.imageUrl || null,
        contact: {
          name: companyName,
          line1: contactLine1 || "contato@liberatoconsulting.com.br",
          line2: contactLine2 || "Consultoria em gestão empresarial",
          website: c["website"] || "www.liberatoconsulting.com.br",
        },
      });

      // Nome do arquivo: NomedoAssunto_NomedaConsultoria.pdf
      const camel = (value: string, max: number) =>
        value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-zA-Z0-9 ]+/g, " ")
          .split(/\s+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join("")
          .slice(0, max);
      const fileName = `${camel(data.title, 60) || "Material"}_${camel(companyName, 40) || "LiberatoConsulting"}.pdf`;
      const path = `newsletter/${crypto.randomUUID()}-${fileName}`;
      const { error } = await supabaseAdmin.storage
        .from("content")
        .upload(path, bytes, { contentType: "application/pdf", upsert: false });
      if (error) return { ok: false as const, error: error.message };

      if (data.campaignId) {
        await supabaseAdmin
          .from("newsletter_campaigns")
          .update({ file_path: path, file_name: fileName })
          .eq("id", data.campaignId);
      }
      const { data: signed } = await supabaseAdmin.storage
        .from("content")
        .createSignedUrl(path, 600);
      return { ok: true as const, path, name: fileName, url: signed?.signedUrl ?? "" };

    } catch (err) {
      console.error("buildNewsletterPdf failed", err);
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false as const, error: `Falha ao gerar o PDF: ${message}` };
    }
  });

