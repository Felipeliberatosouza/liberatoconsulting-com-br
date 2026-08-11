/** Utilidades para montar links de WhatsApp que funcionam em desktop e mobile. */

export function normalizeWhatsApp(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

/**
 * Em desktop o redirecionamento wa.me -> api.whatsapp.com pode ser bloqueado
 * pelo navegador (ERR_BLOCKED_BY_RESPONSE). Nesse caso usamos o WhatsApp Web,
 * que abre a conversa direto (ou o app instalado).
 */
export function whatsappHref(number: string, text?: string): string {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const query = text ? `&text=${encodeURIComponent(text)}` : "";
  return isMobile
    ? `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`
    : `https://web.whatsapp.com/send?phone=${number}${query}`;
}

/** Abre a conversa em uma nova aba de nível superior. */
export function openWhatsApp(number: string, text?: string) {
  window.open(whatsappHref(number, text), "_blank", "noopener,noreferrer");
}
