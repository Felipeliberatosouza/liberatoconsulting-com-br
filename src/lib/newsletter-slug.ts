import { shortSlug } from "./short-slug";

/** Endereço amigável (slug) das newsletters publicadas: no máximo duas palavras. */
export function newsletterSlug(title: string) {
  return shortSlug(title);
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
