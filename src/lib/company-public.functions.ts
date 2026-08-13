import { createServerFn } from "@tanstack/react-start";

/** Endereço público da consultoria, usado apenas nos dados estruturados (schema.org). */
export type PublicAddress = {
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
};

const FALLBACK: PublicAddress = {
  streetAddress: "",
  postalCode: "",
  addressLocality: "São Paulo",
  addressRegion: "SP",
  addressCountry: "BR",
};

function countryCode(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return "BR";
  if (v === "brasil" || v === "brazil" || v === "br") return "BR";
  return value.trim();
}

/** Leitura pública (sem autenticação) dos campos de endereço já cadastrados no painel. */
export const getPublicCompanyAddress = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicAddress> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("company_profile")
        .select(
          "address_street, address_number, address_complement, address_city, address_state, address_zip, address_country",
        )
        .limit(1)
        .maybeSingle();
      if (!data) return FALLBACK;
      const row = data as Record<string, string | null>;
      const street = [row["address_street"], row["address_number"], row["address_complement"]]
        .map((p) => (p ?? "").trim())
        .filter(Boolean)
        .join(", ");
      return {
        streetAddress: street,
        postalCode: (row["address_zip"] ?? "").trim(),
        addressLocality: (row["address_city"] ?? "").trim() || FALLBACK.addressLocality,
        addressRegion: (row["address_state"] ?? "").trim() || FALLBACK.addressRegion,
        addressCountry: countryCode(row["address_country"] ?? ""),
      };
    } catch {
      return FALLBACK;
    }
  },
);

/** Monta o objeto PostalAddress omitindo campos ainda não preenchidos. */
export function postalAddressSchema(a: PublicAddress | undefined) {
  const addr = a ?? FALLBACK;
  return {
    "@type": "PostalAddress",
    ...(addr.streetAddress ? { streetAddress: addr.streetAddress } : {}),
    ...(addr.postalCode ? { postalCode: addr.postalCode } : {}),
    addressLocality: addr.addressLocality,
    addressRegion: addr.addressRegion,
    addressCountry: addr.addressCountry,
  };
}
