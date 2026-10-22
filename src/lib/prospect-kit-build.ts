/** Monta e salva o material de prospecção com os dados atuais do painel. */
import { listConsultants } from "./consultants.functions";
import { getPresentationContext } from "./presentation.functions";
import { prepareImage } from "./presentation-deck";
import { buildKitBanner, buildKitDeck, type KitInput } from "./prospect-kit";
import { saveProspectKit } from "./prospect-kit.functions";

export async function regenerateProspectKit() {
  const [ctx, cons] = await Promise.all([getPresentationContext(), listConsultants().catch(() => [])]);
  const [logo, logoLight] = await Promise.all([prepareImage(ctx.liberatoLogo, false), prepareImage(ctx.liberatoLogoLight, false)]);
  const inst = ctx.institutional as any;
  const k: KitInput = {
    logo,
    logoLight,
    introduction: {
      title: inst.introduction?.title || "Gestão estratégica com inteligência artificial",
      body: inst.introduction?.body || inst.purpose || "",
    },
    metrics: (inst.metrics ?? []).map((m: any) => ({ value: String(m.value ?? ""), label: String(m.label ?? "") })),
    impact: inst.impact ?? [],
    services: (ctx.services ?? [])
      .filter((s: any) => s.published !== false)
      .map((s: any) => ({ title: String(s.title ?? ""), bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [] })),
    consultants: (cons as any[]).slice(0, 2).map((c) => ({
      name: c.full_name,
      headline: c.headline ?? "",
      education: educationBullets(String(c.education ?? "")),
      clients: String(c.clients ?? "").replace(/\.\s*$/, "").split(/[,;\n]/).map((s) => s.trim()).filter(Boolean),
      specialties: (Array.isArray(c.specialties) ? c.specialties : []).map((s: unknown) => String(s).split(" · ").pop()!.trim()).filter(Boolean),
    })),
    identity: {
      tradeName: ctx.identity?.tradeName ?? "Liberato Consulting",
      website: ctx.identity?.website ?? "https://liberatoconsulting.com.br",
      phone: ctx.identity?.phone ?? "",
      email: ctx.identity?.email ?? "",
      address: ctx.identity?.address ?? "",
    },
  };
  const [banner, deck] = await Promise.all([buildKitBanner(k), buildKitDeck(k)]);
  return saveProspectKit({ data: { banner, ...deck } });
}

/** "- Instituição (SIGLA). Curso, ano | Curso 2, ano" → ["Curso — SIGLA (ano)", ...], sem traço inicial. */
export function educationBullets(raw: string): string[] {
  const out: string[] = [];
  for (const line of raw.split(/\n+/)) {
    const l = line.replace(/^[\s\-–•·]+/, "").trim();
    if (!l) continue;
    const dot = l.indexOf(". ");
    const inst = dot > 0 ? l.slice(0, dot) : "";
    const sigla = inst.match(/\(([^)]+)\)/)?.[1]?.split("/")[0]?.trim() || inst;
    const rest = dot > 0 ? l.slice(dot + 2) : l;
    const items: { course: string; year: string }[] = [];
    for (const seg of rest.split("|").map((x) => x.trim()).filter(Boolean)) {
      if (/^\d{4}$/.test(seg) && items.length) { items[items.length - 1]!.year = seg; continue; }
      const m = seg.match(/^(.*?)[,\s]+(\d{4})$/);
      items.push(m ? { course: m[1]!, year: m[2]! } : { course: seg, year: "" });
    }
    for (const it of items) out.push(`${it.course.replace(/[.,]$/, "")}${sigla ? ` — ${sigla}` : ""}${it.year ? ` (${it.year})` : ""}`);
  }
  return out;
}
