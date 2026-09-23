import { ALL_REGIONS, ALL_SEGMENTS, ALL_STATES, DEFAULT_SEGMENTS, REGIONS as R, STATES } from "./audience-filters";

/** Combinações aceitas para geração de conteúdo com IA em "Dados do Brasil". */
export const SEGMENTS: string[] = [ALL_SEGMENTS, ...DEFAULT_SEGMENTS];
export const REGIONS: string[] = [ALL_REGIONS, ...R.map((r) => r.id)];
export const UFS: string[] = [ALL_STATES, ...STATES.map((s) => s.uf)];
