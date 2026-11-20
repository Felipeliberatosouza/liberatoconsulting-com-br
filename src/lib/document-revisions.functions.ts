import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listDocumentRevisions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server"); await assertAdmin(context);
    const rows = await context.supabase.from("project_document_revisions").select("id,changed_at,kind").eq("document_id",data.id).order("changed_at", { ascending: false });
    if (rows.error) throw new Error("Não foi possível consultar as alterações.");
    return rows.data;
  });