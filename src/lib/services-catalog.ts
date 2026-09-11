import type { Dict } from "@/i18n/pt";
import type { Lang } from "@/i18n/config";

/** Tradução de um serviço para um idioma (campos textuais). */
export type ServiceProductTranslation = {
  title?: string;
  lead?: string;
  problem?: string;
  body?: string;
  audience?: string;
  duration?: string;
  level?: string;
  limits?: string;
  ai?: string;
  family?: string;
  bullets?: string[];
  results?: string[];
  modules?: string[];
};

/** Serviço (produto comercial) cadastrado na área administrativa. */
export type ServiceProduct = {
  id?: string;
  slug: string;
  group_id: string;
  groups: string[];
  family_id: string;
  family_title: string;
  code: string;
  title: string;
  lead: string;
  problem: string;
  body: string;
  audience: string;
  duration: string;
  duration_corporate: string;
  level: string;
  bullets: string[];
  results: string[];
  modules: string[];
  limits: string;
  ai: string;
  position: number;
  published: boolean;
  /** Preços internos: nunca aparecem nas páginas públicas. */
  price_sme?: string;
  price_corporate?: string;
  translations?: Partial<Record<Lang, ServiceProductTranslation>>;
};

export const EMPTY_PRODUCT: ServiceProduct = {
  slug: "",
  group_id: "",
  groups: [],
  family_id: "",
  family_title: "",
  code: "",
  title: "",
  lead: "",
  problem: "",
  body: "",
  audience: "",
  duration: "",
  duration_corporate: "",
  level: "",
  bullets: [],
  results: [],
  modules: [],
  limits: "",
  ai: "",
  position: 0,
  published: true,
  price_sme: "",
  price_corporate: "",
};

type DictPage = Dict["serviceDetail"]["pages"][number];

function pick(value: string | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function pickList(value: string[] | undefined, fallback: string[]) {
  return value && value.length > 0 ? value : fallback;
}

/** Converte um serviço do banco em uma página do dicionário, no idioma pedido. */
function toPage(row: ServiceProduct, lang: Lang, base?: DictPage): DictPage {
  const tr = lang === "pt" ? undefined : row.translations?.[lang];
  const fb = (key: keyof DictPage) => (base ? (base[key] as never) : undefined);
  return {
    ...(base ?? ({} as DictPage)),
    id: row.slug,
    group: row.group_id || (fb("group") as unknown as string) || "",
    groups: row.groups.length > 0 ? row.groups : ((fb("groups") as unknown as string[]) ?? []),
    code: row.code,
    family: pick(tr?.family, row.family_title),
    title: pick(tr?.title, row.title),
    lead: pick(tr?.lead, row.lead),
    problem: pick(tr?.problem, row.problem),
    body: pick(tr?.body, row.body),
    audience: pick(tr?.audience, row.audience),
    duration: pick(tr?.duration, row.duration),
    level: pick(tr?.level, row.level),
    bullets: pickList(tr?.bullets, row.bullets),
    results: pickList(tr?.results, row.results),
    modules: pickList(tr?.modules, row.modules),
    limits: pick(tr?.limits, row.limits),
    ai: pick(tr?.ai, row.ai),
  } as DictPage;
}

/**
 * Aplica os serviços cadastrados no painel sobre o dicionário do idioma atual.
 * O cadastro é a fonte dos produtos: textos, ordem, família e grupo.
 * Quando um idioma ainda não tem tradução salva, o texto do dicionário é mantido.
 */
export function applyServiceProducts(
  dict: Dict,
  rows: ServiceProduct[] | undefined,
  lang: Lang,
): Dict {
  if (!rows || rows.length === 0) return dict;

  const bySlug = new Map(dict.serviceDetail.pages.map((p) => [p.id, p]));
  const ordered = [...rows].sort((a, b) => a.position - b.position);

  const pages: DictPage[] = ordered
    .filter((r) => r.published !== false)
    .map((r) => {
      const base = bySlug.get(r.slug);
      // Sem tradução salva no idioma, preserva o texto já traduzido do dicionário.
      const merged = toPage(r, lang, base);
      if (lang !== "pt" && base && !r.translations?.[lang]) {
        return { ...merged, ...base, id: r.slug, groups: merged.groups, group: merged.group };
      }
      return merged;
    });

  const items = dict.serviceFamilies.items.map((f) => ({
    ...f,
    products: ordered
      .filter((r) => r.published !== false && r.family_id === f.id)
      .map((r) => r.slug),
  }));

  return {
    ...dict,
    serviceFamilies: { ...dict.serviceFamilies, items },
    serviceDetail: { ...dict.serviceDetail, pages },
  } as Dict;
}
