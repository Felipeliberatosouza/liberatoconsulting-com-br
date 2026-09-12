/**
 * Palavras e frases-chave de SEO da Liberato Consulting.
 *
 * Cada termo aponta para a página do projeto que realmente responde àquela
 * busca. São usados em:
 *  - bloco visível de links internos (`SeoKeywordLinks`);
 *  - meta `keywords` das páginas principais;
 *  - `knowsAbout` da organização no JSON-LD.
 */

export type KeywordLink = { term: string; path: string };

export type KeywordTheme = {
  id: string;
  title: string;
  terms: KeywordLink[];
};

export const KEYWORD_THEMES: KeywordTheme[] = [
  {
    id: "gestao",
    title: "Consultoria empresarial e gestão estratégica",
    terms: [
      { term: "consultoria empresarial", path: "/services" },
      { term: "consultoria de gestão empresarial", path: "/services" },
      { term: "consultoria estratégica empresarial", path: "/services/plano-de-crescimento-e-posicionamento" },
      { term: "planejamento estratégico empresarial", path: "/services/plano-de-crescimento-e-posicionamento" },
      { term: "desdobramento de metas e KPIs", path: "/services/rotina-de-gestao" },
      { term: "gestão da rotina empresarial", path: "/services/rotina-de-gestao" },
      { term: "consultoria para pequenas e médias empresas", path: "/services" },
      { term: "consultoria para crescimento empresarial", path: "/services/growth-strategy-office" },
      { term: "consultoria para expansão de negócios", path: "/services/growth-strategy-office" },
      { term: "consultoria de posicionamento de mercado", path: "/services/plano-de-crescimento-e-posicionamento" },
    ],
  },
  {
    id: "operacoes",
    title: "Eficiência operacional e processos",
    terms: [
      { term: "eficiência operacional", path: "/services/eficiencia-90" },
      { term: "consultoria de excelência operacional", path: "/services/programa-de-excelencia-operacional" },
      { term: "gestão de processos", path: "/services/programa-de-excelencia-operacional" },
      { term: "automação de processos empresariais", path: "/services/automacao-de-processo-prioritario" },
      { term: "consultoria de produtividade empresarial", path: "/services/sprint-de-produtividade" },
      { term: "consultoria para redução de custos empresariais", path: "/services/eficiencia-90" },
    ],
  },
  {
    id: "ia",
    title: "Inteligência artificial aplicada aos negócios",
    terms: [
      { term: "inteligência artificial para empresas", path: "/services/mapa-digital-e-ia-pratica" },
      { term: "consultoria em IA para empresas", path: "/services/mapa-digital-e-ia-pratica" },
      { term: "consultoria de inteligência artificial corporativa", path: "/services/enterprise-digital-and-ai-transformation" },
      { term: "implementação de IA em processos de negócios", path: "/services/automacao-de-processo-prioritario" },
      { term: "diagnóstico de maturidade em IA para empresas", path: "/services/mapa-digital-e-ia-pratica" },
      { term: "agentes de IA para operações corporativas", path: "/services/enterprise-digital-and-ai-transformation" },
      { term: "IA para tomada de decisão empresarial", path: "/services/decision-room" },
      { term: "consultoria em transformação digital", path: "/services/enterprise-digital-and-ai-transformation" },
      { term: "consultoria em dados e analytics", path: "/services/market-signal-monitor" },
    ],
  },
  {
    id: "financas",
    title: "Finanças, preços e controladoria",
    terms: [
      { term: "consultoria financeira empresarial", path: "/services/financeiro-sob-controle" },
      { term: "planejamento financeiro empresarial", path: "/services/financeiro-sob-controle" },
      { term: "gestão de fluxo de caixa", path: "/services/financeiro-sob-controle" },
      { term: "advisory financeiro para empresas", path: "/services/advisory-financeiro" },
      { term: "consultoria de controladoria para pequenas empresas", path: "/services/performance-finance-and-controls" },
      { term: "consultoria em formação de preços", path: "/services/price-and-value-intelligence" },
      { term: "consultoria de pricing e estratégia de preços", path: "/services/price-and-value-intelligence" },
    ],
  },
  {
    id: "comercial",
    title: "Vendas, clientes e experiência",
    terms: [
      { term: "consultoria comercial", path: "/services/sprint-comercial" },
      { term: "consultoria de vendas B2B", path: "/services/sprint-comercial" },
      { term: "consultoria de CRM", path: "/services/cliente-que-retem" },
      { term: "consultoria para retenção de clientes", path: "/services/cliente-que-retem" },
      { term: "consultoria de experiência do cliente", path: "/services/customer-growth-and-experience-transformation" },
      { term: "pesquisa de satisfação de clientes", path: "/services/customer-insight-sprint" },
      { term: "consultoria para lançamento de novos produtos", path: "/services/concept-and-proposition-test" },
    ],
  },
  {
    id: "pesquisas",
    title: "Pesquisa de mercado e inteligência competitiva",
    terms: [
      { term: "pesquisa de mercado para empresas", path: "/services/market-opportunity-decision" },
      { term: "análise de concorrência empresarial", path: "/services/competitive-response-radar" },
      { term: "consultoria de inteligência competitiva", path: "/services/competitive-response-radar" },
      { term: "estudo de viabilidade empresarial", path: "/services/validacao-e-viabilidade" },
      { term: "estudo de dimensionamento de mercado no Brasil", path: "/services/market-opportunity-decision" },
      { term: "inteligência de mercado e dados no Brasil", path: "/brasil" },
      { term: "análise setorial e regulatória no Brasil", path: "/brasil/setores-estrategicos" },
      { term: "mapeamento de concorrentes e barreiras de entrada no Brasil", path: "/services/brazil-entry-navigator" },
      { term: "market intelligence consulting Brazil", path: "/services/market-opportunity-decision" },
      { term: "market sizing and regulatory analysis Brazil", path: "/brasil" },
    ],
  },
  {
    id: "brasil",
    title: "Entrada e investimento no Brasil",
    terms: [
      { term: "consultoria de market entry no Brasil", path: "/services/brazil-entry-navigator" },
      { term: "consultoria para empresa estrangeira entrar no Brasil", path: "/services/brazil-entry-navigator" },
      { term: "estudo de mercado para investimentos no Brasil", path: "/brasil/investimento-estrangeiro" },
      { term: "estudo de mercado no Brasil para investidor estrangeiro", path: "/brasil/investimento-estrangeiro" },
    ],
  },
  {
    id: "empreendedorismo",
    title: "Empreendedorismo e novos negócios",
    terms: [
      { term: "consultoria para startups", path: "/services/validacao-e-viabilidade" },
      { term: "validação de ideia de negócio", path: "/services/validacao-e-viabilidade" },
      { term: "consultoria para plano de negócios", path: "/services/modelagem-de-negocio" },
      { term: "consultoria em modelagem de negócios", path: "/services/modelagem-de-negocio" },
    ],
  },
  {
    id: "pessoas",
    title: "Pessoas, liderança e mudança",
    terms: [
      { term: "consultoria de liderança e gestão de pessoas", path: "/services/organizacao-e-pessoas-para-crescer" },
      { term: "consultoria de gestão da mudança", path: "/services/people-and-transformation-office" },
    ],
  },
  {
    id: "esg",
    title: "ESG, clima e sustentabilidade",
    terms: [
      { term: "consultoria ESG", path: "/services/esg-essencial" },
      { term: "consultoria de sustentabilidade empresarial", path: "/services/sustainability-and-climate-strategy" },
      { term: "consultoria de estratégia climática", path: "/services/sustainability-and-climate-strategy" },
      { term: "consultoria de carbono e cadeia de suprimentos", path: "/services/carbono-e-cadeia" },
    ],
  },
  {
    id: "seguranca",
    title: "Cibersegurança, privacidade e continuidade",
    terms: [
      { term: "consultoria de cibersegurança para empresas", path: "/services/cyber-essentials-pme" },
      { term: "avaliação de riscos cibernéticos", path: "/services/cyber-essentials-pme" },
      { term: "consultoria LGPD para empresas", path: "/services/trust-review-mensal" },
      { term: "consultoria em privacidade de dados", path: "/services/trust-review-mensal" },
      { term: "consultoria em continuidade de negócios", path: "/services/cyber-resilience-and-digital-trust" },
    ],
  },
];

/** Todos os termos, em ordem de tema. */
export const ALL_KEYWORDS: string[] = KEYWORD_THEMES.flatMap((theme) =>
  theme.terms.map((t) => t.term),
);

/** Conteúdo pronto para a meta `keywords` (subconjunto ou lista completa). */
export function keywordsMeta(themeIds?: string[]) {
  const themes = themeIds
    ? KEYWORD_THEMES.filter((t) => themeIds.includes(t.id))
    : KEYWORD_THEMES;
  return {
    name: "keywords",
    content: themes.flatMap((t) => t.terms.map((k) => k.term)).join(", "),
  };
}
