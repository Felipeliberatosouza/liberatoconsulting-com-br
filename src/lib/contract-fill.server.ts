import { formatDateExtenso, type ContractVars } from "./contract-fill";

function joinAddress(r: Record<string, unknown>, prefix = "address_") {
  const get = (k: string) => String(r[`${prefix}${k}`] ?? "").trim();
  const line = [get("street"), get("number"), get("complement")].filter(Boolean).join(", ");
  const city = [get("district"), get("city"), get("state")].filter(Boolean).join(" — ");
  return [line, city, get("zip"), get("country")].filter(Boolean).join(", ");
}

/**
 * Monta os valores usados no preenchimento automático do contrato a partir do
 * cadastro da pessoa (profiles) e dos dados da consultoria (company_profile).
 */
export async function buildContractVars(input: {
  userId?: string;
  email?: string;
}): Promise<ContractVars> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let query = supabaseAdmin.from("profiles").select("*").limit(1);
  query = input.userId ? query.eq("user_id", input.userId) : query.eq("email", input.email ?? "");
  const [{ data: profile }, { data: company }] = await Promise.all([
    query.maybeSingle(),
    supabaseAdmin
      .from("company_profile")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const p = (profile ?? {}) as Record<string, unknown>;
  const c = (company ?? {}) as Record<string, unknown>;
  const s = (v: unknown) => String(v ?? "").trim();

  return {
    nome: s(p["full_name"]),
    cpf: s(p["cpf"]),
    rg: s(p["rg"]),
    nacionalidade: s(p["nationality"]) || "brasileiro(a)",
    estado_civil: s(p["marital_status"]),
    endereco: joinAddress(p),
    email: s(p["email"]) || s(input.email),
    telefone: s(p["phone"]),
    banco: s(p["bank_name"]),
    agencia: s(p["bank_branch"]),
    conta: s(p["bank_account"]),
    pix: s(p["pix_key"]),
    empresa_razao_social: s(c["legal_name"]) || "Liberato Consulting",
    empresa_nome_fantasia: s(c["trade_name"]) || "Liberato Consulting",
    empresa_cnpj: s(c["cnpj"]),
    empresa_endereco: joinAddress(c),
    empresa_email: s(c["email"]) || "contato@liberatoconsulting.com.br",
    empresa_telefone: s(c["phone"]),
    empresa_site: s(c["website"]) || "https://liberatoconsulting.com.br",
    cidade_foro: s(c["address_city"]) || "São Paulo",
    data_extenso: formatDateExtenso(),
  };
}
