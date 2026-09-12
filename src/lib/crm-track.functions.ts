import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Registro anônimo da navegação do site para o CRM.
 * Guarda apenas o caminho visitado e um identificador aleatório de visitante
 * (gerado no navegador). O e-mail só entra quando a própria pessoa se
 * identifica em um formulário.
 */

const eventSchema = z.object({
  visitorId: z.string().trim().min(8).max(64),
  kind: z.enum(["page", "service", "brasil", "content", "form"]).default("page"),
  path: z.string().trim().min(1).max(300),
  label: z.string().trim().max(200).default(""),
  lang: z.string().trim().max(8).default("pt"),
  referrer: z.string().trim().max(300).default(""),
});

export const trackSiteEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => eventSchema.parse(d))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("crm_site_events").insert({
        visitor_id: data.visitorId,
        kind: data.kind,
        path: data.path,
        label: data.label,
        lang: data.lang,
        referrer: data.referrer,
      });
    } catch {
      // rastreamento nunca pode quebrar a navegação
    }
    return { ok: true as const };
  });

/** Liga um visitante anônimo ao e-mail informado em um formulário. */
export const identifyVisitor = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        visitorId: z.string().trim().min(8).max(64),
        email: z.string().trim().email().max(255),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("crm_site_events")
        .update({ email: data.email.toLowerCase() })
        .eq("visitor_id", data.visitorId)
        .is("email", null);
    } catch {
      // silencioso
    }
    return { ok: true as const };
  });
