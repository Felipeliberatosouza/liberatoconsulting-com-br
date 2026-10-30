import { createFileRoute } from "@tanstack/react-router";

/**
 * /guia baixa direto o PDF publicado do "Guia de Gestão Completa" (sem abrir página).
 * Sempre entrega a versão mais recente publicada em Ferramentas de Gestão.
 */
export const Route = createFileRoute("/guia")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: tool } = await supabaseAdmin
          .from("management_tools")
          .select("file_path, file_name")
          .eq("published", true)
          .ilike("title", "Guia de Gest%")
          .not("file_path", "is", null)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!tool?.file_path) return new Response("Guia indisponível", { status: 404 });
        const file = await supabaseAdmin.storage.from("management-tools").download(tool.file_path);
        if (file.error || !file.data) return new Response("Guia indisponível", { status: 404 });
        const name = (tool.file_name || "Guia-Gestao-Completa.pdf").replace(/[^\w.\-]/g, "_");
        return new Response(file.data, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${name}"`,
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
