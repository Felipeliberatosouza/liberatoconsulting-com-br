/** Porte de empresa pelo número de pessoas ocupadas (metodologia IBGE/Sebrae). */
export type Porte = "" | "micro" | "pequena" | "media" | "grande";
export type Sector = "industria" | "comercio_servicos";
export type EmployeeRange = { label: string; min: number; max: number | null };

export const PORTE_LABEL: Record<Exclude<Porte, "">, string> = {
  micro: "Microempresa",
  pequena: "Pequena Empresa",
  media: "Média Empresa",
  grande: "Grande Empresa",
};

export const SECTOR_LABEL: Record<Sector, string> = {
  industria: "Indústria / Construção",
  comercio_servicos: "Comércio / Serviços",
};

/** Limites de cada porte por setor. */
export const PORTE_LIMITS: Record<Sector, Record<Exclude<Porte, "">, { min: number; max: number | null }>> = {
  industria: { micro: { min: 1, max: 19 }, pequena: { min: 20, max: 99 }, media: { min: 100, max: 499 }, grande: { min: 500, max: null } },
  comercio_servicos: { micro: { min: 1, max: 9 }, pequena: { min: 10, max: 49 }, media: { min: 50, max: 99 }, grande: { min: 100, max: null } },
};

const RANGES: Record<Sector, Record<Exclude<Porte, "">, EmployeeRange[]>> = {
  industria: {
    micro: [{ label: "1 a 19", min: 1, max: 19 }],
    pequena: [{ label: "20 a 49", min: 20, max: 49 }, { label: "50 a 99", min: 50, max: 99 }],
    media: [{ label: "100 a 199", min: 100, max: 199 }, { label: "200 a 499", min: 200, max: 499 }],
    grande: [
      { label: "500 a 999", min: 500, max: 999 },
      { label: "1.000 a 4.999", min: 1000, max: 4999 },
      { label: "5.000 ou mais", min: 5000, max: null },
    ],
  },
  comercio_servicos: {
    micro: [{ label: "1 a 9", min: 1, max: 9 }],
    pequena: [{ label: "10 a 19", min: 10, max: 19 }, { label: "20 a 49", min: 20, max: 49 }],
    media: [{ label: "50 a 99", min: 50, max: 99 }],
    grande: [
      { label: "100 a 499", min: 100, max: 499 },
      { label: "500 a 999", min: 500, max: 999 },
      { label: "1.000 ou mais", min: 1000, max: null },
    ],
  },
};

/** Faixas de funcionários disponíveis conforme porte e setor. "Qualquer porte" lista todas as faixas do setor. */
export function employeeRangesFor(porte: Porte, sector: Sector): EmployeeRange[] {
  if (porte) return RANGES[sector][porte];
  return [...RANGES[sector].micro, ...RANGES[sector].pequena, ...RANGES[sector].media, ...RANGES[sector].grande];
}

/** Deduz o setor a partir do segmento escolhido. */
export function sectorFromSegment(segment: string): Sector {
  return /ind[uú]stri|constru|manufat|f[aá]bric|metal|qu[ií]mic|t[eê]xtil|minera|petr[oó]le|energia|agroind/i.test(segment)
    ? "industria"
    : "comercio_servicos";
}

export type PorteValue = Exclude<Porte, "">;
export const PORTE_OPTIONS: PorteValue[] = ["micro", "pequena", "media", "grande"];

/** Converte valores antigos (pme/corporacao/sme/corporate) para o porte Sebrae. */
export function normalizePorte(value: unknown): PorteValue | "" {
  const t = String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (!t) return "";
  if (/^micro/.test(t)) return "micro";
  if (/^media|medium/.test(t)) return "media";
  if (/grande|corpor|enterprise|large/.test(t)) return "grande";
  if (/pequen|pme|sme|small|startup/.test(t)) return "pequena";
  return "";
}

export function porteLabel(value: unknown): string {
  const p = normalizePorte(value);
  return p ? PORTE_LABEL[p] : "—";
}

/** Tabela de valor-hora: grande empresa usa a tabela corporativa; demais portes, a de PME. */
export function porteRateTier(value: unknown): "sme" | "corporate" {
  return normalizePorte(value) === "grande" ? "corporate" : "sme";
}
