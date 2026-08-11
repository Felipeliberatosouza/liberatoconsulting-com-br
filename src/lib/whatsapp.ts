/** Utilidades para montar links de WhatsApp que funcionam em desktop e mobile. */

export function normalizeWhatsApp(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

/** Abre uma conversa diretamente no WhatsApp Web. */
export function whatsappHref(number: string, text?: string): string {
  const params = new URLSearchParams({
    phone: number,
    type: "phone_number",
    app_absent: "0",
  });
  if (text) params.set("text", text);
  return `https://web.whatsapp.com/send/?${params.toString()}`;
}
