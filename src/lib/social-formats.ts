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

export type SocialInput = { title: string; body: string; link?: string | undefined };

export function toWhatsApp({ title, body, link }: SocialInput) {
  const paras = cleanParagraphs(body);
  const intro = paras[0] ?? "";
  const bullets = paras.slice(1, 4).map((p) => `• ${truncate(p, 160)}`);
  return [
    `*${title.trim()}*`,
    "",
    truncate(intro, 400),
    ...(bullets.length ? ["", ...bullets] : []),
    ...(link ? ["", `Leia na íntegra: ${link}`] : []),
  ]
    .join("\n")
    .trim();
}

export function toLinkedIn({ title, body, link }: SocialInput) {
  const paras = cleanParagraphs(body);
  const text = paras.slice(0, 4).join("\n\n");
  return [
    title.trim(),
    "",
    truncate(text, 2600),
    ...(link ? ["", `Conteúdo completo: ${link}`] : []),
    "",
    "#gestão #estratégia #inteligenciaartificial #brasil #LiberatoConsulting",
  ]
    .join("\n")
    .trim();
}

export function toInstagram({ title, body, link }: SocialInput) {
  const paras = cleanParagraphs(body);
  const intro = truncate(paras[0] ?? "", 700);
  return [
    `${title.trim()} 🚀`,
    "",
    intro,
    ...(paras[1] ? ["", `👉 ${truncate(paras[1], 300)}`] : []),
    "",
    link ? `Link na bio: ${link}` : "Link na bio.",
    "",
    "#consultoria #gestaoempresarial #inteligenciaartificial #empreendedorismo #mercadobrasileiro #liberatoconsulting",
  ]
    .join("\n")
    .trim();
}
