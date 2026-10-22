export const STANDARD_NEXT_STEPS = [
  "Escopo inicial e diagnóstico",
  "Reunião de alinhamentos e objetivos",
  "Proposta comercial. Assinatura de contrato e de NDA",
  "Início do cronograma",
];

export type PresentationSize = "pme" | "corporativo";
export function presentationSize(value: string): PresentationSize | "" {
  const text = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/grande|corpor|enterprise/.test(text)) return "corporativo";
  if (/micro|pequen|media|pme|startup|small|medium/.test(text)) return "pme";
  return "";
}

export function referenceDuration(duration: string, corporate: string, size: PresentationSize): string {
  const parts = duration.split(/\s*[·|;]\s*/);
  const chosen = size === "corporativo"
    ? corporate.trim() || parts.find(p => /corpor|grande/i.test(p)) || parts[parts.length - 1] || ""
    : parts.find(p => /PME|startup|pequen/i.test(p)) || parts[0] || "";
  return chosen.replace(/Duração de referência:\s*/gi, "").replace(/\s*\([^)]*\)/g, "").trim();
}

/** Compare only visible pixels; never recolor the image. */
export function logoBackground(pixels: ArrayLike<number>): "FFFFFF" | "1B2A41" {
  let white = 0, dark = 0, weight = 0;
  const linear = (c: number) => c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = (pixels[i + 3] ?? 0) / 255;
    if (alpha < 0.1) continue;
    const lum = 0.2126 * linear(pixels[i] ?? 0) + 0.7152 * linear(pixels[i + 1] ?? 0) + 0.0722 * linear(pixels[i + 2] ?? 0);
    white += alpha * (1.05 / (lum + 0.05));
    dark += alpha * ((Math.max(lum, 0.023) + 0.05) / (Math.min(lum, 0.023) + 0.05));
    weight += alpha;
  }
  return weight && dark > white ? "1B2A41" : "FFFFFF";
}

export type PresentationResource = { title: string; summary: string | null; url: string; category?: string | null; position?: number; popularity?: number; kind: "guide" | "tool" };
export function selectPresentationResources(resources: PresentationResource[], business: string) {
  const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const tokens = new Set(normalize(business).match(/[a-z]{4,}/g)?.filter(t => !["para", "empresa", "gestao", "sobre", "servico"].includes(t)) ?? []);
  const groups = [ /marketing|digital|agencia|vendas|comercial|prospeccao|clientes|crm/, /industria|lean|producao|operacoes|estoque/, /financeir|margem|precificacao|custos|equilibrio/ ];
  const context = normalize(business);
  const score = (r: PresentationResource) => {
    const text = normalize(`${r.title} ${r.category ?? ""} ${r.summary ?? ""}`);
    return [...tokens].filter(t => text.includes(t)).length + groups.filter(g => g.test(context) && g.test(text)).length * 3;
  };
  const tools = resources.filter(r => r.kind === "tool").sort((a, b) => score(b) - score(a) || (b.popularity ?? 0) - (a.popularity ?? 0) || (a.position ?? 9999) - (b.position ?? 9999) || a.title.localeCompare(b.title));
  const guide = resources.find(r => r.kind === "guide");
  return [...(guide ? [guide] : []), ...tools.slice(0, 1)];
}