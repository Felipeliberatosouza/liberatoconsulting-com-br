import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WhatsAppLeadDialog } from "@/components/WhatsAppLeadDialog";


export function WhatsAppFloat() {
  const { t, whatsapp } = useLanguage();
  const [open, setOpen] = useState(false);
  if (!whatsapp) return null;

  const label = t.whatsapp?.label ?? "WhatsApp";
  return (
    <>
    <button
      type="button"
      onClick={(event) => {
        trackEvent("cta_click", { label: "whatsapp_float", category: "engagement" });
        setOpen(true);
      }}
      aria-label={label}
      className="fixed bottom-28 right-4 z-30 inline-flex items-center gap-3 rounded-full bg-accent px-4 py-3 font-semibold text-accent-foreground shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:right-6"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Seja atendido por WhatsApp</span>
    </button>
    <WhatsAppLeadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
