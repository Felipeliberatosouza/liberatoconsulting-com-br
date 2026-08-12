import { useEffect, useState } from "react";
import { Check, Eraser, SlidersHorizontal } from "lucide-react";

import { useLanguage } from "@/i18n";
import {
  ALL_REGIONS,
  ALL_SEGMENTS,
  ALL_STATES,
  EMPTY_FILTERS,
  REGIONS,
  statesForRegion,
  useAudienceFilters,
  type AudienceFilters,
} from "@/lib/audience-filters";

const select =
  "w-full rounded-full border border-accent-foreground/30 bg-accent-foreground/10 px-3 py-1.5 text-xs font-medium text-accent-foreground outline-none focus:border-accent-foreground [&>option]:bg-background [&>option]:text-foreground";

/** Linha de personalização (segmento, região e UF) exibida abaixo do cabeçalho. */
export function SiteFilterBar() {
  const { segments } = useLanguage();
  const { filters, applied, label, apply, clear } = useAudienceFilters();
  const [draft, setDraft] = useState<AudienceFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const states = statesForRegion(draft.region);
  const dirty =
    draft.segment !== filters.segment ||
    draft.region !== filters.region ||
    draft.state !== filters.state;

  return (
    <div className="border-t border-ink-foreground/15 bg-accent text-accent-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-foreground">
          <SlidersHorizontal className="size-3.5" />
          Personalize os dados
        </span>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="filtro-segmento">
            Segmento
          </label>
          <select
            id="filtro-segmento"
            value={draft.segment}
            onChange={(e) => setDraft((d) => ({ ...d, segment: e.target.value }))}
            className={`${select} sm:w-56`}
          >
            <option value={ALL_SEGMENTS}>Geral (todos os segmentos)</option>
            {segments.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filtro-regiao">
            Região do Brasil
          </label>
          <select
            id="filtro-regiao"
            value={draft.region}
            onChange={(e) =>
              setDraft((d) => ({ ...d, region: e.target.value, state: ALL_STATES }))
            }
            className={`${select} sm:w-44`}
          >
            <option value={ALL_REGIONS}>Todas as regiões</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="filtro-uf">
            Estado (UF)
          </label>
          <select
            id="filtro-uf"
            value={draft.state}
            onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
            className={`${select} sm:w-52`}
          >
            <option value={ALL_STATES}>Todos os estados</option>
            {states.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.name} ({s.uf})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              clear();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-accent-foreground/30 px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent-foreground/10"
          >
            <Eraser className="size-3.5" />
            Apagar filtros
          </button>
          <button
            onClick={() => apply(draft)}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-ink-foreground transition-opacity hover:opacity-90"
          >
            <Check className="size-3.5" />
            {dirty ? "Concluir filtros" : "Filtros aplicados"}
          </button>
        </div>

        {applied && (
          <p className="w-full text-[11px] text-accent-foreground/80">
            Exibindo informações destacadas para{" "}
            <span className="font-semibold text-ink-foreground">{label}</span>.
          </p>
        )}
      </div>
    </div>
  );
}

/** Selo reutilizável que destaca o recorte escolhido nos banners e seções. */
export function FilterScopeBadge({ className = "" }: { className?: string }) {
  const { applied, label } = useAudienceFilters();
  if (!applied) return null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent ${className}`}
    >
      <SlidersHorizontal className="size-3" />
      {label}
    </span>
  );
}
