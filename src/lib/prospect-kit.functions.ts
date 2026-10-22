import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "presentations";
export const KIT_FILES = {
  banner: "prospect-kit/banner.png",
  pptx: "prospect-kit/resumo-servicos.pptx",
  pdf: "prospect-kit/resumo-servicos.pdf",
} as const;
const TYPES = {
  banner: "image/png",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
} as const;
const NAMES = { banner: "Banner-Liberato.png", pptx: "Resumo-Servicos-Liberato.pptx", pdf: "Resumo-Servicos-Liberato.pdf" } as const;

const b64 = z.string().min(10).max(12_000_000);

/** Salva o material de prospecção atual (banner, PowerPoint e PDF). */
export const saveProspectKit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ banner: b64, pptx: b64, pdf: b64 }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    for (const k of ["banner", "pptx", "pdf"] as const) {
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(KIT_FILES[k], bytes(data[k]), { upsert: true, contentType: TYPES[k] });
      if (error) throw new Error(`Falha ao salvar ${k}: ${error.message}`);
    }
    return { ok: true, updatedAt: new Date().toISOString() };
  });

/** Links temporários para visualizar/baixar o material. */
export const getProspectKit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.storage.from(BUCKET).list("prospect-kit");
    const updated = (list ?? []).find((f) => f.name === "resumo-servicos.pdf")?.updated_at ?? null;
    if (!updated) return { updatedAt: null, urls: null };
    const urls: Record<string, string> = {};
    for (const k of ["banner", "pptx", "pdf"] as const) {
      const { data } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(KIT_FILES[k], 600, { download: NAMES[k] });
      urls[k] = data?.signedUrl ?? "";
    }
    const { data: view } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(KIT_FILES.banner, 60 * 60 * 24 * 365);
    urls["bannerView"] = view?.signedUrl ?? "";
    return { updatedAt: updated as string, urls: urls as { banner: string; pptx: string; pdf: string; bannerView: string } };
  });

const CONTENT_FILE = "prospect-kit/content.json";
const tb = z.object({ title: z.string().max(200), body: z.string().max(700) });
const metric = z.object({ value: z.string().max(40), label: z.string().max(80) });
const contentSchema = z.object({
  banner: z.object({ title: z.string().max(200), pillars: z.array(tb).max(3), metrics: z.array(metric).max(4) }),
  slide1: z.object({ kicker: z.string().max(60), highlight: z.string().max(80), body: z.string().max(700), impactTitle: z.string().max(80), impact: z.array(tb).max(4), metrics: z.array(metric).max(4) }),
  slide2: z.object({ title: z.string().max(80), subtitle: z.string().max(200), pillars: z.array(tb).max(3), process: z.string().max(200), also: z.string().max(400) }),
  slide3: z.object({ title: z.string().max(80), subtitle: z.string().max(250) }),
});

/** Textos ajustados pelo administrador (null = usar o padrão do painel). */
export const getKitContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage.from(BUCKET).download(CONTENT_FILE);
    if (!data) return { content: null as z.infer<typeof contentSchema> | null };
    try {
      return { content: contentSchema.parse(JSON.parse(await data.text())) };
    } catch {
      return { content: null };
    }
  });

/** Aplica um pedido em texto ao conteúdo atual e salva o resultado. */
export const editKitContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ request: z.string().trim().min(3).max(2000), current: contentSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");
    const sys =
      "Você edita os textos do material de prospecção da Liberato Consulting (banner do e-mail e 3 slides). " +
      "Recebe o JSON atual e um pedido do administrador. Altere SOMENTE o que foi pedido, mantendo exatamente a mesma estrutura de chaves. " +
      "Português do Brasil, tom profissional. Não invente números, clientes ou resultados que não estejam no JSON ou no pedido. " +
      "Limites: títulos curtos (até ~60 caracteres), textos de cartões até ~280 caracteres, no máximo 3 pilares e 4 métricas. " +
      "Seções: banner (imagem do e-mail), slide1 (Por que a Liberato), slide2 (O que entregamos), slide3 (Vamos conversar). " +
      'Responda com {"content": <JSON completo atualizado>, "summary": "frase curta do que mudou"}.';
    let r: { content: unknown; summary?: string };
    try {
      r = await askJson(sys, `JSON atual:\n${JSON.stringify(data.current)}\n\nPedido: ${data.request}`);
    } catch {
      throw new Error("Não foi possível interpretar o pedido. Tente reformular.");
    }
    const parsed = contentSchema.safeParse(r?.content);
    if (!parsed.success) throw new Error("A alteração gerou um formato inválido. Tente reformular o pedido.");
    await saveContent(parsed.data);
    return { content: parsed.data, summary: String(r.summary ?? "Alteração aplicada.") };
  });

/** Volta aos textos padrão (derivados do painel). */
export const resetKitContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.storage.from(BUCKET).remove([CONTENT_FILE]);
    return { ok: true };
  });

async function saveContent(c: z.infer<typeof contentSchema>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(CONTENT_FILE, new Blob([JSON.stringify(c)], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  if (error) throw new Error(`Falha ao salvar textos: ${error.message}`);
}
