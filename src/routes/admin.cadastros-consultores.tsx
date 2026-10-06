import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { ConsultantOnboardingForm, onboardingMissing } from "@/components/ConsultantOnboardingForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ONBOARDING_STATUS_LABEL, type OnboardingData } from "@/lib/onboarding-fields";
import { approveOnboarding, listOnboardings, rejectOnboarding, saveOnboarding, type OnboardingRow } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/admin/cadastros-consultores")({
  head: () => ({
    meta: [
      { title: "Cadastros de consultores — Painel Liberato" },
      { name: "description", content: "Revise e aprove os cadastros enviados por novos consultores." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Cadastros de consultores — Painel Liberato" },
      { property: "og:description", content: "Revise e aprove os cadastros enviados por novos consultores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingAdmin,
});

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—");
const clean = (v: OnboardingData): OnboardingData => ({
  ...v,
  specialties: v.specialties.filter(Boolean),
  segments: v.segments.filter(Boolean),
  certifications: v.certifications.filter(Boolean),
  highlights: v.highlights.filter(Boolean),
});

function OnboardingAdmin() {
  const qc = useQueryClient();
  const rows = useQuery({ queryKey: ["onboardings"], queryFn: () => listOnboardings(), retry: false });
  const [open, setOpen] = useState<OnboardingRow | null>(null);
  const [form, setForm] = useState<OnboardingData | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const pick = (r: OnboardingRow) => {
    setOpen(r);
    setForm({ ...r.payload, full_name: r.payload.full_name || r.full_name, email: r.payload.email || r.email, phone: r.payload.phone || r.phone });
    setNote(r.review_note ?? "");
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["onboardings"] });

  async function run(kind: "save" | "approve" | "reject") {
    if (!open || !form) return;
    setBusy(kind);
    try {
      const r =
        kind === "save"
          ? await saveOnboarding({ data: { id: open.id, data: clean(form), review_note: note } })
          : kind === "approve"
            ? await approveOnboarding({ data: { id: open.id, data: clean(form), review_note: note } })
            : await rejectOnboarding({ data: { id: open.id, review_note: note } });
      if (!r.ok) toast.error(r.error);
      else {
        const w = "warning" in r ? String(r.warning ?? "") : "";
        toast.success(kind === "approve" ? "Cadastro aprovado e contrato enviado." : kind === "reject" ? "Cadastro recusado." : "Alterações salvas.");
        if (w) toast.warning(w);
        await refresh();
        if (kind !== "save") setOpen(null);
      }
    } catch (e) {
      toast.error((e as Error).message || "Falha na operação.");
    } finally {
      setBusy("");
    }
  }

  const missing = form ? onboardingMissing(form) : [];

  return (
    <AdminShell
      title="Cadastros de consultores"
      description="Formulários enviados pelos candidatos aprovados em Candidaturas. Revise, edite e aprove para criar o consultor e enviar o contrato."
      requireAdmin
    >
      {!open ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Link enviado</th>
                <th className="px-4 py-3">Cadastro recebido</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(rows.data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{r.full_name}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(r.sent_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(r.submitted_at)}</td>
                  <td className="px-4 py-3">{ONBOARDING_STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status !== "sent" ? (
                      <Button size="sm" variant="outline" onClick={() => pick(r)}>
                        Abrir
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aguardando preenchimento</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Nenhum cadastro ainda. Use "Aprovar e enviar link" em Candidaturas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        form && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => setOpen(null)}>
                Voltar
              </Button>
              <span className="text-sm text-muted-foreground">
                Status: {ONBOARDING_STATUS_LABEL[open.status] ?? open.status} · Recebido em {fmt(open.submitted_at)}
              </span>
            </div>
            <ConsultantOnboardingForm value={form} onChange={setForm} />
            <div className="space-y-1.5">
              <Label htmlFor="note">Observação interna</Label>
              <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" disabled={!!busy} onClick={() => run("save")}>
                {busy === "save" ? "Salvando…" : "Salvar alterações"}
              </Button>
              {open.status !== "approved" ? (
                <>
                  <Button disabled={!!busy || missing.length > 0} onClick={() => run("approve")}>
                    {busy === "approve" ? "Aprovando…" : "Aprovar cadastro e enviar contrato"}
                  </Button>
                  <Button variant="destructive" disabled={!!busy} onClick={() => run("reject")}>
                    Recusar
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Aprovado em {fmt(open.approved_at)}. Após receber o contrato assinado, anexe-o em Usuários para liberar o acesso, e publique o perfil em Consultores.
                </span>
              )}
              {missing.length > 0 ? <span className="text-sm text-destructive">Falta: {missing.join(", ")}</span> : null}
            </div>
          </div>
        )
      )}
    </AdminShell>
  );
}
