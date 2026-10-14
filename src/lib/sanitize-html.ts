/** Remove scripts, frames, event handlers and javascript: URLs from stored e-mail HTML before rendering. */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  return String(html ?? "")
    .replace(/<\s*(script|style|iframe|object|embed|frameset|frame|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|iframe|object|embed|frameset|frame|meta|link|base|form)\b[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|xlink:href|action)\s*=\s*(["']?)\s*(javascript|vbscript|data:text\/html)[^"'\s>]*\2/gi, '$1="#"');
}
