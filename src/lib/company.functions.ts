import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { companySchema, EMPTY_COMPANY, type CompanyProfile, type Partner } from "./company-profile";

export type { CompanyProfile, Partner } from "./company-profile";

/** Dados cadastrais da consultoria (somente administradores). */
export const getCompany = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CompanyProfile> => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("company_profile")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data) return EMPTY_COMPANY;
    const row = data as Record<string, unknown>;
    return {
      ...EMPTY_COMPANY,
      ...(row as unknown as CompanyProfile),
      partners: (row["partners"] as Partner[]) ?? [],
    };
  });

export const saveCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => companySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { id, founded_on, ...rest } = data;
    const row = { ...rest, founded_on: founded_on || null, partners: rest.partners as never };
    const result = id
      ? await context.supabase.from("company_profile").update(row as never).eq("id", id).select("id").maybeSingle()
      : await context.supabase.from("company_profile").insert(row as never).select("id").single();
    if (result.error) {
      console.error("Falha ao salvar dados da consultoria", {
        code: result.error.code,
        details: result.error.details,
        hint: result.error.hint,
      });
      if (result.error.code === "42501") {
        return { ok: false as const, error: "Sua sessão não tem permissão para alterar os dados da consultoria." };
      }
      if (result.error.code === "22007" || result.error.code === "22008") {
        return { ok: false as const, error: "A data de fundação é inválida. Revise o campo e tente novamente." };
      }
      if (result.error.code === "23502") {
        return { ok: false as const, error: "Um campo obrigatório não foi enviado. Revise os dados e tente novamente." };
      }
      return { ok: false as const, error: `O banco de dados recusou o salvamento (${result.error.code || "erro desconhecido"}).` };
    }
    if (id && !result.data) {
      return { ok: false as const, error: "O cadastro da consultoria não foi encontrado ou não pode ser alterado." };
    }
    const savedId = result.data?.id;
    if (!savedId) {
      return { ok: false as const, error: "O salvamento não retornou a confirmação do cadastro." };
    }
    return { ok: true as const, id: savedId };
  });

/* ------------------------------------------------------------------ */
/* Contratos                                                            */
/* ------------------------------------------------------------------ */

export const listContractTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("contract_templates")
      .select("id, audience, title, body, version, active")
      .order("audience", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      audience: string;
      title: string;
      body: string;
      version: number;
      active: boolean;
    }>;
  });

export const saveContractTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        audience: z.enum(["autor", "consultor"]),
        title: z.string().trim().min(3).max(200),
        body: z.string().trim().min(20).max(40000),
        bumpVersion: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data: current } = await context.supabase
      .from("contract_templates")
      .select("id, version")
      .eq("audience", data.audience)
      .maybeSingle();
    const version = (current?.version ?? 0) + (data.bumpVersion || !current ? 1 : 0);
    const { error } = await context.supabase.from("contract_templates").upsert(
      {
        audience: data.audience,
        title: data.title,
        body: data.body,
        version,
        active: true,
      },
      { onConflict: "audience" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Assinatura digital do contrato pelo consultor ou autor. */
export const signContract = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        audience: z.enum(["autor", "consultor"]),
        signer_name: z.string().trim().min(3).max(160),
        signer_cpf: z.string().trim().min(11).max(20),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: tpl } = await context.supabase
      .from("contract_templates")
      .select("id, body, version")
      .eq("audience", data.audience)
      .maybeSingle();
    if (!tpl) return { ok: false as const, error: "Contrato não encontrado." };
    const { buildContractVars } = await import("./contract-fill.server");
    const { fillContract } = await import("./contract-fill");
    const vars = await buildContractVars({ userId: context.userId });
    const signedBody = fillContract(tpl.body, vars);
    const { error } = await context.supabase.from("contract_signatures").insert({
      user_id: context.userId,
      template_id: tpl.id,
      audience: data.audience,
      version: tpl.version,
      signer_name: data.signer_name,
      signer_cpf: data.signer_cpf,
      signed_body: tpl.body,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const listSignatures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("contract_signatures")
      .select("id, user_id, audience, version, signer_name, signer_cpf, signed_at")
      .order("signed_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      user_id: string;
      audience: string;
      version: number;
      signer_name: string;
      signer_cpf: string;
      signed_at: string;
    }>;
  });

/* ------------------------------------------------------------------ */
/* E-mails automáticos                                                  */
/* ------------------------------------------------------------------ */

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("email_templates")
      .select("id, slug, label, subject, body, enabled")
      .order("label", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Array<{
      id: string;
      slug: string;
      label: string;
      subject: string;
      body: string;
      enabled: boolean;
    }>;
  });

export const saveEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        subject: z.string().trim().min(3).max(200),
        body: z.string().trim().min(5).max(20000),
        enabled: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("email_templates").update(patch).eq("id", id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
