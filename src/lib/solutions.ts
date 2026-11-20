/**
 * Portfólio por dor (reformulação nov/26): 7 consultorias + 6 treinamentos.
 * O nome de cada serviço usa a mesma linguagem com que o cliente descreve o
 * problema e pesquisa no Google/IA. Módulo seguro para o navegador.
 */
import type { Lang } from "@/i18n/config";

type L = Record<Lang, string>;
type LL = Record<Lang, string[]>;

export interface Solution {
  slug: string;
  n: number;
  title: L;
  chip: L;
  pain: L;
  promise: L;
  slogan: L;
  tools: LL;
  kpi: LL;
  trainingSlug?: string;
}

export interface Training {
  slug: string;
  title: L;
  audience: L;
  outcome: L;
  solutionSlug: string;
}

export const SOLUTIONS: Solution[] = [
  {
    slug: "preco-certo-lucro-real",
    n: 1,
    title: {
      pt: "Preço Certo e Lucro Real em Cada Venda",
      en: "The Right Price and Real Profit on Every Sale",
      es: "Precio Correcto y Ganancia Real en Cada Venta",
      zh: "定价正确，每笔销售都有真实利润",
    },
    chip: { pt: "Vendo bem, mas não sobra dinheiro", en: "We sell well, but no money is left", es: "Vendo bien, pero no sobra dinero", zh: "销售不错，却剩不下钱" },
    pain: {
      pt: "“Faturo bem, mas não sei para onde vai o dinheiro nem se meu preço está certo.”",
      en: "“Revenue is good, but I don't know where the money goes or if my price is right.”",
      es: "“Facturo bien, pero no sé adónde va el dinero ni si mi precio es correcto.”",
      zh: "“营收不错，但我不知道钱去了哪里，也不知道价格对不对。”",
    },
    promise: {
      pt: "Descubra quais produtos e clientes dão lucro de verdade, acerte o preço e tenha caixa previsível.",
      en: "Find which products and clients truly make money, fix your pricing and get predictable cash.",
      es: "Descubra qué productos y clientes dan ganancia real, ajuste el precio y tenga caja previsible.",
      zh: "找出真正赚钱的产品和客户，定对价格，让现金流可预期。",
    },
    slogan: { pt: "Venda com lucro, não só com volume.", en: "Sell for profit, not just volume.", es: "Venda con ganancia, no solo con volumen.", zh: "为利润而卖，而不只是为销量。" },
    tools: {
      pt: ["Margem de contribuição por produto e cliente", "Curva ABC", "Precificação por valor e por custo", "DRE gerencial", "Fluxo de caixa de 13 semanas", "Ponto de equilíbrio"],
      en: ["Contribution margin by product and client", "ABC analysis", "Value- and cost-based pricing", "Management P&L", "13-week cash flow", "Break-even point"],
      es: ["Margen de contribución por producto y cliente", "Curva ABC", "Precios por valor y por costo", "Estado de resultados gerencial", "Flujo de caja de 13 semanas", "Punto de equilibrio"],
      zh: ["按产品和客户的边际贡献", "ABC分析", "基于价值和成本的定价", "管理损益表", "13周现金流", "盈亏平衡点"],
    },
    kpi: {
      pt: ["Margem de contribuição (%)", "EBITDA", "Ciclo de caixa (dias)"],
      en: ["Contribution margin (%)", "EBITDA", "Cash cycle (days)"],
      es: ["Margen de contribución (%)", "EBITDA", "Ciclo de caja (días)"],
      zh: ["边际贡献率（%）", "EBITDA", "现金周期（天）"],
    },
    trainingSlug: "financas-para-nao-financeiros",
  },
  {
    slug: "vendas-sem-depender-do-dono",
    n: 2,
    title: { pt: "Vendas B2B sem Depender do Dono", en: "B2B Sales That Don't Depend on the Owner", es: "Ventas B2B sin Depender del Dueño", zh: "不依赖老板的B2B销售" },
    chip: { pt: "Só eu consigo vender", en: "Only I can sell", es: "Solo yo logro vender", zh: "只有我能卖出去" },
    pain: {
      pt: "“Só eu consigo vender. Um mês vende muito, no outro nada.”",
      en: "“Only I can sell. One month sales are great, the next nothing.”",
      es: "“Solo yo logro vender. Un mes se vende mucho y al siguiente nada.”",
      zh: "“只有我能卖。这个月卖得多，下个月却没有。”",
    },
    promise: {
      pt: "Cliente ideal definido, proposta de valor clara, funil com CRM e rotina de prospecção da equipe.",
      en: "Defined ideal client, clear value proposition, CRM pipeline and a team prospecting routine.",
      es: "Cliente ideal definido, propuesta de valor clara, embudo con CRM y rutina de prospección del equipo.",
      zh: "明确理想客户、清晰价值主张、CRM销售漏斗和团队拓客节奏。",
    },
    slogan: { pt: "Vendas previsíveis, sem depender só do dono.", en: "Predictable sales without relying on the owner.", es: "Ventas previsibles, sin depender solo del dueño.", zh: "可预期的销售，不再只靠老板。" },
    tools: {
      pt: ["Perfil de cliente ideal (ICP)", "Jobs to Be Done", "Canvas da Proposta de Valor", "Funil e CRM", "SPIN Selling", "Cadência de prospecção", "Metas comerciais"],
      en: ["Ideal customer profile (ICP)", "Jobs to Be Done", "Value Proposition Canvas", "Pipeline and CRM", "SPIN Selling", "Prospecting cadence", "Sales targets"],
      es: ["Perfil de cliente ideal (ICP)", "Jobs to Be Done", "Canvas de Propuesta de Valor", "Embudo y CRM", "SPIN Selling", "Cadencia de prospección", "Metas comerciales"],
      zh: ["理想客户画像（ICP）", "待办任务理论（JTBD）", "价值主张画布", "销售漏斗与CRM", "SPIN销售法", "拓客节奏", "销售目标"],
    },
    kpi: {
      pt: ["Taxa de conversão do funil", "Ciclo de vendas (dias)", "% da receita nos 5 maiores clientes"],
      en: ["Pipeline conversion rate", "Sales cycle (days)", "% of revenue from top 5 clients"],
      es: ["Tasa de conversión del embudo", "Ciclo de ventas (días)", "% de ingresos en los 5 mayores clientes"],
      zh: ["漏斗转化率", "销售周期（天）", "前5大客户收入占比"],
    },
    trainingSlug: "vendas-consultivas-b2b",
  },
  {
    slug: "operacao-sem-retrabalho",
    n: 3,
    title: { pt: "Operação sem Retrabalho e sem Atrasos", en: "Operations Without Rework or Delays", es: "Operación sin Retrabajo y sin Atrasos", zh: "没有返工和延误的运营" },
    chip: { pt: "Vivemos apagando incêndio", en: "We're always firefighting", es: "Vivimos apagando incendios", zh: "总是在救火" },
    pain: {
      pt: "“Vivemos apagando incêndio, os prazos atrasam e o custo só sobe.”",
      en: "“We're always firefighting, deadlines slip and costs keep rising.”",
      es: "“Vivimos apagando incendios, los plazos se atrasan y el costo solo sube.”",
      zh: "“我们总在救火，交期延误，成本一直上涨。”",
    },
    promise: {
      pt: "Gargalos mapeados, processos padronizados e desperdícios eliminados — mais entrega com a mesma equipe.",
      en: "Bottlenecks mapped, processes standardized and waste removed — more output with the same team.",
      es: "Cuellos de botella mapeados, procesos estandarizados y desperdicios eliminados — más entrega con el mismo equipo.",
      zh: "找出瓶颈、流程标准化、消除浪费——同样团队，更多产出。",
    },
    slogan: { pt: "Menos retrabalho, mais entrega, com a mesma equipe.", en: "Less rework, more delivery, same team.", es: "Menos retrabajo, más entrega, con el mismo equipo.", zh: "更少返工，更多交付，团队不变。" },
    tools: {
      pt: ["Mapeamento do Fluxo de Valor (VSM)", "Lean, Kaizen e Kanban", "5S", "PDCA e MASP", "Procedimento Operacional Padrão (POP)", "Gestão visual"],
      en: ["Value Stream Mapping (VSM)", "Lean, Kaizen and Kanban", "5S", "PDCA and root-cause analysis", "Standard operating procedures (SOP)", "Visual management"],
      es: ["Mapeo del Flujo de Valor (VSM)", "Lean, Kaizen y Kanban", "5S", "PDCA y análisis de causa raíz", "Procedimiento Operativo Estándar (POE)", "Gestión visual"],
      zh: ["价值流图（VSM）", "精益、改善与看板", "5S", "PDCA与根因分析", "标准作业程序（SOP）", "目视化管理"],
    },
    kpi: {
      pt: ["Lead time", "% de retrabalho", "Custo unitário", "Entregas no prazo"],
      en: ["Lead time", "% rework", "Unit cost", "On-time delivery"],
      es: ["Lead time", "% de retrabajo", "Costo unitario", "Entregas a tiempo"],
      zh: ["交付周期", "返工率", "单位成本", "准时交付率"],
    },
    trainingSlug: "lean-eficiencia-processos",
  },
  {
    slug: "metas-que-saem-do-papel",
    n: 4,
    title: { pt: "Metas que Saem do Papel e Rotina de Gestão", en: "Goals That Get Done and a Management Routine", es: "Metas que Salen del Papel y Rutina de Gestión", zh: "目标落地与管理例会机制" },
    chip: { pt: "O planejamento não sai do papel", en: "Our plan never gets done", es: "La planificación no sale del papel", zh: "规划总是落不了地" },
    pain: {
      pt: "“Fazemos planejamento todo ano e nada muda. Se eu me afastar uma semana, a empresa para.”",
      en: "“We plan every year and nothing changes. If I step away for a week, the company stops.”",
      es: "“Planificamos todos los años y nada cambia. Si me alejo una semana, la empresa se detiene.”",
      zh: "“每年都做规划却毫无变化。我离开一周，公司就停摆。”",
    },
    promise: {
      pt: "Metas com dono, áreas alinhadas e reuniões semanais curtas que transformam plano em rotina.",
      en: "Goals with owners, aligned teams and short weekly meetings that turn plans into routine.",
      es: "Metas con responsable, áreas alineadas y reuniones semanales breves que convierten el plan en rutina.",
      zh: "目标有负责人、部门对齐、简短周会，让计划变成日常。",
    },
    slogan: { pt: "Metas que saem do papel e viram rotina.", en: "Goals that leave the page and become routine.", es: "Metas que salen del papel y se vuelven rutina.", zh: "让目标落地，成为日常。" },
    tools: {
      pt: ["Planejamento estratégico enxuto", "OKR e metas SMART", "Balanced Scorecard", "Reunião semanal de indicadores", "Matriz RACI", "Scrum e Kanban para projetos"],
      en: ["Lean strategic planning", "OKRs and SMART goals", "Balanced Scorecard", "Weekly KPI meeting", "RACI matrix", "Scrum and Kanban for projects"],
      es: ["Planificación estratégica ágil", "OKR y metas SMART", "Balanced Scorecard", "Reunión semanal de indicadores", "Matriz RACI", "Scrum y Kanban para proyectos"],
      zh: ["精简战略规划", "OKR与SMART目标", "平衡计分卡", "每周指标会议", "RACI矩阵", "项目Scrum与看板"],
    },
    kpi: {
      pt: ["% de metas atingidas", "% de projetos no prazo", "Decisões delegadas"],
      en: ["% of goals achieved", "% of projects on time", "Delegated decisions"],
      es: ["% de metas alcanzadas", "% de proyectos a tiempo", "Decisiones delegadas"],
      zh: ["目标达成率", "项目准时率", "授权决策数"],
    },
    trainingSlug: "lideranca-gestao-da-rotina",
  },
  {
    slug: "automacao-e-ia",
    n: 5,
    title: { pt: "Automação e IA Onde Dá Retorno", en: "Automation and AI Where It Pays Off", es: "Automatización e IA Donde Da Retorno", zh: "在有回报的地方用自动化和AI" },
    chip: { pt: "Muito trabalho manual em planilhas", en: "Too much manual spreadsheet work", es: "Mucho trabajo manual en planillas", zh: "太多手工表格工作" },
    pain: {
      pt: "“Minha equipe perde horas copiando dados e não sei por onde começar com IA.”",
      en: "“My team wastes hours copying data and I don't know where to start with AI.”",
      es: "“Mi equipo pierde horas copiando datos y no sé por dónde empezar con IA.”",
      zh: "“团队花大量时间复制数据，我不知道AI从哪里开始。”",
    },
    promise: {
      pt: "Tarefas repetitivas automatizadas, assistentes de IA para a equipe e painéis que viram decisão.",
      en: "Repetitive tasks automated, AI assistants for the team and dashboards that drive decisions.",
      es: "Tareas repetitivas automatizadas, asistentes de IA para el equipo y paneles que generan decisiones.",
      zh: "自动化重复任务，为团队配备AI助手，用看板支撑决策。",
    },
    slogan: { pt: "IA onde dá retorno, não onde está na moda.", en: "AI where it pays off, not where it's trendy.", es: "IA donde da retorno, no donde está de moda.", zh: "AI用在有回报处，而非追赶潮流。" },
    tools: {
      pt: ["Matriz impacto x esforço", "Diagnóstico de maturidade digital", "Automação no-code e RPA", "Assistentes de IA generativa", "Dashboards de indicadores", "Regras de dados e LGPD"],
      en: ["Impact vs effort matrix", "Digital maturity assessment", "No-code automation and RPA", "Generative AI assistants", "KPI dashboards", "Data rules and privacy (LGPD)"],
      es: ["Matriz impacto vs esfuerzo", "Diagnóstico de madurez digital", "Automatización no-code y RPA", "Asistentes de IA generativa", "Paneles de indicadores", "Reglas de datos y LGPD"],
      zh: ["影响-投入矩阵", "数字化成熟度评估", "无代码自动化与RPA", "生成式AI助手", "指标看板", "数据规则与LGPD"],
    },
    kpi: {
      pt: ["Horas economizadas por mês", "Redução de erros", "Payback da automação"],
      en: ["Hours saved per month", "Error reduction", "Automation payback"],
      es: ["Horas ahorradas por mes", "Reducción de errores", "Payback de la automatización"],
      zh: ["每月节省工时", "错误减少", "自动化回收期"],
    },
    trainingSlug: "ia-pratica-gestores",
  },
  {
    slug: "validar-ideia-antes-de-investir",
    n: 6,
    title: { pt: "Validar Nova Ideia antes de Investir", en: "Validate a New Idea Before Investing", es: "Validar una Nueva Idea antes de Invertir", zh: "投资前先验证新想法" },
    chip: { pt: "Tenho medo de investir errado", en: "I'm afraid of investing wrong", es: "Tengo miedo de invertir mal", zh: "担心投错" },
    pain: {
      pt: "“Tenho uma ideia de produto ou expansão, mas tenho medo de investir alto no escuro.”",
      en: "“I have a product or expansion idea, but I'm afraid of investing big in the dark.”",
      es: "“Tengo una idea de producto o expansión, pero temo invertir mucho a ciegas.”",
      zh: "“我有新产品或扩张想法，但害怕盲目大笔投入。”",
    },
    promise: {
      pt: "Demanda testada com clientes reais e viabilidade calculada — decisão clara de avançar, ajustar ou parar.",
      en: "Demand tested with real customers and viability calculated — a clear go, adjust or stop decision.",
      es: "Demanda probada con clientes reales y viabilidad calculada — decisión clara de avanzar, ajustar o parar.",
      zh: "用真实客户测试需求并测算可行性——明确推进、调整或停止。",
    },
    slogan: { pt: "Teste antes de investir. Decida com evidência.", en: "Test before you invest. Decide with evidence.", es: "Pruebe antes de invertir. Decida con evidencia.", zh: "先测试再投资，用证据决策。" },
    tools: {
      pt: ["Business Model Canvas", "Entrevistas de problema", "Testes de demanda e MVP", "TAM-SAM-SOM", "Viabilidade (VPL, TIR, payback)", "Plano de negócios"],
      en: ["Business Model Canvas", "Problem interviews", "Demand tests and MVP", "TAM-SAM-SOM", "Viability (NPV, IRR, payback)", "Business plan"],
      es: ["Business Model Canvas", "Entrevistas de problema", "Pruebas de demanda y MVP", "TAM-SAM-SOM", "Viabilidad (VAN, TIR, payback)", "Plan de negocios"],
      zh: ["商业模式画布", "问题访谈", "需求测试与MVP", "TAM-SAM-SOM", "可行性（NPV、IRR、回收期）", "商业计划书"],
    },
    kpi: {
      pt: ["Hipóteses validadas", "Intenção de compra", "Payback e VPL"],
      en: ["Validated hypotheses", "Purchase intent", "Payback and NPV"],
      es: ["Hipótesis validadas", "Intención de compra", "Payback y VAN"],
      zh: ["已验证假设", "购买意向", "回收期与NPV"],
    },
    trainingSlug: "modelagem-validacao-ideias",
  },
  {
    slug: "entrada-no-brasil",
    n: 7,
    title: { pt: "Entrada no Brasil sem Surpresas", en: "Enter Brazil Without Surprises", es: "Entrada en Brasil sin Sorpresas", zh: "无意外进入巴西市场" },
    chip: { pt: "Quero entrar no mercado brasileiro", en: "We want to enter Brazil", es: "Quiero entrar al mercado brasileño", zh: "想进入巴西市场" },
    pain: {
      pt: "“O Brasil é complexo: tributos, regras e parceiros. Precisamos de dados antes da decisão do board.”",
      en: "“Brazil is complex: taxes, rules, partners. We need data before the board decides.”",
      es: "“Brasil es complejo: impuestos, reglas y socios. Necesitamos datos antes de que decida el directorio.”",
      zh: "“巴西很复杂：税务、法规、合作伙伴。董事会决策前我们需要数据。”",
    },
    promise: {
      pt: "Tamanho de mercado, concorrentes, regulação, tributos e parceiros locais mapeados com dados oficiais.",
      en: "Market size, competitors, regulation, taxes and local partners mapped with official data.",
      es: "Tamaño de mercado, competidores, regulación, impuestos y socios locales mapeados con datos oficiales.",
      zh: "用官方数据梳理市场规模、竞争对手、监管、税务和本地伙伴。",
    },
    slogan: { pt: "Entre no Brasil com dados, não com suposições.", en: "Enter Brazil with data, not assumptions.", es: "Entre en Brasil con datos, no con suposiciones.", zh: "用数据而非假设进入巴西。" },
    tools: {
      pt: ["Dimensionamento de mercado", "PESTEL", "5 Forças de Porter", "Mapa de concorrentes", "Análise tributária e regulatória", "Mapa de parceiros e distribuidores"],
      en: ["Market sizing", "PESTEL", "Porter's Five Forces", "Competitor map", "Tax and regulatory analysis", "Partner and distributor mapping"],
      es: ["Dimensionamiento de mercado", "PESTEL", "5 Fuerzas de Porter", "Mapa de competidores", "Análisis tributario y regulatorio", "Mapa de socios y distribuidores"],
      zh: ["市场规模测算", "PESTEL", "波特五力", "竞争对手地图", "税务与监管分析", "合作伙伴与分销商梳理"],
    },
    kpi: {
      pt: ["Decisão go/no-go fundamentada", "Tempo até a entrada", "Parceiros qualificados"],
      en: ["Evidence-based go/no-go", "Time to entry", "Qualified partners"],
      es: ["Decisión go/no-go fundamentada", "Tiempo hasta la entrada", "Socios calificados"],
      zh: ["有依据的进入决策", "进入所需时间", "合格合作伙伴数"],
    },
  },
  {
    slug: "crm-sob-medida",
    n: 8,
    title: { pt: "Fechou! CRM sob Medida", en: "Fechou! Tailor-made CRM", es: "Fechou! CRM a Medida", zh: "Fechou! 定制CRM" },
    chip: { pt: "Perdemos vendas por falta de acompanhamento", en: "We lose sales for lack of follow-up", es: "Perdemos ventas por falta de seguimiento", zh: "因跟进不足而丢单" },
    pain: {
      pt: "“Perdemos vendas por falta de acompanhamento e nenhum CRM do mercado se adapta ao nosso jeito de vender.”",
      en: "“We lose sales for lack of follow-up, and no off-the-shelf CRM fits the way we sell.”",
      es: "“Perdemos ventas por falta de seguimiento y ningún CRM del mercado se adapta a nuestra forma de vender.”",
      zh: "“我们因跟进不足而丢单，市面上的CRM都不适合我们的销售方式。”",
    },
    promise: {
      pt: "Funil visual com as suas etapas, metas por vendedor, alertas de prazo e implantação assistida — sem licença por usuário.",
      en: "A visual funnel with your stages, seller goals, deadline alerts and assisted rollout — no per-user license.",
      es: "Embudo visual con sus etapas, metas por vendedor, alertas de plazo e implementación asistida — sin licencia por usuario.",
      zh: "按您的阶段设计的可视化漏斗、销售目标、期限提醒和协助上线——不按用户收费。",
    },
    slogan: { pt: "Nenhuma venda esquecida no meio do caminho.", en: "No deal forgotten along the way.", es: "Ninguna venta olvidada en el camino.", zh: "不让任何一笔生意半途被遗忘。" },
    tools: {
      pt: ["Funil de vendas clicável", "Cadastro completo de clientes", "Metas por vendedor", "Alertas de prazo por urgência", "Relatórios e assistente de IA", "Importação por planilha"],
      en: ["Clickable sales funnel", "Complete client records", "Seller goals", "Urgency deadline alerts", "Reports and AI assistant", "Spreadsheet import"],
      es: ["Embudo de ventas clicable", "Registro completo de clientes", "Metas por vendedor", "Alertas de plazo por urgencia", "Informes y asistente de IA", "Importación por planilla"],
      zh: ["可点击的销售漏斗", "完整客户档案", "销售目标", "按紧急程度的期限提醒", "报表与AI助手", "表格导入"],
    },
    kpi: {
      pt: ["Taxa de conversão do funil", "Tempo médio por etapa", "Meta atingida por vendedor"],
      en: ["Funnel conversion rate", "Average time per stage", "Goal attainment per seller"],
      es: ["Tasa de conversión del embudo", "Tiempo medio por etapa", "Meta alcanzada por vendedor"],
      zh: ["漏斗转化率", "各阶段平均时长", "销售目标达成率"],
    },
  },
];

export const TRAININGS: Training[] = [
  {
    slug: "financas-para-nao-financeiros",
    solutionSlug: "preco-certo-lucro-real",
    title: { pt: "Finanças e Precificação para Gestores Não Financeiros", en: "Finance and Pricing for Non-Financial Managers", es: "Finanzas y Precios para Gestores No Financieros", zh: "非财务经理的财务与定价" },
    audience: { pt: "Gerentes, coordenadores, comercial e compras", en: "Managers, supervisors, sales and purchasing", es: "Gerentes, coordinadores, comercial y compras", zh: "经理、主管、销售与采购" },
    outcome: { pt: "Ler a DRE, calcular a margem real e parar de dar desconto que corrói o caixa.", en: "Read the P&L, calculate real margin and stop discounts that drain cash.", es: "Leer el estado de resultados, calcular el margen real y dejar de dar descuentos que drenan la caja.", zh: "看懂损益表，计算真实利润率，停止侵蚀现金的折扣。" },
  },
  {
    slug: "vendas-consultivas-b2b",
    solutionSlug: "vendas-sem-depender-do-dono",
    title: { pt: "Vendas Consultivas B2B e Prospecção", en: "B2B Consultative Selling and Prospecting", es: "Ventas Consultivas B2B y Prospección", zh: "B2B顾问式销售与拓客" },
    audience: { pt: "Vendedores, SDRs e líderes comerciais", en: "Sales reps, SDRs and sales leaders", es: "Vendedores, SDR y líderes comerciales", zh: "销售、SDR与销售负责人" },
    outcome: { pt: "Prospectar o cliente ideal, usar funil/CRM e vender por valor, não por preço.", en: "Prospect ideal clients, use pipeline/CRM and sell on value, not price.", es: "Prospectar al cliente ideal, usar embudo/CRM y vender por valor, no por precio.", zh: "开发理想客户，使用漏斗/CRM，以价值而非价格成交。" },
  },
  {
    slug: "lean-eficiencia-processos",
    solutionSlug: "operacao-sem-retrabalho",
    title: { pt: "Lean e Eficiência de Processos na Prática", en: "Lean and Process Efficiency in Practice", es: "Lean y Eficiencia de Procesos en la Práctica", zh: "精益与流程效率实战" },
    audience: { pt: "Líderes de operações, produção e logística", en: "Operations, production and logistics leaders", es: "Líderes de operaciones, producción y logística", zh: "运营、生产与物流负责人" },
    outcome: { pt: "Achar gargalos, eliminar desperdícios, padronizar rotinas e acabar com o retrabalho.", en: "Find bottlenecks, remove waste, standardize routines and end rework.", es: "Encontrar cuellos de botella, eliminar desperdicios, estandarizar rutinas y terminar con el retrabajo.", zh: "找到瓶颈、消除浪费、标准化流程、杜绝返工。" },
  },
  {
    slug: "lideranca-gestao-da-rotina",
    solutionSlug: "metas-que-saem-do-papel",
    title: { pt: "Liderança e Gestão da Rotina", en: "Leadership and Daily Management", es: "Liderazgo y Gestión de la Rutina", zh: "领导力与日常管理" },
    audience: { pt: "Novos líderes, coordenadores e gerentes", en: "New leaders, supervisors and managers", es: "Nuevos líderes, coordinadores y gerentes", zh: "新任领导、主管与经理" },
    outcome: { pt: "Conduzir reuniões curtas, acompanhar metas e decidir sem depender do dono.", en: "Run short meetings, track goals and decide without depending on the owner.", es: "Conducir reuniones breves, seguir metas y decidir sin depender del dueño.", zh: "主持高效短会、跟踪目标、无需事事请示老板。" },
  },
  {
    slug: "ia-pratica-gestores",
    solutionSlug: "automacao-e-ia",
    title: { pt: "IA Prática para Gestores e Equipes", en: "Practical AI for Managers and Teams", es: "IA Práctica para Gestores y Equipos", zh: "面向管理者和团队的实用AI" },
    audience: { pt: "Gestores e equipes de todas as áreas", en: "Managers and teams from every area", es: "Gestores y equipos de todas las áreas", zh: "各部门管理者与团队" },
    outcome: { pt: "Usar IA generativa e automações simples para eliminar horas de trabalho manual.", en: "Use generative AI and simple automations to eliminate hours of manual work.", es: "Usar IA generativa y automatizaciones simples para eliminar horas de trabajo manual.", zh: "用生成式AI和简单自动化节省大量手工工时。" },
  },
  {
    slug: "modelagem-validacao-ideias",
    solutionSlug: "validar-ideia-antes-de-investir",
    title: { pt: "Modelagem de Negócios e Validação de Ideias", en: "Business Modeling and Idea Validation", es: "Modelado de Negocios y Validación de Ideas", zh: "商业建模与想法验证" },
    audience: { pt: "Diretores, sócios e times de novos produtos", en: "Directors, partners and new-product teams", es: "Directores, socios y equipos de nuevos productos", zh: "董事、合伙人与新产品团队" },
    outcome: { pt: "Estruturar o negócio, entrevistar clientes e testar demanda antes de gastar o orçamento.", en: "Structure the business, interview customers and test demand before spending the budget.", es: "Estructurar el negocio, entrevistar clientes y probar la demanda antes de gastar el presupuesto.", zh: "梳理商业模式、访谈客户、在花预算前验证需求。" },
  },
];

export const findSolution = (slug: string) => SOLUTIONS.find((s) => s.slug === slug);
export const findTraining = (slug: string) => TRAININGS.find((t) => t.slug === slug);

export const pick = (v: L, lang: string) => v[(lang as Lang)] ?? v.pt;
export const pickList = (v: LL, lang: string) => v[(lang as Lang)] ?? v.pt;

/** Textos da home e das páginas de soluções. */
export const SOLUTION_UI = {
  slogan: { pt: "Do problema ao resultado medido.", en: "From problem to measured result.", es: "Del problema al resultado medido.", zh: "从问题到可衡量的结果。" },
  support: {
    pt: "Diagnóstico rápido, plano de 90 dias e resultado medido em indicadores, com IA aplicada onde dá retorno.",
    en: "Fast diagnosis, a 90-day plan and results measured in KPIs, with AI applied where it pays off.",
    es: "Diagnóstico rápido, plan de 90 días y resultado medido en indicadores, con IA aplicada donde da retorno.",
    zh: "快速诊断、90天计划、用指标衡量结果，AI只用在有回报的地方。",
  },
  question: { pt: "Qual problema está travando sua empresa?", en: "What problem is holding your company back?", es: "¿Qué problema está frenando su empresa?", zh: "是什么问题在拖累您的企业？" },
  solutionsEyebrow: { pt: "Consultoria", en: "Consulting", es: "Consultoría", zh: "咨询" },
  solutionsTitle: { pt: "7 problemas que resolvemos — com resultado medido", en: "7 problems we solve — with measured results", es: "7 problemas que resolvemos — con resultado medido", zh: "我们解决的7个问题——结果可衡量" },
  measure: { pt: "Como medimos", en: "How we measure", es: "Cómo medimos", zh: "衡量指标" },
  see: { pt: "Ver como resolvemos", en: "See how we solve it", es: "Ver cómo lo resolvemos", zh: "查看解决方式" },
  ladderTitle: { pt: "Como começar", en: "How to start", es: "Cómo empezar", zh: "如何开始" },
  ladder: {
    pt: [["Radar Executivo", "Conversa de 45 min para confirmar o problema principal."], ["Plano 90 Dias", "Indicadores de partida, causas e plano priorizado."], ["Sprint de Resultado", "Execução lado a lado com a equipe até o indicador mudar."], ["Autonomia", "Treinamento e acompanhamento mensal para a equipe manter o resultado."]],
    en: [["Executive Radar", "A 45-min conversation to confirm the main problem."], ["90-Day Plan", "Baseline KPIs, root causes and a prioritized plan."], ["Results Sprint", "Hands-on execution with your team until the KPI moves."], ["Autonomy", "Training and monthly advisory so your team sustains results."]],
    es: [["Radar Ejecutivo", "Conversación de 45 min para confirmar el problema principal."], ["Plan 90 Días", "Indicadores de partida, causas y plan priorizado."], ["Sprint de Resultado", "Ejecución junto al equipo hasta que el indicador cambie."], ["Autonomía", "Capacitación y acompañamiento mensual para sostener el resultado."]],
    zh: [["高管雷达", "45分钟交流，确认核心问题。"], ["90天计划", "基线指标、根因与优先级计划。"], ["成果冲刺", "与团队并肩执行，直到指标改变。"], ["自主能力", "培训与月度辅导，让团队保持成果。"]],
  } as Record<Lang, string[][]>,
  trainingsEyebrow: { pt: "Treinamento in Company", en: "In-Company Training", es: "Capacitación In Company", zh: "企业内训" },
  trainingsTitle: { pt: "Capacite sua equipe para sustentar os resultados", en: "Train your team to sustain the results", es: "Capacite a su equipo para sostener los resultados", zh: "培养团队，持续保持成果" },
  trainingsBody: {
    pt: "Workshops práticos de 8h a 16h com os dados e desafios reais da sua empresa. Sem teoria solta: a equipe sai aplicando.",
    en: "Hands-on 8–16h workshops using your company's real data and challenges. No loose theory: your team leaves applying it.",
    es: "Talleres prácticos de 8 a 16 h con los datos y desafíos reales de su empresa. Sin teoría suelta: el equipo sale aplicando.",
    zh: "8–16小时实战工作坊，使用企业真实数据与挑战。不讲空理论，学完即用。",
  },
  badges: {
    pt: ["Feito com os dados da sua empresa", "Ferramentas prontas no dia seguinte", "Autonomia sem depender de consultores"],
    en: ["Built on your company's data", "Tools ready the next day", "Autonomy without relying on consultants"],
    es: ["Hecho con los datos de su empresa", "Herramientas listas al día siguiente", "Autonomía sin depender de consultores"],
    zh: ["基于企业自身数据", "第二天即可使用的工具", "不依赖顾问的自主能力"],
  } as Record<Lang, string[]>,
  forWho: { pt: "Para quem", en: "Who it's for", es: "Para quién", zh: "适合人群" },
  allTrainings: { pt: "Ver todos os treinamentos", en: "See all trainings", es: "Ver todas las capacitaciones", zh: "查看全部培训" },
  allSolutions: { pt: "Ver todas as soluções", en: "See all solutions", es: "Ver todas las soluciones", zh: "查看全部方案" },
  talk: { pt: "Falar com um especialista", en: "Talk to a specialist", es: "Hablar con un especialista", zh: "联系专家" },
  pain: { pt: "O problema", en: "The problem", es: "El problema", zh: "问题" },
  deliver: { pt: "O que entregamos", en: "What we deliver", es: "Qué entregamos", zh: "我们交付什么" },
  method: { pt: "Método e ferramentas", en: "Method and tools", es: "Método y herramientas", zh: "方法与工具" },
  linkedTraining: { pt: "Quer que sua equipe aprenda a fazer sozinha?", en: "Want your team to learn to do it alone?", es: "¿Quiere que su equipo aprenda a hacerlo solo?", zh: "希望团队自己掌握？" },
  linkedSolution: { pt: "Precisa de resultado rápido? Conheça a consultoria", en: "Need fast results? See the consulting service", es: "¿Necesita resultado rápido? Conozca la consultoría", zh: "需要快速见效？了解咨询服务" },
  menuSolve: { pt: "O que você precisa resolver?", en: "What do you need to solve?", es: "¿Qué necesita resolver?", zh: "您需要解决什么？" },
  menuTrainings: { pt: "Treinamentos", en: "Trainings", es: "Capacitaciones", zh: "培训" },
};
