import { brandFooterText, type EmailBrandIdentity } from "./email-brand";

/** Lê os dados institucionais cadastrados e devolve o rodapé dos e-mails. */
export async function getEmailBrandFooter(): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("company_profile")
      .select(
        "trade_name, legal_name, cnpj, phone, email, address_street, address_number, address_complement, address_district, address_city, address_state, address_zip, address_country",
      )
      .limit(1)
      .maybeSingle();
    if (!data) return brandFooterText(undefined);
    const row = data as Record<string, string | null>;
    const val = (k: string) => (row[k] ?? "").trim();
    const address = [
      [val("address_street"), val("address_number")].filter(Boolean).join(", "),
      val("address_complement"),
      val("address_district"),
      [val("address_city"), val("address_state")].filter(Boolean).join(" - "),
      val("address_zip"),
      val("address_country"),
    ]
      .filter(Boolean)
      .join(" — ");
    const identity: EmailBrandIdentity = {
      legalName: val("legal_name") || val("trade_name"),
      cnpj: val("cnpj"),
      address,
      phone: val("phone"),
      email: val("email"),
    };
    return brandFooterText(identity);
  } catch {
    return brandFooterText(undefined);
  }
}
