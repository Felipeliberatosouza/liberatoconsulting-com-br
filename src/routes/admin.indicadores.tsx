import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { useAuthReady } from "@/hooks/useAuthReady";
import {
  deleteIndicator,
  fillPreviousIndicatorsAI,
  listIndicators,
  refreshIndicatorsAI,
  saveIndicator,
  type Indicator,
} from "@/lib/indicators.functions";

import {
  ALL_REGIONS,
  ALL_SEGMENTS,
  ALL_STATES,
  DEFAULT_SEGMENTS,
  REGIONS,
  statesForRegion,
} from "@/lib/audience-filters";
import { useFieldErrors } from "@/hooks/useFieldErrors";

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
  previous_value: "",
  previous_period: "",
  forecast_value: "",
  forecast_period: "",
  forecast_source_name: "",
  forecast_source_url: "",

  trend: "",
  note: "",
  source_name: "",
  source_url: "",
  position: 0,
  published: true,
  segment: ALL_SEGMENTS as string,
  region: ALL_REGIONS as string,
  uf: ALL_STATES as string,
};
type Form = typeof empty;

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function IndicatorsPage() {
  const authReady = useAuthReady();
  const q = useQuery({
    queryKey: ["admin-indicators"],
    queryFn: () => listIndicators(),
    enabled: authReady,
    retry: false,
  });
  const [form, setForm] = useState<Form>(empty);
  const [busy, setBusy] = useState(false);
  const { validate, errorClass } = useFieldErrors();
  const [refreshing, setRefreshing] = useState(false);
  const [filling, setFilling] = useState(false);
  const autoFilled = useRef(false);

  // Preenche sozinho, uma vez, os "dados anteriores" e a "tendência" em branco.
  useEffect(() => {
    const rows = q.data;
    if (!authReady || !rows || autoFilled.current) return;
    const pending = rows.some(
      (r) =>
        !(r.previous_value ?? "").trim() ||
        !(r.previous_period ?? "").trim() ||
        !(r.forecast_value ?? "").trim() ||
        !(r.forecast_period ?? "").trim() ||
        !(r.forecast_source_name ?? "").trim(),
    );
    if (!pending) return;
    setFilling(true);
    fillPreviousIndicatorsAI()
      .then((r) => {
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        autoFilled.current = true;
        if (r.updated > 0) {
          toast.success(`${r.updated} indicadores complementados automaticamente (dados anteriores e tendência).`);
          void q.refetch();
        }
      })
      .catch((error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Não foi possível buscar os dados anteriores e a tendência."),
      )
      .finally(() => setFilling(false));
  }, [authReady, q.data]);

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
          fonte, e sempre busca também a leitura anterior de cada série nas fontes oficiais — a
          coluna do período anterior nunca fica em branco. Confira sempre os números antes de
          publicar.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={refreshing || filling}
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
            className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {refreshing ? "Consultando fontes…" : "Atualizar todos com IA"}
          </button>
          <button
            disabled={refreshing || filling}
            onClick={async () => {
              setFilling(true);
              try {
                const r = await fillPreviousIndicatorsAI();
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success(`${r.updated} indicadores complementados.`);
                  await q.refetch();
                }
              } catch {
                toast.error("Não foi possível buscar os dados anteriores e a tendência.");
              } finally {
                setFilling(false);
              }
            }}
            className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent disabled:opacity-60"
          >
            {filling ? "Buscando dados oficiais…" : "Preencher dados anteriores e tendência com IA"}
          </button>
        </div>
      </div>


      <form
        noValidate
        className="mt-8 rounded-lg border border-border bg-background p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validate({ slug: form.slug, label: form.label, value: form.value })) return;
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
              className={`mt-1 ${input}${errorClass("slug", form.slug)}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground md:col-span-2">
            Nome exibido
            <input
              required
              value={form.label}
              onChange={(e) => set("label", e.target.value)}
              placeholder="Crescimento do PIB"
              className={`mt-1 ${input}${errorClass("label", form.label)}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Valor
            <input value={form.value} onChange={(e) => set("value", e.target.value)} className={`mt-1 ${input}${errorClass("value", form.value)}`} />
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
            Valor anterior
            <input
              value={form.previous_value}
              onChange={(e) => set("previous_value", e.target.value)}
              placeholder="2,9"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Período do valor anterior
            <input
              value={form.previous_period}
              onChange={(e) => set("previous_period", e.target.value)}
              placeholder="2º trimestre de 2025"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Tendência (valor projetado)
            <input
              value={form.forecast_value}
              onChange={(e) => set("forecast_value", e.target.value)}
              placeholder="3,1"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Período da tendência
            <input
              value={form.forecast_period}
              onChange={(e) => set("forecast_period", e.target.value)}
              placeholder="2026"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Fonte da tendência
            <input
              value={form.forecast_source_name}
              onChange={(e) => set("forecast_source_name", e.target.value)}
              placeholder="Banco Central — Relatório Focus"
              className={`mt-1 ${input}`}
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Link da fonte da tendência
            <input
              value={form.forecast_source_url}
              onChange={(e) => set("forecast_source_url", e.target.value)}
              className={`mt-1 ${input}`}
            />
          </label>


          <label className="text-xs font-medium text-muted-foreground">
            Direção (alta / baixa / estável)
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

        <fieldset className="mt-6 rounded-md border border-border p-4">
          <legend className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recorte do indicador (filtros de Dados do Brasil)
          </legend>
          <p className="text-xs text-muted-foreground">
            Deixe em &quot;Geral / Todas / Todos&quot; para indicadores nacionais. Ao definir um
            recorte, o indicador só aparece quando o visitante aplicar esses filtros.
          </p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <label className="text-xs font-medium text-muted-foreground">
              Segmento
              <select
                value={form.segment}
                onChange={(e) => set("segment", e.target.value)}
                className={`mt-1 ${input}`}
              >
                <option value={ALL_SEGMENTS}>Geral (todos os segmentos)</option>
                {DEFAULT_SEGMENTS.map((sg) => (
                  <option key={sg} value={sg}>
                    {sg}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Região
              <select
                value={form.region}
                onChange={(e) => {
                  setForm((f) => ({ ...f, region: e.target.value, uf: ALL_STATES }));
                }}
                className={`mt-1 ${input}`}
              >
                <option value={ALL_REGIONS}>Todas as regiões</option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted-foreground">
              Estado (UF)
              <select
                value={form.uf}
                onChange={(e) => set("uf", e.target.value)}
                className={`mt-1 ${input}`}
              >
                <option value={ALL_STATES}>Todos os estados</option>
                {statesForRegion(form.region).map((st) => (
                  <option key={st.uf} value={st.uf}>
                    {st.name} ({st.uf})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
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
              <th className="px-4 py-3">Tendência</th>
              <th className="px-4 py-3">Fonte</th>
              <th className="px-4 py-3">Recorte</th>
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
                <td className="px-4 py-3 text-muted-foreground">
                  {i.forecast_value
                    ? `${i.forecast_value} ${i.unit}${i.forecast_period ? ` (${i.forecast_period})` : ""}`
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{i.source_name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[
                    i.segment !== ALL_SEGMENTS ? i.segment : null,
                    i.region !== ALL_REGIONS
                      ? (REGIONS.find((r) => r.id === i.region)?.label ?? i.region)
                      : null,
                    i.uf !== ALL_STATES ? i.uf : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Geral"}
                </td>
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
                <td className="px-4 py-6 text-muted-foreground" colSpan={8}>
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
