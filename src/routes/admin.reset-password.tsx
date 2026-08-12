import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Liberato Consulting" },
      { name: "description", content: "Defina uma nova senha de acesso ao painel da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Redefinir senha — Liberato Consulting" },
      { property: "og:description", content: "Redefinição de senha do painel administrativo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Não foi possível atualizar a senha. Solicite um novo link.");
        return;
      }
      toast.success("Senha atualizada com sucesso.");
      navigate({ to: "/admin", replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-20">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-background p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Liberato</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Definir nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready
            ? "Escolha uma nova senha para o painel administrativo."
            : "Abra esta página pelo link enviado ao seu e-mail para continuar."}
        </p>

        <label className="mt-6 block text-sm font-medium">
          Nova senha
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Confirmar senha
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={busy || !ready}
          className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar nova senha"}
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/admin/login" })}
          className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-accent hover:underline"
        >
          Voltar ao login
        </button>
      </form>
    </div>
  );
}
