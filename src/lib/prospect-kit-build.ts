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
      lines: [c.education, c.experience, c.clients].map((x: unknown) => String(x ?? "").replace(/\s+/g, " ").trim()),
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
