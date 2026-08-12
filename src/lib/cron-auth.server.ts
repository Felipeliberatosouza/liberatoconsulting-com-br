/**
 * Autenticação dos disparos agendados (boletim/newsletter).
 *
 * O segredo NUNCA é exposto ao navegador: ele vive no ambiente do servidor
 * (`CRON_DISPATCH_SECRET`) e/ou em uma tabela privada lida apenas pelo
 * service role, usada pelo agendador do banco (pg_cron) ao chamar o endpoint.
 */

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function extractToken(request: Request): string {
  return (
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "")
  ).trim();
}

export async function assertCronCaller(request: Request): Promise<boolean> {
  const provided = extractToken(request);
  if (!provided) return false;

  const envSecret = (process.env["CRON_DISPATCH_SECRET"] ?? "").trim();
  if (envSecret && safeEqual(provided, envSecret)) return true;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("verify_cron_secret" as never, {
      _token: provided,
    } as never);
    if (!error && data === true) return true;
  } catch {
    // ignora: falha na verificação significa acesso negado
  }

  return false;
}
