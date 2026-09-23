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
  // Segundo fator (aplicativo autenticador) exigido para administradores.
  const [mfa, setMfa] = useState<null | { factorId: string; enroll?: { qr: string; secret: string } }>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    adminExists()
      .then((r) => setMode(r.exists ? "login" : "bootstrap"))
      .catch(() => setMode("login"));
    // Sessão já aberta, mas pendente do segundo fator: vai direto à verificação.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      try {
        const s = await getPanelSession();
        if (s.needsMfa) await startMfa();
      } catch {
        /* sem sessão válida */
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startMfa() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const verified = data.totp.find((f) => f.status === "verified");
    if (verified) {
      setMfa({ factorId: verified.id });
      return;
    }
    // Remove cadastros incompletos antes de gerar um novo QR code.
    for (const f of data.all.filter((f) => f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const enrolled = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Liberato ${new Date().toISOString().slice(0, 10)}`,
    });
    if (enrolled.error) throw enrolled.error;
    setMfa({
      factorId: enrolled.data.id,
      enroll: { qr: enrolled.data.totp.qr_code, secret: enrolled.data.totp.secret },
    });
  }

  async function finishLogin() {
    queryClient.removeQueries({ queryKey: ["panel-session"] });
    const panelSession = await queryClient.fetchQuery({
      queryKey: ["panel-session"],
      queryFn: () => getPanelSession(),
      staleTime: 30_000,
    });
    if (panelSession.needsMfa) {
      await startMfa();
      return;
    }
    if (panelSession.roles.length === 0) {
      await supabase.auth.signOut();
      queryClient.removeQueries({ queryKey: ["panel-session"] });
      toast.error("Este usuário não possui acesso à área administrativa.");
      return;
    }
    navigate({ to: "/admin", replace: true });
  }

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!mfa) return;
    const clean = code.replace(/\D/g, "");
    if (clean.length !== 6) {
      toast.error("Digite o código de 6 dígitos do aplicativo autenticador.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfa.factorId, code: clean });
      if (error) {
        toast.error("Código inválido ou expirado. Tente novamente.");
        return;
      }
      setMfa(null);
      setCode("");
      await finishLogin();
    } catch {
      toast.error("Não foi possível validar o código. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  async function onCancelMfa() {
    await supabase.auth.signOut();
    queryClient.removeQueries({ queryKey: ["panel-session"] });
    setMfa(null);
    setCode("");
  }

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
      await finishLogin();
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

  if (mfa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-6 py-20">
        <form onSubmit={onVerify} noValidate className="w-full max-w-sm rounded-lg border border-border bg-background p-8">
          <img src={logoUrl} alt="Liberato Consulting" className="h-11 w-auto" />
          <h1 className="mt-3 font-display text-2xl font-bold">Verificação em duas etapas</h1>
          {mfa.enroll ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Primeiro acesso como administrador: escaneie o QR code com um aplicativo autenticador
                (Google Authenticator, Microsoft Authenticator, Authy…) e digite o código gerado.
              </p>
              <img src={mfa.enroll.qr} alt="QR code do autenticador" className="mx-auto mt-4 h-44 w-44 rounded-md border border-border bg-background p-2" />
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Não consegue escanear? Digite a chave:
                <span className="mt-1 block select-all break-all font-mono text-foreground">{mfa.enroll.secret}</span>
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Abra seu aplicativo autenticador e digite o código de 6 dígitos da Liberato Consulting.
            </p>
          )}
          <label className="mt-6 block text-sm font-medium">
            Código de verificação
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-center font-mono text-lg tracking-[0.4em] outline-none focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-6 w-full rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Verificando…" : "Verificar e entrar"}
          </button>
          <button
            type="button"
            onClick={onCancelMfa}
            className="mt-3 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:text-accent hover:underline"
          >
            Cancelar e sair
          </button>
        </form>
      </div>
    );
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

