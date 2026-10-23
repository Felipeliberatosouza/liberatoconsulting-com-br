import { pickFeature, type Feature, type ToolRef } from "./editorial-rules";

type Rotation = { newsletterTool?: string | null; bulletin?: Feature | null };

async function db() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

export async function getRotation(): Promise<Rotation> {
  const { data } = await (await db()).from("site_settings").select("value").eq("key", "editorial_rotation").maybeSingle();
  return (data?.value ?? {}) as Rotation;
}

export async function saveRotation(patch: Rotation) {
  const current = await getRotation();
  await (await db()).from("site_settings").upsert(
    { key: "editorial_rotation", value: { ...current, ...patch } as never },
    { onConflict: "key" },
  );
}

/** Ferramentas publicadas, da mais recente para a mais antiga. */
export async function publishedTools(): Promise<ToolRef[]> {
  const { data } = await (await db())
    .from("interactive_tools")
    .select("slug, title, summary")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);
  return (data ?? []) as ToolRef[];
}

/** Último artigo publicado (o mais recente cadastrado). */
export async function latestArticle() {
  const { data } = await (await db())
    .from("content_articles")
    .select("title, summary, slug")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { title: string; summary: string; slug: string } | null;
}

export async function latestNewsletter() {
  const { data } = await (await db())
    .from("newsletter_campaigns")
    .select("slug, subject")
    .not("sent_at", "is", null)
    .not("slug", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as { slug: string; subject: string } | null;
}

export function featureLink(origin: string, f: Feature, tools: ToolRef[]) {
  if (f.kind === "tool") {
    const t = tools.find((x) => x.slug === f.slug);
    return { url: `${origin}/ferramentas/${f.slug}`, title: t?.title ?? "Ferramenta de gestão" };
  }
  return { url: `${origin}/guia-gestao`, title: "Guia de Gestão Liberato" };
}

/** Destaque (ferramenta ou guia) para o rodapé, sem repetir o boletim anterior. */
export async function rotatingFeature(origin: string) {
  const [tools, rot] = await Promise.all([publishedTools(), getRotation()]);
  const f = pickFeature(tools[0] ?? null, true, rot.bulletin ?? null);
  return { feature: f, ...featureLink(origin, f, tools) };
}
