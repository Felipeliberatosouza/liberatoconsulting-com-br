import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { toast } from "sonner";
import { listDeliveries, previewDelivery, resendDelivery, type DeliveryItem, type DeliveryRecipient } from "@/lib/deliveries.functions";
import { MessagePreview } from "@/components/MessagePreview";

export const Route = createFileRoute("/admin/envios")({
  head: () => ({
    meta: [
      { title: "Painel de Envio de Informações — Liberato Consulting" },
      { name: "description", content: "Gestão de todos os envios do site por e-mail e WhatsApp." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel de Envio de Informações — Liberato Consulting" },
      { property: "og:description", content: "Gestão de todos os envios do site por e-mail e WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeliveriesPage,
});

const SOURCE_LABEL: Record<string, string> = {
  newsletter: "Newsletter",
  boletim: "Boletim Semanal",
  notificacao: "Notificação do site",
};

function fmt(v: string) {
  return new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
}

function DeliveriesPage() {
  const q = useQuery({ queryKey: ["deliveries"], queryFn: () => listDeliveries() });
  const [source, setSource] = useState("todos");
  const [channel, setChannel] = useState("todos");
  const [hideTests, setHideTests] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string; whatsapp: string; recipient?: string } | null>(null);

  async function openPreview(i: DeliveryItem, r?: DeliveryRecipient) {
    setBusy(`p-${i.key}`);
    const res = await previewDelivery({ data: { source: i.source as "newsletter", referenceId: i.key, email: r?.email || "" } });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    setPreview({ subject: res.subject, html: res.html, whatsapp: res.whatsapp, recipient: r?.name || r?.email });
  }

  async function resend(i: DeliveryItem, r: DeliveryRecipient, channel: "email" | "whatsapp") {
    const id = `${r.id}-${channel}`;
    setBusy(id);
    const res = await resendDelivery({ data: { source: i.source as "newsletter", referenceId: i.key, email: r.email || "", phone: r.phone, name: r.name, channel } });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(channel === "email" ? `E-mail reenviado para ${r.email}` : `WhatsApp reenviado para ${r.phone}`);
    q.refetch();
  }

  const items = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data ?? []).filter((i) => {
      if (source !== "todos" && i.source !== source) return false;
      if (hideTests && i.isTest) return false;
      if (channel === "email" && i.sentEmail === 0) return false;
      if (channel === "whatsapp" && i.sentWhatsApp === 0) return false;
      if (s && !i.subject.toLowerCase().includes(s) && !i.recipients.some((r) => `${r.name} ${r.email} ${r.phone}`.toLowerCase().includes(s))) return false;
      return true;
    });
  }, [q.data, source, channel, hideTests, search]);

  const totals = useMemo(() => {
    const people = new Set<string>();
    let email = 0, wa = 0, fail = 0;
    for (const i of items) {
      email += i.sentEmail; wa += i.sentWhatsApp; fail += i.failed;
      i.recipients.forEach((r) => people.add(r.email || r.phone));
    }
    return { envios: items.length, email, wa, fail, people: people.size };
  }, [items]);

  const field = "rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <AdminShell title="Painel de Envio de Informações" requireAdmin description="Tudo o que o site já enviou, com data, destinatários e forma de envio (e-mail e/ou WhatsApp).">
      <div className="grid gap-3 sm:grid-cols-5">
        {[["Envios", totals.envios], ["E-mails entregues", totals.email], ["WhatsApp entregues", totals.wa], ["Falhas", totals.fail], ["Pessoas alcançadas", totals.people]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{l}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select className={field} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="todos">Todos os assuntos</option>
          <option value="newsletter">Newsletter</option>
          <option value="boletim">Boletim Semanal</option>
          <option value="notificacao">Notificações do site</option>
        </select>
        <select className={field} value={channel} onChange={(e) => setChannel(e.target.value)}>
          <option value="todos">E-mail e WhatsApp</option>
          <option value="email">Com e-mail</option>
          <option value="whatsapp">Com WhatsApp</option>
        </select>
        <input className={`${field} min-w-56 flex-1`} placeholder="Buscar assunto, nome, e-mail ou telefone" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hideTests} onChange={(e) => setHideTests(e.target.checked)} /> Ocultar testes
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Data</th><th className="p-3">Assunto</th><th className="p-3">Tipo</th>
              <th className="p-3 text-center">E-mail</th><th className="p-3 text-center">WhatsApp</th><th className="p-3 text-center">Falhas</th><th className="p-3">Destinatários</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!q.isLoading && items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum envio encontrado.</td></tr>}
            {items.map((i) => (
              <Fragment key={i.key}>
                <tr className="border-t border-border align-top">
                  <td className="whitespace-nowrap p-3">{fmt(i.sentAt)}</td>
                  <td className="p-3">
                    <p className="font-medium">{i.subject}</p>
                    {i.isTest && <span className="text-xs text-muted-foreground">Envio de teste</span>}
                    {i.lastError && <p className="mt-1 text-xs text-destructive">{i.lastError}</p>}
                  </td>
                  <td className="whitespace-nowrap p-3">{SOURCE_LABEL[i.source] ?? i.source}</td>
                  <td className="p-3 text-center">{i.sentEmail}</td>
                  <td className="p-3 text-center">{i.sentWhatsApp}</td>
                  <td className="p-3 text-center">{i.failed}</td>
                  <td className="p-3">
                    {(i.source === "newsletter" || i.source === "boletim") && (
                      <button type="button" className="mb-1 block text-accent underline" disabled={busy === `p-${i.key}`} onClick={() => openPreview(i)}>
                        {busy === `p-${i.key}` ? "Abrindo…" : "Visualizar"}
                      </button>
                    )}
                    {i.recipients.length > 0 ? (
                      <button type="button" className="text-accent underline" onClick={() => setOpen(open === i.key ? null : i.key)}>
                        {open === i.key ? "Ocultar" : `Ver ${i.recipients.length}`}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Detalhe individual indisponível (envio anterior a 18/09/2026)</span>
                    )}
                  </td>
                </tr>
                {open === i.key && (
                  <tr className="bg-secondary/30">
                    <td colSpan={7} className="p-3">
                      <table className="w-full text-xs">
                        <thead className="text-left text-muted-foreground">
                          <tr><th className="p-2">Nome</th><th className="p-2">E-mail</th><th className="p-2">WhatsApp</th><th className="p-2">Forma</th><th className="p-2">Situação</th><th className="p-2">Horário</th><th className="p-2">Reenviar</th></tr>
                        </thead>
                        <tbody>
                          {i.recipients.map((r) => (
                            <tr key={r.id} className="border-t border-border">
                              <td className="p-2">{r.name || "—"}</td>
                              <td className="p-2">{r.email || "—"}</td>
                              <td className="p-2">{r.phone || "—"}</td>
                              <td className="p-2">{r.channel === "whatsapp" ? "WhatsApp" : "E-mail"}</td>
                              <td className={`p-2 ${r.status === "falhou" ? "text-destructive" : ""}`}>{r.status === "falhou" ? `Falhou${r.error ? `: ${r.error}` : ""}` : "Entregue"}{r.retroactive ? " (registro retroativo)" : ""}</td>
                              <td className="p-2 whitespace-nowrap">{fmt(r.sentAt)}</td>
                              <td className="p-2 whitespace-nowrap">
                                {(i.source === "newsletter" || i.source === "boletim") ? (
                                  <div className="flex gap-2">
                                    {r.email && (
                                      <button type="button" className="rounded border border-border px-2 py-1 hover:bg-secondary" disabled={busy === `${r.id}-email`} onClick={() => resend(i, r, "email")}>
                                        {busy === `${r.id}-email` ? "Enviando…" : "E-mail"}
                                      </button>
                                    )}
                                    {r.phone && (
                                      <button type="button" className="rounded border border-border px-2 py-1 hover:bg-secondary" disabled={busy === `${r.id}-whatsapp`} onClick={() => resend(i, r, "whatsapp")}>
                                        {busy === `${r.id}-whatsapp` ? "Enviando…" : "WhatsApp"}
                                      </button>
                                    )}
                                    <button type="button" className="text-accent underline" onClick={() => openPreview(i, r)}>Prévia</button>
                                  </div>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {preview && <MessagePreview {...preview} onClose={() => setPreview(null)} />}
    </AdminShell>
  );
}
