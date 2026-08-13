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
