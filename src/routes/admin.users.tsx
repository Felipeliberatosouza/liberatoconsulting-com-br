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
import {
  getSignedContractUrl,
  resendContractEmail,
  uploadSignedContract,
} from "@/lib/users.functions";
import {
  formatCep,
  formatCpf,
  formatPhone,
  isValidCep,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  passwordRules,
} from "@/lib/validation";
import { getResumeUrl, listApplications, listLeads } from "@/lib/admin.functions";
import { listSubscribers } from "@/lib/newsletter.functions";
import {
  listBulletinSubscribers,
  unsubscribeBulletinByAdmin,
} from "@/lib/bulletin.functions";

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

type Tab = "team" | "subscribers" | "bulletin" | "applicants" | "leads";

const TABS: Array<{ id: Tab; label: string; hint: string }> = [
  { id: "team", label: "Equipe com acesso", hint: "Administradores, consultores e autores." },
  { id: "subscribers", label: "Assinantes da newsletter", hint: "Nome, e-mail e origem." },
  {
    id: "bulletin",
    label: "Assinantes do Boletim Semanal",
    hint: "Nome, empresa, segmento, e-mail, WhatsApp, canais e situação.",
  },
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
  address_zip: "",
  address_street: "",
  address_number: "",
  address_complement: "",
  address_district: "",
  address_city: "",
  address_state: "",
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
  error,
  valid,
  hint,
  onBlur,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string | undefined;
  valid?: boolean | undefined;
  hint?: string | undefined;
  onBlur?: (() => void) | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      {required && <span className="ml-0.5 text-destructive">*</span>}
      <input
        type={type}
        required={required}
        value={value}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 ${input} ${
          error ? "border-destructive" : valid ? "border-emerald-500" : ""
        } ${disabled ? "opacity-70" : ""}`}
      />
      {error ? (
        <span className="mt-1 block text-[11px] font-normal text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] font-normal text-muted-foreground">{hint}</span>
      ) : null}
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
        {tab === "bulletin" && <BulletinTab />}
        {tab === "applicants" && <ApplicantsTab />}
        {tab === "leads" && <LeadsTab />}
      </div>
    </AdminShell>
  );
}

/* ------------------------------ equipe ------------------------------ */

function contractStatus(row: TeamRow) {
  const needs = row.roles.some((r) => r === "consultor" || r === "autor");
  if (!needs) return { needs, ok: true, label: "não se aplica" };
  const ok = Boolean(row.contract_uploaded_at);
  return {
    needs,
    ok,
    label: ok
      ? `válido em ${new Date(row.contract_uploaded_at as string).toLocaleDateString("pt-BR")}`
      : "contrato pendente",
  };
}

function ContractCell({ row, onDone }: { row: TeamRow; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const status = contractStatus(row);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("erro"));
        reader.readAsDataURL(file);
      });
      const r = await uploadSignedContract({
        data: {
          user_id: row.user_id,
          file_name: file.name,
          content_type: file.type || "application/pdf",
          file_base64: base64,
        },
      });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Contrato assinado registrado. Acesso liberado.");
        onDone();
      }
    } catch {
      toast.error("Não foi possível enviar o contrato.");
    } finally {
      setBusy(false);
    }
  };

  if (!status.needs) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-1">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
          status.ok ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"
        }`}
      >
        {status.ok ? "contrato válido" : "contrato pendente"}
      </span>
      {status.ok && row.contract_file_path && (
        <button
          className="block text-xs text-accent hover:underline"
          onClick={async () => {
            const r = await getSignedContractUrl({ data: { path: row.contract_file_path! } });
            if (r.ok) window.open(r.url, "_blank", "noopener");
            else toast.error(r.error);
          }}
        >
          ver documento
        </button>
      )}
      <label className="block cursor-pointer text-xs text-muted-foreground hover:text-accent">
        {busy ? "enviando…" : status.ok ? "substituir arquivo" : "enviar contrato assinado"}
        <input
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </label>
      {!status.ok && (
        <button
          className="block text-xs text-muted-foreground hover:text-accent"
          onClick={async () => {
            const r = await resendContractEmail({ data: { user_id: row.user_id } });
            if (r.ok) toast.success("Contrato reenviado por e-mail.");
            else toast.error(r.error);
          }}
        >
          reenviar por e-mail
        </button>
      )}
    </div>
  );
}

function TeamTab() {
  const team = useQuery({ queryKey: ["admin-team"], queryFn: () => listTeam(), retry: false });
  const [form, setForm] = useState<Form>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cepBusy, setCepBusy] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const rules = passwordRules(form.password, {
    fullName: form.full_name,
    email: form.email,
    birthDate: form.birth_date,
    cpf: form.cpf,
  });
  const passwordOk = rules.every((r) => r.ok);
  const emailOk = isValidEmail(form.email);
  const cpfOk = isValidCpf(form.cpf);
  const phoneOk = !form.phone || isValidPhone(form.phone);
  const cepOk = isValidCep(form.address_zip);

  const lookupCep = async () => {
    const digits = form.address_zip.replace(/\D+/g, "");
    if (digits.length !== 8) return;
    setCepBusy(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as Record<string, string> & { erro?: boolean };
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((f) => ({
        ...f,
        address_street: data["logradouro"] || f.address_street,
        address_district: data["bairro"] || f.address_district,
        address_city: data["localidade"] || f.address_city,
        address_state: data["uf"] || f.address_state,
        address_country: f.address_country || "Brasil",
      }));
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setCepBusy(false);
    }
  };

  const startEdit = (row: TeamRow) => {
    setEditing(true);
    setForm({
      ...emptyForm,
      ...(row as unknown as Partial<Form>),
      user_id: row.user_id,
      birth_date: row.birth_date ?? "",
      phone: formatPhone(row.phone ?? ""),
      cpf: formatCpf(row.cpf ?? ""),
      address_zip: formatCep(row.address_zip ?? ""),
      role: ((row.roles[0] as PanelRole) ?? "consultor") as PanelRole,
      password: "",
      email_opt_in: row.email_opt_in ?? true,
      active: row.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOk) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (!cpfOk) {
      toast.error("Informe um CPF válido.");
      return;
    }
    if (!phoneOk) {
      toast.error("Informe o celular no formato (11) 91234-5678.");
      return;
    }
    if (!cepOk) {
      toast.error("Informe um CEP válido.");
      return;
    }
    if ((!editing || form.password) && !passwordOk) {
      toast.error("A senha não atende às regras de segurança.");
      return;
    }
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
        const created = r as { needsContract?: boolean; contractWarning?: string };
        if (!editing && created.needsContract) {
          if (created.contractWarning) toast.error(created.contractWarning);
          else
            toast.success(
              "Usuário criado e contrato enviado por e-mail. O acesso será liberado após o upload do contrato assinado.",
            );
        } else {
          toast.success(editing ? "Cadastro atualizado." : "Usuário criado.");
        }
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
        <p className="mt-1 text-sm text-muted-foreground">{ROLE_DESCRIPTION[form.role]}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Campos com <span className="text-destructive">*</span> são obrigatórios.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Tipo de usuário<span className="ml-0.5 text-destructive">*</span>
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
          <Field
            label="Nome completo"
            value={form.full_name}
            onChange={(v) => set("full_name", v)}
            required
          />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(v) => set("email", v)}
            required
            valid={emailOk}
            error={form.email && !emailOk ? "E-mail inválido." : undefined}
          />
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(v) => set("cpf", formatCpf(v))}
            required
            valid={cpfOk}
            error={form.cpf && !cpfOk ? "CPF inválido." : undefined}
            hint="000.000.000-00"
          />
          <Field
            label="Data de nascimento"
            type="date"
            value={form.birth_date}
            onChange={(v) => set("birth_date", v)}
            required
          />
          <Field
            label="Celular"
            value={form.phone}
            onChange={(v) => set("phone", formatPhone(v))}
            valid={Boolean(form.phone) && phoneOk}
            error={form.phone && !phoneOk ? "Celular inválido." : undefined}
            hint="(11) 91234-5678"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              {editing ? "Nova senha (opcional)" : "Senha"}
              {!editing && <span className="ml-0.5 text-destructive">*</span>}
              <span className="relative mt-1 block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={`${input} pr-16 ${
                    form.password ? (passwordOk ? "border-emerald-500" : "border-destructive") : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-accent"
                >
                  {showPassword ? "ocultar" : "ver"}
                </button>
              </span>
            </label>
            <ul className="mt-2 space-y-1">
              {rules.map((r) => (
                <li
                  key={r.id}
                  className={`flex items-start gap-2 text-[11px] ${
                    r.ok ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  <span>{r.ok ? "✓" : "•"}</span>
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <Field label="RG" value={form.rg} onChange={(v) => set("rg", v)} />
          <Field
            label="Nacionalidade"
            value={form.nationality}
            onChange={(v) => set("nationality", v)}
          />
          <Field
            label="Estado civil"
            value={form.marital_status}
            onChange={(v) => set("marital_status", v)}
          />
        </div>

        <h3 className="mt-6 text-sm font-semibold">Endereço</h3>
        <div className="mt-2 grid gap-4 md:grid-cols-3">
          <Field
            label="CEP"
            value={form.address_zip}
            onChange={(v) => set("address_zip", formatCep(v))}
            onBlur={() => void lookupCep()}
            required
            valid={cepOk}
            error={form.address_zip && !cepOk ? "CEP inválido." : undefined}
            hint={cepBusy ? "buscando endereço…" : "00000-000 — preenche o endereço automaticamente"}
          />
          <Field label="Rua" value={form.address_street} onChange={(v) => set("address_street", v)} />
          <Field
            label="Número"
            value={form.address_number}
            onChange={(v) => set("address_number", v)}
            required
          />
          <Field
            label="Complemento"
            value={form.address_complement}
            onChange={(v) => set("address_complement", v)}
          />
          <Field
            label="Bairro"
            value={form.address_district}
            onChange={(v) => set("address_district", v)}
          />
          <Field label="Cidade" value={form.address_city} onChange={(v) => set("address_city", v)} />
          <Field label="Estado" value={form.address_state} onChange={(v) => set("address_state", v)} />
          <Field
            label="País"
            value={form.address_country}
            onChange={(v) => set("address_country", v)}
          />
        </div>

        <h3 className="mt-6 text-sm font-semibold">Dados bancários</h3>
        <div className="mt-2 grid gap-4 md:grid-cols-3">
          <Field label="Banco" value={form.bank_name} onChange={(v) => set("bank_name", v)} required />
          <Field
            label="Agência"
            value={form.bank_branch}
            onChange={(v) => set("bank_branch", v)}
            required
          />
          <Field
            label="Conta"
            value={form.bank_account}
            onChange={(v) => set("bank_account", v)}
            required
          />
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

        {(form.role === "consultor" || form.role === "autor") && (
          <p className="mt-4 rounded-md bg-secondary/60 px-4 py-3 text-xs text-muted-foreground">
            Ao criar o cadastro, o contrato é enviado automaticamente por e-mail. O acesso ao painel
            só é liberado depois que o contrato assinado for enviado na lista abaixo.
          </p>
        )}

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
              <tr key={row.user_id} className="border-t border-border align-top">
                <td className="px-4 py-3">{row.full_name || "—"}</td>
                <td className="px-4 py-3">{row.email || "—"}</td>
                <td className="px-4 py-3">
                  {row.roles.map((r) => ROLE_LABEL[r as PanelRole] ?? r).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <ContractCell row={row} onDone={() => void team.refetch()} />
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

/* ------------------ assinantes do boletim semanal -------------------- */

function BulletinTab() {
  const q = useQuery({
    queryKey: ["admin-bulletin-subscribers"],
    queryFn: () => listBulletinSubscribers(),
    retry: false,
  });
  const rows = q.data ?? [];
  const active = rows.filter((r) => r.status === "active").length;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
        {active} ativos · {rows.length - active} cancelados
      </p>
      <table className="w-full min-w-[1000px] text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome completo</th>
            <th className="px-4 py-3">Empresa / instituição</th>
            <th className="px-4 py-3">Segmento</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">WhatsApp</th>
            <th className="px-4 py-3">Canais</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3">Cadastro</th>
            <th className="px-4 py-3">Situação</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border align-top">
              <td className="px-4 py-3">{r.full_name || "—"}</td>
              <td className="px-4 py-3">{r.company || "—"}</td>
              <td className="px-4 py-3">{r.segment || "—"}</td>
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
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {[r.via_email ? "E-mail" : null, r.via_whatsapp ? "WhatsApp" : null]
                  .filter(Boolean)
                  .join(" + ") || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{r.source_path || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-3">
                {r.status === "active"
                  ? "ativo"
                  : `cancelado${
                      r.unsubscribed_at
                        ? ` em ${new Date(r.unsubscribed_at).toLocaleDateString("pt-BR")}`
                        : ""
                    }`}
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === "active" && (
                  <button
                    onClick={async () => {
                      const res = await unsubscribeBulletinByAdmin({ data: { id: r.id } });
                      if (!res.ok) toast.error(res.error);
                      else toast.success("Envio interrompido para este cadastro.");
                      await q.refetch();
                    }}
                    className="text-destructive hover:underline"
                  >
                    interromper envio
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={10}>
                Nenhum assinante do Boletim Semanal.
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

  async function openResume(path: string) {
    try {
      const r = await getResumeUrl({ data: { path } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      window.open(r.url, "_blank", "noopener");
    } catch {
      toast.error("Não foi possível abrir o currículo.");
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">E-mail</th>
            <th className="px-4 py-3">Celular</th>
            <th className="px-4 py-3">Área</th>
            <th className="px-4 py-3">Currículo</th>
            <th className="px-4 py-3">Recebido</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {(q.data ?? []).map((a: Record<string, string | null>) => (
            <tr key={a["id"]} className="border-t border-border">
              <td className="px-4 py-3">{a["full_name"]}</td>
              <td className="px-4 py-3">
                <a href={`mailto:${a["email"]}`} className="text-accent hover:underline">
                  {a["email"]}
                </a>
              </td>
              <td className="px-4 py-3">
                {a["phone"] ? (
                  <a href={`tel:${a["phone"]}`} className="hover:underline">
                    {a["phone"]}
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{a["interest_area"]}</td>
              <td className="px-4 py-3">
                {a["resume_path"] ? (
                  <button
                    onClick={() => openResume(a["resume_path"] as string)}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                  >
                    {a["resume_filename"] ?? "Baixar"}
                  </button>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
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
              <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
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
