import type { Lang } from "@/i18n/config";
import type { ScopeQuestion } from "./scope-form";

export const fechouCopy = {
  pt: {
    title: "Não quero perder vendas por falta de acompanhamento",
    body: "Veja em que etapa cada cliente está, quem precisa agir hoje e quanto falta para a equipe bater a meta.",
    demo: "Testar demonstração",
    details: "Conhecer o Fechou! CRM",
    scope: "Planejar meu CRM",
    faq: "Posso testar o Fechou! CRM com a minha marca?",
    answer:
      "Sim. A demonstração usa dados fictícios. Você pode inserir seu nome, logomarca e cor sem acessar dados de clientes.",
    features: [
      "Funil visual por etapa",
      "Alertas por prazo e vendedor",
      "Metas, conversão e ticket médio",
      "Importação de planilhas Excel e CSV",
      "Acesso por cargo e verificação em duas etapas",
    ],
  },
  en: {
    title: "Stop losing sales because follow-ups fall through",
    body: "See where every customer stands, who needs to act today and how close your team is to its target.",
    demo: "Try the demo",
    details: "Explore Fechou! CRM",
    scope: "Plan my CRM",
    faq: "Can I try Fechou! CRM with my own branding?",
    answer:
      "Yes. The demo uses fictional records. Add your name, logo and brand color without accessing customer data.",
    features: [
      "Visual sales funnel",
      "Deadline alerts by salesperson",
      "Targets, conversion and average deal value",
      "Excel and CSV imports",
      "Role-based access and two-step verification",
    ],
  },
  es: {
    title: "Que ninguna venta se pierda por falta de seguimiento",
    body: "Vea en qué etapa está cada cliente, quién debe actuar hoy y cuánto falta para alcanzar la meta.",
    demo: "Probar la demostración",
    details: "Conocer Fechou! CRM",
    scope: "Planificar mi CRM",
    faq: "¿Puedo probar Fechou! CRM con mi marca?",
    answer:
      "Sí. La demostración usa datos ficticios. Puede añadir su nombre, logotipo y color sin acceder a datos de clientes.",
    features: [
      "Embudo de ventas visual",
      "Alertas por plazo y vendedor",
      "Metas, conversión y valor medio de venta",
      "Importación de Excel y CSV",
      "Acceso por cargo y verificación en dos pasos",
    ],
  },
  zh: {
    title: "别让商机因跟进不及时而流失",
    body: "查看每位客户所处阶段、今日负责人和团队距离销售目标的差距。",
    demo: "试用演示",
    details: "了解 Fechou! CRM",
    scope: "规划我的 CRM",
    faq: "能用自己的品牌体验 Fechou! CRM 吗？",
    answer: "可以。演示使用虚构数据，可添加企业名称、标志和颜色，不会访问客户数据。",
    features: [
      "可视化销售漏斗",
      "按销售人员和时限提醒",
      "目标、转化率和平均成交额",
      "导入 Excel 和 CSV",
      "按角色授权及两步验证",
    ],
  },
} satisfies Record<
  Lang,
  {
    title: string;
    body: string;
    demo: string;
    details: string;
    scope: string;
    faq: string;
    answer: string;
    features: string[];
  }
>;

const questions: Record<Lang, readonly [string, string, ...string[]][]> = {
  pt: [
    ["Equipe", "Quantas pessoas vão usar o CRM?", "1 a 5", "6 a 20", "Mais de 20"],
    [
      "Processo",
      "Como vocês controlam as vendas hoje?",
      "Planilhas",
      "Já usamos CRM",
      "Ainda não temos um controle",
    ],
    [
      "Gargalo",
      "Onde mais perdem vendas?",
      "Encontrar clientes",
      "Acompanhar propostas",
      "Fechar negócios",
    ],
    [
      "Canais",
      "De onde vêm mais oportunidades?",
      "Indicações",
      "Prospecção ativa",
      "Site, redes sociais ou anúncios",
    ],
    [
      "Funil",
      "Qual etapa precisa de mais controle?",
      "Prospecção e qualificação",
      "Proposta e negociação",
      "Pós-venda e renovação",
    ],
    [
      "Prazos",
      "Como devem funcionar os alertas?",
      "Um prazo por etapa",
      "Prazos por vendedor",
      "Vamos definir no diagnóstico",
    ],
    [
      "Migração",
      "Quais dados precisam ser importados?",
      "Clientes e contatos",
      "Histórico e vendas",
      "Não há dados para importar",
    ],
    [
      "Integrações",
      "Qual integração vem primeiro?",
      "ERP",
      "E-mail ou WhatsApp",
      "Não precisamos agora",
    ],
    [
      "Indicadores",
      "Qual indicador é mais importante?",
      "Conversão",
      "Receita e metas",
      "Tempo de fechamento",
    ],
    [
      "Implantação",
      "Quando querem começar?",
      "Neste mês",
      "Nos próximos 3 meses",
      "Ainda estamos avaliando",
    ],
  ],
  en: [
    ["Team", "How many people will use the CRM?", "1–5", "6–20", "More than 20"],
    [
      "Process",
      "How do you track sales today?",
      "Spreadsheets",
      "Existing CRM",
      "No current tracking",
    ],
    [
      "Bottleneck",
      "Where do you lose the most sales?",
      "Finding customers",
      "Following up on proposals",
      "Closing deals",
    ],
    [
      "Channels",
      "Where do most opportunities come from?",
      "Referrals",
      "Outbound prospecting",
      "Website, social or ads",
    ],
    [
      "Funnel",
      "Which stage needs the most oversight?",
      "Prospecting and qualification",
      "Proposals and negotiation",
      "After-sales and renewals",
    ],
    [
      "Deadlines",
      "How should alerts work?",
      "One deadline per stage",
      "Deadlines per salesperson",
      "Decide during assessment",
    ],
    [
      "Migration",
      "What data do you need to import?",
      "Customers and contacts",
      "History and sales",
      "No data to import",
    ],
    [
      "Integrations",
      "Which integration comes first?",
      "ERP",
      "Email or WhatsApp",
      "None right now",
    ],
    ["Metrics", "Which metric matters most?", "Conversion", "Revenue and targets", "Time to close"],
    [
      "Rollout",
      "When would you like to start?",
      "This month",
      "In the next 3 months",
      "Still evaluating",
    ],
  ],
  es: [
    ["Equipo", "¿Cuántas personas usarán el CRM?", "1 a 5", "6 a 20", "Más de 20"],
    [
      "Proceso",
      "¿Cómo controlan las ventas hoy?",
      "Hojas de cálculo",
      "Ya usamos un CRM",
      "Aún no tenemos control",
    ],
    [
      "Obstáculo",
      "¿Dónde pierden más ventas?",
      "Encontrar clientes",
      "Dar seguimiento a propuestas",
      "Cerrar negocios",
    ],
    [
      "Canales",
      "¿De dónde vienen más oportunidades?",
      "Referencias",
      "Prospección activa",
      "Sitio, redes o anuncios",
    ],
    [
      "Embudo",
      "¿Qué etapa necesita más control?",
      "Prospección y calificación",
      "Propuesta y negociación",
      "Posventa y renovaciones",
    ],
    [
      "Plazos",
      "¿Cómo deben funcionar las alertas?",
      "Un plazo por etapa",
      "Plazos por vendedor",
      "Definir durante el diagnóstico",
    ],
    [
      "Migración",
      "¿Qué datos necesitan importar?",
      "Clientes y contactos",
      "Historial y ventas",
      "No hay datos para importar",
    ],
    [
      "Integraciones",
      "¿Qué integración es prioritaria?",
      "ERP",
      "Correo o WhatsApp",
      "Ninguna por ahora",
    ],
    [
      "Indicadores",
      "¿Cuál es el indicador más importante?",
      "Conversión",
      "Ingresos y metas",
      "Tiempo de cierre",
    ],
    [
      "Implementación",
      "¿Cuándo quieren empezar?",
      "Este mes",
      "En los próximos 3 meses",
      "Todavía estamos evaluando",
    ],
  ],
  zh: [
    ["团队", "多少人将使用 CRM？", "1 到 5 人", "6 到 20 人", "超过 20 人"],
    ["流程", "目前如何管理销售？", "电子表格", "已有 CRM", "还未系统管理"],
    ["瓶颈", "在哪个环节流失最多订单？", "寻找客户", "跟进报价", "促成交易"],
    ["渠道", "商机主要来自哪里？", "客户推荐", "主动开发", "网站、社交媒体或广告"],
    ["漏斗", "哪个阶段最需要管理？", "开发与筛选", "报价与谈判", "售后与续约"],
    ["时限", "希望如何设置提醒？", "按阶段设置", "按销售人员设置", "诊断后决定"],
    ["迁移", "需要导入哪些数据？", "客户与联系人", "销售与历史记录", "无需导入"],
    ["集成", "优先集成什么？", "ERP", "电子邮件或 WhatsApp", "暂不需要"],
    ["指标", "哪个指标最重要？", "转化率", "收入与目标", "成交周期"],
    ["实施", "希望何时开始？", "本月", "未来三个月内", "仍在评估"],
  ],
};
const other = { pt: "Outro", en: "Other", es: "Otro", zh: "其他" };
export const crmScopeIds = questions.pt.map((_, i) => `crm${i + 1}`);
export function crmScopeQuestions(lang: Lang): ScopeQuestion[] {
  return questions[lang].map(([theme, question, ...options], i) => ({
    id: `crm${i + 1}`,
    index: i + 1,
    theme,
    question,
    purpose: question,
    options: [...options, other[lang]],
  }));
}
