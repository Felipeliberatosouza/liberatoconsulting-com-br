import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { toast } from "sonner";
import { listDeliveries, listWhatsAppSubscribers, previewDelivery, resendDelivery, type DeliveryItem, type DeliveryRecipient } from "@/lib/deliveries.functions";
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
  prospeccao: "Prospecção (Brevo)",
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
  const [filter, setFilter] = useState<"all" | "email" | "whatsapp" | "falhou">("all");
  function toggle(key: string, f: "all" | "email" | "whatsapp" | "falhou") {
    if (open === key && filter === f) { setOpen(null); return; }
    setOpen(key); setFilter(f);
  }
  const FILTER_LABEL = { all: "Todos os destinatários", email: "Receberam por e-mail", whatsapp: "Receberam por WhatsApp", falhou: "Envios com falha" };
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string; whatsapp: string; recipient?: string | undefined } | null>(null);

  async function openPreview(i: DeliveryItem, r?: DeliveryRecipient) {
    setBusy(`p-${i.key}`);
    const res = await previewDelivery({ data: { source: i.source as "newsletter", referenceId: i.key, email: r?.email || "" } });
    setBusy(null);
    if (!res.ok) { toast.error(res.error); return; }
    setPreview({ subject: res.subject, html: res.html, whatsapp: res.whatsapp, recipient: r?.name || r?.email });
  }

  async function resendAll(i: DeliveryItem, list: DeliveryRecipient[]) {
    const seen = new Set<string>();
    const jobs = list.filter((r) => {
      const ch = filter === "email" || filter === "whatsapp" ? filter : (r.channel as "email" | "whatsapp");
      const k = `${ch}-${ch === "email" ? r.email : r.phone}`;
      if (!(ch === "email" ? r.email : r.phone) || seen.has(k)) return false;
      seen.add(k); return true;
    });
    if (!jobs.length) {
      if (filter === "falhou" && i.failed > 0 && (i.source === "newsletter" || i.source === "boletim")) {
        const subs = await listWhatsAppSubscribers({ data: { source: i.source } });
        if (!subs.length) { toast.info("Nenhum inscrito ativo com WhatsApp para reenviar."); return; }
        if (!confirm(`Este envio não tem o detalhe de cada pessoa. Reenviar por WhatsApp para os ${subs.length} inscrito(s) ativos com WhatsApp?`)) return;
        setBusy(`all-${i.key}`);
        let ok = 0, fail = 0;
        try {
          for (const s of subs) {
            const res = await resendDelivery({ data: { source: i.source, referenceId: i.key, email: s.email, phone: s.phone, name: s.name, channel: "whatsapp" } });
            if (res.ok) ok++; else { fail++; if (/12 segundos/.test(res.error)) { toast.error(res.error); break; } }
          }
        } catch (e) { fail++; toast.error(e instanceof Error ? e.message : "Falha no reenvio."); }
        setBusy(null);
        if (fail) toast.error(`${ok} reenviado(s), ${fail} com falha.`); else toast.success(`${ok} reenvio(s) concluído(s).`);
        q.refetch();
        return;
      }
      toast.info("Nenhum destinatário disponível para reenvio nesta lista.");
      return;
    }
    if (!confirm(`Reenviar para ${jobs.length} destinatário(s) agora?`)) return;
    setBusy(`all-${i.key}`);
    let ok = 0, fail = 0;
    try {
      for (const r of jobs) {
        const ch = filter === "email" || filter === "whatsapp" ? filter : (r.channel as "email" | "whatsapp");
        const res = await resendDelivery({ data: { source: i.source as "newsletter", referenceId: i.key, email: r.email || "", phone: r.phone, name: r.name, channel: ch } });
        if (res.ok) ok++; else { fail++; if (ch === "whatsapp" && /12 segundos/.test(res.error)) { toast.error(res.error); break; } }
      }
    } catch (e) { fail++; toast.error(e instanceof Error ? e.message : "Falha no reenvio."); }
    setBusy(null);
    if (fail) toast.error(`${ok} reenviado(s), ${fail} com falha.`); else toast.success(`${ok} reenvio(s) concluído(s).`);
    q.refetch();
  }

  async function resend(i: DeliveryItem, r: DeliveryRecipient, channel: "email" | "whatsapp") {
    const id = `${r.id}-${channel}`;
    setBusy(id);
    let res: Awaited<ReturnType<typeof resendDelivery>>;
    try {
      res = await resendDelivery({ data: { source: i.source as "newsletter", referenceId: i.key, email: r.email || "", phone: r.phone, name: r.name, channel } });
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : "Falha no reenvio.");
      return;
    }
    setBusy(null);
    if (!res.ok) { toast.error(res.error); return; }
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
    <AdminShell title="Painel de Envio de Informações" requireAdmin wide description="Tudo o que o site já enviou, com data, destinatários e forma de envio (e-mail e/ou WhatsApp).">
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

      <div className="mt-4 rounded-lg border border-border">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-[13%] p-3">Data</th><th className="p-3">Assunto</th><th className="w-[13%] p-3">Tipo</th>
              <th className="w-[7%] p-3 text-center">E-mail</th><th className="w-[9%] p-3 text-center">WhatsApp</th><th className="w-[7%] p-3 text-center">Falhas</th><th className="w-[13%] p-3">Destinatários</th>
            </tr>
          </thead>
          <tbody>
            {q.isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!q.isLoading && items.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum envio encontrado.</td></tr>}
            {items.map((i) => (
              <Fragment key={i.key}>
                <tr className="border-t border-border align-top">
                  <td className="p-3">{fmt(i.sentAt)}</td>
                  <td className="p-3">
                    <p className="break-words font-medium">{i.subject}</p>
                    {i.isTest && <span className="text-xs text-muted-foreground">Envio de teste</span>}
                    {i.lastError && <p className="mt-1 break-words text-xs text-destructive">{i.lastError}</p>}
                  </td>
                  <td className="p-3">{SOURCE_LABEL[i.source] ?? i.source}</td>
                  <td className="p-3 text-center">{i.sentEmail > 0 ? (<button type="button" title="Ver quem são" className="font-semibold text-accent underline" onClick={() => toggle(i.key, "email")}>{i.sentEmail}</button>) : 0}</td>
                  <td className="p-3 text-center">{i.sentWhatsApp > 0 ? (<button type="button" title="Ver quem são" className="font-semibold text-accent underline" onClick={() => toggle(i.key, "whatsapp")}>{i.sentWhatsApp}</button>) : 0}</td>
                  <td className="p-3 text-center">{i.failed > 0 ? (<button type="button" title="Ver quem são" className="font-semibold text-accent underline" onClick={() => toggle(i.key, "falhou")}>{i.failed}</button>) : 0}</td>
                  <td className="p-3">
                    {(i.source === "newsletter" || i.source === "boletim") && (
                      <button type="button" className="mb-1 block text-accent underline" disabled={busy === `p-${i.key}`} onClick={() => openPreview(i)}>
                        {busy === `p-${i.key}` ? "Abrindo…" : "Visualizar"}
                      </button>
                    )}
                    {i.recipients.length > 0 ? (
                      <button type="button" className="text-accent underline" onClick={() => toggle(i.key, "all")}>
                        {open === i.key && filter === "all" ? "Ocultar" : `Ver ${i.recipients.length}`}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground" title="Detalhe individual indisponível para envios anteriores a 18/09/2026">Histórico anterior a 18/09</span>
                    )}
                  </td>
                </tr>
                {open === i.key && (
                  <tr className="bg-secondary/30">
                    <td colSpan={7} className="p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{FILTER_LABEL[filter]}</p>
                        {(i.source === "newsletter" || i.source === "boletim") && (
                          <button type="button" className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-60" disabled={busy === `all-${i.key}`}
                            onClick={() => resendAll(i, i.recipients.filter((r) => filter === "all" || (filter === "falhou" ? r.status === "falhou" : r.channel === filter && r.status === "enviado")))}>
                            {busy === `all-${i.key}` ? "Reenviando…" : "Reenviar para todos desta lista"}
                          </button>
                        )}
                      </div>
                      <div className="overflow-x-auto"><table className="w-full text-xs">
                        <thead className="text-left text-muted-foreground">
                          <tr><th className="p-2">Nome</th><th className="p-2">E-mail</th><th className="p-2">WhatsApp</th><th className="p-2">Forma</th><th className="p-2">Situação</th><th className="p-2">Horário</th><th className="p-2">Reenviar</th></tr>
                        </thead>
                        <tbody>
                          {i.recipients.filter((r) => filter === "all" || (filter === "falhou" ? r.status === "falhou" : r.channel === filter && r.status === "enviado")).length === 0 && (
                            <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">Nenhum destinatário registrado individualmente para este envio.{filter === "falhou" ? " Use o botão acima para reenviar aos inscritos ativos com WhatsApp." : ""}</td></tr>
                          )}
                          {i.recipients.filter((r) => filter === "all" || (filter === "falhou" ? r.status === "falhou" : r.channel === filter && r.status === "enviado")).map((r) => (
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
                      </table></div>
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
