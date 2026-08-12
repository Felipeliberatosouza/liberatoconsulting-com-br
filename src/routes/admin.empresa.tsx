import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  getCompany,
  listContractTemplates,
  listSignatures,
  saveCompany,
  saveContractTemplate,
  type CompanyProfile,
  type Partner,
} from "@/lib/company.functions";
import { getSegments, saveSegments } from "@/lib/admin.functions";
import { DEFAULT_SEGMENTS } from "@/lib/audience-filters";

export const Route = createFileRoute("/admin/empresa")({
  head: () => ({
    meta: [
      { title: "Dados da consultoria — Painel Liberato Consulting" },
      { name: "description", content: "Razão social, CNPJ, sócios e contratos de trabalho." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Dados da consultoria — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Razão social, CNPJ, sócios e contratos de trabalho.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyPage,
});

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function CompanyPage() {
  const q = useQuery({ queryKey: ["company"], queryFn: () => getCompany(), retry: false });
  const [form, setForm] = useState<CompanyProfile | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.data) setForm(q.data);
  }, [q.data]);

  const set = (k: keyof CompanyProfile, v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  const setPartner = (i: number, patch: Partial<Partner>) =>
    setForm((f) =>
      f
        ? { ...f, partners: f.partners.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }
        : f,
    );

  if (!form) {
    return (
      <AdminShell title="Dados da consultoria" requireAdmin>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Dados da consultoria"
      requireAdmin
      description="Informações cadastrais usadas em contratos, PDFs da newsletter e documentos institucionais."
    >
      <form
        className="rounded-lg border border-border bg-background p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await saveCompany({ data: form });
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Dados da consultoria salvos.");
              await q.refetch();
            }
          } catch {
            toast.error("Não foi possível salvar.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <L label="Razão social"><input required value={form.legal_name} onChange={(e) => set("legal_name", e.target.value)} className={input} /></L>
          <L label="Nome fantasia"><input value={form.trade_name} onChange={(e) => set("trade_name", e.target.value)} className={input} /></L>
          <L label="CNPJ"><input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} className={input} /></L>
          <L label="Inscrição estadual"><input value={form.state_registration} onChange={(e) => set("state_registration", e.target.value)} className={input} /></L>
          <L label="Inscrição municipal"><input value={form.municipal_registration} onChange={(e) => set("municipal_registration", e.target.value)} className={input} /></L>
          <L label="Data de fundação"><input type="date" value={form.founded_on ?? ""} onChange={(e) => set("founded_on", e.target.value)} className={input} /></L>
          <L label="Rua"><input value={form.address_street} onChange={(e) => set("address_street", e.target.value)} className={input} /></L>
          <L label="Número"><input value={form.address_number} onChange={(e) => set("address_number", e.target.value)} className={input} /></L>
          <L label="Complemento"><input value={form.address_complement} onChange={(e) => set("address_complement", e.target.value)} className={input} /></L>
          <L label="Bairro"><input value={form.address_district} onChange={(e) => set("address_district", e.target.value)} className={input} /></L>
          <L label="Cidade"><input value={form.address_city} onChange={(e) => set("address_city", e.target.value)} className={input} /></L>
          <L label="Estado"><input value={form.address_state} onChange={(e) => set("address_state", e.target.value)} className={input} /></L>
          <L label="CEP"><input value={form.address_zip} onChange={(e) => set("address_zip", e.target.value)} className={input} /></L>
          <L label="País"><input value={form.address_country} onChange={(e) => set("address_country", e.target.value)} className={input} /></L>
          <L label="E-mail institucional"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={input} /></L>
          <L label="Telefone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} className={input} /></L>
          <L label="Site"><input value={form.website} onChange={(e) => set("website", e.target.value)} className={input} /></L>
        </div>

        <h2 className="mt-8 font-display text-lg font-bold">Sócios</h2>
        <div className="mt-3 space-y-3">
          {form.partners.map((p, i) => (
            <div key={i} className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
              <input
                value={p.name}
                onChange={(e) => setPartner(i, { name: e.target.value })}
                placeholder="Nome"
                className={input}
              />
              <input
                value={p.cpf}
                onChange={(e) => setPartner(i, { cpf: e.target.value })}
                placeholder="CPF"
                className={input}
              />
              <input
                value={p.share}
                onChange={(e) => setPartner(i, { share: e.target.value })}
                placeholder="Cota (%)"
                className={input}
              />
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, partners: form.partners.filter((_, idx) => idx !== i) })
                }
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm({ ...form, partners: [...form.partners, { name: "", cpf: "", share: "" }] })
            }
            className="text-sm text-accent hover:underline"
          >
            + adicionar sócio
          </button>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-8 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar dados da consultoria"}
        </button>
      </form>

      <SegmentsBlock />

      <ContractsBlock />
    </AdminShell>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function SegmentsBlock() {
  const q = useQuery({ queryKey: ["segments"], queryFn: () => getSegments(), retry: false });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    const list = q.data.segments.length > 0 ? q.data.segments : DEFAULT_SEGMENTS;
    setText(list.join("\n"));
  }, [q.data]);

  return (
    <div className="mt-10 rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-lg font-bold">Segmentos atendidos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Um segmento por linha. Eles aparecem na barra de personalização abaixo do cabeçalho do
        site, sempre com a opção “Geral” como primeira escolha.
      </p>
      <textarea
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`mt-4 ${input}`}
        placeholder={"Agronegócio\nEnergia e renováveis\n…"}
      />
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const segments = text
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            const r = await saveSegments({ data: { segments } });
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Segmentos salvos.");
              await q.refetch();
            }
          } catch {
            toast.error("Não foi possível salvar os segmentos.");
          } finally {
            setBusy(false);
          }
        }}
        className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
      >
        {busy ? "Salvando…" : "Salvar segmentos"}
      </button>
    </div>
  );
}

function ContractsBlock() {
  const templates = useQuery({
    queryKey: ["contract-templates"],
    queryFn: () => listContractTemplates(),
    retry: false,
  });
  const signatures = useQuery({
    queryKey: ["contract-signatures"],
    queryFn: () => listSignatures(),
    retry: false,
  });
  const [audience, setAudience] = useState<"autor" | "consultor">("consultor");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [bump, setBump] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const tpl = (templates.data ?? []).find((t) => t.audience === audience);
    setTitle(tpl?.title ?? `Contrato de prestação de serviços — ${audience}`);
    setBody(tpl?.body ?? "");
  }, [audience, templates.data]);

  return (
    <div className="mt-10 rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-lg font-bold">Contratos de vínculo de trabalho</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Este texto aparece para consultores e autores assinarem digitalmente no primeiro acesso.
        Sem a assinatura, eles não conseguem usar o sistema.
      </p>

      <div className="mt-4 flex gap-2">
        {(["consultor", "autor"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAudience(a)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              audience === a ? "bg-ink text-ink-foreground" : "text-muted-foreground"
            }`}
          >
            {a === "consultor" ? "Consultores" : "Autores"}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`mt-4 ${input}`}
        placeholder="Título do contrato"
      />
      <textarea
        rows={14}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className={`mt-3 ${input} font-mono text-xs`}
        placeholder="Texto integral do contrato…"
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={bump} onChange={(e) => setBump(e.target.checked)} />
        Nova versão — exigir que todos assinem novamente
      </label>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await saveContractTemplate({
              data: { audience, title, body, bumpVersion: bump },
            });
            if (!r.ok) toast.error(r.error);
            else {
              toast.success("Contrato salvo.");
              setBump(false);
              await templates.refetch();
            }
          } catch {
            toast.error("Não foi possível salvar o contrato.");
          } finally {
            setBusy(false);
          }
        }}
        className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
      >
        {busy ? "Salvando…" : "Salvar contrato"}
      </button>

      <h3 className="mt-8 font-display font-bold">Assinaturas registradas</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2">Nome</th>
              <th className="py-2">CPF</th>
              <th className="py-2">Perfil</th>
              <th className="py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {(signatures.data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="py-2">{s.signer_name}</td>
                <td className="py-2">{s.signer_cpf}</td>
                <td className="py-2">{s.audience}</td>
                <td className="py-2 text-muted-foreground">
                  {new Date(s.signed_at).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
            {(signatures.data ?? []).length === 0 && (
              <tr>
                <td className="py-4 text-muted-foreground" colSpan={4}>
                  Nenhuma assinatura ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
