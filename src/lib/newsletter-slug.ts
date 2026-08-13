/** Endereço amigável (slug) das newsletters publicadas. */
export function newsletterSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/** Garante que o endereço amigável não colida com outra newsletter. */
export async function uniqueNewsletterSlug(client: any, base: string, currentId: string | null) {
  const root = base || "newsletter";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await client
      .from("newsletter_campaigns")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === currentId) return candidate;
  }
  return `${root}-${Date.now()}`;
}
