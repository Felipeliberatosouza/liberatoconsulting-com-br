import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import {
  deletePerson,
  getPersonDetails,
  inviteToService,
  removeFromService,
  resendConsentInvite,
  SERVICE_LABEL,
} from "@/lib/people.functions";

type Basic = { name: string; email: string; phone: string; company: string };

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const yes = (b: unknown) => (b ? "Sim" : "Não");

const STATUS: Record<string, string> = {
  pending: "Aguardando aprovação do usuário",
  approved: "Aprovado pelo usuário",
  revoked: "Cancelado",
  superseded: "Substituído por novo convite",
};

function Row({ k, v }: { k: string; v: unknown }) {
  const s = v === null || v === undefined || v === "" ? "—" : String(v);
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 border-b border-border/60 py-1 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="break-words">{s}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h3 className="pt-3 text-xs font-semibold uppercase tracking-wide text-accent">{title}</h3>
      {children}
    </section>
  );
}

export function PersonPanel({ person, onClose }: { person: Basic; onClose: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["person", person.email],
    queryFn: () => getPersonDetails({ data: { email: person.email } }),
    enabled: !!person.email,
  });
  const d = q.data;
  const [inv, setInv] = useState<null | "newsletter" | "bulletin">(null);
  const [form, setForm] = useState({ phone: person.phone, segment: "", via_email: true, via_whatsapp: false });
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    q.refetch();
    qc.invalidateQueries({ queryKey: ["all-subs"] });
    qc.invalidateQueries({ queryKey: ["all-bull"] });
  };

  const tool = d?.tools[0];
  const scope = d?.scopes[0];
  const nl = d?.newsletter[0];
  const bl = d?.bulletin[0];
  const pending = (s: string) => d?.consents.find((c: any) => c.service === s && c.status === "pending");
  const approvedConsent = (s: string) => d?.consents.find((c: any) => c.service === s && c.status === "approved");

  async function sendInvite() {
    if (!inv) return;
    setBusy(true);
    try {
      const r = await inviteToService({
        data: {
          service: inv,
          email: person.email,
          full_name: person.name,
          phone: form.phone,
          company: person.company,
          segment: form.segment || bl?.segment || tool?.segment || "",
          via_email: form.via_email,
          via_whatsapp: form.via_whatsapp,
        },
      });
      if (!r.ok) toast.error(r.error);
      else {
        const parts = [
          r.emailStatus && `e-mail ${r.emailStatus === "sent" ? "enviado" : "falhou"}`,
          r.waStatus && `WhatsApp ${r.waStatus === "sent" ? "enviado" : "falhou"}`,
        ].filter(Boolean);
        toast.success(`Pedido de autorização criado (${parts.join(", ")}).`);
        setInv(null);
        refresh();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar convite.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(service: "newsletter" | "bulletin") {
    if (!confirm(`Remover ${person.email} do serviço ${SERVICE_LABEL[service]}?`)) return;
    await removeFromService({ data: { email: person.email, service } });
    toast.success("Serviço removido.");
    refresh();
  }

  async function removeAll() {
    if (!confirm(`Excluir ${person.email} de TODOS os cadastros do site? Esta ação não pode ser desfeita.`)) return;
    const r = await deletePerson({ data: { email: person.email } });
    if (!r.ok) return toast.error(r.error);
    toast.success("Usuário excluído.");
    qc.invalidateQueries();
    onClose();
  }

  function ServiceBox({ s, active }: { s: "newsletter" | "bulletin"; active: any }) {
    const p = pending(s);
    const a = approvedConsent(s);
    return (
      <div className="rounded-md border border-border p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <strong>{SERVICE_LABEL[s]}</strong>
          {active ? (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              Ativo {a ? "· autorizado via convite do Adm" : "· cadastro feito pelo próprio usuário"}
            </span>
          ) : p ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Inserido pelo Adm · aguardando aprovação</span>
          ) : (
            <span className="text-xs text-muted-foreground">Não recebe</span>
          )}
        </div>
        {active && (
          <p className="mt-1 text-xs text-muted-foreground">
            Status: {active.status} · E-mail: {yes(s === "newsletter" ? true : active.via_email)} · WhatsApp:{" "}
            {yes(active.via_whatsapp)} · Desde {fmt(active.created_at)}
          </p>
        )}
        {p && (
          <p className="mt-1 text-xs text-muted-foreground">
            Autorização do usuário: <strong>não concedida</strong>. Nenhum envio será feito até a aprovação. Convite em{" "}
            {fmt(p.invited_at)}.
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          {!active && !p && (
            <button className="text-xs font-medium text-accent hover:underline" onClick={() => setInv(s)}>
              + Incluir (enviar pedido de autorização)
            </button>
          )}
          {p && (
            <button
              className="text-xs font-medium text-accent hover:underline"
              onClick={async () => {
                const r = await resendConsentInvite({ data: { id: p.id } });
                if (r.ok) toast.success("Convite reenviado.");
                else toast.error(r.error);
                refresh();
              }}
            >
              Reenviar convite
            </button>
          )}
          {(active || p) && (
            <button className="text-xs font-medium text-destructive hover:underline" onClick={() => remove(s)}>
              Remover serviço
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30" onClick={onClose}>
      <aside
        className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">{person.name || person.email}</h2>
            <p className="text-sm text-muted-foreground">{person.email}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-2xl leading-none text-muted-foreground">
            ×
          </button>
        </div>

        {!person.email && <p className="mt-4 text-sm">Cadastro sem e-mail: gerencie pela aba de origem.</p>}
        {q.isLoading && <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>}
        {q.isError && <p className="mt-4 text-sm text-destructive">Acesso restrito a administradores.</p>}

        {d && (
          <div className="space-y-2">
            <Section title="Dados pessoais e da empresa">
              <Row k="Nome" v={person.name} />
              <Row k="Telefone / WhatsApp" v={person.phone || bl?.whatsapp || nl?.whatsapp} />
              <Row k="Empresa" v={person.company || tool?.company || bl?.company || scope?.company} />
              <Row k="Cargo" v={tool?.job_title || scope?.respondent_role} />
              <Row k="Faturamento da empresa" v={tool?.revenue_range} />
              <Row k="Número de funcionários" v={scope?.employees} />
              <Row k="Segmento" v={tool?.segment || bl?.segment} />
              <Row k="Estado (UF)" v={tool?.state} />
              <Row k="País" v={d.leads[0]?.country} />
            </Section>

            <Section title="Permissões de envio informadas pelo usuário">
              <Row k="Newsletter (ferramentas)" v={tool ? yes(tool.receive_newsletter) : "—"} />
              <Row k="Boletim (ferramentas)" v={tool ? yes(tool.receive_bulletin) : "—"} />
              <Row k="Insights (ferramentas)" v={tool ? yes(tool.receive_insights) : "—"} />
              <Row k="Aceite de contato (lead)" v={d.leads.length ? yes(d.leads.some((l: any) => l.email_opt_in)) : "—"} />
              <Row
                k="Aceite de e-mails (candidatura)"
                v={d.applications.length ? yes(d.applications.some((a: any) => a.email_opt_in)) : "—"}
              />
            </Section>

            <Section title="Serviços de envio">
              <div className="space-y-2">
                <ServiceBox s="newsletter" active={nl?.status === "active" ? nl : null} />
                <ServiceBox s="bulletin" active={bl?.status === "active" ? bl : null} />
              </div>
              {inv && (
                <div className="mt-2 space-y-2 rounded-md border border-accent/50 p-3 text-sm">
                  <p>
                    Incluir em <strong>{SERVICE_LABEL[inv]}</strong>. O usuário receberá um link para aprovar; nada
                    será enviado antes disso.
                  </p>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.via_email} onChange={(e) => setForm({ ...form, via_email: e.target.checked })} />
                    Por e-mail
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.via_whatsapp}
                      onChange={(e) => setForm({ ...form, via_whatsapp: e.target.checked })}
                    />
                    Por WhatsApp
                  </label>
                  {form.via_whatsapp && (
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="WhatsApp com DDD"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  )}
                  {inv === "bulletin" && (
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      placeholder="Segmento (opcional)"
                      value={form.segment}
                      onChange={(e) => setForm({ ...form, segment: e.target.value })}
                    />
                  )}
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={sendInvite}
                      className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground disabled:opacity-60"
                    >
                      {busy ? "Enviando…" : "Enviar pedido de autorização"}
                    </button>
                    <button onClick={() => setInv(null)} className="rounded-md border border-border px-3 py-1.5">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </Section>

            <Section title="Histórico de autorizações (LGPD)">
              {d.consents.length === 0 && <p className="text-sm text-muted-foreground">Nenhum convite enviado pelo Adm.</p>}
              {d.consents.map((c: any) => (
                <div key={c.id} className="rounded-md border border-border p-3 text-xs">
                  <strong>{SERVICE_LABEL[c.service]}</strong> — {STATUS[c.status] ?? c.status}
                  <div className="mt-1 grid gap-0.5 text-muted-foreground">
                    <span>
                      Convite por {c.invited_by_name || "Adm"} em {fmt(c.invited_at)} · e-mail:{" "}
                      {c.invite_email_status || "—"} · WhatsApp: {c.invite_whatsapp_status || "—"}
                    </span>
                    {c.approved_at && (
                      <>
                        <span>Aprovado em: {fmt(c.approved_at)}</span>
                        <span>IP: {c.approved_ip || "—"}</span>
                        <span>Aparelho/navegador: {c.approved_user_agent || "—"}</span>
                      </>
                    )}
                    {c.revoked_at && <span>Cancelado em: {fmt(c.revoked_at)}</span>}
                  </div>
                </div>
              ))}
            </Section>

            {d.scopes.length > 0 && (
              <Section title="Escopos iniciais enviados">
                {d.scopes.map((s: any) => (
                  <Row key={s.id} k={fmt(s.created_at)} v={`${s.company} · ${s.respondent_role || ""} · ${s.employees || "—"} funcionários`} />
                ))}
              </Section>
            )}
            {d.leads.length > 0 && (
              <Section title="Contatos pelo site (leads)">
                {d.leads.map((l: any) => (
                  <Row key={l.id} k={fmt(l.created_at)} v={`${l.service_title || l.service_slug}: ${l.message || ""}`} />
                ))}
              </Section>
            )}
            {d.applications.length > 0 && (
              <Section title="Candidaturas">
                {d.applications.map((a: any) => (
                  <Row key={a.id} k={fmt(a.created_at)} v={a.interest_area} />
                ))}
              </Section>
            )}

            <div className="pt-6">
              <button
                onClick={removeAll}
                className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                Excluir usuário de todos os cadastros
              </button>
              {d.team.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Esta pessoa tem acesso ao painel: remova-a primeiro na aba Equipe com acesso.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
