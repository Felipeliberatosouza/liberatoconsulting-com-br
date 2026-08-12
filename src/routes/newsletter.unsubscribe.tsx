import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { unsubscribeNewsletter } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/newsletter/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Cancelar inscrição na newsletter — Liberato Consulting" },
      { name: "description", content: "Cancele o recebimento da newsletter da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Cancelar inscrição na newsletter" },
      { property: "og:description", content: "Cancele o recebimento da newsletter da Liberato Consulting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    unsubscribeNewsletter({ data: { token } })
      .then((r) => setState(r.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-24">
        <h1 className="font-display text-3xl font-bold">Newsletter</h1>
        <p className="mt-4 text-muted-foreground">
          {state === "loading" && "Processando seu pedido…"}
          {state === "ok" && "Sua inscrição foi cancelada. Você não receberá mais nossos e-mails."}
          {state === "error" && "Não foi possível cancelar a inscrição. O link pode estar inválido."}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
