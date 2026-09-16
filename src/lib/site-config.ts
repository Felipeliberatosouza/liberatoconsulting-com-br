import type { Dict } from "@/i18n/pt";
import type { Lang } from "@/i18n/config";

/** Contagem inicial padronizada de leituras de todo conteúdo. */
export const READ_COUNT_BASE = 20;

/** Campos de cor editáveis no painel (paleta principal). */
export const THEME_FIELDS = [
  { key: "primary", label: "Primária (botões e destaques escuros)", fallback: "#1b2436" },
  { key: "accent", label: "Destaque (laranja da marca)", fallback: "#e2751f" },
  { key: "ink", label: "Fundo escuro (faixas e rodapé)", fallback: "#14192a" },
  { key: "background", label: "Fundo do site", fallback: "#faf9f7" },
  { key: "foreground", label: "Texto principal", fallback: "#1d2333" },
] as const;

export type ThemeKey = (typeof THEME_FIELDS)[number]["key"];
export type Theme = Partial<Record<ThemeKey, string>>;

export type TextOverride = Partial<Record<Lang, string>>;
export type TextOverrides = Record<string, TextOverride>;

export type ArticleRecord = {
  id: string;
  slug: string;
  group_id: string;
  kind: string;
  title: string;
  summary: string;
  body: string;
  service: string;
  link_url: string | null;
  position: number;
  published: boolean;
  cover_url: string | null;
  authors: string;
  author_contact: string;
  file_path: string | null;
  file_name: string | null;
  read_count: number;
  rating_sum: number;
  rating_count: number;
  article_date: string | null;
  chart_data: string;
  table_data: string;
  translations: Record<
    string,
    {
      kind?: string;
      title?: string;
      summary?: string;
      body?: string;
      table_data?: string;
      chart_data?: string;
    }
  >;


};


export type Branding = { logoUrl?: string; whatsapp?: string; segments?: string[] };

/** Slides do carrossel da página inicial (ordem, exibição e imagem). */
export type HeroSlideSetting = { id: string; enabled: boolean; imageUrl?: string };
export type HeroSettings = { autoplayMs?: number; slides?: HeroSlideSetting[] };

export const HERO_SLIDE_IDS = ["consultoria", "pesquisas", "empreendedorismo", "operacoes", "estrategia"] as const;
export const DEFAULT_AUTOPLAY_MS = 7000;

/**
 * Normaliza a configuração salva, garantindo todos os slides padrão.
 * Slides adicionados ao projeto entram no topo do painel e do carrossel,
 * sem alterar a ordem já escolhida para os banners existentes.
 */
export function heroSlideOrder(hero: HeroSettings | undefined): HeroSlideSetting[] {
  const saved = hero?.slides ?? [];
  const known = saved.filter((s) => (HERO_SLIDE_IDS as readonly string[]).includes(s.id));
  const missing = HERO_SLIDE_IDS.filter((id) => !known.some((s) => s.id === id)).map((id) => ({
    id,
    enabled: true,
  }));
  return [...missing, ...known];
}

/** Conteúdo editável de cada tema da seção "Dados do Brasil". */
export type BrazilSectionText = { title: string; body: string; bullets: string[] };
export type BrazilSectionMeta = {
  sources?: string;
  authors?: string;
  authorContact?: string;
  updatedAt?: string;
};
export type BrazilSectionOverride = Partial<Record<Lang, BrazilSectionText>> & {
  meta?: BrazilSectionMeta;
};
export type BrazilOverrides = Record<string, BrazilSectionOverride>;

/** Banner (imagem de topo) de cada grande área do site. */
export type AreaBanner = { imageUrl?: string };
export type AreaBanners = Partial<Record<AreaKey, AreaBanner>>;

export type InstitutionalMetric = { value: string; label: string };
export type InstitutionalLogo = { name: string; imageUrl: string };
export type InstitutionalImpact = { title: string; body: string; imageUrl?: string };
export type InstitutionalFaq = { question: string; answer: string };
export type InstitutionalContent = {
  banner: { eyebrow: string; title: string; imageUrl?: string };
  introduction: { eyebrow: string; title: string; body: string };
  metrics: InstitutionalMetric[];
  logos: InstitutionalLogo[];
  impact: InstitutionalImpact[];
  faq: InstitutionalFaq[];
  mission: string;
  values: string;
  purpose: string;
};
export type InstitutionalSettings = InstitutionalContent & {
  translations?: Partial<Record<Exclude<Lang, "pt">, InstitutionalContent>>;
};

export const DEFAULT_INSTITUTIONAL: InstitutionalSettings = {
  banner: {
    eyebrow: "Resultado real, investimento justo",
    title: "Nosso compromisso é melhorar os seus resultados, melhorar a sua margem de lucro!",
  },
  introduction: {
    eyebrow: "Resultados que permanecem",
    title: "Gestão prática para transformar desafios em desempenho",
    body: "Unimos estratégia, execução e inteligência aplicada para melhorar margens, acelerar vendas e fortalecer a capacidade de gestão da sua empresa.",
  },
  metrics: [
    { value: "+50", label: "empresas atendidas" },
    { value: "R$ 120 mi", label: "em resultados gerados" },
    { value: "8,4x", label: "retorno sobre investimento" },
    { value: "20+", label: "anos de experiência" },
  ],
  logos: [],
  impact: [
    { title: "Aumente sua margem de lucro", body: "Decisões orientadas por dados, custos sob controle e foco no resultado." },
    { title: "Aumente suas vendas", body: "Estratégia comercial, inteligência de mercado e execução disciplinada." },
    { title: "Melhore seus processos e sua capacidade de execução", body: "Rotinas claras, produtividade e gestão que sustenta o crescimento." },
    { title: "Conheça melhor o Brasil, para investir melhor", body: "Pesquisa confiável para decisões de entrada, expansão e investimento." },
    { title: "Tenha autonomia", body: "Ferramentas de IA que dão autonomia ao seu time após os nossos serviços." },
  ],
  faq: [
    { question: "Como a Liberato Consulting atua?", answer: "Trabalhamos ao lado da liderança e das equipes, conectando diagnóstico, metas, execução e acompanhamento dos resultados." },
    { question: "A consultoria atende empresas de quais portes?", answer: "Atendemos pequenas e médias empresas, corporações e investidores, com escopo ajustado ao desafio e à estrutura de cada organização." },
    { question: "A inteligência artificial substitui a equipe?", answer: "Não. Aplicamos IA como ferramenta de análise, produtividade e decisão, sempre com validação humana e transferência de conhecimento." },
    { question: "Como acesso as ferramentas gratuitas de gestão?", answer: "Crie uma conta gratuita, complete seu perfil e acesse a biblioteca de guias e planilhas disponibilizados pela Liberato Consulting." },
  ],
  mission: "Transformar estratégia em resultados mensuráveis, com método, tecnologia e desenvolvimento das pessoas.",
  values: "Ética, objetividade, excelência, respeito às pessoas, decisões baseadas em evidências e compromisso com o resultado do cliente.",
  purpose: "Ajudar organizações a tomar decisões melhores e construir capacidade própria para crescer com consistência.",
};

export const AREA_KEYS = ["services", "about", "content", "brazil"] as const;
export type AreaKey = (typeof AREA_KEYS)[number];

export type SiteConfig = {
  theme: Theme;
  texts: TextOverrides;
  articles: ArticleRecord[];
  branding: Branding;
  hero: HeroSettings;
  brazil: BrazilOverrides;
  banners: AreaBanners;
  institutional: InstitutionalSettings;
  /** Serviços cadastrados no painel (sem preços). */
  products: import("./services-catalog").ServiceProduct[];
};

export const EMPTY_CONFIG: SiteConfig = {
  theme: {},
  texts: {},
  articles: [],
  branding: {},
  hero: {},
  brazil: {},
  banners: {},
  institutional: DEFAULT_INSTITUTIONAL,
  products: [],
};

/** Lista todos os caminhos de texto (folhas string) do dicionário PT. */
export function flattenTexts(value: unknown, prefix = ""): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = [];
  if (typeof value === "string") {
    if (prefix) out.push({ path: prefix, value });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => out.push(...flattenTexts(v, `${prefix}[${i}]`)));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out.push(...flattenTexts(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}

function tokens(path: string): Array<string | number> {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

export function getByPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const key of tokens(path)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[key];
  }
  return cur;
}

function setByPath(obj: unknown, path: string, value: string) {
  const parts = tokens(path);
  let cur: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur == null || typeof cur !== "object") return;
    cur = cur[parts[i]!];
  }
  const last = parts[parts.length - 1]!;
  if (cur && typeof cur === "object" && last in cur) cur[last] = value;
}

/** Aplica os textos personalizados do painel sobre o dicionário do idioma atual. */
export function applyTextOverrides(dict: Dict, overrides: TextOverrides, lang: Lang): Dict {
  const entries = Object.entries(overrides ?? {});
  if (entries.length === 0) return dict;
  const clone = structuredClone(dict) as Dict;
  for (const [path, values] of entries) {
    const text = values?.[lang] ?? values?.pt;
    if (typeof text === "string" && text.length > 0) setByPath(clone, path, text);
  }
  return clone;
}

/** Aplica os textos de "Dados do Brasil" editados no painel sobre o dicionário. */
export function applyBrazilOverrides(dict: Dict, overrides: BrazilOverrides, lang: Lang): Dict {
  const entries = Object.entries(overrides ?? {});
  if (entries.length === 0) return dict;
  const map = new Map(entries);
  const sections = dict.brazil.sections.map((s) => {
    const o = map.get(s.id);
    const v = o?.[lang] ?? o?.pt;
    if (!v) return s;
    return {
      ...s,
      title: v.title?.trim() ? v.title : s.title,
      body: v.body?.trim() ? v.body : s.body,
      bullets: v.bullets && v.bullets.length > 0 ? v.bullets : s.bullets,
    };
  });
  return { ...dict, brazil: { ...dict.brazil, sections } } as Dict;
}

/** Converte hex/rgb informado no painel para valor aplicável em CSS var. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const field of THEME_FIELDS) {
    const value = theme?.[field.key];
    if (!value) {
      root.style.removeProperty(`--${field.key}`);
      continue;
    }
    root.style.setProperty(`--${field.key}`, value);
    if (field.key === "accent") root.style.setProperty("--ring", value);
  }
}
