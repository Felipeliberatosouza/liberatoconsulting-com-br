import { SOLUTIONS, TRAININGS, type Solution, type Training } from "./solutions";
import { EMPTY_PRODUCT, type ServiceProduct } from "./services-catalog";
import type { Lang } from "@/i18n/config";

const groups = ["empreendedorismo", "operacoes", "operacoes", "estrategia", "operacoes", "empreendedorismo", "pesquisas"];
const families = ["negocios-decisoes", "operacoes-eficiencia", "operacoes-eficiencia", "estrategia-metas", "operacoes-eficiencia", "negocios-decisoes", "pesquisas-brasil"];
const familyTitles = ["Empreendedorismo e Decisões", "Operações e Eficiência", "Operações e Eficiência", "Estratégia e Metas", "Operações e Eficiência", "Empreendedorismo e Decisões", "Pesquisas e Inteligência sobre o Brasil"];

/** Complete defaults can be registered once; never write data on page load. */
export function portfolioDefaults(): ServiceProduct[] {
  return [
    ...SOLUTIONS.map((s, i): ServiceProduct => ({
      ...EMPTY_PRODUCT, slug: s.slug, title: s.title.pt, lead: s.slogan.pt,
      problem: s.pain.pt, body: s.promise.pt, bullets: [s.chip.pt],
      modules: s.tools.pt, results: s.kpi.pt, group_id: groups[i] ?? "operacoes",
      groups: [groups[i] ?? "operacoes"], family_id: families[i] ?? "operacoes-eficiencia",
      family_title: familyTitles[i] ?? "Consultoria", position: i + 1,
      translations: Object.fromEntries((["en", "es", "zh"] as const).map((lang) => [lang, {
        title: s.title[lang], lead: s.slogan[lang], problem: s.pain[lang], body: s.promise[lang],
        bullets: [s.chip[lang]], modules: s.tools[lang], results: s.kpi[lang],
      }])),
    })),
    ...TRAININGS.map((t, i): ServiceProduct => ({
      ...EMPTY_PRODUCT, slug: t.slug, title: t.title.pt, lead: t.outcome.pt,
      body: t.outcome.pt, audience: t.audience.pt, group_id: "treinamento", groups: ["treinamento"],
      family_id: "treinamento-in-company", family_title: "Treinamento in Company", position: i + 8,
      translations: Object.fromEntries((["en", "es", "zh"] as const).map((lang) => [lang, {
        title: t.title[lang], lead: t.outcome[lang], body: t.outcome[lang], audience: t.audience[lang],
      }])),
    })),
  ];
}

function localized<T extends string | string[]>(row: ServiceProduct, field: "title" | "lead" | "problem" | "body" | "audience" | "bullets" | "modules" | "results", fallback: Record<Lang, T>): Record<Lang, T> {
  return Object.fromEntries((["pt", "en", "es", "zh"] as const).map((lang) => {
    const value = lang === "pt" ? row[field] : row.translations?.[lang]?.[field];
    return [lang, value === undefined ? fallback[lang] : value];
  })) as Record<Lang, T>;
}

/** Stable URLs/relationships; all visible service copy comes from the registry. */
export function resolvePortfolio(rows: ServiceProduct[]) {
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  const solutions: Solution[] = SOLUTIONS.flatMap((s) => {
    const row = bySlug.get(s.slug);
    if (!row) return [s];
    if (!row.published) return [];
    const chips = localized(row, "bullets", { pt: [s.chip.pt], en: [s.chip.en], es: [s.chip.es], zh: [s.chip.zh] });
    return [{ ...s, title: localized(row, "title", s.title), pain: localized(row, "problem", s.pain),
      slogan: localized(row, "lead", s.slogan), promise: localized(row, "body", s.promise),
      tools: localized(row, "modules", s.tools), kpi: localized(row, "results", s.kpi),
      chip: Object.fromEntries((["pt", "en", "es", "zh"] as const).map((lang) => [lang, chips[lang][0] ?? s.chip[lang]])) as Solution["chip"],
    }];
  });
  const trainings: Training[] = TRAININGS.flatMap((t) => {
    const row = bySlug.get(t.slug);
    if (!row) return [t];
    return row.published ? [{ ...t, title: localized(row, "title", t.title), audience: localized(row, "audience", t.audience), outcome: localized(row, "body", t.outcome) }] : [];
  });
  return { solutions, trainings };
}