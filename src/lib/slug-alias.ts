/**
 * Compatibilidade de endereços: os artigos passaram a usar links curtos
 * (1 a 2 palavras). Endereços antigos (título completo) precisam continuar
 * respondendo com um redirecionamento permanente para não gerar erros 4xx
 * no Google.
 */

/** Slug completo do título (formato usado antes da simplificação dos links). */
export function longSlug(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Compara dois endereços ignorando diferenças de sufixo/prefixo simples. */
export function slugMatches(requested: string, title: string, current: string) {
  const req = requested.toLowerCase();
  const full = longSlug(title);
  if (req === full) return true;
  if (full.startsWith(req) && req.length >= 8) return true;
  if (req.startsWith(current) && current.length >= 4) return true;
  return false;
}
