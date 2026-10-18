import { useState } from "react";
import { X } from "lucide-react";

// Cores do próprio WhatsApp e do cliente de e-mail: a prévia imita fielmente esses aplicativos.
const WA = { header: "#075E54", bg: "#ECE5DD", bubble: "#DCF8C6", text: "#111B21", meta: "#667781", link: "#027EB5" };

function waFormat(text: string) {
  // Negrito (*texto*), itálico (_texto_) e links, como o WhatsApp exibe.
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/(^|\s)_([^_\n]+)_/g, "$1<em>$2</em>")
    .replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" target="_blank" rel="noreferrer" style="color:${WA.link};text-decoration:underline">$1</a>`)
    .replace(/\n/g, "<br/>");
}

export function MessagePreview({
  subject,
  html,
  whatsapp,
  recipient,
  onClose,
}: {
  subject: string;
  html: string;
  whatsapp: string;
  recipient?: string | undefined;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"email" | "whatsapp">("email");
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex gap-2">
            {(["email", "whatsapp"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-accent text-accent-foreground" : "bg-secondary"}`}
              >
                {t === "email" ? "Como chega por e-mail" : "Como chega no WhatsApp"}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Fechar" onClick={onClose} className="rounded-full p-1.5 hover:bg-secondary">
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto bg-secondary/40 p-5">
          {tab === "email" ? (
            <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-border bg-background shadow">
              <div className="border-b border-border px-5 py-4">
                <p className="text-lg font-semibold">{subject}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">L</div>
                  <div className="text-sm">
                    <p><span className="font-semibold">Liberato Consulting</span> <span className="text-muted-foreground">&lt;contato@notify.liberatoconsulting.com.br&gt;</span></p>
                    <p className="text-xs text-muted-foreground">para {recipient || "assinante"} · {time}</p>
                  </div>
                </div>
              </div>
              <iframe title="E-mail" srcDoc={html} sandbox="allow-popups" className="h-[60vh] w-full bg-background" />
            </div>
          ) : (
            <div className="mx-auto w-[360px] overflow-hidden rounded-[2.2rem] border-[10px] border-foreground shadow-xl">
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: WA.header, color: "#fff" }}>
                <div className="flex size-9 items-center justify-center rounded-full bg-background text-sm font-bold text-accent">L</div>
                <div>
                  <p className="text-sm font-semibold">Liberato Consulting</p>
                  <p className="text-[11px] opacity-80">conta comercial</p>
                </div>
              </div>
              <div className="h-[60vh] overflow-y-auto px-3 py-4" style={{ background: WA.bg }}>
                <div className="mx-auto mb-3 w-fit rounded-md px-3 py-1 text-[11px]" style={{ background: "#E1F3FB", color: WA.meta }}>HOJE</div>
                <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none px-3 py-2 text-[13.5px] leading-snug shadow-sm" style={{ background: WA.bubble, color: WA.text }}>
                  <div dangerouslySetInnerHTML={{ __html: waFormat(whatsapp) }} />
                  <p className="mt-1 text-right text-[10.5px]" style={{ color: WA.meta }}>{time} ✓✓</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
