/**
 * Dados da consultoria (painel → Dados da consultoria) usados no rodapé
 * do Boletim Semanal e da Newsletter.
 */
export type CompanyFooter = {
  name: string;
  cnpj: string;
  address: string;
  email: string;
  phone: string;
  website: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Monta o endereço completo: rua, número, bairro, cidade, estado, país. */
export function formatCompanyAddress(c: Record<string, string | null | undefined>) {
  const street = [c["address_street"], c["address_number"]].filter(Boolean).join(", ");
  const cityState = [c["address_city"], c["address_state"]].filter(Boolean).join(" - ");
  return [street, c["address_complement"], c["address_district"], cityState, c["address_zip"], c["address_country"]]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" — ");
}

export function companyFooterFromRow(
  row: Record<string, string | null> | null | undefined,
  fallbackWebsite: string,
): CompanyFooter {
  const c = (row ?? {}) as Record<string, string | null>;
  return {
    // Nome fantasia tem prioridade sobre a razão social.
    name: c["trade_name"] || c["legal_name"] || "Liberato Consulting",
    cnpj: c["cnpj"] || "",
    address: formatCompanyAddress(c),
    email: c["email"] || "contato@liberatoconsulting.com.br",
    phone: c["phone"] || "",
    website: c["website"] || fallbackWebsite,
  };
}

/** Lê os dados cadastrados no painel administrativo. */
export async function loadCompanyFooter(fallbackWebsite: string): Promise<CompanyFooter> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle();
  return companyFooterFromRow(data as Record<string, string | null> | null, fallbackWebsite);
}

/**
 * Marca usada nos e-mails: logomarca atual do painel (Marca → logomarca,
 * depois Dados da consultoria → logo) e dados institucionais do rodapé.
 * Sempre lida no momento do disparo, para refletir alterações do painel.
 */
export async function loadEmailBrand(
  fallbackWebsite: string,
): Promise<{ company: CompanyFooter; logoUrl: string }> {
  const { EMAIL_LOGO_URL } = await import("./email-brand");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: companyRow }, { data: branding }] = await Promise.all([
    supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
    supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
  ]);
  const c = (companyRow ?? {}) as Record<string, string | null>;
  const company = companyFooterFromRow(c, fallbackWebsite);
  const logoUrl =
    ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl ||
    c["logo_url"] ||
    EMAIL_LOGO_URL;
  return { company, logoUrl };
}

/** Bloco HTML do rodapé (fundo escuro). */
export function companyFooterHtml(c: CompanyFooter) {
  const line = (text: string) =>
    text ? `<div style="font-size:12px;opacity:.75;margin-top:2px">${escapeHtml(text)}</div>` : "";
  const contact = [c.phone, c.email].filter(Boolean).join(" — ");
  return `<div style="font-size:13px;font-weight:700">${escapeHtml(c.name)}</div>
  ${line(c.cnpj ? `CNPJ ${c.cnpj}` : "")}
  ${line(c.address)}
  ${line(contact)}
  ${line(c.website)}`;
}

/** Bloco em texto simples do rodapé. */
export function companyFooterText(c: CompanyFooter) {
  return [
    c.name,
    c.cnpj ? `CNPJ ${c.cnpj}` : "",
    c.address,
    [c.phone, c.email].filter(Boolean).join(" — "),
    c.website,
  ]
    .filter(Boolean)
    .join("\n");
}
