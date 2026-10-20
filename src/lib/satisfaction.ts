/** Pesquisas de satisfação (Etapa 5 de Projetos): perguntas, textos e cálculos. */

export type SurveyKind = "executado" | "nao_executado";
export type Lang = "pt" | "en" | "es" | "zh";

export const SITE = "https://liberatoconsulting.com.br";
export const SCOPE_LINK = `${SITE}/escopoinicial`;
export const surveyLink = (kind: SurveyKind) =>
  `${SITE}/${kind === "executado" ? "satisfacao" : "atendimento"}`;

export const REASONS: Record<Lang, string[]> = {
  pt: ["Orçamento", "Prazo", "Mudança de prioridades internas", "Escolhemos outro fornecedor", "Proposta não atendeu à necessidade", "Outro"],
  en: ["Budget", "Timeline", "Change in internal priorities", "We chose another provider", "Proposal did not meet our needs", "Other"],
  es: ["Presupuesto", "Plazo", "Cambio de prioridades internas", "Elegimos otro proveedor", "La propuesta no atendió la necesidad", "Otro"],
  zh: ["预算", "时间", "内部优先事项变化", "我们选择了其他供应商", "方案未满足需求", "其他"],
};

type Q = { id: "score1" | "score2" | "score3"; label: string; type: "stars" | "nps" | "reason" };

export function surveyQuestions(kind: SurveyKind, lang: Lang): Q[] {
  const t = {
    pt: {
      e1: "Qual o seu nível de satisfação com a qualidade e os resultados do serviço entregue?",
      e2: "Como avalia a comunicação, a pontualidade e o atendimento do consultor?",
      e3: "De 0 a 10, qual a probabilidade de recomendar a Liberato Consulting a um colega?",
      n1: "A proposta apresentada estava clara e aderente à necessidade da sua empresa?",
      n2: "Qual foi o principal motivo para não seguir com a contratação?",
      n3: "Como avalia o atendimento da equipe durante as conversas?",
    },
    en: {
      e1: "How satisfied are you with the quality and results of the service delivered?",
      e2: "How do you rate the consultant's communication, punctuality and service?",
      e3: "From 0 to 10, how likely are you to recommend Liberato Consulting to a colleague?",
      n1: "Was the proposal clear and aligned with your company's needs?",
      n2: "What was the main reason for not moving forward?",
      n3: "How do you rate the team's service during the conversations?",
    },
    es: {
      e1: "¿Cuál es su nivel de satisfacción con la calidad y los resultados del servicio entregado?",
      e2: "¿Cómo evalúa la comunicación, la puntualidad y la atención del consultor?",
      e3: "De 0 a 10, ¿qué probabilidad hay de que recomiende Liberato Consulting a un colega?",
      n1: "¿La propuesta presentada fue clara y adecuada a la necesidad de su empresa?",
      n2: "¿Cuál fue el principal motivo para no seguir con la contratación?",
      n3: "¿Cómo evalúa la atención del equipo durante las conversaciones?",
    },
    zh: {
      e1: "您对所交付服务的质量和成果满意度如何？",
      e2: "您如何评价顾问的沟通、准时性和服务？",
      e3: "从0到10，您向同事推荐 Liberato Consulting 的可能性有多大？",
      n1: "所提交的方案是否清晰并符合贵公司的需求？",
      n2: "未继续合作的主要原因是什么？",
      n3: "您如何评价团队在沟通过程中的服务？",
    },
  }[lang];
  return kind === "executado"
    ? [
        { id: "score1", label: t.e1, type: "stars" },
        { id: "score2", label: t.e2, type: "stars" },
        { id: "score3", label: t.e3, type: "nps" },
      ]
    : [
        { id: "score1", label: t.n1, type: "stars" },
        { id: "score2", label: t.n2, type: "reason" },
        { id: "score3", label: t.n3, type: "stars" },
      ];
}

type TK = "eyebrow"|"choose"|"exec"|"nonExec"|"execDesc"|"nonExecDesc"|"intro"|"company"|"name"|"email"|"service"|"comment"|"send"|"sentTitle"|"sentText"|"required"|"error"|"other"|"low"|"high"|"execTitle"|"nonExecTitle";
export const SURVEY_TEXTS: Record<Lang, Record<TK, string>> = {
  pt: {
    execTitle: 'Jogo aberto! Valeu a pena? Como foi trabalhar com a gente?', nonExecTitle: 'Jogo aberto! Mesmo sem fechar, sua opinião vale muito: como foi nosso atendimento?',
    eyebrow: "Pesquisa de satisfação", choose: "Escolha a pesquisa", exec: "Serviço executado", nonExec: "Serviço não executado",
    execDesc: "Para clientes que contrataram e receberam um serviço.", nonExecDesc: "Para quem recebeu proposta e não seguiu com a contratação.",
    intro: "São apenas 3 perguntas. Sua opinião nos ajuda a melhorar.", company: "Empresa", name: "Seu nome", email: "E-mail",
    service: "Serviço", comment: "Comentário (opcional)", send: "Enviar respostas", sentTitle: "Obrigado pela sua avaliação!",
    sentText: "Recebemos suas respostas. Elas serão analisadas pela nossa equipe.", required: "Responda às 3 perguntas e informe empresa, nome e e-mail válido.",
    error: "Não foi possível enviar agora. Tente novamente.", other: "Descreva o motivo (obrigatório)", low: "Nada provável", high: "Muito provável",
  },
  en: {
    execTitle: "Let's be honest! Was it worth it? How was working with us?", nonExecTitle: "Let's be honest! Even without closing a deal, your opinion matters a lot: how was our service?",
    eyebrow: "Satisfaction survey", choose: "Choose the survey", exec: "Service delivered", nonExec: "Service not contracted",
    execDesc: "For clients who hired and received a service.", nonExecDesc: "For those who received a proposal and did not move forward.",
    intro: "Only 3 questions. Your opinion helps us improve.", company: "Company", name: "Your name", email: "E-mail",
    service: "Service", comment: "Comment (optional)", send: "Submit answers", sentTitle: "Thank you for your feedback!",
    sentText: "We received your answers. Our team will review them.", required: "Answer the 3 questions and provide company, name and a valid e-mail.",
    error: "Could not submit now. Please try again.", other: "Describe the reason (required)", low: "Not likely", high: "Very likely",
  },
  es: {
    execTitle: '¡Juego abierto! ¿Valió la pena? ¿Cómo fue trabajar con nosotros?', nonExecTitle: '¡Juego abierto! Aunque no cerramos, su opinión vale mucho: ¿cómo fue nuestra atención?',
    eyebrow: "Encuesta de satisfacción", choose: "Elija la encuesta", exec: "Servicio ejecutado", nonExec: "Servicio no contratado",
    execDesc: "Para clientes que contrataron y recibieron un servicio.", nonExecDesc: "Para quien recibió propuesta y no siguió con la contratación.",
    intro: "Solo 3 preguntas. Su opinión nos ayuda a mejorar.", company: "Empresa", name: "Su nombre", email: "Correo electrónico",
    service: "Servicio", comment: "Comentario (opcional)", send: "Enviar respuestas", sentTitle: "¡Gracias por su evaluación!",
    sentText: "Recibimos sus respuestas. Nuestro equipo las analizará.", required: "Responda las 3 preguntas e informe empresa, nombre y correo válido.",
    error: "No fue posible enviar ahora. Inténtelo de nuevo.", other: "Describa el motivo (obligatorio)", low: "Nada probable", high: "Muy probable",
  },
  zh: {
    execTitle: '坦诚相告！值得吗？与我们合作感觉如何？', nonExecTitle: '坦诚相告！即使没有合作，您的意见也非常重要：我们的服务如何？',
    eyebrow: "满意度调查", choose: "选择调查", exec: "已执行的服务", nonExec: "未执行的服务",
    execDesc: "适用于已签约并接受服务的客户。", nonExecDesc: "适用于收到方案但未继续合作的客户。",
    intro: "仅有3个问题。您的意见帮助我们改进。", company: "公司", name: "您的姓名", email: "电子邮件",
    service: "服务", comment: "评论（可选）", send: "提交答案", sentTitle: "感谢您的评价！",
    sentText: "我们已收到您的答案，团队将进行分析。", required: "请回答3个问题并填写公司、姓名和有效邮箱。",
    error: "暂时无法提交，请重试。", other: "请说明原因（必填）", low: "不太可能", high: "非常可能",
  },
};

export type SurveyRow = {
  id: string;
  kind: SurveyKind;
  company: string;
  respondent_name: string;
  email: string;
  service: string;
  score1: number | null;
  score2: number | null;
  score3: number | null;
  reason: string;
  comment: string;
  lang: string;
  created_at: string;
};

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

/** NPS = % promotores (9–10) − % detratores (0–6). */
export function npsScore(values: number[]) {
  if (!values.length) return null;
  const promoters = values.filter((v) => v >= 9).length;
  const detractors = values.filter((v) => v <= 6).length;
  return Math.round(((promoters - detractors) / values.length) * 100);
}

/** CSAT = % de notas 4 ou 5 (escala 1–5). */
export function csatScore(values: number[]) {
  if (!values.length) return null;
  return Math.round((values.filter((v) => v >= 4).length / values.length) * 100);
}

export function summarize(rows: SurveyRow[]) {
  const exec = rows.filter((r) => r.kind === "executado");
  const non = rows.filter((r) => r.kind === "nao_executado");
  const nums = (xs: Array<number | null>) => xs.filter((v): v is number => typeof v === "number");
  const execStars = nums([...exec.map((r) => r.score1), ...exec.map((r) => r.score2)]);
  const nps = nums(exec.map((r) => r.score3));
  const reasons = new Map<string, number>();
  for (const r of non) {
    const key = (r.reason.split(":")[0] ?? "").trim() || "Não informado";
    reasons.set(key, (reasons.get(key) ?? 0) + 1);
  }
  return {
    total: rows.length,
    exec: {
      count: exec.length,
      quality: avg(nums(exec.map((r) => r.score1))),
      service: avg(nums(exec.map((r) => r.score2))),
      csat: csatScore(execStars),
      nps: npsScore(nps),
      promoters: nps.filter((v) => v >= 9).length,
      passives: nps.filter((v) => v >= 7 && v <= 8).length,
      detractors: nps.filter((v) => v <= 6).length,
    },
    non: {
      count: non.length,
      proposal: avg(nums(non.map((r) => r.score1))),
      service: avg(nums(non.map((r) => r.score3))),
      reasons: [...reasons.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    },
  };
}
