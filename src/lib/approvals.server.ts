import type { Json } from "./json";

type Request = {
  kind: string;
  action: string;
  target_id: string | null;
  payload: Record<string, Json>;
};

/**
 * Aplica no site a alteração aprovada pelo administrador.
 * Cada "kind" corresponde a uma área do painel.
 */
export async function applyChangeRequest(req: Request) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const payload = req.payload as never;

  switch (req.kind) {
    case "article": {
      const { error } = req.target_id
        ? await supabaseAdmin.from("content_articles").update(payload).eq("id", req.target_id)
        : await supabaseAdmin.from("content_articles").insert(payload);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }
    case "brazil": {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .upsert({ key: "brazil", value: payload as never }, { onConflict: "key" });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }
    case "indicator": {
      const { error } = req.target_id
        ? await supabaseAdmin.from("economic_indicators").update(payload).eq("id", req.target_id)
        : await supabaseAdmin.from("economic_indicators").insert(payload);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }
    case "campaign": {
      const { error } = req.target_id
        ? await supabaseAdmin.from("newsletter_campaigns").update(payload).eq("id", req.target_id)
        : await supabaseAdmin.from("newsletter_campaigns").insert(payload);
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }
    default:
      return { ok: false as const, error: `Tipo de alteração desconhecido: ${req.kind}` };
  }
}
