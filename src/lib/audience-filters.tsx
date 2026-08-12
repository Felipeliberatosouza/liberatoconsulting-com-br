import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Segmentos padrão atendidos pela consultoria (editáveis no painel administrativo). */
export const DEFAULT_SEGMENTS = [
  "Agronegócio",
  "Energia e renováveis",
  "Mineração",
  "Indústria e manufatura",
  "Infraestrutura e logística",
  "Tecnologia e software",
  "Serviços financeiros e fintechs",
  "Saúde e ciências da vida",
  "Varejo e bens de consumo",
  "Educação",
  "Turismo e hospitalidade",
  "Setor público e regulação",
];

export const ALL_SEGMENTS = "geral";
export const ALL_REGIONS = "todas";
export const ALL_STATES = "todos";

export const REGIONS = [
  { id: "norte", label: "Norte" },
  { id: "nordeste", label: "Nordeste" },
  { id: "centro-oeste", label: "Centro-Oeste" },
  { id: "sudeste", label: "Sudeste" },
  { id: "sul", label: "Sul" },
] as const;

export type RegionId = (typeof REGIONS)[number]["id"];

export const STATES: Array<{ uf: string; name: string; region: RegionId }> = [
  { uf: "AC", name: "Acre", region: "norte" },
  { uf: "AP", name: "Amapá", region: "norte" },
  { uf: "AM", name: "Amazonas", region: "norte" },
  { uf: "PA", name: "Pará", region: "norte" },
  { uf: "RO", name: "Rondônia", region: "norte" },
  { uf: "RR", name: "Roraima", region: "norte" },
  { uf: "TO", name: "Tocantins", region: "norte" },
  { uf: "AL", name: "Alagoas", region: "nordeste" },
  { uf: "BA", name: "Bahia", region: "nordeste" },
  { uf: "CE", name: "Ceará", region: "nordeste" },
  { uf: "MA", name: "Maranhão", region: "nordeste" },
  { uf: "PB", name: "Paraíba", region: "nordeste" },
  { uf: "PE", name: "Pernambuco", region: "nordeste" },
  { uf: "PI", name: "Piauí", region: "nordeste" },
  { uf: "RN", name: "Rio Grande do Norte", region: "nordeste" },
  { uf: "SE", name: "Sergipe", region: "nordeste" },
  { uf: "DF", name: "Distrito Federal", region: "centro-oeste" },
  { uf: "GO", name: "Goiás", region: "centro-oeste" },
  { uf: "MT", name: "Mato Grosso", region: "centro-oeste" },
  { uf: "MS", name: "Mato Grosso do Sul", region: "centro-oeste" },
  { uf: "ES", name: "Espírito Santo", region: "sudeste" },
  { uf: "MG", name: "Minas Gerais", region: "sudeste" },
  { uf: "RJ", name: "Rio de Janeiro", region: "sudeste" },
  { uf: "SP", name: "São Paulo", region: "sudeste" },
  { uf: "PR", name: "Paraná", region: "sul" },
  { uf: "RS", name: "Rio Grande do Sul", region: "sul" },
  { uf: "SC", name: "Santa Catarina", region: "sul" },
];

export type AudienceFilters = { segment: string; region: string; state: string };

export const EMPTY_FILTERS: AudienceFilters = {
  segment: ALL_SEGMENTS,
  region: ALL_REGIONS,
  state: ALL_STATES,
};

export function statesForRegion(region: string) {
  return region === ALL_REGIONS ? STATES : STATES.filter((s) => s.region === region);
}

export function regionLabel(id: string) {
  return REGIONS.find((r) => r.id === id)?.label ?? "";
}

export function stateLabel(uf: string) {
  const s = STATES.find((x) => x.uf === uf);
  return s ? `${s.name} (${s.uf})` : "";
}

export function isFiltered(f: AudienceFilters) {
  return f.segment !== ALL_SEGMENTS || f.region !== ALL_REGIONS || f.state !== ALL_STATES;
}

/** Rótulo curto usado em banners e textos ("Agronegócio · Sudeste · São Paulo (SP)"). */
export function filtersLabel(f: AudienceFilters) {
  const parts: string[] = [];
  if (f.segment !== ALL_SEGMENTS) parts.push(f.segment);
  if (f.region !== ALL_REGIONS) parts.push(regionLabel(f.region));
  if (f.state !== ALL_STATES) parts.push(stateLabel(f.state));
  return parts.join(" · ");
}

type Ctx = {
  filters: AudienceFilters;
  applied: boolean;
  label: string;
  apply: (f: AudienceFilters) => void;
  clear: () => void;
};

const FilterContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "liberato-filters";

export function AudienceFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<AudienceFilters>(EMPTY_FILTERS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AudienceFilters>;
      setFilters({ ...EMPTY_FILTERS, ...parsed });
    } catch {
      /* ignora dados inválidos */
    }
  }, []);

  const apply = useCallback((f: AudienceFilters) => {
    setFilters(f);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  const clear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* armazenamento indisponível */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      filters,
      applied: isFiltered(filters),
      label: filtersLabel(filters),
      apply,
      clear,
    }),
    [filters, apply, clear],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

const FALLBACK: Ctx = {
  filters: EMPTY_FILTERS,
  applied: false,
  label: "",
  apply: () => undefined,
  clear: () => undefined,
};

export function useAudienceFilters() {
  return useContext(FilterContext) ?? FALLBACK;
}
