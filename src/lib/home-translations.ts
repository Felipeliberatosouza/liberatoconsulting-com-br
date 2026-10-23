/**
 * Textos fixos da página inicial e componentes compartilhados (botões,
 * títulos de seção, FAQ complementar). PT é a fonte; EN/ES/ZH seguem a mesma estrutura.
 */
import type { Lang } from "@/i18n/config";

type Faq = { question: string; answer: string };

const pt = {
  freeTools: "Ferramentas de gestão grátis",
  talkExperts: "Fale com nossos especialistas",
  contactUs: "Fale conosco",
  downloadTools: "Baixe Ferramentas de Gestão — Grátis!",
  clients: "Clientes",
  clientsAria: "Clientes da Liberato Consulting",
  bannerAlt: "Consultoria orientada a resultados",
  impactEyebrow: "Resultados",
  impactTitle: "O Impacto que traremos para o seu negócio",
  faqEyebrow: "Perguntas frequentes",
  faqTitle: "O que você precisa saber antes de começar",
  highlightedFor: "Conteúdo destacado para",
  prevBanner: "Banner anterior",
  nextBanner: "Próximo banner",
  keywordsTitle: "Consultoria empresarial: temas mais procurados",
  footerNewsletter: "Receba nossos conteúdos sobre gestão, IA e o mercado brasileiro.",
  interactiveTitle: "Ferramentas interativas",
  interactiveBody: "Informe os dados do seu negócio e receba resultados, gráfico e relatório em PDF e PowerPoint.",
  extraFaq: [
    { question: "Como a empresa é classificada por porte?", answer: "Usamos o critério do Sebrae: Microempresa (até 9 funcionários em comércio e serviços, até 19 na indústria), Pequena, Média e Grande Empresa. O porte define prazos de referência e o escopo das propostas." },
    { question: "O que são as ferramentas interativas de gestão?", answer: "São calculadoras criadas pela Liberato Consulting: você informa os dados da sua empresa e recebe resultados, gráficos e um relatório em PDF e PowerPoint. Todos os cálculos seguem fórmulas verificadas e testadas antes da publicação." },
    { question: "Como funciona o diagnóstico empresarial?", answer: "Depois de um escopo inicial, enviamos um link curto e exclusivo com perguntas sobre a sua empresa. Com as respostas, montamos o planejamento e o orçamento, que pode ser apresentado em até três cenários de investimento." },
    { question: "Vocês oferecem treinamentos in company?", answer: "Sim. Oferecemos oito programas de treinamento in company — como liderança, vendas, finanças, processos e IA aplicada — com carga horária e materiais ajustados à sua equipe." },
    { question: "O que recebo na Newsletter Insights e no Boletim Semanal?", answer: "A Newsletter Insights traz o artigo mais recente, uma ferramenta ou guia de gestão e uma análise de notícia econômica com impacto nos negócios. O Boletim Semanal reúne indicadores do Brasil. Ambos são gratuitos, por e-mail ou WhatsApp." },
    { question: "A Liberato Consulting apoia empresas estrangeiras no Brasil?", answer: "Sim. Produzimos pesquisas e dados de mercado sobre o Brasil para decisões de entrada, expansão e investimento, e atendemos em português, inglês, espanhol e chinês." },
  ] as Faq[],
};

type HomeDict = typeof pt;

const en: HomeDict = {
  freeTools: "Free management tools",
  talkExperts: "Talk to our experts",
  contactUs: "Contact us",
  downloadTools: "Download Management Tools — Free!",
  clients: "Clients",
  clientsAria: "Liberato Consulting clients",
  bannerAlt: "Results-driven consulting",
  impactEyebrow: "Results",
  impactTitle: "The impact we will bring to your business",
  faqEyebrow: "Frequently asked questions",
  faqTitle: "What you need to know before getting started",
  highlightedFor: "Content highlighted for",
  prevBanner: "Previous banner",
  nextBanner: "Next banner",
  keywordsTitle: "Business consulting: most searched topics",
  footerNewsletter: "Get our content on management, AI and the Brazilian market.",
  interactiveTitle: "Interactive tools",
  interactiveBody: "Enter your business data and get results, charts and a PDF and PowerPoint report.",
  extraFaq: [
    { question: "How are companies classified by size?", answer: "We use the Sebrae criteria: Micro company (up to 9 employees in retail and services, up to 19 in industry), Small, Medium and Large company. Size defines reference timelines and proposal scope." },
    { question: "What are the interactive management tools?", answer: "Calculators built by Liberato Consulting: you enter your company data and receive results, charts and a PDF and PowerPoint report. All calculations follow formulas verified and tested before publication." },
    { question: "How does the business diagnostic work?", answer: "After an initial scope, we send a short, exclusive link with questions about your company. With the answers we build the plan and the quote, which can be presented in up to three investment scenarios." },
    { question: "Do you offer in-company training?", answer: "Yes. We offer eight in-company training programs — such as leadership, sales, finance, processes and applied AI — with workload and materials tailored to your team." },
    { question: "What do I get in the Insights Newsletter and the Weekly Bulletin?", answer: "The Insights Newsletter brings our latest article, a management tool or guide, and an analysis of economic news and its business impact. The Weekly Bulletin gathers Brazilian indicators. Both are free, by email or WhatsApp." },
    { question: "Does Liberato Consulting support foreign companies in Brazil?", answer: "Yes. We produce market research and data on Brazil for entry, expansion and investment decisions, and we serve clients in Portuguese, English, Spanish and Chinese." },
  ],
};

const es: HomeDict = {
  freeTools: "Herramientas de gestión gratis",
  talkExperts: "Hable con nuestros especialistas",
  contactUs: "Contáctenos",
  downloadTools: "Descargue Herramientas de Gestión — ¡Gratis!",
  clients: "Clientes",
  clientsAria: "Clientes de Liberato Consulting",
  bannerAlt: "Consultoría orientada a resultados",
  impactEyebrow: "Resultados",
  impactTitle: "El impacto que traeremos a su negocio",
  faqEyebrow: "Preguntas frecuentes",
  faqTitle: "Lo que necesita saber antes de empezar",
  highlightedFor: "Contenido destacado para",
  prevBanner: "Banner anterior",
  nextBanner: "Siguiente banner",
  keywordsTitle: "Consultoría empresarial: temas más buscados",
  footerNewsletter: "Reciba nuestros contenidos sobre gestión, IA y el mercado brasileño.",
  interactiveTitle: "Herramientas interactivas",
  interactiveBody: "Ingrese los datos de su negocio y reciba resultados, gráficos e informe en PDF y PowerPoint.",
  extraFaq: [
    { question: "¿Cómo se clasifica la empresa por tamaño?", answer: "Usamos el criterio del Sebrae: Microempresa (hasta 9 empleados en comercio y servicios, hasta 19 en la industria), Pequeña, Mediana y Gran Empresa. El tamaño define plazos de referencia y el alcance de las propuestas." },
    { question: "¿Qué son las herramientas interactivas de gestión?", answer: "Son calculadoras creadas por Liberato Consulting: usted ingresa los datos de su empresa y recibe resultados, gráficos e informe en PDF y PowerPoint. Todos los cálculos siguen fórmulas verificadas y probadas antes de su publicación." },
    { question: "¿Cómo funciona el diagnóstico empresarial?", answer: "Tras un alcance inicial, enviamos un enlace corto y exclusivo con preguntas sobre su empresa. Con las respuestas armamos la planificación y el presupuesto, que puede presentarse en hasta tres escenarios de inversión." },
    { question: "¿Ofrecen capacitaciones in company?", answer: "Sí. Ofrecemos ocho programas in company — como liderazgo, ventas, finanzas, procesos e IA aplicada — con carga horaria y materiales ajustados a su equipo." },
    { question: "¿Qué recibo en la Newsletter Insights y el Boletín Semanal?", answer: "La Newsletter Insights trae el artículo más reciente, una herramienta o guía de gestión y un análisis de noticia económica con impacto en los negocios. El Boletín Semanal reúne indicadores de Brasil. Ambos son gratuitos, por correo o WhatsApp." },
    { question: "¿Liberato Consulting apoya a empresas extranjeras en Brasil?", answer: "Sí. Producimos investigaciones y datos de mercado sobre Brasil para decisiones de entrada, expansión e inversión, y atendemos en portugués, inglés, español y chino." },
  ],
};

const zh: HomeDict = {
  freeTools: "免费管理工具",
  talkExperts: "联系我们的专家",
  contactUs: "联系我们",
  downloadTools: "免费下载管理工具！",
  clients: "客户",
  clientsAria: "Liberato Consulting 的客户",
  bannerAlt: "以结果为导向的咨询",
  impactEyebrow: "成果",
  impactTitle: "我们将为您的企业带来的影响",
  faqEyebrow: "常见问题",
  faqTitle: "开始之前您需要了解的内容",
  highlightedFor: "重点内容面向",
  prevBanner: "上一张横幅",
  nextBanner: "下一张横幅",
  keywordsTitle: "企业咨询：热门主题",
  footerNewsletter: "获取有关管理、人工智能和巴西市场的内容。",
  interactiveTitle: "互动工具",
  interactiveBody: "输入您的企业数据，即可获得结果、图表以及 PDF 和 PowerPoint 报告。",
  extraFaq: [
    { question: "企业规模如何划分？", answer: "我们采用 Sebrae 标准：微型企业（商业和服务业不超过 9 名员工，工业不超过 19 名）、小型、中型和大型企业。规模决定参考工期和方案范围。" },
    { question: "什么是互动管理工具？", answer: "这是 Liberato Consulting 开发的计算工具：输入企业数据即可获得结果、图表以及 PDF 和 PowerPoint 报告。所有计算均采用发布前经过验证和测试的公式。" },
    { question: "企业诊断如何进行？", answer: "在初步范围确认后，我们会发送一个简短的专属链接，包含关于贵公司的问题。根据回答，我们制定规划和报价，并可提供最多三种投资方案。" },
    { question: "你们提供企业内训吗？", answer: "提供。我们有八个企业内训项目，涵盖领导力、销售、财务、流程和人工智能应用等，课时和材料根据团队定制。" },
    { question: "Insights 电子简报和每周简报包含什么？", answer: "Insights 电子简报包含最新文章、一个管理工具或指南，以及对经济新闻及其商业影响的分析。每周简报汇总巴西经济指标。两者均免费，可通过电子邮件或 WhatsApp 接收。" },
    { question: "Liberato Consulting 是否支持外国企业进入巴西？", answer: "是的。我们为进入、扩张和投资决策提供巴西市场研究和数据，并提供葡萄牙语、英语、西班牙语和中文服务。" },
  ],
};

const DICTS: Record<Lang, HomeDict> = { pt, en, es, zh };

export function homeText(lang: Lang): HomeDict {
  return DICTS[lang] ?? pt;
}
