import { createServerFn } from "@tanstack/react-start";

import type { PublicAddress } from "./company-address";

/** Leitura pública (sem autenticação) dos campos de endereço já cadastrados no painel. */
export const getPublicCompanyAddress = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicAddress> => {
    const { FALLBACK_ADDRESS, countryCode } = await import("./company-address");
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("company_profile")
        .select(
          "address_street, address_number, address_complement, address_city, address_state, address_zip, address_country",
        )
        .limit(1)
        .maybeSingle();
      if (!data) return FALLBACK_ADDRESS;
      const row = data as Record<string, string | null>;
      const street = [row["address_street"], row["address_number"], row["address_complement"]]
        .map((p) => (p ?? "").trim())
        .filter(Boolean)
        .join(", ");
      return {
        streetAddress: street,
        postalCode: (row["address_zip"] ?? "").trim(),
        addressLocality: (row["address_city"] ?? "").trim() || FALLBACK_ADDRESS.addressLocality,
        addressRegion: (row["address_state"] ?? "").trim() || FALLBACK_ADDRESS.addressRegion,
        addressCountry: countryCode(row["address_country"] ?? ""),
      };
    } catch {
      return FALLBACK_ADDRESS;
    }
  },
);

export type PublicCompanyIdentity = {
  legalName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
};

/** Dados institucionais exibidos no rodapé (razão social, CNPJ, endereço e contatos). */
export const getPublicCompanyIdentity = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCompanyIdentity> => {
    const empty: PublicCompanyIdentity = { legalName: "", cnpj: "", address: "", phone: "", email: "" };
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("company_profile")
        .select(
          "trade_name, legal_name, cnpj, phone, email, address_street, address_number, address_complement, address_district, address_city, address_state, address_zip, address_country",
        )
        .limit(1)
        .maybeSingle();
      if (!data) return empty;
      const row = data as Record<string, string | null>;
      const val = (k: string) => (row[k] ?? "").trim();
      const street = [val("address_street"), val("address_number")].filter(Boolean).join(", ");
      const cityState = [val("address_city"), val("address_state")].filter(Boolean).join(" - ");
      const address = [
        street,
        val("address_complement"),
        val("address_district"),
        cityState,
        val("address_zip"),
        val("address_country"),
      ]
        .filter(Boolean)
        .join(" — ");
      return {
        legalName: val("legal_name") || val("trade_name"),
        cnpj: val("cnpj"),
        address,
        phone: val("phone"),
        email: val("email"),
      };
    } catch {
      return empty;
    }
  },
);
