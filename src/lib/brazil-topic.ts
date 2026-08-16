/** Utilitários dos "Dados e destaques" de cada tema de Dados do Brasil. */

/** Converte um texto em um trecho seguro para URL. */
export function slugifyTopic(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Endereço do item. O prefixo numérico mantém o link estável em qualquer
 * idioma; o restante do slug existe apenas para leitura humana e SEO.
 */
export function topicSlug(index: number, label: string): string {
  const readable = slugifyTopic(label);
  return readable ? `t${index + 1}-${readable}` : `t${index + 1}`;
}

/** Recupera a posição do item a partir do endereço. */
export function topicIndexFromSlug(slug: string): number | null {
  const m = /^t(\d+)/.exec(slug);
  if (!m) return null;
  const n = Number(m[1]) - 1;
  return Number.isInteger(n) && n >= 0 && n < 40 ? n : null;
}
