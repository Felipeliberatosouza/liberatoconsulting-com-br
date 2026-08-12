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
    case "bulletin": {
      if (req.action === "unsubscribe" && req.target_id) {
        const { error } = await supabaseAdmin
          .from("bulletin_subscribers")
          .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
          .eq("id", req.target_id);
        if (error) return { ok: false as const, error: error.message };
        return { ok: true as const };
      }
      const data = req.payload as { testEmail?: string; testWhatsApp?: string; testSegment?: string };
      const { dispatchBulletin } = await import("./bulletin.server");
      try {
        const r = await dispatchBulletin({
          testEmail: data.testEmail,
          testWhatsApp: data.testWhatsApp,
          testSegment: data.testSegment,
        });
        return r.ok ? { ok: true as const } : { ok: false as const, error: r.error };
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : "Falha no envio do boletim.",
        };
      }
    }
    default:
      return { ok: false as const, error: `Tipo de alteração desconhecido: ${req.kind}` };
  }
}
