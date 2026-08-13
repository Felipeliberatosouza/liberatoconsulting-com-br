/** Gera versões do conteúdo da newsletter adaptadas a cada rede social. */

function cleanParagraphs(body: string) {
  return body
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export type SocialInput = {
  title: string;
  body: string;
  link?: string | undefined;
  headline?: string | undefined;
  bullets?: string[] | undefined;
  linkedinText?: string | undefined;
  authors?: string | undefined;
  publishedAt?: string | undefined;
};

function askHeadline({ title, headline }: SocialInput) {
  const h = (headline ?? "").trim();
  if (h) return h;
  return `Você sabe o que é ${title.trim().replace(/[.?!]+$/, "")}?`;
}

function bulletList({ body, bullets }: SocialInput) {
  const list = (bullets ?? []).filter((b) => b.trim());
  if (list.length) return list.slice(0, 5);
  return cleanParagraphs(body)
    .slice(0, 5)
    .map((p) => truncate(p, 90));
}

function readMore(link?: string) {
  return link ? ["", "Leia mais! Acesse:", link] : ["", "Leia mais! Acesse o nosso site."];
}

function formatDate(d?: string) {
  if (!d) return "";
  const date = new Date(`${d}T12:00:00`);
  return Number.isNaN(date.getTime()) ? d : date.toLocaleDateString("pt-BR");
}

export function toWhatsApp(src: SocialInput) {
  return [
    `*${askHeadline(src)}*`,
    "",
    ...bulletList(src).map((b) => `• ${b}`),
    ...readMore(src.link),
  ]
    .join("\n")
    .trim();
}

export function toInstagram(src: SocialInput) {
  return [
    `${askHeadline(src)} 🚀`,
    "",
    ...bulletList(src).map((b) => `• ${b}`),
    ...readMore(src.link),
    "",
    "#consultoria #gestaoempresarial #inteligenciaartificial #empreendedorismo #mercadobrasileiro #liberatoconsulting",
  ]
    .join("\n")
    .trim();
}

export function toLinkedIn(src: SocialInput) {
  const long = (src.linkedinText ?? "").trim();
  const text = long || cleanParagraphs(src.body).join("\n\n");
  const signature = [
    src.authors?.trim() ? `Autoria: ${src.authors.trim()}` : "",
    formatDate(src.publishedAt) ? `Publicado em ${formatDate(src.publishedAt)}` : "",
  ].filter(Boolean);
  return [
    askHeadline(src),
    "",
    ...bulletList(src).map((b) => `• ${b}`),
    "",
    truncate(text, 2600),
    ...(src.link ? ["", "Leia mais! Acesse:", src.link] : []),
    ...(signature.length ? ["", ...signature] : []),
    "",
    "#gestão #estratégia #inteligenciaartificial #brasil #LiberatoConsulting",
  ]
    .join("\n")
    .trim();
}
