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
