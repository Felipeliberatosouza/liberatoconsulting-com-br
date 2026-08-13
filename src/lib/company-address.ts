/** Endereço público da consultoria, usado apenas nos dados estruturados (schema.org). */
export type PublicAddress = {
  streetAddress: string;
  postalCode: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
};

export const FALLBACK_ADDRESS: PublicAddress = {
  streetAddress: "",
  postalCode: "",
  addressLocality: "São Paulo",
  addressRegion: "SP",
  addressCountry: "BR",
};

export function countryCode(value: string) {
  const v = value.trim().toLowerCase();
  if (!v) return "BR";
  if (v === "brasil" || v === "brazil" || v === "br") return "BR";
  return value.trim();
}

/** Monta o objeto PostalAddress omitindo campos ainda não preenchidos no banco. */
export function postalAddressSchema(a: PublicAddress | undefined | null) {
  const addr = a ?? FALLBACK_ADDRESS;
  return {
    "@type": "PostalAddress",
    ...(addr.streetAddress ? { streetAddress: addr.streetAddress } : {}),
    ...(addr.postalCode ? { postalCode: addr.postalCode } : {}),
    addressLocality: addr.addressLocality || FALLBACK_ADDRESS.addressLocality,
    addressRegion: addr.addressRegion || FALLBACK_ADDRESS.addressRegion,
    addressCountry: addr.addressCountry || FALLBACK_ADDRESS.addressCountry,
  };
}
