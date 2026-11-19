import type { Lang } from "@/i18n/config";
import { pt } from "@/i18n/pt";
import type { TextOverrides } from "./site-config";

export const HERO_FIELDS = ["eyebrow", "title", "body", "primary", "secondary"] as const;
export type HeroField = (typeof HERO_FIELDS)[number];
export const heroTextKey = (id: string, field: HeroField) => `heroCopy.${id}.${field}`;

// Reviewed translations for the six PT banner drafts, keyed by permanent IDs.
const localized = {
  en: {
    consultoria: ["Management Consulting", "Sales are strong, but are profits, goals or your team falling behind?", "We find what holds you back, build a 90-day plan and train your team to sustain improvements, using AI where it pays off.", "Explore Consulting", "View Training"],
    treinamento: ["In-Company Training", "Your team needs to do better without relying on you.", "Hands-on training at your company: finance, B2B sales, processes, leadership, AI and idea validation. Each group builds a plan for your business.", "View Training Catalog", "Request a Proposal"],
    pesquisas: ["Brazil Data", "Want to enter Brazil or invest without guessing?", "Market size, competitors, regulations and local partners in one clear study to help you decide with confidence.", "View Brazil Data", "Speak with a Specialist"],
    operacoes: ["Operations and Productivity", "Always firefighting, with delays and rework?", "We find bottlenecks, standardize what works and use AI to cut manual work, so the same team can deliver more.", "Explore the Service", "Schedule a Call"],
    empreendedorismo: ["Validate Ideas Before Investing", "I have an idea, but I'm worried about making the wrong investment.", "Test demand with real customers and assess viability before investing. Use evidence to decide whether to proceed, adjust or stop.", "Explore Consulting", "Schedule a Call"],
    estrategia: ["Goals and Management Routines", "Is your business plan stuck on paper?", "Give each goal an owner, align your teams and use short meetings to put plans into practice without everything depending on the owner.", "Explore Consulting", "Schedule a Call"],
  },
  es: {
    consultoria: ["Consultoría de gestión", "¿Su empresa vende, pero las ganancias, las metas o el equipo no acompañan?", "Identificamos qué frena los resultados, preparamos un plan de 90 días y formamos a su equipo para sostener las mejoras, con IA donde da retorno.", "Conocer la consultoría", "Ver capacitaciones"],
    treinamento: ["Capacitación In Company", "Su equipo necesita mejorar sin depender de usted.", "Capacitación práctica en su empresa: finanzas, ventas B2B, procesos, liderazgo, IA y validación de ideas. Cada grupo sale con un plan aplicado a su negocio.", "Ver catálogo de capacitación", "Solicitar propuesta"],
    pesquisas: ["Datos de Brasil", "¿Quiere entrar o invertir en Brasil sin apostar a ciegas?", "Tamaño del mercado, competidores, normas y socios locales en un estudio claro para decidir con seguridad.", "Ver datos de Brasil", "Hablar con un especialista"],
    operacoes: ["Operaciones y productividad", "¿Siempre apagando incendios, con retrasos y retrabajo?", "Identificamos cuellos de botella, estandarizamos lo que funciona y usamos IA para reducir el trabajo manual y entregar más con el mismo equipo.", "Conocer el servicio", "Agendar una conversación"],
    empreendedorismo: ["Validar ideas antes de invertir", "Tengo una idea, pero temo invertir mal.", "Pruebe la demanda con clientes reales y evalúe la viabilidad antes de invertir. Decida con evidencia si debe avanzar, ajustar o detenerse.", "Conocer la consultoría", "Agendar una conversación"],
    estrategia: ["Metas y rutina de gestión", "¿La planificación de su empresa no sale del papel?", "Metas con responsables, equipos alineados y reuniones breves para convertir el plan en rutina sin que todo dependa del dueño.", "Conocer la consultoría", "Agendar una conversación"],
  },
  zh: {
    consultoria: ["管理咨询", "公司有销量，但利润、目标或团队跟不上？", "找出影响业绩的障碍，制定90天计划，并培训团队持续改进，在有回报的地方应用人工智能。", "了解咨询服务", "查看培训"],
    treinamento: ["企业内训", "让团队做得更好，不再事事依赖您。", "在企业内开展财务、B2B销售、流程、领导力、人工智能和创意验证实训。每期学员都会制定可用于实际业务的计划。", "查看课程目录", "索取方案"],
    pesquisas: ["巴西数据", "想进入巴西市场或投资，又不想盲目下注？", "一份清晰的研究报告涵盖市场规模、竞争对手、法规和本地合作伙伴，帮助您放心决策。", "查看巴西数据", "咨询专家"],
    operacoes: ["运营与生产力", "总是在救火，交付延误，还要返工？", "找出瓶颈，将有效做法标准化，用AI减少手工操作，让同一团队交付更多。", "了解服务", "预约沟通"],
    empreendedorismo: ["投资前先验证想法", "有了新想法，却担心投错。", "投资之前，用真实客户验证需求并评估可行性，凭证据决定推进、调整还是停止。", "了解咨询服务", "预约沟通"],
    estrategia: ["目标与日常管理", "企业计划还停留在纸面上？", "明确目标负责人，协调团队，通过简短会议推动计划落地，不再事事依赖老板。", "了解咨询服务", "预约沟通"],
  },
} satisfies Record<Exclude<Lang, "pt">, Record<string, readonly string[]>>;

export function heroCopy(lang: Lang, overrides: TextOverrides = {}) {
  return pt.hero.slides.map((slide) => {
    const translations = lang === "pt" ? undefined : localized[lang][slide.id as keyof typeof localized.en];
    return { ...slide, ...Object.fromEntries(HERO_FIELDS.map((field, i) => [field,
      overrides[heroTextKey(slide.id, field)]?.[lang] || translations?.[i] || slide[field],
    ])) };
  });
}