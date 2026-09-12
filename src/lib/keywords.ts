/**
 * Palavras e frases-chave de SEO da Liberato Consulting.
 *
 * Cada termo aponta para a página do projeto que realmente responde àquela
 * busca e traz a tradução nos quatro idiomas publicados. São usados em:
 *  - bloco visível de links internos (`SeoKeywordLinks`);
 *  - meta `keywords` das páginas principais;
 *  - `knowsAbout` da organização no JSON-LD.
 */

export type KeywordLang = "pt" | "en" | "es" | "zh";

export type KeywordLink = {
  /** Termo em português (fonte). */
  term: string;
  en: string;
  es: string;
  zh: string;
  path: string;
};

export type KeywordTheme = {
  id: string;
  title: string;
  titleEn: string;
  titleEs: string;
  titleZh: string;
  terms: KeywordLink[];
};

export const KEYWORD_THEMES: KeywordTheme[] = [
  {
    id: "gestao",
    title: "Consultoria empresarial e gestão estratégica",
    titleEn: "Management consulting and business strategy",
    titleEs: "Consultoría empresarial y gestión estratégica",
    titleZh: "企业管理与战略咨询",
    terms: [
      {
        term: "consultoria empresarial",
        en: "management consulting",
        es: "consultoría empresarial",
        zh: "企业管理咨询",
        path: "/services",
      },
      {
        term: "consultoria de gestão empresarial",
        en: "business management consulting",
        es: "consultoría de gestión empresarial",
        zh: "经营管理咨询",
        path: "/services",
      },
      {
        term: "consultoria estratégica empresarial",
        en: "corporate strategy consulting",
        es: "consultoría estratégica empresarial",
        zh: "企业战略咨询",
        path: "/services/plano-de-crescimento-e-posicionamento",
      },
      {
        term: "planejamento estratégico empresarial",
        en: "strategic planning for companies",
        es: "planificación estratégica empresarial",
        zh: "企业战略规划",
        path: "/services/plano-de-crescimento-e-posicionamento",
      },
      {
        term: "desdobramento de metas e KPIs",
        en: "goal deployment and KPIs",
        es: "despliegue de metas y KPIs",
        zh: "目标分解与关键绩效指标",
        path: "/services/rotina-de-gestao",
      },
      {
        term: "gestão da rotina empresarial",
        en: "daily management routine",
        es: "gestión de la rutina empresarial",
        zh: "日常经营管理",
        path: "/services/rotina-de-gestao",
      },
      {
        term: "consultoria para pequenas e médias empresas",
        en: "consulting for small and medium businesses",
        es: "consultoría para pequeñas y medianas empresas",
        zh: "中小企业咨询",
        path: "/services",
      },
      {
        term: "consultoria para crescimento empresarial",
        en: "business growth consulting",
        es: "consultoría para el crecimiento empresarial",
        zh: "企业增长咨询",
        path: "/services/growth-strategy-office",
      },
      {
        term: "consultoria para expansão de negócios",
        en: "business expansion consulting",
        es: "consultoría para la expansión de negocios",
        zh: "业务扩张咨询",
        path: "/services/growth-strategy-office",
      },
      {
        term: "consultoria de posicionamento de mercado",
        en: "market positioning consulting",
        es: "consultoría de posicionamiento de mercado",
        zh: "市场定位咨询",
        path: "/services/plano-de-crescimento-e-posicionamento",
      },
    ],
  },
  {
    id: "operacoes",
    title: "Eficiência operacional e processos",
    titleEn: "Operational efficiency and processes",
    titleEs: "Eficiencia operativa y procesos",
    titleZh: "运营效率与流程",
    terms: [
      {
        term: "eficiência operacional",
        en: "operational efficiency",
        es: "eficiencia operativa",
        zh: "运营效率",
        path: "/services/eficiencia-90",
      },
      {
        term: "consultoria de excelência operacional",
        en: "operational excellence consulting",
        es: "consultoría de excelencia operativa",
        zh: "卓越运营咨询",
        path: "/services/programa-de-excelencia-operacional",
      },
      {
        term: "gestão de processos",
        en: "business process management",
        es: "gestión de procesos",
        zh: "流程管理",
        path: "/services/programa-de-excelencia-operacional",
      },
      {
        term: "automação de processos empresariais",
        en: "business process automation",
        es: "automatización de procesos empresariales",
        zh: "业务流程自动化",
        path: "/services/automacao-de-processo-prioritario",
      },
      {
        term: "consultoria de produtividade empresarial",
        en: "business productivity consulting",
        es: "consultoría de productividad empresarial",
        zh: "企业生产力咨询",
        path: "/services/sprint-de-produtividade",
      },
      {
        term: "consultoria para redução de custos empresariais",
        en: "cost reduction consulting",
        es: "consultoría para la reducción de costes",
        zh: "企业降本咨询",
        path: "/services/eficiencia-90",
      },
    ],
  },
  {
    id: "ia",
    title: "Inteligência artificial aplicada aos negócios",
    titleEn: "Artificial intelligence applied to business",
    titleEs: "Inteligencia artificial aplicada a los negocios",
    titleZh: "人工智能在企业中的应用",
    terms: [
      {
        term: "inteligência artificial para empresas",
        en: "artificial intelligence for business",
        es: "inteligencia artificial para empresas",
        zh: "企业人工智能",
        path: "/services/mapa-digital-e-ia-pratica",
      },
      {
        term: "consultoria em IA para empresas",
        en: "AI consulting for companies",
        es: "consultoría en IA para empresas",
        zh: "企业人工智能咨询",
        path: "/services/mapa-digital-e-ia-pratica",
      },
      {
        term: "consultoria de inteligência artificial corporativa",
        en: "enterprise AI consulting",
        es: "consultoría de inteligencia artificial corporativa",
        zh: "企业级人工智能咨询",
        path: "/services/enterprise-digital-and-ai-transformation",
      },
      {
        term: "implementação de IA em processos de negócios",
        en: "AI implementation in business processes",
        es: "implementación de IA en procesos de negocio",
        zh: "人工智能业务流程落地",
        path: "/services/automacao-de-processo-prioritario",
      },
      {
        term: "diagnóstico de maturidade em IA para empresas",
        en: "AI maturity assessment for companies",
        es: "diagnóstico de madurez en IA para empresas",
        zh: "企业人工智能成熟度评估",
        path: "/services/mapa-digital-e-ia-pratica",
      },
      {
        term: "agentes de IA para operações corporativas",
        en: "AI agents for corporate operations",
        es: "agentes de IA para operaciones corporativas",
        zh: "企业运营人工智能代理",
        path: "/services/enterprise-digital-and-ai-transformation",
      },
      {
        term: "IA para tomada de decisão empresarial",
        en: "AI for business decision making",
        es: "IA para la toma de decisiones empresariales",
        zh: "人工智能辅助经营决策",
        path: "/services/decision-room",
      },
      {
        term: "consultoria em transformação digital",
        en: "digital transformation consulting",
        es: "consultoría en transformación digital",
        zh: "数字化转型咨询",
        path: "/services/enterprise-digital-and-ai-transformation",
      },
      {
        term: "consultoria em dados e analytics",
        en: "data and analytics consulting",
        es: "consultoría en datos y analítica",
        zh: "数据与分析咨询",
        path: "/services/market-signal-monitor",
      },
    ],
  },
  {
    id: "financas",
    title: "Finanças, preços e controladoria",
    titleEn: "Finance, pricing and controlling",
    titleEs: "Finanzas, precios y control de gestión",
    titleZh: "财务、定价与管控",
    terms: [
      {
        term: "consultoria financeira empresarial",
        en: "corporate finance consulting",
        es: "consultoría financiera empresarial",
        zh: "企业财务咨询",
        path: "/services/financeiro-sob-controle",
      },
      {
        term: "planejamento financeiro empresarial",
        en: "business financial planning",
        es: "planificación financiera empresarial",
        zh: "企业财务规划",
        path: "/services/financeiro-sob-controle",
      },
      {
        term: "gestão de fluxo de caixa",
        en: "cash flow management",
        es: "gestión del flujo de caja",
        zh: "现金流管理",
        path: "/services/financeiro-sob-controle",
      },
      {
        term: "advisory financeiro para empresas",
        en: "financial advisory for companies",
        es: "asesoría financiera para empresas",
        zh: "企业财务顾问",
        path: "/services/advisory-financeiro",
      },
      {
        term: "consultoria de controladoria para pequenas empresas",
        en: "controllership consulting for small businesses",
        es: "consultoría de control de gestión para pequeñas empresas",
        zh: "小企业管理会计咨询",
        path: "/services/performance-finance-and-controls",
      },
      {
        term: "consultoria em formação de preços",
        en: "pricing structure consulting",
        es: "consultoría en formación de precios",
        zh: "价格体系咨询",
        path: "/services/price-and-value-intelligence",
      },
      {
        term: "consultoria de pricing e estratégia de preços",
        en: "pricing strategy consulting",
        es: "consultoría de pricing y estrategia de precios",
        zh: "定价战略咨询",
        path: "/services/price-and-value-intelligence",
      },
    ],
  },
  {
    id: "comercial",
    title: "Vendas, clientes e experiência",
    titleEn: "Sales, customers and experience",
    titleEs: "Ventas, clientes y experiencia",
    titleZh: "销售、客户与体验",
    terms: [
      {
        term: "consultoria comercial",
        en: "sales consulting",
        es: "consultoría comercial",
        zh: "销售咨询",
        path: "/services/sprint-comercial",
      },
      {
        term: "consultoria de vendas B2B",
        en: "B2B sales consulting",
        es: "consultoría de ventas B2B",
        zh: "B2B 销售咨询",
        path: "/services/sprint-comercial",
      },
      {
        term: "consultoria de CRM",
        en: "CRM consulting",
        es: "consultoría de CRM",
        zh: "客户关系管理咨询",
        path: "/services/cliente-que-retem",
      },
      {
        term: "consultoria para retenção de clientes",
        en: "customer retention consulting",
        es: "consultoría para la retención de clientes",
        zh: "客户留存咨询",
        path: "/services/cliente-que-retem",
      },
      {
        term: "consultoria de experiência do cliente",
        en: "customer experience consulting",
        es: "consultoría de experiencia del cliente",
        zh: "客户体验咨询",
        path: "/services/customer-growth-and-experience-transformation",
      },
      {
        term: "pesquisa de satisfação de clientes",
        en: "customer satisfaction research",
        es: "encuesta de satisfacción de clientes",
        zh: "客户满意度调研",
        path: "/services/customer-insight-sprint",
      },
      {
        term: "consultoria para lançamento de novos produtos",
        en: "new product launch consulting",
        es: "consultoría para el lanzamiento de nuevos productos",
        zh: "新产品上市咨询",
        path: "/services/concept-and-proposition-test",
      },
    ],
  },
  {
    id: "pesquisas",
    title: "Pesquisa de mercado e inteligência competitiva",
    titleEn: "Market research and competitive intelligence",
    titleEs: "Investigación de mercado e inteligencia competitiva",
    titleZh: "市场研究与竞争情报",
    terms: [
      {
        term: "pesquisa de mercado para empresas",
        en: "market research for companies",
        es: "investigación de mercado para empresas",
        zh: "企业市场研究",
        path: "/services/market-opportunity-decision",
      },
      {
        term: "análise de concorrência empresarial",
        en: "competitor analysis",
        es: "análisis de la competencia",
        zh: "竞争对手分析",
        path: "/services/competitive-response-radar",
      },
      {
        term: "consultoria de inteligência competitiva",
        en: "competitive intelligence consulting",
        es: "consultoría de inteligencia competitiva",
        zh: "竞争情报咨询",
        path: "/services/competitive-response-radar",
      },
      {
        term: "estudo de viabilidade empresarial",
        en: "business feasibility study",
        es: "estudio de viabilidad empresarial",
        zh: "商业可行性研究",
        path: "/services/validacao-e-viabilidade",
      },
      {
        term: "estudo de dimensionamento de mercado no Brasil",
        en: "market sizing study in Brazil",
        es: "estudio de dimensionamiento de mercado en Brasil",
        zh: "巴西市场规模研究",
        path: "/services/market-opportunity-decision",
      },
      {
        term: "inteligência de mercado e dados no Brasil",
        en: "market intelligence and data on Brazil",
        es: "inteligencia de mercado y datos de Brasil",
        zh: "巴西市场情报与数据",
        path: "/brasil",
      },
      {
        term: "análise setorial e regulatória no Brasil",
        en: "sector and regulatory analysis in Brazil",
        es: "análisis sectorial y regulatorio en Brasil",
        zh: "巴西行业与监管分析",
        path: "/brasil/setores-estrategicos",
      },
      {
        term: "mapeamento de concorrentes e barreiras de entrada no Brasil",
        en: "competitor mapping and entry barriers in Brazil",
        es: "mapeo de competidores y barreras de entrada en Brasil",
        zh: "巴西竞争格局与进入壁垒",
        path: "/services/brazil-entry-navigator",
      },
      {
        term: "market intelligence consulting Brazil",
        en: "market intelligence consulting Brazil",
        es: "consultoría de market intelligence en Brasil",
        zh: "巴西市场情报咨询",
        path: "/services/market-opportunity-decision",
      },
      {
        term: "market sizing and regulatory analysis Brazil",
        en: "market sizing and regulatory analysis Brazil",
        es: "dimensionamiento de mercado y análisis regulatorio en Brasil",
        zh: "巴西市场规模与监管分析",
        path: "/brasil",
      },
    ],
  },
  {
    id: "brasil",
    title: "Entrada e investimento no Brasil",
    titleEn: "Market entry and investment in Brazil",
    titleEs: "Entrada e inversión en Brasil",
    titleZh: "进入巴西市场与投资",
    terms: [
      {
        term: "consultoria de market entry no Brasil",
        en: "market entry consulting in Brazil",
        es: "consultoría de entrada al mercado brasileño",
        zh: "巴西市场进入咨询",
        path: "/services/brazil-entry-navigator",
      },
      {
        term: "consultoria para empresa estrangeira entrar no Brasil",
        en: "consulting for foreign companies entering Brazil",
        es: "consultoría para empresas extranjeras que entran en Brasil",
        zh: "外资企业进入巴西咨询",
        path: "/services/brazil-entry-navigator",
      },
      {
        term: "estudo de mercado para investimentos no Brasil",
        en: "market study for investments in Brazil",
        es: "estudio de mercado para inversiones en Brasil",
        zh: "巴西投资市场研究",
        path: "/brasil/investimento-estrangeiro",
      },
      {
        term: "estudo de mercado no Brasil para investidor estrangeiro",
        en: "Brazil market study for foreign investors",
        es: "estudio de mercado en Brasil para el inversor extranjero",
        zh: "面向外国投资者的巴西市场研究",
        path: "/brasil/investimento-estrangeiro",
      },
    ],
  },
  {
    id: "empreendedorismo",
    title: "Empreendedorismo e novos negócios",
    titleEn: "Entrepreneurship and new ventures",
    titleEs: "Emprendimiento y nuevos negocios",
    titleZh: "创业与新业务",
    terms: [
      {
        term: "consultoria para startups",
        en: "consulting for startups",
        es: "consultoría para startups",
        zh: "初创企业咨询",
        path: "/services/validacao-e-viabilidade",
      },
      {
        term: "validação de ideia de negócio",
        en: "business idea validation",
        es: "validación de idea de negocio",
        zh: "商业创意验证",
        path: "/services/validacao-e-viabilidade",
      },
      {
        term: "consultoria para plano de negócios",
        en: "business plan consulting",
        es: "consultoría para plan de negocio",
        zh: "商业计划咨询",
        path: "/services/modelagem-de-negocio",
      },
      {
        term: "consultoria em modelagem de negócios",
        en: "business modeling consulting",
        es: "consultoría en modelado de negocio",
        zh: "商业模式设计咨询",
        path: "/services/modelagem-de-negocio",
      },
    ],
  },
  {
    id: "pessoas",
    title: "Pessoas, liderança e mudança",
    titleEn: "People, leadership and change",
    titleEs: "Personas, liderazgo y cambio",
    titleZh: "人才、领导力与变革",
    terms: [
      {
        term: "consultoria de liderança e gestão de pessoas",
        en: "leadership and people management consulting",
        es: "consultoría de liderazgo y gestión de personas",
        zh: "领导力与人才管理咨询",
        path: "/services/organizacao-e-pessoas-para-crescer",
      },
      {
        term: "consultoria de gestão da mudança",
        en: "change management consulting",
        es: "consultoría de gestión del cambio",
        zh: "变革管理咨询",
        path: "/services/people-and-transformation-office",
      },
    ],
  },
  {
    id: "esg",
    title: "ESG, clima e sustentabilidade",
    titleEn: "ESG, climate and sustainability",
    titleEs: "ESG, clima y sostenibilidad",
    titleZh: "ESG、气候与可持续发展",
    terms: [
      {
        term: "consultoria ESG",
        en: "ESG consulting",
        es: "consultoría ESG",
        zh: "ESG 咨询",
        path: "/services/esg-essencial",
      },
      {
        term: "consultoria de sustentabilidade empresarial",
        en: "corporate sustainability consulting",
        es: "consultoría de sostenibilidad empresarial",
        zh: "企业可持续发展咨询",
        path: "/services/sustainability-and-climate-strategy",
      },
      {
        term: "consultoria de estratégia climática",
        en: "climate strategy consulting",
        es: "consultoría de estrategia climática",
        zh: "气候战略咨询",
        path: "/services/sustainability-and-climate-strategy",
      },
      {
        term: "consultoria de carbono e cadeia de suprimentos",
        en: "carbon and supply chain consulting",
        es: "consultoría de carbono y cadena de suministro",
        zh: "碳排放与供应链咨询",
        path: "/services/carbono-e-cadeia",
      },
    ],
  },
  {
    id: "seguranca",
    title: "Cibersegurança, privacidade e continuidade",
    titleEn: "Cybersecurity, privacy and continuity",
    titleEs: "Ciberseguridad, privacidad y continuidad",
    titleZh: "网络安全、隐私与业务连续性",
    terms: [
      {
        term: "consultoria de cibersegurança para empresas",
        en: "cybersecurity consulting for companies",
        es: "consultoría de ciberseguridad para empresas",
        zh: "企业网络安全咨询",
        path: "/services/cyber-essentials-pme",
      },
      {
        term: "avaliação de riscos cibernéticos",
        en: "cyber risk assessment",
        es: "evaluación de riesgos cibernéticos",
        zh: "网络风险评估",
        path: "/services/cyber-essentials-pme",
      },
      {
        term: "consultoria LGPD para empresas",
        en: "data protection law (LGPD) consulting",
        es: "consultoría LGPD para empresas",
        zh: "巴西数据保护法（LGPD）咨询",
        path: "/services/trust-review-mensal",
      },
      {
        term: "consultoria em privacidade de dados",
        en: "data privacy consulting",
        es: "consultoría en privacidad de datos",
        zh: "数据隐私咨询",
        path: "/services/trust-review-mensal",
      },
      {
        term: "consultoria em continuidade de negócios",
        en: "business continuity consulting",
        es: "consultoría en continuidad del negocio",
        zh: "业务连续性咨询",
        path: "/services/cyber-resilience-and-digital-trust",
      },
    ],
  },
];

/** Termo no idioma pedido (com retorno ao português). */
export function keywordTerm(k: KeywordLink, lang: KeywordLang = "pt"): string {
  if (lang === "en") return k.en;
  if (lang === "es") return k.es;
  if (lang === "zh") return k.zh;
  return k.term;
}

/** Título do tema no idioma pedido. */
export function themeTitle(theme: KeywordTheme, lang: KeywordLang = "pt"): string {
  if (lang === "en") return theme.titleEn;
  if (lang === "es") return theme.titleEs;
  if (lang === "zh") return theme.titleZh;
  return theme.title;
}

/** Temas filtrados por id (todos quando omitido). */
export function keywordThemes(themeIds?: string[]): KeywordTheme[] {
  return themeIds ? KEYWORD_THEMES.filter((t) => themeIds.includes(t.id)) : KEYWORD_THEMES;
}

/** Todos os termos de um idioma, em ordem de tema. */
export function allKeywords(lang: KeywordLang = "pt"): string[] {
  return KEYWORD_THEMES.flatMap((theme) => theme.terms.map((t) => keywordTerm(t, lang)));
}

/** Todos os termos em português (compatibilidade). */
export const ALL_KEYWORDS: string[] = allKeywords("pt");

/**
 * Lista para `knowsAbout`: termos em todos os idiomas, sem repetições.
 * Ajuda buscadores a associar a organização às buscas de cada mercado.
 */
export const ALL_KEYWORDS_MULTILINGUAL: string[] = Array.from(
  new Set([...allKeywords("pt"), ...allKeywords("en"), ...allKeywords("es"), ...allKeywords("zh")]),
);

/** Conteúdo pronto para a meta `keywords`, no idioma servido. */
export function keywordsMeta(themeIds?: string[], lang: KeywordLang = "pt") {
  return {
    name: "keywords",
    content: keywordThemes(themeIds)
      .flatMap((t) => t.terms.map((k) => keywordTerm(k, lang)))
      .join(", "),
  };
}
