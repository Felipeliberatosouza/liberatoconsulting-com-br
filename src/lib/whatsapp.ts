/** Utilidades para montar links de WhatsApp que funcionam em desktop e mobile. */

export function normalizeWhatsApp(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

/** Abre diretamente o aplicativo, sem passar pelos domínios web bloqueados. */
export function whatsappHref(number: string, text?: string): string {
  const query = text ? `&text=${encodeURIComponent(text)}` : "";
  return `whatsapp://send?phone=${number}${query}`;
}
