import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  listBulletinSubscribers,
  previewBulletin,
  sendBulletinNow,
  unsubscribeBulletinByAdmin,
  type BulletinSubscriberRow,
} from "@/lib/bulletin.functions";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/admin/boletim")({
  head: () => ({
    meta: [
      { title: "Boletim Semanal — Painel Liberato" },
      {
        name: "description",
        content: "Cadastros, pré-visualização e envio do Boletim Semanal por e-mail e WhatsApp.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Boletim Semanal — Painel Liberato" },
      { property: "og:description", content: "Gestão do Boletim Semanal da consultoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBulletin,
});

function AdminBulletin() {
  const { segments } = useLanguage();
  const [rows, setRows] = useState<BulletinSubscriberRow[]>([]);
  const [segment, setSegment] = useState("Todos");
  const [preview, setPreview] = useState<{ html: string; whatsapp: string } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testWhatsApp, setTestWhatsApp] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      setRows(await listBulletinSubscribers());
    } catch {
      /* sessão sem permissão */
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function loadPreview(seg: string) {
    setBusy(true);
    try {
      const r = await previewBulletin({ data: { segment: seg } });
      if (r.ok) setPreview({ html: r.html, whatsapp: r.whatsapp });
    } catch {
      toast.error("Não foi possível gerar a pré-visualização.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadPreview(segment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment]);

  const active = rows.filter((r) => r.status === "active");
  const field =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <AdminShell
      title="Boletim Semanal"
      description="O boletim é montado automaticamente com a logomarca da consultoria, a data de atualização, os indicadores econômicos do segmento, os últimos artigos e os dados da consultoria no rodapé. O envio automático ocorre toda segunda-feira às 10h."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="font-display text-lg font-bold">Pré-visualizar por segmento</h2>
            <label className="mt-4 block text-sm font-medium">
              Segmento
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className={field}
              >
                <option value="Todos">Todos os segmentos</option>
                {segments.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-3 text-xs text-muted-foreground">
              Cada inscrito recebe a versão do seu próprio segmento.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-6">
            <h2 className="font-display text-lg font-bold">Enviar</h2>
            <label className="mt-4 block text-sm font-medium">
              E-mail de teste
              <input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="contato@liberatoconsulting.com.br"
                className={field}
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              WhatsApp de teste
              <input
                value={testWhatsApp}
                onChange={(e) => setTestWhatsApp(e.target.value)}
                placeholder="(11) 91234-5678"
                className={field}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!testEmail && !testWhatsApp) {
                    toast.error("Informe um e-mail ou WhatsApp de teste.");
                    return;
                  }
                  setBusy(true);
                  try {
                    const r = await sendBulletinNow({
                      data: {
                        ...(testEmail ? { testEmail } : {}),
                        ...(testWhatsApp ? { testWhatsApp } : {}),
                        testSegment: segment,
                      },
                    });
                    if (r.ok) toast.success("Teste enviado.");
                    else toast.error(r.error);
                  } catch {
                    toast.error("Não foi possível enviar o teste.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                Enviar teste
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!window.confirm(`Enviar o boletim agora para ${active.length} inscritos?`))
                    return;
                  setBusy(true);
                  try {
                    const r = await sendBulletinNow({ data: {} });
                    if (r.ok)
                      toast.success(
                        `Enviado: ${r.sentEmail} e-mails e ${r.sentWhatsApp} mensagens de WhatsApp.`,
                      );
                    else toast.error(r.error);
                    await refresh();
                  } catch {
                    toast.error("Não foi possível enviar o boletim.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
              >
                Enviar agora a todos
              </button>
            </div>
          </div>

          {preview && (
            <div className="rounded-lg border border-border bg-background p-6">
              <h2 className="font-display text-lg font-bold">Mensagem de WhatsApp</h2>
              <pre className="mt-3 whitespace-pre-wrap rounded-md bg-secondary/60 p-4 text-xs text-foreground">
                {preview.whatsapp}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                No WhatsApp o envio é uma imagem (logomarca do boletim) seguida desta mensagem, com
                o link para parar de receber.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <h2 className="px-2 pb-3 font-display text-lg font-bold">Pré-visualização do e-mail</h2>
          {preview ? (
            <iframe
              title="Pré-visualização do Boletim Semanal"
              srcDoc={preview.html}
              className="h-[720px] w-full rounded-md border border-border bg-white"
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Gerando pré-visualização…</p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-border bg-background">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold">Cadastros</h2>
          <span className="text-sm text-muted-foreground">
            {active.length} ativos · {rows.length - active.length} cancelados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Segmento</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Canais</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{r.full_name}</td>
                  <td className="px-4 py-3">{r.company}</td>
                  <td className="px-4 py-3">{r.segment}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${r.email}`} className="text-accent hover:underline">
                      {r.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {r.whatsapp ? (
                      <a href={`tel:${r.whatsapp}`} className="text-accent hover:underline">
                        {r.whatsapp}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {[r.via_email ? "E-mail" : null, r.via_whatsapp ? "WhatsApp" : null]
                      .filter(Boolean)
                      .join(" + ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "active" ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        cancelado
                        {r.unsubscribed_at
                          ? ` em ${new Date(r.unsubscribed_at).toLocaleDateString("pt-BR")}`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "active" && (
                      <button
                        type="button"
                        onClick={async () => {
                          await unsubscribeBulletinByAdmin({ data: { id: r.id } });
                          await refresh();
                          toast.success("Envio interrompido para este cadastro.");
                        }}
                        className="text-xs text-destructive hover:underline"
                      >
                        Interromper envio
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum cadastro no Boletim Semanal ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
