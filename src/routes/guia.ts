import { createFileRoute } from "@tanstack/react-router";

/**
 * /guia baixa direto o PDF publicado do "Guia de Gestão Completa" (sem abrir página).
 * Sempre entrega a versão mais recente publicada em Ferramentas de Gestão.
 */
export const Route = createFileRoute("/guia")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        // Primeiro acesso: página segura (HTTPS) que dispara o download, evitando o bloqueio do Chrome.
        if (url.searchParams.get("baixar") !== "1") {
          const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guia de Gestão Completa | Liberato Consulting</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="1;url=/guia?baixar=1"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;background:#0f2340;color:#fff;text-align:center;padding:24px}h1{font-size:1.5rem;margin:0 0 12px}p{opacity:.85}a{display:inline-block;margin-top:18px;background:#f28c28;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-family:sans-serif;font-weight:600}</style></head><body><main><h1>Liberato Consulting</h1><p>Iniciando o download do seu Guia de Gestão Completa...</p><a href="/guia?baixar=1">Clique aqui caso o download não tenha iniciado</a></main></body></html>`;
          return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
        }
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
