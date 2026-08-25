import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Partner = { name: string; cpf: string; share: string };

export type CompanyProfile = {
  id: string;
  legal_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  municipal_registration: string;
  founded_on: string | null;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string | null;
  partners: Partner[];
};

const EMPTY: CompanyProfile = {
  id: "",
  legal_name: "",
  trade_name: "Liberato Consulting",
  cnpj: "",
  state_registration: "",
  municipal_registration: "",
  founded_on: null,
  address_street: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  address_country: "Brasil",
  email: "",
  phone: "",
  website: "",
  logo_url: null,
  partners: [],
};

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
    if (!data) return EMPTY;
    const row = data as Record<string, unknown>;
    return {
      ...EMPTY,
      ...(row as unknown as CompanyProfile),
      partners: (row["partners"] as Partner[]) ?? [],
    };
  });

const companySchema = z.object({
  // O formulário usa string vazia enquanto ainda não existe registro. Converta-a
  // para undefined para que o primeiro salvamento seja tratado como INSERT.
  id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().uuid().optional(),
  ),
  legal_name: z.string().trim().max(200).default(""),
  trade_name: z.string().trim().max(200).default(""),
  cnpj: z.string().trim().max(30).default(""),
  state_registration: z.string().trim().max(40).default(""),
  municipal_registration: z.string().trim().max(40).default(""),
  founded_on: z.string().trim().max(20).nullable().optional(),
  address_street: z.string().trim().max(160).default(""),
  address_number: z.string().trim().max(20).default(""),
  address_complement: z.string().trim().max(80).default(""),
  address_district: z.string().trim().max(80).default(""),
  address_city: z.string().trim().max(80).default(""),
  address_state: z.string().trim().max(40).default(""),
  address_zip: z.string().trim().max(20).default(""),
  address_country: z.string().trim().max(60).default("Brasil"),
  email: z.string().trim().max(255).default(""),
  phone: z.string().trim().max(40).default(""),
  website: z.string().trim().max(200).default(""),
  logo_url: z.string().max(1_400_000).nullable().optional(),
  partners: z
    .array(
      z.object({
        name: z.string().trim().max(160),
        cpf: z.string().trim().max(20),
        share: z.string().trim().max(20),
      }),
    )
    .max(30)
    .default([]),
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
    return { ok: true as const, id: result.data.id };
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
