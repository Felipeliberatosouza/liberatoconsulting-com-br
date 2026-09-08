import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PANEL_ROLES } from "./roles";
import {
  isStrongPassword,
  isValidCep,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  PHONE_ERROR,
} from "./validation";

export type TeamRow = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  birth_date?: string | null;
  cpf?: string;
  rg?: string;
  nationality?: string;
  marital_status?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_district?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  pix_key?: string;
  notes?: string;
  email_opt_in?: boolean;
  active?: boolean;
  contract_file_path?: string | null;
  contract_file_name?: string | null;
  contract_sent_at?: string | null;
  contract_uploaded_at?: string | null;
  roles: string[];
  signed_at: string | null;
};

/* ------------------------------------------------------------------ */
/* Sessão                                                              */
/* ------------------------------------------------------------------ */

/** Sessão do painel: papéis do usuário e contrato pendente de assinatura. */
export const getPanelSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRoles } = await import("./access.server");
    const roles = await getRoles(context);
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", context.userId)
      .maybeSingle();

    let needsContract: null | { audience: string; title: string; body: string; version: number } =
      null;
    const contractRole = roles.includes("admin")
      ? null
      : roles.find((r) => r === "consultor" || r === "autor");
    if (contractRole) {
      const { data: tpl } = await context.supabase
        .from("contract_templates")
        .select("id, audience, title, body, version")
        .eq("audience", contractRole)
        .eq("active", true)
        .maybeSingle();
      if (tpl) {
        const { data: signed } = await context.supabase
          .from("contract_signatures")
          .select("id")
          .eq("user_id", context.userId)
          .eq("audience", contractRole)
          .eq("version", tpl.version)
          .maybeSingle();
        if (!signed) {
          needsContract = {
            audience: tpl.audience,
            title: tpl.title,
            body: tpl.body,
            version: tpl.version,
          };
        }
      }
    }

    return {
      userId: context.userId,
      roles,
      isAdmin: roles.includes("admin"),
      name: (profile?.full_name as string) ?? "",
      email: (profile?.email as string) ?? "",
      needsContract,
    };
  });

/* ------------------------------------------------------------------ */
/* Equipe (admin, consultor, autor)                                     */
/* ------------------------------------------------------------------ */

export const listTeam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles }, { data: roles }, { data: signatures }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("full_name", { ascending: true }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("contract_signatures").select("user_id, audience, signed_at"),
    ]);
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as string]);
    }
    const signedMap = new Map<string, string>();
    for (const s of signatures ?? []) signedMap.set(s.user_id, s.signed_at as string);

    const rows: TeamRow[] = (profiles ?? []).map((p) => ({
      ...(p as unknown as TeamRow),
      roles: roleMap.get(p.user_id) ?? [],
      signed_at: signedMap.get(p.user_id) ?? null,
    }));
    // Usuários com papel mas ainda sem perfil preenchido.
    for (const [userId, list] of roleMap) {
      if (!rows.some((r) => r.user_id === userId)) {
        rows.push({
          id: userId,
          user_id: userId,
          full_name: "",
          email: "",
          roles: list,
          signed_at: signedMap.get(userId) ?? null,
        } as TeamRow);
      }
    }
    return rows;
  });

const profileFields = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z
    .string()
    .trim()
    .max(255)
    .refine((v) => isValidEmail(v), "E-mail inválido."),
  phone: z
    .string()
    .trim()
    .min(1, "Celular obrigatório.")
    .max(40)
    .refine(isValidPhone, PHONE_ERROR),
  birth_date: z.string().trim().min(1, "Data de nascimento obrigatória.").max(20),
  cpf: z
    .string()
    .trim()
    .max(20)
    .refine((v) => isValidCpf(v), "CPF inválido."),
  rg: z.string().trim().max(30).default(""),
  nationality: z.string().trim().max(60).default(""),
  marital_status: z.string().trim().max(40).default(""),
  address_street: z.string().trim().max(160).default(""),
  address_number: z.string().trim().min(1, "Número obrigatório.").max(20),
  address_complement: z.string().trim().max(80).default(""),
  address_district: z.string().trim().max(80).default(""),
  address_city: z.string().trim().max(80).default(""),
  address_state: z.string().trim().max(40).default(""),
  address_zip: z
    .string()
    .trim()
    .max(20)
    .refine((v) => isValidCep(v), "CEP inválido."),
  address_country: z.string().trim().max(60).default("Brasil"),
  bank_name: z.string().trim().min(1, "Banco obrigatório.").max(80),
  bank_branch: z.string().trim().min(1, "Agência obrigatória.").max(20),
  bank_account: z.string().trim().min(1, "Conta obrigatória.").max(30),
  pix_key: z.string().trim().max(140).default(""),
  notes: z.string().trim().max(2000).default(""),
  email_opt_in: z.boolean().default(true),
  active: z.boolean().default(true),
});

const createMember = profileFields.extend({
  role: z.enum(PANEL_ROLES),
  password: z.string().min(8).max(200),
});

/** Cria um usuário com acesso ao painel (administrador, consultor ou autor). */
export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createMember.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { role, password, birth_date, ...profile } = data;

    if (
      !isStrongPassword(password, {
        fullName: profile.full_name,
        email: profile.email,
        birthDate: birth_date,
        cpf: profile.cpf,
      })
    ) {
      return { ok: false as const, error: "A senha não atende às regras de segurança." };
    }

    const needsContract = role === "consultor" || role === "autor";

    const created = await supabaseAdmin.auth.admin.createUser({
      email: profile.email,
      password,
      email_confirm: true,
      // Acesso bloqueado até o envio do contrato assinado.
      ...(needsContract ? { ban_duration: "876000h" } : {}),
    } as never);
    if (created.error || !created.data.user) {
      return { ok: false as const, error: created.error?.message ?? "Falha ao criar usuário." };
    }
    const userId = created.data.user.id;
    const roleRes = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    if (roleRes.error) return { ok: false as const, error: roleRes.error.message };
    const { error } = await supabaseAdmin
      .from("profiles")
      .insert({ ...profile, birth_date: birth_date || null, user_id: userId });
    if (error) return { ok: false as const, error: error.message };

    let contractWarning = "";
    if (needsContract) {
      const { sendContractEmail } = await import("./contracts.server");
      const sent = await sendContractEmail({
        audience: role,
        toEmail: profile.email,
        toName: profile.full_name,
      }).catch((e: unknown) => ({ ok: false as const, error: String(e) }));
      if (sent.ok) {
        await supabaseAdmin
          .from("profiles")
          .update({ contract_sent_at: new Date().toISOString() })
          .eq("user_id", userId);
      } else {
        contractWarning = sent.error ?? "Não foi possível enviar o contrato por e-mail.";
      }
    }
    return { ok: true as const, contractWarning, needsContract };
  });


/** Atualiza os dados cadastrais e o papel de um membro da equipe. */
export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    profileFields
      .extend({
        user_id: z.string().uuid(),
        role: z.enum(PANEL_ROLES),
        password: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { user_id, role, password, birth_date, ...profile } = data;

    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert({ ...profile, birth_date: birth_date || null, user_id }, { onConflict: "user_id" });
    if (error) return { ok: false as const, error: error.message };

    await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
    const roleRes = await supabaseAdmin.from("user_roles").insert({ user_id, role });
    if (roleRes.error) return { ok: false as const, error: roleRes.error.message };

    if (password && password.length > 0) {
      if (
        !isStrongPassword(password, {
          fullName: profile.full_name,
          email: profile.email,
          birthDate: birth_date,
          cpf: profile.cpf,
        })
      ) {
        return { ok: false as const, error: "A senha não atende às regras de segurança." };
      }
      const up = await supabaseAdmin.auth.admin.updateUserById(user_id, { password });
      if (up.error) return { ok: false as const, error: up.error.message };
    }
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Contrato assinado                                                    */
/* ------------------------------------------------------------------ */

/** Reenvia o contrato do papel para o e-mail do membro. */
export const resendContractEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", data.user_id)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user_id),
    ]);
    const audience = (roles ?? []).map((r) => r.role as string).find(
      (r) => r === "consultor" || r === "autor",
    ) as "consultor" | "autor" | undefined;
    if (!audience) return { ok: false as const, error: "Este usuário não exige contrato." };
    if (!profile?.email) return { ok: false as const, error: "Usuário sem e-mail cadastrado." };
    const { sendContractEmail } = await import("./contracts.server");
    const sent = await sendContractEmail({
      audience,
      toEmail: profile.email as string,
      toName: (profile.full_name as string) ?? "",
    });
    if (!sent.ok) return sent;
    await supabaseAdmin
      .from("profiles")
      .update({ contract_sent_at: new Date().toISOString() })
      .eq("user_id", data.user_id);
    return { ok: true as const };
  });

/** Recebe o contrato assinado (PDF/imagem) e libera o acesso do usuário. */
export const uploadSignedContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        file_name: z.string().trim().min(1).max(200),
        content_type: z.string().trim().max(120).default("application/pdf"),
        file_base64: z.string().min(16).max(15_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const binary = atob(data.file_base64.replace(/^data:[^;]+;base64,/, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

    const safeName = data.file_name.replace(/[^\w.\-]+/g, "_");
    const path = `${data.user_id}/${Date.now()}_${safeName}`;
    const up = await supabaseAdmin.storage
      .from("contracts")
      .upload(path, bytes, { contentType: data.content_type, upsert: true });
    if (up.error) return { ok: false as const, error: up.error.message };

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        contract_file_path: path,
        contract_file_name: data.file_name,
        contract_uploaded_at: new Date().toISOString(),
      })
      .eq("user_id", data.user_id);
    if (error) return { ok: false as const, error: error.message };

    // Libera o acesso ao painel.
    await supabaseAdmin.auth.admin.updateUserById(data.user_id, { ban_duration: "none" } as never);
    return { ok: true as const };
  });

/** Link temporário para abrir o contrato assinado. */
export const getSignedContractUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("contracts")
      .createSignedUrl(data.path, 300);
    if (error || !signed) return { ok: false as const, error: error?.message ?? "Falha." };
    return { ok: true as const, url: signed.signedUrl };
  });


/** Remove definitivamente um usuário do painel. */
export const deleteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    if (data.user_id === context.userId) {
      return { ok: false as const, error: "Você não pode excluir o próprio acesso." };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Cadastros sem acesso: leads e candidatos                             */
/* ------------------------------------------------------------------ */

export const updateLeadRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(160).optional(),
        email: z.string().trim().email().max(255).nullable().optional(),
        email_opt_in: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("leads").update(patch as never).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteLeadRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const updateApplicationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(1).max(160).optional(),
        email: z.string().trim().email().max(255).optional(),
        email_opt_in: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("job_applications")
      .update(patch as never)
      .eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteApplicationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("job_applications").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const updateSubscriberRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().max(160).optional(),
        email: z.string().trim().email().max(255).optional(),
        status: z.enum(["active", "unsubscribed"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    if (data.status) {
      const { data: subscriber } = await supabaseAdmin
        .from("newsletter_subscribers")
        .select("email")
        .eq("id", id)
        .maybeSingle();
      if (!subscriber) return { ok: false as const, error: "Assinante não encontrado." };
      try {
        const { setRecipientEmailConsent } = await import("./email-consent.server");
        await setRecipientEmailConsent(subscriber.email, data.status === "active");
      } catch (error) {
        const { consentErrorMessage } = await import("./email-consent.server");
        return { ok: false as const, error: consentErrorMessage(error) };
      }
    }
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update(patch as never)
      .eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Fila de aprovações                                                   */
/* ------------------------------------------------------------------ */

export const listChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getRoles } = await import("./access.server");
    const roles = await getRoles(context);
    const query = context.supabase
      .from("change_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data, error } = roles.includes("admin")
      ? await query
      : await query.eq("requester_id", context.userId);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
      id: String(r["id"]),
      requester_name: String(r["requester_name"] ?? ""),
      kind: String(r["kind"] ?? ""),
      action: String(r["action"] ?? ""),
      target_id: (r["target_id"] as string | null) ?? null,
      title: String(r["title"] ?? ""),
      summary: String(r["summary"] ?? ""),
      payload_json: JSON.stringify(r["payload"] ?? {}),
      status: String(r["status"] ?? ""),
      review_note: String(r["review_note"] ?? ""),
      created_at: String(r["created_at"] ?? ""),
      reviewed_at: (r["reviewed_at"] as string | null) ?? null,
    }));
  });

/** Aprova (aplicando a alteração) ou recusa um pedido. */
export const reviewChangeRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        approve: z.boolean(),
        note: z.string().trim().max(1000).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("change_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { ok: false as const, error: "Pedido não encontrado." };
    if (row.status !== "pending") return { ok: false as const, error: "Pedido já revisado." };

    if (data.approve) {
      const { applyChangeRequest } = await import("./approvals.server");
      const applied = await applyChangeRequest(row as never);
      if (!applied.ok) return applied;
    }

    const { error: upErr } = await context.supabase
      .from("change_requests")
      .update({
        status: data.approve ? "approved" : "rejected",
        reviewer_id: context.userId,
        review_note: data.note ?? "",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (upErr) return { ok: false as const, error: upErr.message };
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ */
/* Opções de autoria (autores, consultores e administradores)          */
/* ------------------------------------------------------------------ */

/** Lista nomes e e-mails dos usuários que podem assinar publicações. */
export const listAuthorOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAnyRole } = await import("./access.server");
    await assertAnyRole(context, ["consultor", "autor"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: roles }, { data: profiles }, authList] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.from("profiles").select("user_id, full_name, email, active"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    const allowed = new Set(
      (roles ?? [])
        .filter((r) => ["admin", "consultor", "autor"].includes(r.role as string))
        .map((r) => r.user_id as string),
    );
    const byUser = new Map<string, { name: string; email: string; active: boolean }>();
    for (const p of profiles ?? []) {
      byUser.set(p.user_id as string, {
        name: ((p.full_name as string) ?? "").trim(),
        email: ((p.email as string) ?? "").trim(),
        active: p.active !== false,
      });
    }
    // Usuários com papel mas ainda sem perfil preenchido continuam disponíveis.
    for (const u of authList.data?.users ?? []) {
      if (!allowed.has(u.id)) continue;
      const cur = byUser.get(u.id);
      const email = cur?.email || u.email || "";
      const name = cur?.name || email.split("@")[0] || "";
      byUser.set(u.id, { name, email, active: cur ? cur.active : true });
    }
    return [...byUser.entries()]
      .filter(([userId, v]) => allowed.has(userId) && v.active && v.name.trim())
      .map(([userId, v]) => ({ userId, name: v.name, email: v.email }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

