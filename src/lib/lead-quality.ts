/** Classificação automática da qualidade de um lead de prospecção. */
export type LeadQuality = "completo" | "parcial" | "basico";

type QualityInput = {
  email?: string;
  phone?: string;
  website?: string;
  owner_name?: string;
  contacts?: Array<{ full_name?: string; role_title?: string; email?: string; phone?: string; linkedin_url?: string }>;
};

const has = (v?: string) => Boolean(v && v.trim());

export function leadQuality(lead: QualityInput): LeadQuality {
  const contacts = lead.contacts ?? [];
  const decisorWithChannel = contacts.some(
    (c) => has(c.full_name) && has(c.role_title) && (has(c.email) || has(c.phone) || has(c.linkedin_url)),
  );
  const companyChannel = has(lead.email) || has(lead.phone);
  if (decisorWithChannel && (companyChannel || contacts.some((c) => has(c.email) || has(c.phone)))) return "completo";
  if (companyChannel || decisorWithChannel) return "parcial";
  return "basico";
}

/** Indica se o lead parece grande demais para o foco em PMEs. */
export function isLargeCompany(lead: { size?: string; employees?: number | null }, maxEmployees: number | null): boolean {
  if (lead.size === "corporacao") return true;
  const limit = maxEmployees ?? 499;
  return typeof lead.employees === "number" && lead.employees > limit;
}
