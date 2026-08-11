import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  getAlertEmail,
  getSiteConfig,
  inviteAdmin,
  resetLogo,
  saveAlertEmail,
  saveLogo,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Liberato Consulting" },
      { name: "description", content: "Gerencie cores, textos e conteúdos do site." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel administrativo — Liberato Consulting" },
      { property: "og:description", content: "Gerencie cores, textos e conteúdos do site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

const CARDS = [
  {
    to: "/admin/theme",
    title: "Cores do site",
    text: "Ajuste a paleta principal: cor primária, laranja de destaque, fundos e texto.",
  },
  {
    to: "/admin/texts",
    title: "Textos do site",
    text: "Edite qualquer texto em português. As versões EN, ES e ZH são traduzidas automaticamente.",
  },
  {
    to: "/admin/content",
    title: "Conteúdos",
    text: "Publique artigos, guias e estudos que aparecem na seção Conteúdo.",
  },
  {
    to: "/admin/leads",
    title: "Leads recebidos",
    text: "Veja os contatos enviados pelos formulários das páginas de serviço.",
  },
  {
    to: "/admin/applications",
    title: "Candidaturas",
    text: "Consulte os currículos enviados pelo formulário Trabalhe Conosco.",
  },
];

function AdminHome() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [alertEmail, setAlertEmail] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);
  const alert = useQuery({
    queryKey: ["admin-alert-email"],
    queryFn: () => getAlertEmail(),
    retry: false,
  });

  useEffect(() => {
    if (alert.data?.email) setAlertEmail(alert.data.email);
  }, [alert.data]);


  return (
    <AdminShell
      title="Painel administrativo"
      description="Tudo que você alterar aqui vale para o site publicado, em todos os idiomas."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-border bg-background p-6 transition-colors hover:border-accent"
          >
            <h2 className="font-display text-lg font-bold">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 max-w-md rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">E-mail para alertas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Endereço que recebe o aviso de cada novo lead e de cada currículo enviado pelo site.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSavingAlert(true);
            try {
              const r = await saveAlertEmail({ data: { email: alertEmail } });
              if (!r.ok) toast.error(r.error);
              else toast.success("E-mail de alertas atualizado.");
            } catch {
              toast.error("Não foi possível salvar o e-mail.");
            } finally {
              setSavingAlert(false);
            }
          }}
        >
          <input
            type="email"
            required
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            placeholder="felipesza@yahoo.com.br"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={savingAlert || alert.isLoading}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {savingAlert ? "Salvando…" : "Salvar e-mail"}
          </button>
        </form>
      </div>



      <div className="mt-10 max-w-md rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">Convidar administrador</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Crie o acesso de outra pessoa da equipe. Ela já entra com o e-mail e senha definidos aqui.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await inviteAdmin({ data: { email, password } });
              if (!r.ok) toast.error(r.error);
              else {
                toast.success("Administrador criado.");
                setEmail("");
                setPassword("");
              }
            } catch {
              toast.error("Não foi possível criar o acesso.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            type="email"
            required
            placeholder="email@liberato.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Criando…" : "Criar acesso"}
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
