import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { adminExists, bootstrapAdmin } from "@/lib/admin.functions";
import { getPanelSession } from "@/lib/users.functions";
import { useLanguage } from "@/i18n";
import { useFieldErrors } from "@/hooks/useFieldErrors";

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
  const queryClient = useQueryClient();
  const { logoUrl } = useLanguage();
  const [mode, setMode] = useState<"login" | "bootstrap" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { validate, errorClass } = useFieldErrors();

  useEffect(() => {
    adminExists()
      .then((r) => setMode(r.exists ? "login" : "bootstrap"))
      .catch(() => setMode("login"));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required: Record<string, unknown> = { email };
    if (mode !== "forgot") required["password"] = password;
    if (!validate(required)) return;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        });
        if (error) {
          toast.error("Não foi possível enviar o e-mail. Tente novamente.");
          return;
        }
        setSent(true);
        toast.success("Se o e-mail existir, enviamos um link de redefinição.");
        return;
      }
      if (mode === "bootstrap") {
        const r = await bootstrapAdmin({ data: { email, password } });
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success("Administrador criado. Entrando…");
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        toast.error("E-mail ou senha inválidos.");
        return;
      }

      // A tela administrativa pode ter armazenado uma consulta sem sessão antes
      // do login. Remova esse resultado e valide o acesso com o novo token antes
      // de navegar, evitando o redirecionamento de volta ao login na 1ª tentativa.
      queryClient.removeQueries({ queryKey: ["panel-session"] });
      const panelSession = await queryClient.fetchQuery({
        queryKey: ["panel-session"],
        queryFn: () => getPanelSession(),
        staleTime: 30_000,
      });
      if (panelSession.roles.length === 0) {
        await supabase.auth.signOut();
        queryClient.removeQueries({ queryKey: ["panel-session"] });
        toast.error("Este usuário não possui acesso à área administrativa.");
        return;
      }

      navigate({ to: "/admin", replace: true });
    } catch (error) {
      queryClient.removeQueries({ queryKey: ["panel-session"] });
      toast.error(
        error instanceof Error && error.message.includes("Forbidden")
          ? "Este usuário não possui acesso à área administrativa."
          : "Não foi possível validar o acesso. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-20">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-sm rounded-lg border border-border bg-background p-8"
      >
        <img src={logoUrl} alt="Liberato Consulting" className="h-11 w-auto" />
        <h1 className="mt-3 font-display text-2xl font-bold">
          {mode === "bootstrap"
            ? "Criar administrador"
            : mode === "forgot"
              ? "Esqueci minha senha"
              : "Acesso ao painel"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "bootstrap"
            ? "Nenhum administrador cadastrado ainda. Defina o acesso principal do painel."
            : mode === "forgot"
              ? "Informe seu e-mail e enviaremos um link para criar uma nova senha."
              : "Área restrita à equipe Liberato Consulting."}
        </p>

        <label className="mt-6 block text-sm font-medium">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent${errorClass("email", email)}`}
          />
        </label>
        {mode !== "forgot" && (
          <label className="mt-4 block text-sm font-medium">
            Senha
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent${errorClass("password", password)}`}
            />
          </label>
        )}

        {sent && mode === "forgot" && (
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Verifique sua caixa de entrada (e o spam). O link expira em pouco tempo.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {busy
            ? "Aguarde…"
            : mode === "bootstrap"
              ? "Criar e entrar"
              : mode === "forgot"
                ? "Enviar link de redefinição"
                : "Entrar"}
        </button>

        {mode !== "bootstrap" && (
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMode(mode === "forgot" ? "login" : "forgot");
            }}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-accent hover:underline"
          >
            {mode === "forgot" ? "Voltar ao login" : "Esqueci minha senha"}
          </button>
        )}

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-accent hover:underline"
          >
            Voltar para a página inicial
          </a>
        </div>
      </form>
    </div>
  );
}

