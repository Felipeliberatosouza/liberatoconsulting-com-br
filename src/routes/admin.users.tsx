import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { PANEL_ROLES, ROLE_DESCRIPTION, ROLE_LABEL, type PanelRole } from "@/lib/roles";
import {
  createTeamMember,
  deleteApplicationRecord,
  deleteLeadRecord,
  deleteTeamMember,
  listTeam,
  updateApplicationRecord,
  updateLeadRecord,
  updateSubscriberRecord,
  updateTeamMember,
  type TeamRow,
} from "@/lib/users.functions";
import { listApplications, listLeads } from "@/lib/admin.functions";
import { listSubscribers } from "@/lib/newsletter.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Usuários — Painel Liberato Consulting" },
      { name: "description", content: "Cadastros de equipe, assinantes, candidatos e leads." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Usuários — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Cadastros de equipe, assinantes, candidatos e leads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsersPage,
});

type Tab = "team" | "subscribers" | "applicants" | "leads";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "team", label: "Equipe com acesso", hint: "Administradores, consultores e autores." },
  { id: "subscribers", label: "Assinantes da newsletter", hint: "Nome, e-mail e origem." },
  { id: "applicants", label: "Candidatos", hint: "Currículos do Trabalhe Conosco." },
  { id: "leads", label: "Leads", hint: "Contatos dos formulários do site." },
];

const emptyForm = {
  user_id: "",
  role: "consultor" as PanelRole,
  password: "",
  full_name: "",
  email: "",
  phone: "",
  birth_date: "",
  cpf: "",
  rg: "",
  nationality: "Brasileira",
  marital_status: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
  address_zip: "",
  address_country: "Brasil",
  bank_name: "",
  bank_branch: "",
  bank_account: "",
  pix_key: "",
  notes: "",
  email_opt_in: true,
  active: true,
};
type Form = typeof emptyForm;

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 ${input}`}
      />
    </label>
  );
}

function UsersPage() {
  const [tab, setTab] = useState<Tab>("team");

  return (
    <AdminShell
      title="Usuários"
      requireAdmin
      description="Todos os cadastros da plataforma. Somente equipe (administrador, consultor e autor de artigos) tem senha de acesso ao painel."
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === t.id ? "bg-ink text-ink-foreground" : "bg-background text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {TABS.find((t) => t.id === tab)?.hint}
      </p>

      <div className="mt-6">
        {tab === "team" && <TeamTab />}
        {tab === "subscribers" && <SubscribersTab />}
        {tab === "applicants" && <ApplicantsTab />}
        {tab === "leads" && <LeadsTab />}
      </div>
    </AdminShell>
  );
}

/* ------------------------------ equipe ------------------------------ */

function TeamTab() {
  const team = useQuery({ queryKey: ["admin-team"], queryFn: () => listTeam(), retry: false });
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const startEdit = (row: TeamRow) => {
    setEditing(true);
    setForm({
      ...emptyForm,
      ...(row as unknown as Partial<Form>),
      user_id: row.user_id,
      birth_date: row.birth_date ?? "",
      role: ((row.roles[0] as PanelRole) ?? "consultor") as PanelRole,
      password: "",
      email_opt_in: row.email_opt_in ?? true,
      active: row.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { user_id, password, ...rest } = form;
      const r = editing
        ? await updateTeamMember({
            data: { ...rest, user_id, ...(password ? { password } : {}) },
          })
        : await createTeamMember({ data: { ...rest, password } });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success(editing ? "Cadastro atualizado." : "Usuário criado.");
        setForm(emptyForm);
        setEditing(false);
        await team.refetch();
      }
    } catch {
      toast.error("Não foi possível salvar o cadastro.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">
          {editing ? "Editar membro da equipe" : "Novo cadastro com acesso"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_DESCRIPTION[form.role]}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Tipo de usuário
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className={`mt-1 ${input}`}
            >
              {PANEL_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <Field label="Nome completo" value={form.full_name} onChange={(v) => set("full_name", v)} required />
          <Field label="E-mail" type="email" value={form.email} onChange={(v) => set("email", v)} required />
          <Field
            label={editing ? "Nova senha (opcional)" : "Senha (mín. 8)"}
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
          />
          <Field label="Celular" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="Data de nascimento" type="date" value={form.birth_date} onChange={(v) => set("birth_date", v)} />
          <Field label="CPF" value={form.cpf} onChange={(v) => set("cpf", v)} />
          <Field label="RG" value={form.rg} onChange={(v) => set("rg", v)} />
          <Field label="Nacionalidade" value={form.nationality} onChange={(v) => set("nationality", v)} />
          <Field label="Estado civil" value={form.marital_status} onChange={(v) => set("marital_status", v)} />
          <Field label="Rua" value={form.address_street} onChange={(v) => set("address_street", v)} />
          <Field label="Número" value={form.address_number} onChange={(v) => set("address_number", v)} />
          <Field label="Complemento" value={form.address_complement} onChange={(v) => set("address_complement", v)} />
          <Field label="Bairro" value={form.address_district} onChange={(v) => set("address_district", v)} />
          <Field label="Cidade" value={form.address_city} onChange={(v) => set("address_city", v)} />
          <Field label="Estado" value={form.address_state} onChange={(v) => set("address_state", v)} />
          <Field label="CEP" value={form.address_zip} onChange={(v) => set("address_zip", v)} />
          <Field label="País" value={form.address_country} onChange={(v) => set("address_country", v)} />
          <Field label="Banco" value={form.bank_name} onChange={(v) => set("bank_name", v)} />
          <Field label="Agência" value={form.bank_branch} onChange={(v) => set("bank_branch", v)} />
          <Field label="Conta" value={form.bank_account} onChange={(v) => set("bank_account", v)} />
          <Field label="Chave PIX" value={form.pix_key} onChange={(v) => set("pix_key", v)} />
        </div>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          Observações para o contrato
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`mt-1 ${input}`}
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.email_opt_in}
              onChange={(e) => set("email_opt_in", e.target.checked)}
            />
            Autorizado a receber e-mails
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
            />
            Cadastro ativo
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Salvando…" : editing ? "Salvar alterações" : "Criar acesso"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setForm(emptyForm);
              }}
              className="text-sm text-muted-foreground hover:text-accent"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Contrato</th>
              <th className="px-4 py-3">E-mails</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(team.data ?? []).map((row) => (
              <tr key={row.user_id} className="border-t border-border">
                <td className="px-4 py-3">{row.full_name || "—"}</td>
                <td className="px-4 py-3">{row.email || "—"}</td>
                <td className="px-4 py-3">
                  {row.roles.map((r) => ROLE_LABEL[r as PanelRole] ?? r).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {row.signed_at ? new Date(row.signed_at).toLocaleDateString("pt-BR") : "pendente"}
                </td>
                <td className="px-4 py-3">{row.email_opt_in === false ? "não" : "sim"}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => startEdit(row)} className="text-accent hover:underline">
                    editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Excluir este acesso definitivamente?")) return;
                      const r = await deleteTeamMember({ data: { user_id: row.user_id } });
                      if (!r.ok) toast.error(r.error);
                      else {
                        toast.success("Usuário excluído.");
                        await team.refetch();
                      }
                    }}
                    className="ml-3 text-muted-foreground hover:text-destructive"
                  >
                    excluir
                  </button>
                </td>
              </tr>
            ))}
            {(team.data ?? []).length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Nenhum usuário com acesso cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* --------------------------- assinantes ----------------------------- */

function SubscribersTab() {
  const q = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: () => listSubscribers(),
    retry: false,
  });
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3">Situação</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-4 py-3">{s.name || "—"}</td>
              <td className="px-4 py-3">{s.email}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.source_path || "—"} {s.language ? `(${s.language})` : ""}
              </td>
              <td className="px-4 py-3">{s.status === "active" ? "ativo" : "cancelado"}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={async () => {
                    const r = await updateSubscriberRecord({
                      data: {
                        id: s.id,
                        status: s.status === "active" ? "unsubscribed" : "active",
                      },
                    });
                    if (!r.ok) toast.error(r.error);
                    else await q.refetch();
                  }}
                  className="text-accent hover:underline"
                >
                  {s.status === "active" ? "desativar envio" : "reativar envio"}
                </button>
              </td>
            </tr>
          ))}
          {(q.data ?? []).length === 0 && (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                Nenhum assinante.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------- candidatos ----------------------------- */

function ApplicantsTab() {
  const q = useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => listApplications(),
    retry: false,
  });
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Área</th>
            <th className="px-4 py-3">Recebido</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((a: Record<string, string | null>) => (
            <tr key={a["id"]} className="border-t border-border">
              <td className="px-4 py-3">{a["full_name"]}</td>
              <td className="px-4 py-3">{a["email"]}</td>
              <td className="px-4 py-3 text-muted-foreground">{a["interest_area"]}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(a["created_at"] ?? "").toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={async () => {
                    const r = await updateApplicationRecord({
                      data: { id: a["id"] as string, email_opt_in: false },
                    });
                    if (!r.ok) toast.error(r.error);
                    else toast.success("Envio de e-mails desativado.");
                  }}
                  className="text-accent hover:underline"
                >
                  não enviar e-mails
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Excluir esta candidatura?")) return;
                    const r = await deleteApplicationRecord({ data: { id: a["id"] as string } });
                    if (!r.ok) toast.error(r.error);
                    else {
                      toast.success("Candidatura excluída.");
                      await q.refetch();
                    }
                  }}
                  className="ml-3 text-muted-foreground hover:text-destructive"
                >
                  excluir
                </button>
              </td>
            </tr>
          ))}
          {(q.data ?? []).length === 0 && (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                Nenhuma candidatura.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ leads ------------------------------- */

function LeadsTab() {
  const q = useQuery({ queryKey: ["admin-leads"], queryFn: () => listLeads(), retry: false });
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Formulário preenchido</th>
            <th className="px-4 py-3">Recebido</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((l: Record<string, string | null>) => (
            <tr key={l["id"]} className="border-t border-border">
              <td className="px-4 py-3">{l["name"]}</td>
              <td className="px-4 py-3">{l["email"] || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {l["service_title"] || l["service_slug"]}
                <span className="block text-xs">{l["source_path"]}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(l["created_at"] ?? "").toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={async () => {
                    const r = await updateLeadRecord({
                      data: { id: l["id"] as string, email_opt_in: false },
                    });
                    if (!r.ok) toast.error(r.error);
                    else toast.success("Envio de e-mails desativado.");
                  }}
                  className="text-accent hover:underline"
                >
                  não enviar e-mails
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Excluir este lead?")) return;
                    const r = await deleteLeadRecord({ data: { id: l["id"] as string } });
                    if (!r.ok) toast.error(r.error);
                    else {
                      toast.success("Lead excluído.");
                      await q.refetch();
                    }
                  }}
                  className="ml-3 text-muted-foreground hover:text-destructive"
                >
                  excluir
                </button>
              </td>
            </tr>
          ))}
          {(q.data ?? []).length === 0 && (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                Nenhum lead recebido.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
