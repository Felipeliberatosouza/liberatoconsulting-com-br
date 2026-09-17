import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { WhatsAppLeadDialog } from "@/components/WhatsAppLeadDialog";
import { Button } from "@/components/ui/button";


export function WhatsAppFloat() {
  const { t, whatsapp } = useLanguage();
  const [open, setOpen] = useState(false);
  const label = t.whatsapp?.label ?? "WhatsApp";
  return (
    <>
    <Button
      type="button"
      onClick={() => {
        trackEvent("cta_click", { label: "whatsapp_float", category: "engagement" });
        setOpen(true);
      }}
      aria-label={label}
      className="fixed bottom-28 right-4 z-30 h-auto gap-3 rounded-full bg-whatsapp px-4 py-3 text-whatsapp-foreground shadow-lg transition-transform hover:bg-whatsapp/90 hover:scale-[1.02] md:right-6"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">Seja atendido por WhatsApp</span>
    </Button>
    <WhatsAppLeadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
