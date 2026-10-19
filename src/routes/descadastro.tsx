import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { confirmProspectUnsubscribe } from "@/lib/prospect-email.functions";

export const Route = createFileRoute("/descadastro")({
  validateSearch: z.object({ t: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Cancelar recebimento de e-mails — Liberato Consulting" },
      { name: "description", content: "Pare de receber os e-mails comerciais da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Cancelar recebimento de e-mails — Liberato Consulting" },
      { property: "og:description", content: "Pare de receber os e-mails comerciais da Liberato Consulting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnsubPage,
});

function UnsubPage() {
  const { t } = Route.useSearch();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const confirm = async () => {
    if (!t) return setState("err");
    setState("busy");
    const r = await confirmProspectUnsubscribe({ data: { t } }).catch(() => ({ ok: false }));
    setState(r.ok ? "ok" : "err");
  };
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Cancelar recebimento de e-mails</h1>
      {state === "ok" ? (
        <p className="text-muted-foreground">Pronto. Seu e-mail foi removido e você não receberá mais nossas mensagens comerciais.</p>
      ) : state === "err" ? (
        <p className="text-destructive">Link inválido ou expirado. Escreva para contato@liberatoconsulting.com.br e faremos a remoção.</p>
      ) : (
        <>
          <p className="text-muted-foreground">Confirme para não receber mais e-mails comerciais da Liberato Consulting.</p>
          <Button onClick={confirm} disabled={state === "busy"} className="mx-auto">
            {state === "busy" ? "Confirmando..." : "Confirmar cancelamento"}
          </Button>
        </>
      )}
    </main>
  );
}
