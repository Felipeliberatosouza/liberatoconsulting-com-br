/**
 * Perguntas do Escopo Inicial para Treinamento in Company (ids t1..t10).
 * PT é a fonte; EN/ES/ZH mantêm a mesma ordem de opções.
 */
import type { Lang } from "@/i18n/config";
import type { ScopeQuestion } from "@/lib/scope-form";

type Q = { theme: string; question: string; purpose: string; dateWhen?: string; options: string[] };

const PT: Q[] = [
  { theme: "Tema e foco", question: "Qual é o tema central que a equipe precisa desenvolver?", purpose: "Definir o conteúdo e o instrutor adequados.", options: ["Gestão Estratégica e Metas", "Vendas B2B e Negociação Comercial", "Eficiência Operacional e Processos", "Inteligência Artificial e Automação na Prática", "Finanças, Margem e Precificação", "Liderança e Formação de Gestores", "Outro"] },
  { theme: "Formato", question: "Em qual modelo de entrega o treinamento deve acontecer?", purpose: "Planejar logística, plataforma e dinâmicas.", options: ["100% Presencial in company", "100% Online ao vivo (interativo)", "Híbrido (encontros presenciais + módulos remotos)", "Outro"] },
  { theme: "Público", question: "Quem serão os participantes do treinamento?", purpose: "Ajustar a linguagem e a profundidade do conteúdo.", options: ["Diretoria e C-Level", "Gerentes e Coordenadores", "Equipe operacional e analistas", "Força de vendas e comercial", "Turma mista (líderes e liderados)", "Outro"] },
  { theme: "Tamanho da turma", question: "Quantas pessoas devem participar da capacitação?", purpose: "Dimensionar número de turmas, materiais e facilitadores.", options: ["Até 10 participantes", "11 a 25 participantes", "26 a 50 participantes", "Mais de 50 participantes (divisão em turmas)", "A definir"] },
  { theme: "Carga horária", question: "Qual a intensidade e formato de cronograma preferido?", purpose: "Calcular horas de instrução e preparação.", options: ["Workshop intensivo de 4 horas", "Treinamento de 1 dia (8 horas)", "Imersão de 2 dias (16 horas)", "Programa semanal contínuo (20 a 40 horas em encontros semanais)", "A combinar de acordo com a recomendação"] },
  { theme: "Customização e prática", question: "Qual o nível de aplicação prática com dados da empresa é necessário?", purpose: "Estimar o esforço de personalização do conteúdo.", options: ["Aplicação com estudos de casos reais e desafios práticos da própria empresa", "Conteúdo expositivo de metodologia com dinâmicas e exercícios padrão", "Foco em treinamento com planilhas e ferramentas práticas para uso imediato", "Combinação dos itens anteriores"] },
  { theme: "Local", question: "Onde o treinamento presencial será sediado (ou abrangência da equipe online)?", purpose: "Prever deslocamento, hospedagem e custos de logística.", options: ["Sede da empresa na Grande São Paulo", "Outras capitais / interior de SP", "Outros estados do Brasil (necessidade de deslocamento/hospedagem)", "100% Online (equipes distribuídas em várias cidades)", "Outro"] },
  { theme: "Motivação", question: "O que motivou a busca por essa capacitação neste momento?", purpose: "Conectar o treinamento ao resultado esperado pela empresa.", options: ["Necessidade urgente de bater metas ou aumentar produtividade", "Adoção de novos processos, sistemas ou ferramentas de IA", "Integração de novos colaboradores ou alinhamento de lideranças", "Programa anual corporativo de desenvolvimento de pessoas", "Outro"] },
  { theme: "Prazo", question: "Para quando a empresa precisa que o treinamento seja realizado?", purpose: "Planejar agenda e preparação do material.", dateWhen: "Data específica fechada para convenção/evento da empresa", options: ["Imediato (nos próximos 15 a 30 dias)", "No próximo trimestre", "Data específica fechada para convenção/evento da empresa", "Planejamento para o próximo semestre"] },
  { theme: "Orçamento", question: "Como está previsto o orçamento para esta contratação?", purpose: "Ajustar a proposta à forma de aprovação do investimento.", options: ["Verba já aprovada para contratação por pacote/turma", "Verba estimada com necessidade de proposta para aprovação da diretoria", "Preferência por receber opções em diferentes cargas horárias", "Ainda sem orçamento definido"] },
];

const EN: Q[] = [
  { theme: "Topic and focus", question: "What core topic does the team need to develop?", purpose: "Define the right content and instructor.", options: ["Strategic Management and Goals", "B2B Sales and Negotiation", "Operational Efficiency and Processes", "Artificial Intelligence and Automation in Practice", "Finance, Margin and Pricing", "Leadership and Manager Development", "Other"] },
  { theme: "Format", question: "Which delivery model should the training follow?", purpose: "Plan logistics, platform and activities.", options: ["100% on-site in company", "100% live online (interactive)", "Hybrid (on-site sessions + remote modules)", "Other"] },
  { theme: "Audience", question: "Who will attend the training?", purpose: "Adjust the language and depth of the content.", options: ["Board and C-Level", "Managers and Coordinators", "Operations team and analysts", "Sales force", "Mixed group (leaders and team members)", "Other"] },
  { theme: "Group size", question: "How many people should take part?", purpose: "Size the number of groups, materials and facilitators.", options: ["Up to 10 participants", "11 to 25 participants", "26 to 50 participants", "More than 50 participants (split into groups)", "To be defined"] },
  { theme: "Workload", question: "What intensity and schedule do you prefer?", purpose: "Estimate instruction and preparation hours.", options: ["4-hour intensive workshop", "1-day training (8 hours)", "2-day immersion (16 hours)", "Ongoing weekly program (20 to 40 hours in weekly sessions)", "To be agreed based on the recommendation"] },
  { theme: "Customization and practice", question: "How much hands-on application with company data is needed?", purpose: "Estimate the content customization effort.", options: ["Real case studies and practical challenges from the company itself", "Methodology lectures with standard activities and exercises", "Focus on spreadsheets and practical tools for immediate use", "A combination of the above"] },
  { theme: "Location", question: "Where will on-site training take place (or how spread is the online team)?", purpose: "Plan travel, lodging and logistics costs.", options: ["Company headquarters in Greater São Paulo", "Other state capitals / São Paulo countryside", "Other Brazilian states (travel/lodging required)", "100% online (teams spread across several cities)", "Other"] },
  { theme: "Motivation", question: "What prompted the search for this training now?", purpose: "Link the training to the result the company expects.", options: ["Urgent need to hit targets or raise productivity", "Adoption of new processes, systems or AI tools", "Onboarding new staff or aligning leadership", "Annual corporate people development program", "Other"] },
  { theme: "Timeline", question: "When does the training need to happen?", purpose: "Plan the schedule and material preparation.", dateWhen: "Specific date set for a company convention/event", options: ["Immediately (next 15 to 30 days)", "Next quarter", "Specific date set for a company convention/event", "Planning for next semester"] },
  { theme: "Budget", question: "How is the budget for this engagement planned?", purpose: "Match the proposal to how the investment is approved.", options: ["Budget already approved per package/group", "Estimated budget; proposal needed for board approval", "Prefer options with different workloads", "No budget defined yet"] },
];

const ES: Q[] = [
  { theme: "Tema y enfoque", question: "¿Cuál es el tema central que el equipo necesita desarrollar?", purpose: "Definir el contenido y el instructor adecuados.", options: ["Gestión Estratégica y Metas", "Ventas B2B y Negociación Comercial", "Eficiencia Operativa y Procesos", "Inteligencia Artificial y Automatización en la Práctica", "Finanzas, Margen y Precios", "Liderazgo y Formación de Gestores", "Otro"] },
  { theme: "Formato", question: "¿En qué modelo de entrega debe realizarse la capacitación?", purpose: "Planificar logística, plataforma y dinámicas.", options: ["100% presencial in company", "100% online en vivo (interactivo)", "Híbrido (encuentros presenciales + módulos remotos)", "Otro"] },
  { theme: "Público", question: "¿Quiénes participarán en la capacitación?", purpose: "Ajustar el lenguaje y la profundidad del contenido.", options: ["Dirección y C-Level", "Gerentes y Coordinadores", "Equipo operativo y analistas", "Fuerza de ventas y comercial", "Grupo mixto (líderes y colaboradores)", "Otro"] },
  { theme: "Tamaño del grupo", question: "¿Cuántas personas deben participar?", purpose: "Dimensionar grupos, materiales y facilitadores.", options: ["Hasta 10 participantes", "11 a 25 participantes", "26 a 50 participantes", "Más de 50 participantes (división en grupos)", "Por definir"] },
  { theme: "Carga horaria", question: "¿Qué intensidad y cronograma prefiere?", purpose: "Calcular horas de instrucción y preparación.", options: ["Taller intensivo de 4 horas", "Capacitación de 1 día (8 horas)", "Inmersión de 2 días (16 horas)", "Programa semanal continuo (20 a 40 horas en encuentros semanales)", "A acordar según la recomendación"] },
  { theme: "Personalización y práctica", question: "¿Qué nivel de aplicación práctica con datos de la empresa se necesita?", purpose: "Estimar el esfuerzo de personalización del contenido.", options: ["Estudios de casos reales y desafíos prácticos de la propia empresa", "Contenido expositivo de metodología con dinámicas y ejercicios estándar", "Enfoque en hojas de cálculo y herramientas prácticas de uso inmediato", "Combinación de los anteriores"] },
  { theme: "Lugar", question: "¿Dónde se realizará la capacitación presencial (o qué alcance tiene el equipo online)?", purpose: "Prever traslados, hospedaje y costos logísticos.", options: ["Sede de la empresa en el Gran São Paulo", "Otras capitales / interior de SP", "Otros estados de Brasil (traslado/hospedaje necesario)", "100% online (equipos en varias ciudades)", "Otro"] },
  { theme: "Motivación", question: "¿Qué motivó la búsqueda de esta capacitación ahora?", purpose: "Conectar la capacitación con el resultado esperado.", options: ["Necesidad urgente de cumplir metas o aumentar la productividad", "Adopción de nuevos procesos, sistemas o herramientas de IA", "Integración de nuevos colaboradores o alineación de líderes", "Programa anual corporativo de desarrollo de personas", "Otro"] },
  { theme: "Plazo", question: "¿Para cuándo necesita la empresa la capacitación?", purpose: "Planificar agenda y preparación del material.", dateWhen: "Fecha específica cerrada para convención/evento de la empresa", options: ["Inmediato (próximos 15 a 30 días)", "En el próximo trimestre", "Fecha específica cerrada para convención/evento de la empresa", "Planificación para el próximo semestre"] },
  { theme: "Presupuesto", question: "¿Cómo está previsto el presupuesto para esta contratación?", purpose: "Ajustar la propuesta a la forma de aprobación de la inversión.", options: ["Presupuesto ya aprobado por paquete/grupo", "Presupuesto estimado; se necesita propuesta para aprobación de la dirección", "Prefiero opciones con diferentes cargas horarias", "Aún sin presupuesto definido"] },
];

const ZH: Q[] = [
  { theme: "主题与重点", question: "团队需要提升的核心主题是什么？", purpose: "确定合适的内容与讲师。", options: ["战略管理与目标", "B2B 销售与商务谈判", "运营效率与流程", "人工智能与自动化实操", "财务、利润与定价", "领导力与管理者培养", "其他"] },
  { theme: "形式", question: "培训应采用哪种交付模式？", purpose: "规划后勤、平台与互动环节。", options: ["100% 线下企业内训", "100% 线上直播（互动）", "混合式（线下课程＋远程模块）", "其他"] },
  { theme: "学员", question: "哪些人员将参加培训？", purpose: "调整内容的表达方式与深度。", options: ["董事会与高管", "经理与主管", "运营团队与分析人员", "销售团队", "混合班（管理者与员工）", "其他"] },
  { theme: "班级规模", question: "预计有多少人参加？", purpose: "确定班次、材料与讲师数量。", options: ["最多 10 人", "11 至 25 人", "26 至 50 人", "50 人以上（分班）", "待定"] },
  { theme: "课时", question: "您偏好的强度与课程安排是什么？", purpose: "估算授课与准备时间。", options: ["4 小时强化工作坊", "1 天培训（8 小时）", "2 天沉浸式（16 小时）", "每周持续课程（每周授课，共 20 至 40 小时）", "根据建议另行商定"] },
  { theme: "定制与实操", question: "需要结合企业数据进行多大程度的实操？", purpose: "估算内容定制工作量。", options: ["使用企业真实案例与实际挑战", "方法讲授，配合标准练习与互动", "侧重可立即使用的表格与实用工具", "以上组合"] },
  { theme: "地点", question: "线下培训在哪里举行（或线上团队分布范围）？", purpose: "预估差旅、住宿与后勤成本。", options: ["大圣保罗地区公司总部", "其他首府城市 / 圣保罗州内陆", "巴西其他州（需差旅/住宿）", "100% 线上（团队分布在多个城市）", "其他"] },
  { theme: "动机", question: "目前寻求此培训的主要原因是什么？", purpose: "将培训与企业期望的成果相连接。", options: ["急需完成目标或提升生产力", "引入新流程、系统或 AI 工具", "新员工融入或管理层对齐", "年度企业人才发展计划", "其他"] },
  { theme: "时间", question: "企业需要在何时完成培训？", purpose: "规划日程与材料准备。", dateWhen: "已确定的公司大会/活动日期", options: ["立即（未来 15 至 30 天）", "下一季度", "已确定的公司大会/活动日期", "计划于下半年"] },
  { theme: "预算", question: "此次采购的预算如何安排？", purpose: "使方案符合投资审批方式。", options: ["已按套餐/班次批准预算", "已有预估预算，需提交方案供管理层审批", "希望收到不同课时的方案选项", "尚未确定预算"] },
];

const HINT: Record<Lang, string> = {
  pt: "Se tiver datas, cidades ou número exato de pessoas, informe em Comentários.",
  en: "If you have dates, cities or an exact headcount, add them under Comments.",
  es: "Si tiene fechas, ciudades o número exacto de personas, indíquelos en Comentarios.",
  zh: "如有日期、城市或确切人数，请在“备注”中说明。",
};

const BY_LANG: Record<Lang, Q[]> = { pt: PT, en: EN, es: ES, zh: ZH };

export function trainingQuestions(lang: Lang, startIndex = 1): ScopeQuestion[] {
  return BY_LANG[lang].map((q, i) => ({
    id: `t${i + 1}`,
    index: startIndex + i,
    ...q,
    ...(i === 0 || i === 3 || i === 6 ? { hint: HINT[lang] } : {}),
  }));
}

export const TRAINING_QUESTIONS = trainingQuestions("pt");
