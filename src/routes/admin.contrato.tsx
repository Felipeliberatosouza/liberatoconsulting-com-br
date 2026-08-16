import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { getPanelSession } from "@/lib/users.functions";
import { signContract } from "@/lib/company.functions";
import { useFieldErrors } from "@/hooks/useFieldErrors";

export const Route = createFileRoute("/admin/contrato")({
  head: () => ({
    meta: [
      { title: "Contrato de vínculo — Liberato Consulting" },
      { name: "description", content: "Assinatura digital do contrato de trabalho." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Contrato de vínculo — Liberato Consulting" },
      { property: "og:description", content: "Assinatura digital do contrato de trabalho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContractPage,
});

function ContractPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const { validate, errorClass } = useFieldErrors();

  const session = useQuery({
    queryKey: ["panel-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      try {
        return await getPanelSession();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const contract = session.data?.needsContract ?? null;

  if (session.isLoading) {
    return <div className="p-16 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!session.data) {
    navigate({ to: "/admin/login", replace: true });
    return null;
  }
  if (!contract) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Nenhum contrato pendente</h1>
        <button
          onClick={() => navigate({ to: "/admin" })}
          className="mt-6 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Ir para o painel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40 py-12">
      <div className="mx-auto max-w-3xl px-6">
        <h1 className="font-display text-2xl font-bold">{contract.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Leia e assine digitalmente para liberar o acesso ao sistema.
        </p>
        <div className="mt-6 max-h-[45vh] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-6 text-sm leading-relaxed">
          {contract.body}
        </div>

        <form
          noValidate
          className="mt-6 space-y-3 rounded-lg border border-border bg-background p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validate({ name, cpf, accept })) return;
            if (!accept) {
              toast.error("Confirme o aceite do contrato.");
              return;
            }
            setBusy(true);
            try {
              const r = await signContract({
                data: {
                  audience: contract.audience as "autor" | "consultor",
                  signer_name: name,
                  signer_cpf: cpf,
                },
              });
              if (!r.ok) toast.error(r.error);
              else {
                toast.success("Contrato assinado.");
                await session.refetch();
                navigate({ to: "/admin", replace: true });
              }
            } catch {
              toast.error("Não foi possível registrar a assinatura.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            required
            minLength={3}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
            className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent${errorClass("name", name)}`}
          />
          <input
            required
            minLength={11}
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="CPF"
            className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent${errorClass("cpf", cpf)}`}
          />
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              className={`mt-1${errorClass("accept", accept)}`}
            />
            Li e aceito integralmente os termos deste contrato. Reconheço esta assinatura
            eletrônica como válida.
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Registrando…" : "Assinar contrato"}
          </button>
        </form>
      </div>
    </div>
  );
}
