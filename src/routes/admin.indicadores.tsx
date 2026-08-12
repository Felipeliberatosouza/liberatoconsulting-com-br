import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  deleteIndicator,
  listIndicators,
  refreshIndicatorsAI,
  saveIndicator,
  type Indicator,
} from "@/lib/indicators.functions";

export const Route = createFileRoute("/admin/indicadores")({
  head: () => ({
    meta: [
      { title: "Indicadores econômicos — Painel Liberato Consulting" },
      {
        name: "description",
        content: "Atualize os indicadores econômicos do Brasil com apoio de inteligência artificial.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Indicadores econômicos — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Atualize os indicadores econômicos do Brasil com apoio de inteligência artificial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IndicatorsPage,
});

const empty = {
  id: undefined as string | undefined,
  slug: "",
  label: "",
  value: "",
  unit: "",
  reference_period: "",
  trend: "",
  note: "",
  source_name: "",
  source_url: "",
  position: 0,
  published: true,
};
type Form = typeof empty;

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function IndicatorsPage() {
  const q = useQuery({
    queryKey: ["admin-indicators"],
    queryFn: () => listIndicators(),
    retry: false,
  });
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const set = (k: keyof Form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const edit = (i: Indicator) => {
    setForm({ ...empty, ...i, id: i.id });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AdminShell
      title="Indicadores econômicos do Brasil"
      description="Estes números aparecem na página Dados do Brasil. A inteligência artificial busca os valores mais recentes nas fontes oficiais (IBGE, Banco Central, MDIC, Ipeadata) e preenche período de referência e fonte."
    >
      <div className="rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">Atualização automática por IA</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A IA revisa todos os indicadores cadastrados e atualiza valor, período, tendência e
          fonte. Confira sempre os números antes de publicar.
        </p>
        <button
          disabled={refreshing}
          onClick={async () => {
            setRefreshing(true);
            try {
              const r = await refreshIndicatorsAI();
              if (!r.ok) toast.error(r.error);
              else {
                toast.success(`${r.updated} indicadores atualizados.`);
                await q.refetch();
              }
            } catch {
              toast.error("Não foi possível atualizar os indicadores.");
            } finally {
              setRefreshing(false);
            }
          }}
          className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
        >
          {refreshing ? "Consultando fontes…" : "Atualizar todos com IA"}
        </button>
      </div>

      <form
        className="mt-8 rounded-lg border border-border bg-background p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const r = await saveIndicator({ data: form });
            if (!r.ok) toast.error(r.error);
            else {
              toast.success(
                "pending" in r && r.pending
                  ? "Alteração enviada para aprovação do administrador."
                  : "Indicador salvo.",
              );
              setForm(empty);
              await q.refetch();
            }
          } catch {
            toast.error("Não foi possível salvar o indicador.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-display text-lg font-bold">
          {form.id ? "Editar indicador" : "Novo indicador"}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-xs font-medium text-muted-foreground">
            Identificador (sem espaços)
            <input
              required
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="pib-variacao"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground md:col-span-2">
            Nome exibido
            <input
              required
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Crescimento do PIB"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Valor
            <input value={form.value} onChange={(e) => set("value", e.target.value)} className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Unidade
            <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="%" className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Período de referência
            <input
              value={form.reference_period}
              onChange={(e) => set("reference_period", e.target.value)}
              placeholder="3º trimestre de 2025"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Tendência
            <input value={form.trend} onChange={(e) => set("trend", e.target.value)} placeholder="alta" className={`mt-1 ${input}`} />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Fonte
            <input
              value={form.source_name}
              onChange={(e) => set("source_name", e.target.value)}
              placeholder="IBGE"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Link da fonte
            <input
              value={form.source_url}
              onChange={(e) => set("source_url", e.target.value)}
              className={`mt-1 ${input}`}
            />
          </label>
        </div>
        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          Nota de contexto
          <textarea
            rows={2}
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            className={`mt-1 ${input}`}
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
          <label className="flex items-center gap-2">
            Ordem
            <input
              type="number"
              value={form.position}
              onChange={(e) => set("position", Number(e.target.value))}
              className="w-20 rounded-md border border-input bg-background px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            Publicado no site
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Salvando…" : "Salvar indicador"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(empty)}
              className="text-sm text-muted-foreground hover:text-accent"
            >
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Indicador</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Referência</th>
              <th className="px-4 py-3">Fonte</th>
              <th className="px-4 py-3">Atualizado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((i) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-4 py-3">{i.label}</td>
                <td className="px-4 py-3">
                  {i.value} {i.unit}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{i.reference_period || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{i.source_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {i.last_checked_at
                    ? new Date(i.last_checked_at).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => edit(i)} className="text-accent hover:underline">
                    editar
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Excluir este indicador?")) return;
                      const r = await deleteIndicator({ data: { id: i.id } });
                      if (!r.ok) toast.error(r.error);
                      else {
                        toast.success("Indicador excluído.");
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
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  Nenhum indicador cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
