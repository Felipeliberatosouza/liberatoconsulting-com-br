/** Utilidades para montar links de WhatsApp que funcionam em desktop e mobile. */

export function normalizeWhatsApp(raw: string | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Números brasileiros sem DDI (10 ou 11 dígitos) recebem o código do país.
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
}

/** Link universal (wa.me): abre o app no celular e o WhatsApp Web no desktop. */
export function whatsappHref(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Abre o WhatsApp de forma confiável, inclusive dentro de iframes de pré-visualização,
 * onde a navegação padrão do link pode ser bloqueada.
 */
export function openWhatsApp(href: string) {
  const win = window.open(href, "_blank", "noopener,noreferrer");
  if (win) return true;
  try {
    window.top!.location.href = href;
    return true;
  } catch {
    window.location.href = href;
    return true;
  }
}
