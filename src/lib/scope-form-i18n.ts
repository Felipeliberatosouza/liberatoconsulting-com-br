/**
 * Traduções do formulário público de Escopo Inicial (/escopoinicial).
 * O português é a fonte (src/lib/scope-form.ts); aqui ficam EN / ES / ZH.
 */
import type { Lang } from "@/i18n/config";
import {
  SCOPE_HELP,
  SCOPE_INTRO,
  SCOPE_NOTE,
  SCOPE_QUESTIONS,
  type ScopeQuestion,
} from "@/lib/scope-form";

type QuestionText = {
  theme: string;
  question: string;
  purpose: string;
  hint?: string;
  dateWhen?: string;
  options: string[];
};

const MULTI_EN =
  "Select the main option that matches your need and, if relevant, describe other options under Comments.";
const MULTI_ES =
  "Marque la principal opción según su necesidad y, si lo considera importante, describa otras opciones en Comentarios.";
const MULTI_ZH = "请选择最符合您需求的主要选项；如有其他情况，可在“备注”中说明。";

const EN: QuestionText[] = [
  {
    theme: "Objective",
    question: "What is the main objective of the consulting engagement?",
    purpose: "Understand the core focus of the work to guide the consulting approach.",
    hint: MULTI_EN,
    options: [
      "Assess business viability",
      "Define positioning and target audience",
      "Validate the business model",
      "Size the market and competition",
      "Prepare a launch or fundraising",
      "Not defined yet / other",
    ],
  },
  {
    theme: "Expected outcome",
    question: "What main result do you expect to receive at the end?",
    purpose: "Define the main deliverable that will support the decision.",
    hint: MULTI_EN,
    options: [
      "Executive recommendations",
      "Market research report",
      "Validation with potential clients or partners",
      "TAM / SAM / SOM and scenarios",
      "Business model and financial model",
      "A combination of the items above",
    ],
  },
  {
    theme: "Company and offering",
    question: "Which description best represents the company or service right now?",
    purpose: "Place the company or offering in time and set the project's starting point.",
    hint: MULTI_EN,
    options: [
      "Operating company seeking growth",
      "Operating company with a specific problem to solve",
      "New business or new service line being designed",
      "Combined services / more than one front",
      "The offering is still being defined",
      "Other",
    ],
  },
  {
    theme: "Target client",
    question: "Who is the main audience or company profile you intend to serve?",
    purpose: "Define the target audience to be studied or approached.",
    hint: MULTI_EN,
    options: [
      "Small companies",
      "Mid-sized companies",
      "Small and mid-sized companies in general",
      "Family businesses",
      "Specific industries",
      "Not defined yet",
    ],
  },
  {
    theme: "Coverage",
    question: "What will the initial geographic coverage be?",
    purpose: "Size the geographic scope and the data collection effort.",
    options: [
      "All of Brazil",
      "One or more regions of Brazil",
      "A state or local market",
      "Brazil and international operations",
      "Not defined yet",
    ],
  },
  {
    theme: "Market research",
    question: "What level of direct contact with the market is expected?",
    purpose: "Assess the need for primary research (interviews or survey) and its cost.",
    hint: "If you have a target sample (number of respondents), note it under Comments.",
    options: [
      "Public sources research only",
      "Interviews with up to 10 people",
      "Interviews with more than 10 people",
      "Quantitative research / survey",
      "Public research plus interviews or survey",
      "Not defined yet",
    ],
  },
  {
    theme: "Market sizing",
    question: "Is it necessary to estimate the market size?",
    purpose: "Check whether the project requires market sizing (TAM/SAM/SOM) and by which method.",
    options: [
      "Not required at this point",
      "Yes, using public sources",
      "Yes, with a company-by-company survey",
      "Yes, but I don't know which method yet",
      "Not defined yet",
    ],
  },
  {
    theme: "Deliverables",
    question: "Which format matters most for presenting the results?",
    purpose: "Match the deliverables to how the results will be used.",
    hint: MULTI_EN,
    options: [
      "Written report",
      "Executive presentation",
      "Spreadsheet or editable model",
      "Report plus presentation",
      "Decision workshop",
      "Not defined yet",
    ],
  },
  {
    theme: "Timeline",
    question: "When does the work need to be completed?",
    purpose: "Plan the schedule and team availability.",
    dateWhen: "I have a fixed date",
    options: [
      "Within 2 weeks",
      "In 3 or 4 weeks",
      "In 5 to 8 weeks",
      "After 8 weeks",
      "I have a fixed date",
      "Not defined yet",
    ],
  },
  {
    theme: "Investment",
    question: "How defined is the investment for this work?",
    purpose: "Match the scope and contracting format to the investment capacity.",
    hint: "If useful, indicate in the Comments field the budget you have for this project.",
    options: [
      "There is a defined investment range",
      "There is a maximum cap",
      "I prefer a phased proposal",
      "There is no budget defined yet",
      "Another contracting format",
    ],
  },
];

const ES: QuestionText[] = [
  {
    theme: "Objetivo",
    question: "¿Cuál es el principal objetivo de la consultoría?",
    purpose: "Entender el foco central del trabajo para orientar el enfoque de la consultoría.",
    hint: MULTI_ES,
    options: [
      "Evaluar la viabilidad del negocio",
      "Definir posicionamiento y público objetivo",
      "Validar el modelo de negocio",
      "Dimensionar mercado y competencia",
      "Preparar lanzamiento o captación",
      "Aún no definido / otro",
    ],
  },
  {
    theme: "Resultado esperado",
    question: "¿Qué resultado principal espera recibir al final?",
    purpose: "Definir el entregable principal que se usará para tomar la decisión.",
    hint: MULTI_ES,
    options: [
      "Recomendaciones ejecutivas",
      "Informe de investigación de mercado",
      "Validación con clientes o socios potenciales",
      "TAM / SAM / SOM y escenarios",
      "Modelo de negocio y modelo financiero",
      "Combinación de los puntos anteriores",
    ],
  },
  {
    theme: "Empresa y oferta",
    question: "¿Qué descripción representa mejor a la empresa o el servicio en este momento?",
    purpose: "Situar el momento de la empresa o de la oferta y el punto de partida del proyecto.",
    hint: MULTI_ES,
    options: [
      "Empresa en operación que busca crecimiento",
      "Empresa en operación con un problema específico a resolver",
      "Nuevo negocio o nueva línea de servicio en diseño",
      "Servicios combinados / más de un frente",
      "La propuesta aún se está definiendo",
      "Otro",
    ],
  },
  {
    theme: "Cliente objetivo",
    question: "¿Cuál es el principal público o perfil de empresa al que se pretende atender?",
    purpose: "Delimitar el público objetivo que será estudiado o abordado.",
    hint: MULTI_ES,
    options: [
      "Pequeñas empresas",
      "Empresas medianas",
      "Pequeñas y medianas empresas en general",
      "Empresas familiares",
      "Sectores específicos",
      "Aún no definido",
    ],
  },
  {
    theme: "Alcance",
    question: "¿Cuál será el alcance geográfico inicial?",
    purpose: "Dimensionar el alcance geográfico y el esfuerzo de recolección de datos.",
    options: [
      "Todo Brasil",
      "Una o más regiones de Brasil",
      "Un estado o mercado local",
      "Brasil y operaciones internacionales",
      "Aún no definido",
    ],
  },
  {
    theme: "Investigación de mercado",
    question: "¿Qué nivel de contacto directo con el mercado se espera?",
    purpose: "Evaluar la necesidad de investigación primaria (entrevistas o encuesta) y su costo.",
    hint: "Si tiene una muestra deseada (número de respondentes), indíquelo en Comentarios.",
    options: [
      "Solo investigación en fuentes públicas",
      "Entrevistas con hasta 10 personas",
      "Entrevistas con más de 10 personas",
      "Investigación cuantitativa / encuesta",
      "Investigación pública más entrevistas o encuesta",
      "Aún no definido",
    ],
  },
  {
    theme: "Dimensionamiento",
    question: "¿Es necesario estimar el tamaño del mercado?",
    purpose: "Verificar si el proyecto exige estimación de mercado (TAM/SAM/SOM) y con qué método.",
    options: [
      "No es necesario en este momento",
      "Sí, con fuentes públicas",
      "Sí, con levantamiento empresa por empresa",
      "Sí, pero aún no sé qué método",
      "Aún no definido",
    ],
  },
  {
    theme: "Entregables",
    question: "¿Qué formato es más importante para presentar el resultado?",
    purpose: "Ajustar el formato de los entregables al uso que se dará al resultado.",
    hint: MULTI_ES,
    options: [
      "Informe en documento",
      "Presentación ejecutiva",
      "Planilla o modelo editable",
      "Informe más presentación",
      "Taller de decisión",
      "Aún no definido",
    ],
  },
  {
    theme: "Plazo",
    question: "¿Cuándo debe estar concluido el trabajo?",
    purpose: "Planificar el cronograma y la disponibilidad del equipo.",
    dateWhen: "Tengo una fecha fija",
    options: [
      "En hasta 2 semanas",
      "En 3 o 4 semanas",
      "En 5 a 8 semanas",
      "Después de 8 semanas",
      "Tengo una fecha fija",
      "Aún no definido",
    ],
  },
  {
    theme: "Inversión",
    question: "¿Cómo está definida la inversión para este trabajo?",
    purpose: "Ajustar el alcance y el formato de contratación a la capacidad de inversión.",
    hint: "Si lo considera útil, indique en Comentarios el presupuesto que tiene para este proyecto.",
    options: [
      "Existe un rango de inversión definido",
      "Existe un techo máximo",
      "Prefiero recibir una propuesta por fases",
      "Aún no hay presupuesto definido",
      "Otro formato de contratación",
    ],
  },
];

const ZH: QuestionText[] = [
  {
    theme: "目标",
    question: "本次咨询的主要目标是什么？",
    purpose: "了解工作的核心重点，以确定咨询方式。",
    hint: MULTI_ZH,
    options: [
      "评估业务可行性",
      "确定定位与目标客户",
      "验证商业模式",
      "测算市场规模与竞争格局",
      "筹备发布或融资",
      "尚未确定／其他",
    ],
  },
  {
    theme: "期望成果",
    question: "您希望最终获得的主要成果是什么？",
    purpose: "明确用于决策的主要交付物。",
    hint: MULTI_ZH,
    options: [
      "高管决策建议",
      "市场研究报告",
      "与潜在客户或合作伙伴的验证",
      "TAM / SAM / SOM 与情景分析",
      "商业模式与财务模型",
      "以上内容的组合",
    ],
  },
  {
    theme: "企业与业务",
    question: "目前哪一项描述最符合贵公司或该服务？",
    purpose: "明确企业或业务所处阶段以及项目起点。",
    hint: MULTI_ZH,
    options: [
      "已运营企业，寻求增长",
      "已运营企业，需解决特定问题",
      "正在设计的新业务或新服务线",
      "多项服务／多条战线",
      "方案仍在确定中",
      "其他",
    ],
  },
  {
    theme: "目标客户",
    question: "希望服务的主要客户群体或企业类型是？",
    purpose: "界定将要研究或接触的目标客户。",
    hint: MULTI_ZH,
    options: ["小型企业", "中型企业", "中小型企业整体", "家族企业", "特定行业", "尚未确定"],
  },
  {
    theme: "覆盖范围",
    question: "初期的地理覆盖范围是？",
    purpose: "确定地理范围及数据采集工作量。",
    options: [
      "巴西全国",
      "巴西的一个或多个地区",
      "某一州或本地市场",
      "巴西及国际业务",
      "尚未确定",
    ],
  },
  {
    theme: "市场调研",
    question: "期望与市场进行何种程度的直接接触？",
    purpose: "评估一手调研（访谈或问卷）的必要性及成本。",
    hint: "如已确定样本量（受访人数），请在“备注”中说明。",
    options: [
      "仅公开资料研究",
      "访谈不超过 10 人",
      "访谈超过 10 人",
      "定量调研／问卷",
      "公开资料研究加访谈或问卷",
      "尚未确定",
    ],
  },
  {
    theme: "规模测算",
    question: "是否需要估算市场规模？",
    purpose: "确认项目是否需要市场规模测算（TAM/SAM/SOM）及采用何种方法。",
    options: [
      "目前不需要",
      "需要，基于公开资料",
      "需要，逐家企业调研",
      "需要，但尚不确定方法",
      "尚未确定",
    ],
  },
  {
    theme: "交付物",
    question: "呈现成果时，哪种形式最重要？",
    purpose: "使交付形式契合成果的实际用途。",
    hint: MULTI_ZH,
    options: [
      "文档报告",
      "高管演示材料",
      "表格或可编辑模型",
      "报告加演示",
      "决策工作坊",
      "尚未确定",
    ],
  },
  {
    theme: "时间要求",
    question: "工作需要在何时完成？",
    purpose: "规划时间表与团队投入。",
    dateWhen: "有固定截止日期",
    options: [
      "2 周内",
      "3 至 4 周",
      "5 至 8 周",
      "8 周以后",
      "有固定截止日期",
      "尚未确定",
    ],
  },
  {
    theme: "投入预算",
    question: "本项目的预算确定情况如何？",
    purpose: "使范围与合作方式匹配预算能力。",
    hint: "如方便，请在“备注”中说明本项目的预算。",
    options: [
      "已有明确的预算区间",
      "有预算上限",
      "希望收到分阶段的方案",
      "尚未确定预算",
      "其他合作方式",
    ],
  },
];

const TEXTS = {
  pt: { intro: SCOPE_INTRO, help: SCOPE_HELP, note: SCOPE_NOTE },
  en: {
    intro:
      "Purpose: quickly understand your need so we can prepare a suitable proposal. It takes 3 to 5 minutes.",
    help: "Select one option per question. The comments field is optional and can be used to add context, dates, industries, figures or links.",
    note: "It is normal for some decisions to still be open. Answering “Not defined yet” helps us tell whether the first step should be a short definition and exploratory research phase.",
  },
  es: {
    intro:
      "Objetivo: entender rápidamente su necesidad para preparar una propuesta adecuada. Completarlo toma de 3 a 5 minutos.",
    help: "Seleccione una alternativa por pregunta. El campo de comentarios es opcional y puede usarse para agregar contexto, fechas, sectores, cifras o enlaces.",
    note: "Si alguna definición aún está abierta, es normal. La respuesta “Aún no definido” ayuda a indicar si el primer paso debe ser una fase corta de definición e investigación exploratoria.",
  },
  zh: {
    intro: "目的：快速了解您的需求，以便准备合适的方案。填写约需 3 至 5 分钟。",
    help: "每题请选择一个选项。备注为选填，可补充背景、日期、行业、数据或链接。",
    note: "部分事项尚未确定是正常的。选择“尚未确定”有助于判断第一步是否应为简短的需求界定与探索性研究。",
  },
} satisfies Record<Lang, { intro: string; help: string; note: string }>;

const BY_LANG: Record<Exclude<Lang, "pt">, QuestionText[]> = { en: EN, es: ES, zh: ZH };

/** Perguntas do formulário no idioma escolhido (ids e ordem preservados). */
export function scopeQuestions(lang: Lang): ScopeQuestion[] {
  if (lang === "pt") return SCOPE_QUESTIONS;
  const translated = BY_LANG[lang];
  return SCOPE_QUESTIONS.map((q, index) => {
    const tr = translated[index];
    if (!tr) return q;
    const next: ScopeQuestion = {
      ...q,
      theme: tr.theme,
      question: tr.question,
      purpose: tr.purpose,
      options: tr.options,
    };
    if (tr.hint) next.hint = tr.hint;
    else delete next.hint;
    if (tr.dateWhen) next.dateWhen = tr.dateWhen;
    return next;
  });
}

export function scopeTexts(lang: Lang) {
  return TEXTS[lang];
}
