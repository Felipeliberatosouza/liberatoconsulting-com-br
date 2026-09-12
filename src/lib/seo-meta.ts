/**
 * Títulos e descrições das páginas públicas nos quatro idiomas publicados.
 *
 * O site serve o mesmo caminho em todos os idiomas (`?lang=`), então o
 * `head()` de cada rota precisa emitir título/descrição no idioma servido —
 * caso contrário buscadores estrangeiros indexam texto em português.
 */

import { OG_IMAGE, localizedUrl, normalizeLang } from "./seo";

export type SeoLang = "pt" | "en" | "es" | "zh";

export type PageSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

type PageSeoByLang = Record<SeoLang, PageSeo>;

export const PAGE_SEO: Record<string, PageSeoByLang> = {
  "/": {
    pt: {
      title: "Pesquisas de mercado e gestão com IA — Liberato Consulting",
      description:
        "Estudos e dados sobre o mercado brasileiro para investidores internacionais, abrangendo agronegócio, energia e indústria com gestão estratégica e IA.",
      ogTitle: "Pesquisas de mercado sobre o Brasil — Liberato Consulting",
      ogDescription:
        "Inteligência sobre setores da economia brasileira para empresas internacionais, com gestão estratégica e IA no centro.",
    },
    en: {
      title: "Brazil market research and AI-driven management — Liberato Consulting",
      description:
        "Research and data on the Brazilian market for international investors, covering agribusiness, energy and industry, with strategic management and AI.",
      ogTitle: "Brazil market research — Liberato Consulting",
      ogDescription:
        "Intelligence on Brazilian economic sectors for international companies, with strategic management and AI at the core.",
    },
    es: {
      title: "Investigación de mercado en Brasil y gestión con IA — Liberato Consulting",
      description:
        "Estudios y datos sobre el mercado brasileño para inversores internacionales: agronegocio, energía e industria, con gestión estratégica e IA.",
      ogTitle: "Investigación de mercado sobre Brasil — Liberato Consulting",
      ogDescription:
        "Inteligencia sobre los sectores de la economía brasileña para empresas internacionales, con gestión estratégica e IA.",
    },
    zh: {
      title: "巴西市场研究与人工智能管理咨询 — Liberato Consulting",
      description:
        "面向国际投资者的巴西市场研究与数据，涵盖农业综合企业、能源与制造业，并以战略管理和人工智能为核心。",
      ogTitle: "巴西市场研究 — Liberato Consulting",
      ogDescription: "为国际企业提供巴西各经济部门的情报，以战略管理与人工智能为核心。",
    },
  },
  "/services": {
    pt: {
      title: "Serviços de consultoria empresarial | Liberato Consulting",
      description:
        "Consultoria em gestão empresarial no Brasil: eficiência operacional, crescimento, digital e IA, finanças, vendas, ESG, pessoas e inteligência de mercado.",
      ogTitle: "Serviços de consultoria empresarial — Liberato Consulting",
      ogDescription:
        "Produtos de consultoria com escopo, prazo e indicadores definidos, com inteligência artificial aplicada ao método.",
    },
    en: {
      title: "Management consulting services | Liberato Consulting",
      description:
        "Business management consulting in Brazil: operational efficiency, growth, digital and AI, finance, sales, ESG, people and market intelligence.",
      ogTitle: "Management consulting services — Liberato Consulting",
      ogDescription:
        "Consulting products with defined scope, timeline and indicators, with artificial intelligence applied to the method.",
    },
    es: {
      title: "Servicios de consultoría empresarial | Liberato Consulting",
      description:
        "Consultoría de gestión empresarial en Brasil: eficiencia operativa, crecimiento, digital e IA, finanzas, ventas, ESG, personas e inteligencia de mercado.",
      ogTitle: "Servicios de consultoría empresarial — Liberato Consulting",
      ogDescription:
        "Productos de consultoría con alcance, plazo e indicadores definidos, con inteligencia artificial aplicada al método.",
    },
    zh: {
      title: "企业管理咨询服务 | Liberato Consulting",
      description:
        "在巴西提供企业管理咨询：运营效率、业务增长、数字化与人工智能、财务、销售、ESG、人才与市场情报。",
      ogTitle: "企业管理咨询服务 — Liberato Consulting",
      ogDescription: "范围、周期与指标明确的咨询产品，并将人工智能融入方法论。",
    },
  },
  "/brasil": {
    pt: {
      title: "Dados do Brasil para investidores — Liberato Consulting",
      description:
        "Economia brasileira: PIB, inflação, Selic, setores estratégicos, investimento estrangeiro, tributos e infraestrutura em um só lugar.",
      ogTitle: "Dados do Brasil para investidores internacionais",
      ogDescription:
        "Panorama econômico, setores estratégicos, IED, tributos, Mercosul, mercado consumidor e infraestrutura do Brasil.",
    },
    en: {
      title: "Brazil data for investors — Liberato Consulting",
      description:
        "The Brazilian economy in one place: GDP, inflation, Selic rate, strategic sectors, foreign investment, taxes and infrastructure.",
      ogTitle: "Brazil data for international investors",
      ogDescription:
        "Economic overview, strategic sectors, FDI, taxes, Mercosur, consumer market and infrastructure in Brazil.",
    },
    es: {
      title: "Datos de Brasil para inversores — Liberato Consulting",
      description:
        "La economía brasileña en un solo lugar: PIB, inflación, tasa Selic, sectores estratégicos, inversión extranjera, tributos e infraestructura.",
      ogTitle: "Datos de Brasil para inversores internacionales",
      ogDescription:
        "Panorama económico, sectores estratégicos, IED, tributos, Mercosur, mercado de consumo e infraestructura de Brasil.",
    },
    zh: {
      title: "面向投资者的巴西数据 — Liberato Consulting",
      description:
        "一站式了解巴西经济：GDP、通胀、基准利率、战略行业、外商投资、税制与基础设施。",
      ogTitle: "面向国际投资者的巴西数据",
      ogDescription: "巴西宏观经济、战略行业、外商直接投资、税制、南方共同市场、消费市场与基础设施。",
    },
  },
  "/about": {
    pt: {
      title: "Quem somos — Liberato Consulting",
      description:
        "Consultoria brasileira com leitura global: método de gestão, resultado medido e transferência de conhecimento, com IA como propósito central.",
      ogTitle: "Quem somos — Liberato Consulting",
      ogDescription: "Método de gestão, resultado medido e inteligência artificial como propósito.",
    },
    en: {
      title: "About us — Liberato Consulting",
      description:
        "A Brazilian consultancy with a global outlook: management method, measured results and knowledge transfer, with AI at the core.",
      ogTitle: "About us — Liberato Consulting",
      ogDescription: "Management method, measured results and artificial intelligence as purpose.",
    },
    es: {
      title: "Quiénes somos — Liberato Consulting",
      description:
        "Consultoría brasileña con mirada global: método de gestión, resultado medido y transferencia de conocimiento, con la IA como propósito central.",
      ogTitle: "Quiénes somos — Liberato Consulting",
      ogDescription: "Método de gestión, resultado medido e inteligencia artificial como propósito.",
    },
    zh: {
      title: "关于我们 — Liberato Consulting",
      description: "具有全球视野的巴西咨询公司：管理方法、可衡量的成果与知识转移，并以人工智能为核心。",
      ogTitle: "关于我们 — Liberato Consulting",
      ogDescription: "管理方法、可衡量的成果，以及作为核心宗旨的人工智能。",
    },
  },
  "/contact": {
    pt: {
      title: "Contato — Liberato Consulting",
      description:
        "Fale com a Liberato Consulting sobre gestão estratégica, empreendedorismo, pesquisas de mercado no Brasil e uso de inteligência artificial.",
      ogTitle: "Contato — Liberato Consulting",
      ogDescription: "Conte o desafio da sua empresa. Respondemos em até dois dias úteis.",
    },
    en: {
      title: "Contact — Liberato Consulting",
      description:
        "Talk to Liberato Consulting about strategic management, entrepreneurship, market research in Brazil and applied artificial intelligence.",
      ogTitle: "Contact — Liberato Consulting",
      ogDescription: "Tell us your company's challenge. We reply within two business days.",
    },
    es: {
      title: "Contacto — Liberato Consulting",
      description:
        "Habla con Liberato Consulting sobre gestión estratégica, emprendimiento, investigación de mercado en Brasil e inteligencia artificial aplicada.",
      ogTitle: "Contacto — Liberato Consulting",
      ogDescription: "Cuéntanos el desafío de tu empresa. Respondemos en hasta dos días hábiles.",
    },
    zh: {
      title: "联系我们 — Liberato Consulting",
      description: "就战略管理、创业、巴西市场研究与人工智能应用，与 Liberato Consulting 联系。",
      ogTitle: "联系我们 — Liberato Consulting",
      ogDescription: "告诉我们贵公司的挑战，我们将在两个工作日内回复。",
    },
  },
  "/content": {
    pt: {
      title: "Conteúdo | Insights — Liberato Consulting",
      description:
        "Artigos, guias e estudos sobre gestão estratégica, operações, empreendedorismo, pesquisas de mercado no Brasil e inteligência artificial aplicada.",
      ogTitle: "Conteúdo — Liberato Consulting",
      ogDescription: "Conhecimento aplicado em gestão empresarial e inteligência artificial.",
    },
    en: {
      title: "Insights — Liberato Consulting",
      description:
        "Articles, guides and studies on strategic management, operations, entrepreneurship, market research in Brazil and applied artificial intelligence.",
      ogTitle: "Insights — Liberato Consulting",
      ogDescription: "Applied knowledge in business management and artificial intelligence.",
    },
    es: {
      title: "Contenido | Insights — Liberato Consulting",
      description:
        "Artículos, guías y estudios sobre gestión estratégica, operaciones, emprendimiento, investigación de mercado en Brasil e inteligencia artificial aplicada.",
      ogTitle: "Contenido — Liberato Consulting",
      ogDescription: "Conocimiento aplicado en gestión empresarial e inteligencia artificial.",
    },
    zh: {
      title: "洞察内容 — Liberato Consulting",
      description: "关于战略管理、运营、创业、巴西市场研究与人工智能应用的文章、指南与研究。",
      ogTitle: "洞察内容 — Liberato Consulting",
      ogDescription: "企业管理与人工智能的实用知识。",
    },
  },
  "/careers": {
    pt: {
      title: "Trabalhe Conosco — Liberato Consulting",
      description:
        "Envie seu currículo para a Liberato Consulting: consultoria em gestão empresarial, pesquisas de mercado e inteligência artificial aplicada.",
      ogTitle: "Trabalhe Conosco — Liberato Consulting",
      ogDescription: "Faça parte de um time de consultoria em gestão com IA aplicada.",
    },
    en: {
      title: "Careers — Liberato Consulting",
      description:
        "Send your CV to Liberato Consulting: management consulting, market research and applied artificial intelligence.",
      ogTitle: "Careers — Liberato Consulting",
      ogDescription: "Join a management consulting team with applied AI.",
    },
    es: {
      title: "Trabaja con nosotros — Liberato Consulting",
      description:
        "Envía tu currículum a Liberato Consulting: consultoría de gestión, investigación de mercado e inteligencia artificial aplicada.",
      ogTitle: "Trabaja con nosotros — Liberato Consulting",
      ogDescription: "Forma parte de un equipo de consultoría de gestión con IA aplicada.",
    },
    zh: {
      title: "加入我们 — Liberato Consulting",
      description: "向 Liberato Consulting 投递简历：管理咨询、市场研究与人工智能应用。",
      ogTitle: "加入我们 — Liberato Consulting",
      ogDescription: "加入一支将人工智能付诸实践的管理咨询团队。",
    },
  },
  "/privacy": {
    pt: {
      title: "Política de Privacidade — Liberato Consulting",
      description:
        "Como a Liberato Consulting coleta, usa, compartilha e protege dados pessoais no site, conforme a LGPD.",
      ogTitle: "Política de Privacidade — Liberato Consulting",
      ogDescription: "Tratamento de dados pessoais, cookies e direitos do titular.",
    },
    en: {
      title: "Privacy Policy — Liberato Consulting",
      description:
        "How Liberato Consulting collects, uses, shares and protects personal data on this site, under Brazilian data protection law.",
      ogTitle: "Privacy Policy — Liberato Consulting",
      ogDescription: "Personal data processing, cookies and data subject rights.",
    },
    es: {
      title: "Política de Privacidad — Liberato Consulting",
      description:
        "Cómo Liberato Consulting recopila, usa, comparte y protege los datos personales en el sitio, conforme a la ley brasileña de protección de datos.",
      ogTitle: "Política de Privacidad — Liberato Consulting",
      ogDescription: "Tratamiento de datos personales, cookies y derechos del titular.",
    },
    zh: {
      title: "隐私政策 — Liberato Consulting",
      description: "Liberato Consulting 如何依据巴西数据保护法在本网站收集、使用、共享与保护个人数据。",
      ogTitle: "隐私政策 — Liberato Consulting",
      ogDescription: "个人数据处理、Cookie 与数据主体权利。",
    },
  },
  "/terms": {
    pt: {
      title: "Termos de Uso — Liberato Consulting",
      description:
        "Regras de uso do site da Liberato Consulting: conteúdo, propriedade intelectual, responsabilidade e foro.",
      ogTitle: "Termos de Uso — Liberato Consulting",
      ogDescription: "Condições de acesso e uso do site da Liberato Consulting.",
    },
    en: {
      title: "Terms of Use — Liberato Consulting",
      description:
        "Rules for using the Liberato Consulting website: content, intellectual property, liability and jurisdiction.",
      ogTitle: "Terms of Use — Liberato Consulting",
      ogDescription: "Conditions for accessing and using the Liberato Consulting website.",
    },
    es: {
      title: "Términos de Uso — Liberato Consulting",
      description:
        "Reglas de uso del sitio de Liberato Consulting: contenido, propiedad intelectual, responsabilidad y jurisdicción.",
      ogTitle: "Términos de Uso — Liberato Consulting",
      ogDescription: "Condiciones de acceso y uso del sitio de Liberato Consulting.",
    },
    zh: {
      title: "使用条款 — Liberato Consulting",
      description: "Liberato Consulting 网站的使用规则：内容、知识产权、责任与管辖。",
      ogTitle: "使用条款 — Liberato Consulting",
      ogDescription: "访问与使用 Liberato Consulting 网站的条件。",
    },
  },
};

/** Textos da página no idioma servido (com retorno ao português). */
export function pageSeo(path: string, lang: string = "pt"): PageSeo {
  const l = normalizeLang(lang) as SeoLang;
  const entry = PAGE_SEO[path];
  if (!entry) {
    return {
      title: "Liberato Consulting",
      description: "Consultoria em gestão empresarial com inteligência artificial.",
      ogTitle: "Liberato Consulting",
      ogDescription: "Consultoria em gestão empresarial com inteligência artificial.",
    };
  }
  return entry[l] ?? entry.pt;
}

/**
 * Bloco completo de meta tags da página no idioma servido:
 * título, descrição, Open Graph, Twitter Card e URL autorreferente.
 */
export function seoPageMeta(
  path: string,
  lang: string = "pt",
  options: { ogType?: string } = {},
) {
  const s = pageSeo(path, lang);
  return [
    { title: s.title },
    { name: "description", content: s.description },
    { property: "og:title", content: s.ogTitle },
    { property: "og:description", content: s.ogDescription },
    { property: "og:type", content: options.ogType ?? "website" },
    { property: "og:url", content: localizedUrl(path, normalizeLang(lang)) },
    { property: "og:image", content: OG_IMAGE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: s.ogTitle },
    { name: "twitter:description", content: s.ogDescription },
    { name: "twitter:image", content: OG_IMAGE },
  ];
}
