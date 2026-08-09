import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminExists, bootstrapAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acesso restrito — Liberato Consulting" },
      { name: "description", content: "Área de administração do site da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acesso restrito — Liberato Consulting" },
      { property: "og:description", content: "Painel administrativo interno." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "bootstrap">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminExists()
      .then((r) => setMode(r.exists ? "login" : "bootstrap"))
      .catch(() => setMode("login"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "bootstrap") {
        const r = await bootstrapAdmin({ data: { email, password } });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Administrador criado. Entrando…");
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }
      navigate({ to: "/admin", replace: true });
    } catch {
      toast.error("Não foi possível entrar. Tente novamente.");
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
        <h1 className="mt-3 font-display text-2xl font-bold">
          {mode === "bootstrap" ? "Criar administrador" : "Acesso ao painel"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "bootstrap"
            ? "Nenhum administrador cadastrado ainda. Defina o acesso principal do painel."
            : "Área restrita à equipe Liberato Consulting."}
        </p>

        <label className="mt-6 block text-sm font-medium">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Senha
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Aguarde…" : mode === "bootstrap" ? "Criar e entrar" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
