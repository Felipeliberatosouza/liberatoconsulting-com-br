import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { approveConsent, getConsentRequest } from "@/lib/people.functions";

export const Route = createFileRoute("/autorizar/$token")({
  head: () => ({
    meta: [
      { title: "Autorizar recebimento — Liberato Consulting" },
      { name: "description", content: "Confirme se deseja receber comunicações da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Autorizar recebimento — Liberato Consulting" },
      { property: "og:description", content: "Confirme se deseja receber comunicações da Liberato Consulting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthorizePage,
});

type Info = Awaited<ReturnType<typeof getConsentRequest>>;

function AuthorizePage() {
  const { token } = Route.useParams();
  const [info, setInfo] = useState<Info | undefined>(undefined);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    getConsentRequest({ data: { token } })
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [token]);

  async function approve() {
    setState("busy");
    const r = await approveConsent({ data: { token } }).catch(() => ({ ok: false as const, error: "Tente novamente." }));
    if (r.ok) setState("done");
    else {
      setError(r.error);
      setState("error");
    }
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 py-16">
      {info === undefined && <p className="text-muted-foreground">Carregando…</p>}
      {info === null && <p>Link inválido ou expirado.</p>}
      {info && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-semibold">Autorizar recebimento</h1>
          {info.status === "approved" || state === "done" ? (
            <p>
              Obrigado{info.name ? `, ${info.name}` : ""}! Seu recebimento do <strong>{info.service}</strong> está
              autorizado. Você pode cancelar a qualquer momento pelo link presente em cada envio.
            </p>
          ) : info.status !== "pending" ? (
            <p>Este link não é mais válido.</p>
          ) : (
            <>
              <p>
                Olá{info.name ? `, ${info.name}` : ""}! A Liberato Consulting deseja enviar a você o{" "}
                <strong>{info.service}</strong>. Conforme a LGPD, só enviaremos com a sua autorização.
              </p>
              <p className="text-sm text-muted-foreground">
                Ao autorizar, registraremos data, horário, endereço IP e dados do aparelho/navegador como comprovante.
              </p>
              <button
                onClick={approve}
                disabled={state === "busy"}
                className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
              >
                {state === "busy" ? "Registrando…" : "Autorizo o recebimento"}
              </button>
              {state === "error" && <p className="text-sm text-destructive">{error}</p>}
            </>
          )}
        </div>
      )}
    </main>
  );
}
