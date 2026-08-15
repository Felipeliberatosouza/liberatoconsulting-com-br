/**
 * Idioma dos envios (e-mail e WhatsApp): rótulos fixos por idioma e utilidades
 * de formatação. O idioma vem do cadastro do inscrito (`language`).
 */
import type { Lang } from "@/i18n/config";

export const EMAIL_LANGS = ["pt", "en", "es", "zh"] as const;
export type EmailLang = (typeof EMAIL_LANGS)[number];

/** Normaliza o idioma gravado no cadastro ("pt-BR", "EN", vazio…). */
export function emailLang(raw?: string | null): EmailLang {
  const value = (raw ?? "").toLowerCase();
  const base = value.split(/[-_]/)[0] ?? "";
  return (EMAIL_LANGS as readonly string[]).includes(base) ? (base as EmailLang) : "pt";
}

const LOCALES: Record<EmailLang, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  zh: "zh-CN",
};

/** Data por extenso no idioma do destinatário. */
export function formatDateFor(lang: EmailLang, date = new Date()) {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export type EmailLabels = {
  bulletinTitle: string;
  updatedOn: string;
  segment: string;
  allSegments: string;
  indicators: string;
  currentLabel: string;
  previousLabel: string;
  changeLabel: string;
  forecastLabel: string;
  sourceLabel: string;
  socialCta: string;
  latestArticles: string;
  noIndicators: string;
  soonArticles: string;
  readContent: string;
  viewAll: string;
  bulletinWhy: string;
  stopReceiving: string;
  newsletterWhy: string;
  unsubscribe: string;
  cancelSubject: string;
  cancelTitle: string;
  cancelBody: (name: string, url: string) => string;
};

export const LABELS: Record<EmailLang, EmailLabels> = {
  pt: {
    bulletinTitle: "Boletim Semanal",
    updatedOn: "Atualizado em",
    segment: "Segmento",
    allSegments: "Todos os segmentos",
    indicators: "Indicadores econômicos",
    currentLabel: "Atual",
    previousLabel: "Anterior",
    changeLabel: "Variação",
    forecastLabel: "Tendência",
    sourceLabel: "Fonte",
    socialCta:
      "Acesse liberatoconsulting.com.br para mais detalhes e para ter as fontes de informação.",
    latestArticles: "Últimos artigos",
    noIndicators: "Sem indicadores publicados para este recorte nesta semana.",
    soonArticles: "Novos conteúdos serão publicados em breve.",
    readContent: "Ler o conteúdo →",
    viewAll: "Ver todos os conteúdos →",
    bulletinWhy:
      "Você recebe o Boletim Semanal da Liberato Consulting porque solicitou esta atualização.",
    stopReceiving: "Parar de receber",
    newsletterWhy:
      "Você recebeu este e-mail porque se inscreveu na newsletter da Liberato Consulting.",
    unsubscribe: "Cancelar inscrição",
    cancelSubject: "Cancelamento confirmado — Boletim Semanal",
    cancelTitle: "Cancelamento confirmado",
    cancelBody: (name, url) =>
      `Olá${name ? `, ${name}` : ""}. Confirmamos o cancelamento do Boletim Semanal da Liberato Consulting. Você não receberá mais estes envios. Se quiser voltar, é só se cadastrar novamente em ${url}/brasil.`,
  },
  en: {
    bulletinTitle: "Weekly Briefing",
    updatedOn: "Updated on",
    segment: "Segment",
    allSegments: "All segments",
    indicators: "Economic indicators",
    currentLabel: "Current",
    previousLabel: "Previous",
    changeLabel: "Change",
    forecastLabel: "Outlook",
    sourceLabel: "Source",
    socialCta:
      "Visit liberatoconsulting.com.br for more details and the data sources.",
    latestArticles: "Latest articles",
    noIndicators: "No indicators published for this selection this week.",
    soonArticles: "New content will be published soon.",
    readContent: "Read the article →",
    viewAll: "See all content →",
    bulletinWhy:
      "You receive the Liberato Consulting Weekly Briefing because you requested this update.",
    stopReceiving: "Stop receiving",
    newsletterWhy: "You received this email because you subscribed to the Liberato Consulting newsletter.",
    unsubscribe: "Unsubscribe",
    cancelSubject: "Unsubscribe confirmed — Weekly Briefing",
    cancelTitle: "Unsubscribe confirmed",
    cancelBody: (name, url) =>
      `Hello${name ? `, ${name}` : ""}. We have confirmed the cancellation of the Liberato Consulting Weekly Briefing. You will no longer receive these messages. To come back, just subscribe again at ${url}/brasil.`,
  },
  es: {
    bulletinTitle: "Boletín Semanal",
    updatedOn: "Actualizado el",
    segment: "Segmento",
    allSegments: "Todos los segmentos",
    indicators: "Indicadores económicos",
    currentLabel: "Actual",
    previousLabel: "Anterior",
    changeLabel: "Variación",
    forecastLabel: "Tendencia",
    sourceLabel: "Fuente",
    socialCta:
      "Acceda a liberatoconsulting.com.br para más detalles y para consultar las fuentes de información.",
    latestArticles: "Últimos artículos",
    noIndicators: "No hay indicadores publicados para esta selección esta semana.",
    soonArticles: "Pronto se publicarán nuevos contenidos.",
    readContent: "Leer el contenido →",
    viewAll: "Ver todos los contenidos →",
    bulletinWhy:
      "Usted recibe el Boletín Semanal de Liberato Consulting porque solicitó esta actualización.",
    stopReceiving: "Dejar de recibir",
    newsletterWhy:
      "Usted recibió este correo porque se suscribió al newsletter de Liberato Consulting.",
    unsubscribe: "Cancelar suscripción",
    cancelSubject: "Cancelación confirmada — Boletín Semanal",
    cancelTitle: "Cancelación confirmada",
    cancelBody: (name, url) =>
      `Hola${name ? `, ${name}` : ""}. Confirmamos la cancelación del Boletín Semanal de Liberato Consulting. Ya no recibirá estos envíos. Si desea volver, solo tiene que suscribirse de nuevo en ${url}/brasil.`,
  },
  zh: {
    bulletinTitle: "每周简报",
    updatedOn: "更新于",
    segment: "行业板块",
    allSegments: "全部板块",
    indicators: "经济指标",
    currentLabel: "当前",
    previousLabel: "上期",
    changeLabel: "变化",
    forecastLabel: "趋势",
    sourceLabel: "来源",
    socialCta:
      "访问 liberatoconsulting.com.br 了解更多详情及数据来源。",
    latestArticles: "最新文章",
    noIndicators: "本周该筛选条件下暂无已发布的指标。",
    soonArticles: "新内容即将发布。",
    readContent: "阅读内容 →",
    viewAll: "查看全部内容 →",
    bulletinWhy: "您收到这封 Liberato Consulting 每周简报，是因为您订阅了该更新。",
    stopReceiving: "取消接收",
    newsletterWhy: "您收到这封邮件，是因为您订阅了 Liberato Consulting 的电子报。",
    unsubscribe: "取消订阅",
    cancelSubject: "已确认取消订阅 — 每周简报",
    cancelTitle: "已确认取消订阅",
    cancelBody: (name, url) =>
      `您好${name ? `，${name}` : ""}。我们已确认取消您的 Liberato Consulting 每周简报订阅，您将不再收到相关邮件。如需重新订阅，请访问 ${url}/brasil。`,
  },
};

export function labelsFor(lang: Lang | EmailLang | string | null | undefined): EmailLabels {
  return LABELS[emailLang(lang as string)];
}
