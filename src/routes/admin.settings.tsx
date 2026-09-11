import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { ScheduleSettings } from "@/components/ScheduleSettings";
import { listEmailTemplates, saveEmailTemplate } from "@/lib/company.functions";
import {
  getAlertEmail,
  getSiteConfig,
  getWhatsApp,
  resetLogo,
  saveAlertEmail,
  saveLogo,
  saveWhatsApp,
} from "@/lib/admin.functions";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { formatPhone, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Painel Liberato Consulting" },
      { name: "description", content: "Layout, logomarca, contatos e e-mails automáticos." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Configurações — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Layout, logomarca, contatos e e-mails automáticos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const LINKS = [
  {
    to: "/admin/areas",
    title: "Áreas do site",
    text: "Serviços, Quem somos, Conteúdo e Dados do Brasil: banners, títulos e textos.",
  },
  { to: "/admin/theme", title: "Cores do site", text: "Paleta principal, destaques, fundos e texto." },
  { to: "/admin/texts", title: "Textos e títulos", text: "Edite em português; EN, ES e ZH são traduzidos automaticamente." },
  { to: "/admin/hero", title: "Carrossel da página inicial", text: "Imagens e frases dos banners." },
];

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function SettingsPage() {
  return (
    <AdminShell
      title="Configurações"
      requireAdmin
      description="Layout da plataforma, identidade visual, contatos e padrão dos e-mails automáticos enviados aos usuários."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-lg border border-border bg-background p-6 transition-colors hover:border-accent"
          >
            <h2 className="font-display text-lg font-bold">{l.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{l.text}</p>
          </Link>
        ))}
      </div>

      <BrandingBlock />
      <ContactsBlock />
      <ScheduleSettings />
      <EmailTemplatesBlock />
    </AdminShell>
  );
}

function BrandingBlock() {
  const config = useQuery({ queryKey: ["site-config-admin"], queryFn: () => getSiteConfig() });
  const [uploading, setUploading] = useState(false);
  const currentLogo = config.data?.branding?.logoUrl || "/logo.png";

  return (
    <div className="mt-10 max-w-md rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-lg font-bold">Logomarca</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        PNG (preferencialmente com fundo transparente), JPG, WEBP ou SVG de até 1 MB. Vale
        imediatamente para o site inteiro e para os PDFs gerados.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <span className="inline-flex rounded-md border border-border bg-white px-3 py-2">
          <img src={currentLogo} alt="Logomarca atual" className="h-10 w-auto" />
        </span>
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer rounded-md bg-ink px-4 py-2 text-center text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground">
            {uploading ? "Enviando…" : "Enviar nova logo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 1_000_000) {
                  toast.error("Arquivo muito grande. Use uma imagem de até 1 MB.");
                  return;
                }
                setUploading(true);
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
                    toast.success("Logomarca atualizada.");
                    await config.refetch();
                  }
                } catch {
                  toast.error("Não foi possível enviar a logomarca.");
                } finally {
                  setUploading(false);
                }
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
  );
}

function ContactsBlock() {
  const alert = useQuery({ queryKey: ["admin-alert-email"], queryFn: () => getAlertEmail(), retry: false });
  const whats = useQuery({ queryKey: ["admin-whatsapp"], queryFn: () => getWhatsApp(), retry: false });
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const { validate, errorClass } = useFieldErrors();

  useEffect(() => {
    if (alert.data?.email) setEmail(alert.data.email);
  }, [alert.data]);
  useEffect(() => {
    if (whats.data?.number != null) setNumber(whats.data.number);
  }, [whats.data]);

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2">
      <form
        noValidate
        className="rounded-lg border border-border bg-background p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!isValidPhone(number)) {
            toast.error(PHONE_ERROR);
            return;
          }
          if (!validate({ email })) return;
          setBusy(true);
          const r = await saveAlertEmail({ data: { email } });
          setBusy(false);
          if (!r.ok) toast.error(r.error);
          else toast.success("E-mail de alertas atualizado.");
        }}
      >
        <h2 className="font-display text-lg font-bold">E-mail para alertas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Recebe o aviso de cada novo lead e de cada currículo enviado pelo site.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-4 ${input}${errorClass("email", email)}`}
        />
        <button
          disabled={busy}
          className="mt-3 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          Salvar e-mail
        </button>
      </form>

      <form
        className="rounded-lg border border-border bg-background p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const r = await saveWhatsApp({ data: { number } });
          setBusy(false);
          if (!r.ok) toast.error(r.error);
          else toast.success("Número do WhatsApp atualizado.");
        }}
      >
        <h2 className="font-display text-lg font-bold">WhatsApp flutuante</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          DDI editável. No Brasil: +55 (11) 99999-9999.
        </p>
        <input
          type="tel"
          required
          inputMode="tel"
          autoComplete="tel"
          maxLength={25}
          value={number}
          onFocus={() => !number && setNumber("+55")}
          onChange={(e) => setNumber(formatPhone(e.target.value))}
          placeholder={PHONE_PLACEHOLDER}
          className={`mt-4 ${input}${number && !isValidPhone(number) ? " border-destructive ring-1 ring-destructive" : ""}`}
          aria-invalid={Boolean(number) && !isValidPhone(number)}
        />
        <button
          disabled={busy}
          className="mt-3 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          Salvar WhatsApp
        </button>
      </form>
    </div>
  );
}

function EmailTemplatesBlock() {
  const q = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => listEmailTemplates(),
    retry: false,
  });
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string; enabled: boolean }>({
    subject: "",
    body: "",
    enabled: true,
  });

  return (
    <div className="mt-10 rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-lg font-bold">E-mails automáticos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Mensagens enviadas automaticamente aos usuários. Use os campos entre chaves para
        personalizar, por exemplo {"{{nome}}"} e {"{{titulo}}"}.
      </p>

      <div className="mt-4 space-y-3">
        {(q.data ?? []).map((t) => (
          <div key={t.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <strong className="font-display text-sm">{t.label}</strong>
              <span className="text-xs text-muted-foreground">
                {t.enabled ? "ativo" : "desativado"}
              </span>
              <button
                onClick={() => {
                  setOpen(open === t.id ? null : t.id);
                  setDraft({ subject: t.subject, body: t.body, enabled: t.enabled });
                }}
                className="ml-auto text-xs text-accent hover:underline"
              >
                {open === t.id ? "fechar" : "editar"}
              </button>
            </div>
            {open === t.id && (
              <div className="mt-3 space-y-3">
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Assunto"
                  className={input}
                />
                <textarea
                  rows={8}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  className={input}
                />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                  />
                  Enviar este e-mail automaticamente
                </label>
                <button
                  onClick={async () => {
                    const r = await saveEmailTemplate({ data: { id: t.id, ...draft } });
                    if (!r.ok) toast.error(r.error);
                    else {
                      toast.success("Modelo salvo.");
                      setOpen(null);
                      await q.refetch();
                    }
                  }}
                  className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Salvar modelo
                </button>
              </div>
            )}
          </div>
        ))}
        {(q.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado.</p>
        )}
      </div>
    </div>
  );
}
