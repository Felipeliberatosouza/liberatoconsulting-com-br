import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { unsubscribeBulletin } from "@/lib/bulletin.functions";

export const Route = createFileRoute("/boletim/cancelar")({
  head: () => ({
    meta: [
      { title: "Parar de receber o Boletim Semanal — Liberato Consulting" },
      {
        name: "description",
        content: "Cancele o recebimento do Boletim Semanal da Liberato Consulting.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Parar de receber o Boletim Semanal" },
      {
        property: "og:description",
        content: "Cancelamento do Boletim Semanal da Liberato Consulting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BulletinUnsubscribePage,
});

function BulletinUnsubscribePage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    unsubscribeBulletin({ data: { token } })
      .then((r) => setState(r.ok ? "ok" : "error"))
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-24">
        <h1 className="font-display text-3xl font-bold">Boletim Semanal</h1>
        <p className="mt-4 text-muted-foreground">
          {state === "loading" && "Processando seu pedido…"}
          {state === "ok" &&
            "Cancelamento concluído. Você não receberá mais o Boletim Semanal e enviamos uma confirmação para você."}
          {state === "error" &&
            "Não foi possível concluir o cancelamento. O link pode estar inválido ou já ter sido utilizado."}
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
