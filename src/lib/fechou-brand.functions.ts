import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { companyBrandSchema, emptyCompanyBrand } from "./fechou-brand";

export const readCompanyWebsite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ url: z.string().trim().min(4).max(300) }).parse(d))
  .handler(async ({ data }) => {
    const { readWebsiteBrand } = await import("./fechou-brand.server");
    return readWebsiteBrand(data.url);
  });

export const getCrmCompanyDefaults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [tools, profile] = await Promise.all([
      context.supabase.from("tool_user_profiles").select("company,first_name,last_name,email,phone,segment").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("profiles").select("full_name,email,phone,address_street,address_number,address_city,address_state,address_country,address_zip").eq("user_id", context.userId).maybeSingle(),
    ]);
    if (tools.error || profile.error) throw new Error("Não foi possível ler seu cadastro.");
    const t = tools.data; const p = profile.data;
    return { ...emptyCompanyBrand, name: t?.company ?? "", contact: t ? `${t.first_name} ${t.last_name}`.trim() : p?.full_name ?? "", email: t?.email || p?.email || String(context.claims['email'] ?? ""), phone: t?.phone || p?.phone || "", segment: t?.segment || "", address: p ? [p.address_street, p.address_number, p.address_city, p.address_state, p.address_country, p.address_zip].filter(Boolean).join(", ") : "" };
  });

export const saveCrmCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid().optional(), company: companyBrandSchema }).parse(d))
  .handler(async ({ data, context }) => {
    let id = data.id;
    if (!id) {
      const created = await context.supabase.rpc("fechou_create_company", { p_company: data.company });
      if (created.error || !created.data) throw new Error("Não foi possível criar a empresa. Confira sua verificação em duas etapas.");
      return { id: created.data };
    }
    const result = await context.supabase.from("fechou_workspaces").update({ name: data.company.name, company_data: data.company }).eq("id", id).select("id").single();
    if (result.error) throw new Error("Não foi possível salvar os dados da empresa.");
    return { id: result.data.id };
  });