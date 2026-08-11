import { useLanguage } from "@/i18n";

function normalizeWhatsApp(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits;
}

export function WhatsAppFloat() {
  const { t, logoUrl, whatsapp } = useLanguage();
  const number = normalizeWhatsApp(whatsapp);
  if (!number) return null;

  const href = `https://wa.me/${number}`;
  const label = t.whatsapp?.label ?? "WhatsApp";
  const title = t.whatsapp?.title ?? "Abrir conversa no WhatsApp";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={title}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-background p-2 pr-4 shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="inline-flex size-11 items-center justify-center overflow-hidden rounded-full bg-white">
        <img src={logoUrl} alt="" className="h-8 w-auto object-contain" />
      </span>
      <span className="hidden text-sm font-medium text-foreground sm:inline">
        {label}
      </span>
    </a>
  );
}
