/**
 * Reconhece quando um assunto/título digitado em qualquer tela de geração de
 * imagem corresponde a um artigo já publicado (semelhança de 80% ou mais),
 * para reaproveitar a imagem já gerada para esse artigo.
 */
export const ARTICLE_MATCH_THRESHOLD = 0.8;

const STOP = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "um", "uma", "para", "por", "com", "the", "of", "and", "in", "to",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t.length > 0 && !STOP.has(t));
}

/** Semelhança entre 0 e 1 entre dois textos (palavras em comum). */
export function textSimilarity(a: string, b: string): number {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const dice = (2 * inter) / (A.size + B.size);
  // Título digitado pela metade: todas as palavras (mín. 4) estão no artigo.
  const minSize = Math.min(A.size, B.size);
  const containment = minSize >= 4 ? inter / minSize : 0;
  return Math.max(dice, containment >= 0.95 ? containment : 0);
}

/** Artigo mais parecido com o texto, se a semelhança for de pelo menos 80%. */
export function findSimilarArticle<T extends { title: string }>(
  text: string,
  articles: T[],
): T | undefined {
  let best: T | undefined;
  let bestScore = 0;
  for (const a of articles) {
    const s = textSimilarity(text, a.title);
    if (s > bestScore) {
      bestScore = s;
      best = a;
    }
  }
  return bestScore >= ARTICLE_MATCH_THRESHOLD ? best : undefined;
}
