import type { PanelRole } from "./roles";

type Ctx = { supabase: any; userId: string; claims?: any };

/**
 * Todos os papéis do usuário autenticado.
 * O papel de administrador só vale após a verificação em dois fatores (aal2).
 */
export async function getRoles(context: Ctx): Promise<string[]> {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  const roles = ((data ?? []) as Array<{ role: string }>).map((r) => r.role);
  const aal = String(context.claims?.aal ?? "");
  return aal === "aal2" ? roles : roles.filter((r) => r !== "admin");
}

export async function isAdmin(context: Ctx): Promise<boolean> {
  return (await getRoles(context)).includes("admin");
}

export async function assertAdmin(context: Ctx) {
  if (!(await isAdmin(context))) throw new Error("Forbidden");
}

/** Garante que o usuário tem pelo menos um dos papéis informados. */
export async function assertAnyRole(context: Ctx, roles: PanelRole[]) {
  const mine = await getRoles(context);
  if (mine.includes("admin")) return mine;
  if (!roles.some((r) => mine.includes(r))) throw new Error("Forbidden");
  return mine;
}

/** Nome amigável do usuário (perfil ou e-mail). */
export async function displayName(context: Ctx): Promise<string> {
  const { data } = await context.supabase
    .from("profiles")
    .select("full_name, email")
    .eq("user_id", context.userId)
    .maybeSingle();
  return (data?.full_name || data?.email || "") as string;
}

/**
 * Cria um pedido de alteração para revisão do administrador.
 * Usado quando quem edita é consultor ou autor.
 */
export async function queueChangeRequest(
  context: Ctx,
  input: { kind: string; action?: string; targetId?: string | null; title: string; summary?: string; payload: unknown },
) {
  const { error } = await context.supabase.from("change_requests").insert({
    requester_id: context.userId,
    requester_name: await displayName(context),
    kind: input.kind,
    action: input.action ?? "update",
    target_id: input.targetId ?? null,
    title: input.title,
    summary: input.summary ?? "",
    payload: input.payload as never,
    status: "pending",
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, pending: true as const };
}

/** O usuário tem papel de administrador, mas ainda não concluiu a verificação em dois fatores? */
export async function needsAdminMfa(context: Ctx): Promise<boolean> {
  if (String(context.claims?.aal ?? "") === "aal2") return false;
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}
