import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  getAlertEmail,
  getSiteConfig,
  getWhatsApp,
  inviteAdmin,
  resetLogo,
  saveAlertEmail,
  saveLogo,
  saveWhatsApp,
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
    to: "/admin/newsletter",
    title: "Newsletter",
    text: "Gerencie inscritos, escreva campanhas e envie automaticamente para toda a base.",
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

  const authed = useQuery({
    queryKey: ["admin-authed"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    },
    retry: false,
  });
  const enabled = authed.data === true;

  const [alertEmail, setAlertEmail] = useState("");
  const [savingAlert, setSavingAlert] = useState(false);
  const alert = useQuery({
    queryKey: ["admin-alert-email"],
    queryFn: () => getAlertEmail(),
    retry: false,
    enabled,
  });

  useEffect(() => {
    if (alert.data?.email) setAlertEmail(alert.data.email);
  }, [alert.data]);

  const [whatsapp, setWhatsApp] = useState("");
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const whatsappQuery = useQuery({
    queryKey: ["admin-whatsapp"],
    queryFn: () => getWhatsApp(),
    retry: false,
    enabled,
  });

  useEffect(() => {
    if (whatsappQuery.data?.number != null) setWhatsApp(whatsappQuery.data.number);
  }, [whatsappQuery.data]);

  const config = useQuery({ queryKey: ["site-config-admin"], queryFn: () => getSiteConfig() });
  const currentLogo = config.data?.branding?.logoUrl || "/logo.png";
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const onLogoFile = async (file: File) => {
    if (file.size > 1_000_000) {
      toast.error("Arquivo muito grande. Use uma imagem de até 1 MB.");
      return;
    }
    setUploadingLogo(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      const r = await saveLogo({ data: { dataUrl } });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Logomarca atualizada em todo o site.");
        await config.refetch();
      }
    } catch {
      toast.error("Não foi possível enviar a logomarca.");
    } finally {
      setUploadingLogo(false);
    }
  };


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
        <h2 className="font-display text-lg font-bold">Logomarca</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Envie um arquivo PNG (de preferência com fundo transparente), JPG, WEBP ou SVG de até
          1 MB. A troca vale imediatamente para o site inteiro.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className="inline-flex rounded-md border border-border bg-white px-3 py-2">
            <img src={currentLogo} alt="Logomarca atual" className="h-10 w-auto" />
          </span>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground">
              {uploadingLogo ? "Enviando…" : "Enviar nova logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void onLogoFile(f);
                }}
              />
            </label>
            <button
              type="button"
              onClick={async () => {
                const r = await resetLogo();
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success("Logomarca padrão restaurada.");
                  await config.refetch();
                }
              }}
              className="text-xs text-muted-foreground hover:text-accent"
            >
              Usar logo padrão
            </button>
          </div>
        </div>
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
        <h2 className="font-display text-lg font-bold">WhatsApp flutuante</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Número que aparece no botão fixo do site. Deixe em branco para ocultar o botão. Use o
          formato internacional, por exemplo: +55 11 99999-9999.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSavingWhatsApp(true);
            try {
              const r = await saveWhatsApp({ data: { number: whatsapp } });
              if (!r.ok) toast.error(r.error);
              else toast.success("Número do WhatsApp atualizado.");
            } catch {
              toast.error("Não foi possível salvar o número.");
            } finally {
              setSavingWhatsApp(false);
            }
          }}
        >
          <input
            type="text"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsApp(e.target.value)}
            placeholder="+55 11 99999-9999"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={savingWhatsApp || whatsappQuery.isLoading}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {savingWhatsApp ? "Salvando…" : "Salvar WhatsApp"}
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
