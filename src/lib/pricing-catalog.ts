/**
 * Catálogo de etapas e atividades da consultoria usado na ferramenta de
 * precificação. Baseado no processo interno (Construção do Projeto →
 * Diagnóstico → Entregas → Apresentação → Acompanhamento) e revisado com as
 * práticas correntes do mercado de consultoria de gestão.
 */

export const PHASES = [
  { id: "p1", title: "1. Construção do Projeto" },
  { id: "p2", title: "2. Embasamento e Diagnóstico" },
  { id: "p3", title: "3. Desenvolvimento de Entregas" },
  { id: "p4", title: "4. Apresentação" },
  { id: "p5", title: "5. Acompanhamento de Implementação" },
] as const;

export type PhaseId = (typeof PHASES)[number]["id"];

export type CatalogActivity = {
  id: string;
  phase: PhaseId;
  label: string;
  /** Horas por realização. */
  consultant: number;
  assistant: number;
  freelancer: number;
  /** Custo de serviços de terceiros por realização, em reais. */
  thirdParty: number;
  /** Número de realizações sugerido. */
  reps: number;
  /** Atividade normalmente presencial (vira on-line em projetos remotos). */
  onsite?: boolean;
};

export const CATALOG: CatalogActivity[] = [
  // 1. Construção do Projeto
  { id: "kickoff", phase: "p1", label: "Reunião de alinhamento de expectativas", consultant: 1.5, assistant: 0, freelancer: 0, thirdParty: 0, reps: 2 },
  { id: "scope", phase: "p1", label: "Desenho de escopo, plano de trabalho e cronograma", consultant: 4, assistant: 1, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "research-model", phase: "p1", label: "Construção do modelo de confiabilidade das pesquisas", consultant: 8, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "research-model-present", phase: "p1", label: "Apresentação do modelo de confiabilidade", consultant: 1.5, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "project-present", phase: "p1", label: "Apresentação do projeto aos patrocinadores", consultant: 1.5, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1, onsite: true },
  { id: "data-request", phase: "p1", label: "Plano de coleta de dados e acessos (data request list)", consultant: 2, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },

  // 2. Embasamento e Diagnóstico
  { id: "interviews", phase: "p2", label: "Entrevistas com liderança e áreas-chave", consultant: 2, assistant: 1, freelancer: 0, thirdParty: 0, reps: 8 },
  { id: "docs", phase: "p2", label: "Análise documental e de dados internos", consultant: 2, assistant: 2, freelancer: 0, thirdParty: 0, reps: 5 },
  { id: "process-obs", phase: "p2", label: "Observação de processos no local (gemba)", consultant: 1.5, assistant: 0, freelancer: 0, thirdParty: 0, reps: 3, onsite: true },
  { id: "survey", phase: "p2", label: "Survey quantitativo (campo e tabulação)", consultant: 2, assistant: 2, freelancer: 0, thirdParty: 1000, reps: 5 },
  { id: "mystery", phase: "p2", label: "Cliente oculto", consultant: 2, assistant: 0, freelancer: 0, thirdParty: 1250, reps: 4 },
  { id: "value-chain", phase: "p2", label: "Análise da cadeia de valor (interna e externa)", consultant: 8, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "kpi-baseline", phase: "p2", label: "Linha de base de indicadores e desempenho atual", consultant: 6, assistant: 3, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "benchmark", phase: "p2", label: "Benchmarking setorial e de concorrentes", consultant: 6, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "validations", phase: "p2", label: "Rodadas de validação com o cliente", consultant: 1, assistant: 0, freelancer: 0, thirdParty: 0, reps: 8 },
  { id: "diag-workshop", phase: "p2", label: "Workshop de validação do diagnóstico", consultant: 8, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1, onsite: true },

  // 3. Desenvolvimento de Entregas
  { id: "stakeholders", phase: "p3", label: "Perfil de sócios e stakeholders (problema, motivação, intuições)", consultant: 5, assistant: 2.5, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "market", phase: "p3", label: "Análise de mercado (concorrentes, segmentação, tamanho, persona)", consultant: 18, assistant: 14, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "offer", phase: "p3", label: "Proposta de produto/serviço, proposta de valor e posicionamento", consultant: 8, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "business-structure", phase: "p3", label: "Estruturação do negócio (vendas, marketing, RH, operações, tributário)", consultant: 13, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "business-model", phase: "p3", label: "Modelo de negócio e modelagem econômico-financeira", consultant: 13, assistant: 6.5, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "legal", phase: "p3", label: "Modelo de constituição legal e societária", consultant: 3.5, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "brand", phase: "p3", label: "Posicionamento de marca e identidade visual", consultant: 4.5, assistant: 0, freelancer: 2, thirdParty: 0, reps: 1 },
  { id: "process-design", phase: "p3", label: "Redesenho de processos (mapeamento AS-IS / TO-BE)", consultant: 12, assistant: 6, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "efficiency", phase: "p3", label: "Plano de eficiência operacional e redução de custos", consultant: 10, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "strategy-plan", phase: "p3", label: "Planejamento estratégico e desdobramento de metas", consultant: 14, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "governance", phase: "p3", label: "Modelo de governança, rotina de gestão e painel de indicadores", consultant: 8, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "ai-roadmap", phase: "p3", label: "Roteiro de inteligência artificial e automação", consultant: 8, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "valuation", phase: "p3", label: "Valuation e análise de viabilidade econômica", consultant: 12, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "market-report", phase: "p3", label: "Relatório de pesquisa de mercado (Brasil) com fontes públicas", consultant: 10, assistant: 6, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "impl-plan", phase: "p3", label: "Plano de implementação com responsáveis e prazos", consultant: 6, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },

  // 4. Apresentação
  { id: "present-partners", phase: "p4", label: "Reunião de apresentação aos sócios", consultant: 4, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1, onsite: true },
  { id: "hands-on", phase: "p4", label: 'Workshop "Mão na Massa" com stakeholders', consultant: 4, assistant: 0, freelancer: 0, thirdParty: 0, reps: 1, onsite: true },
  { id: "docs-delivery", phase: "p4", label: "Preparação e entrega dos documentos finais", consultant: 10, assistant: 4, freelancer: 0, thirdParty: 0, reps: 1 },
  { id: "exec-deck", phase: "p4", label: "Modelagem da apresentação executiva para stakeholders", consultant: 6, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },

  // 5. Acompanhamento de Implementação
  { id: "followup", phase: "p5", label: "Reuniões de acompanhamento pós-conclusão", consultant: 2, assistant: 0, freelancer: 0, thirdParty: 0, reps: 2 },
  { id: "mentoring", phase: "p5", label: "Mentoria executiva mensal", consultant: 3, assistant: 0, freelancer: 0, thirdParty: 0, reps: 3 },
  { id: "impl-audit", phase: "p5", label: "Auditoria de implementação e ajuste de rotas", consultant: 6, assistant: 2, freelancer: 0, thirdParty: 0, reps: 1 },
];

export function catalogActivity(id: string) {
  return CATALOG.find((a) => a.id === id);
}

/** Atividade já parametrizada para um serviço específico. */
export type PricedActivity = {
  id: string;
  phase: PhaseId;
  label: string;
  consultant: number;
  assistant: number;
  freelancer: number;
  thirdParty: number;
  reps: number;
  onsite: boolean;
  enabled: boolean;
};

export function fromCatalog(a: CatalogActivity, enabled = true): PricedActivity {
  return {
    id: a.id,
    phase: a.phase,
    label: a.label,
    consultant: a.consultant,
    assistant: a.assistant,
    freelancer: a.freelancer,
    thirdParty: a.thirdParty,
    reps: a.reps,
    onsite: Boolean(a.onsite),
    enabled,
  };
}

/** Valores-hora e parâmetros globais da precificação (em reais). */
export type PricingRates = { consultant: number; assistant: number; freelancer: number };

export type PricingSettings = {
  rates: { sme: PricingRates; corporate: PricingRates };
  thirdPartyMarkup: number;
  hoursPerDay: number;
  /** Fator de ajuste do preço por país do cliente. */
  countryFactors: Record<string, number>;
  /** Cotações de reserva (1 BRL = X) usadas se a busca automática falhar. */
  fxFallback: Record<string, number>;
  aiSuggestion?: { text: string; sources: string; updatedAt: string };
};

export const DEFAULT_PRICING: PricingSettings = {
  rates: {
    sme: { consultant: 150, assistant: 30, freelancer: 100 },
    corporate: { consultant: 320, assistant: 60, freelancer: 180 },
  },
  thirdPartyMarkup: 0.25,
  hoursPerDay: 8,
  countryFactors: { BR: 1, PT: 1.6, US: 2.4, ES: 1.8, MX: 1.3, CL: 1.4, CN: 1.7, AE: 2.2 },
  fxFallback: { BRL: 1, USD: 0.185, CNY: 1.32, EUR: 0.17 },
};

export const COUNTRIES = [
  { id: "BR", label: "Brasil", currency: "BRL", lang: "pt" },
  { id: "PT", label: "Portugal", currency: "EUR", lang: "pt" },
  { id: "US", label: "Estados Unidos", currency: "USD", lang: "en" },
  { id: "ES", label: "Espanha", currency: "EUR", lang: "es" },
  { id: "MX", label: "México", currency: "USD", lang: "es" },
  { id: "CL", label: "Chile", currency: "USD", lang: "es" },
  { id: "CN", label: "China", currency: "CNY", lang: "zh" },
  { id: "AE", label: "Emirados Árabes", currency: "USD", lang: "en" },
] as const;

export const CURRENCIES = [
  { id: "BRL", label: "Real (R$)", symbol: "R$", locale: "pt-BR" },
  { id: "USD", label: "Dólar (US$)", symbol: "US$", locale: "en-US" },
  { id: "CNY", label: "Yuan (CN¥)", symbol: "CN¥", locale: "zh-CN" },
  { id: "EUR", label: "Euro (€)", symbol: "€", locale: "pt-PT" },
] as const;

export type CurrencyId = (typeof CURRENCIES)[number]["id"];

export function formatMoney(value: number, currency: string) {
  const c = CURRENCIES.find((x) => x.id === currency) ?? CURRENCIES[0];
  return new Intl.NumberFormat(c.locale, {
    style: "currency",
    currency: c.id,
    maximumFractionDigits: 0,
  }).format(value);
}

export type QuoteOptions = {
  companyType: "sme" | "corporate";
  country: string;
  currency: string;
  startDate: string;
  remoteOnly: boolean;
  discountPct: number;
  fxRate: number;
};

export type QuoteItem = {
  id: string;
  phase: PhaseId;
  label: string;
  hours: number;
  days: number;
  priceBrl: number;
  start: string;
  end: string;
  remoteNote: boolean;
};

export type QuotePhase = {
  id: PhaseId;
  title: string;
  days: number;
  priceBrl: number;
  start: string;
  end: string;
  items: QuoteItem[];
};

export type QuoteResult = {
  phases: QuotePhase[];
  totalHours: number;
  totalDays: number;
  subtotalBrl: number;
  discountBrl: number;
  totalBrl: number;
  totalCurrency: number;
  start: string;
  end: string;
};

function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let left = Math.max(0, Math.ceil(days) - 1);
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1;
  }
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function nextBusinessDay(from: Date) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Calcula o orçamento completo: preço por etapa, cronograma e total. */
export function buildQuote(
  activities: PricedActivity[],
  settings: PricingSettings,
  options: QuoteOptions,
): QuoteResult {
  const rates = settings.rates[options.companyType];
  const factor = settings.countryFactors[options.country] ?? 1;
  const hoursPerDay = settings.hoursPerDay || 8;

  let cursor = new Date(`${options.startDate}T12:00:00`);
  if (Number.isNaN(cursor.getTime())) cursor = new Date();
  while (cursor.getDay() === 0 || cursor.getDay() === 6) cursor.setDate(cursor.getDate() + 1);

  const start = new Date(cursor);
  const phases: QuotePhase[] = [];
  let totalHours = 0;
  let subtotal = 0;
  let totalDays = 0;

  for (const phase of PHASES) {
    const list = activities.filter((a) => a.enabled && a.phase === phase.id);
    if (list.length === 0) continue;
    const items: QuoteItem[] = [];
    const phaseStart = new Date(cursor);
    let phaseDays = 0;
    let phasePrice = 0;

    for (const a of list) {
      const reps = Math.max(0, a.reps || 0);
      const hours = (a.consultant + a.assistant + a.freelancer) * reps;
      const labor =
        (a.consultant * rates.consultant +
          a.assistant * rates.assistant +
          a.freelancer * rates.freelancer) *
        reps;
      const third = a.thirdParty * reps * (1 + settings.thirdPartyMarkup);
      const price = (labor + third) * factor;
      const days = Math.max(0.2, Math.round(((hours / hoursPerDay) * 10) / 10) / 1 || 0.2);
      const itemStart = new Date(cursor);
      const itemEnd = addBusinessDays(itemStart, days);
      cursor = nextBusinessDay(itemEnd);

      items.push({
        id: a.id,
        phase: a.phase,
        label: a.label,
        hours,
        days: Number(days.toFixed(1)),
        priceBrl: price,
        start: iso(itemStart),
        end: iso(itemEnd),
        remoteNote: options.remoteOnly && a.onsite,
      });
      phaseDays += days;
      phasePrice += price;
      totalHours += hours;
    }

    const phaseEnd = items.length > 0 ? items[items.length - 1]!.end : iso(phaseStart);
    phases.push({
      id: phase.id,
      title: phase.title,
      days: Number(phaseDays.toFixed(1)),
      priceBrl: phasePrice,
      start: iso(phaseStart),
      end: phaseEnd,
      items,
    });
    subtotal += phasePrice;
    totalDays += phaseDays;
  }

  const discountBrl = subtotal * (Math.max(0, Math.min(60, options.discountPct)) / 100);
  const totalBrl = subtotal - discountBrl;
  const end = phases.length > 0 ? phases[phases.length - 1]!.end : iso(start);

  return {
    phases,
    totalHours: Number(totalHours.toFixed(1)),
    totalDays: Number(totalDays.toFixed(1)),
    subtotalBrl: Math.round(subtotal),
    discountBrl: Math.round(discountBrl),
    totalBrl: Math.round(totalBrl),
    totalCurrency: Math.round(totalBrl * (options.fxRate || 1)),
    start: iso(start),
    end,
  };
}
