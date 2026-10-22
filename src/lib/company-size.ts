/** Porte de empresa pelo número de pessoas ocupadas (metodologia IBGE/Sebrae). */
export type Porte = "" | "pequena" | "media" | "grande";
export type Sector = "industria" | "comercio_servicos";
export type EmployeeRange = { label: string; min: number; max: number | null };

export const PORTE_LABEL: Record<Exclude<Porte, "">, string> = {
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
  industria: { pequena: { min: 20, max: 99 }, media: { min: 100, max: 499 }, grande: { min: 500, max: null } },
  comercio_servicos: { pequena: { min: 10, max: 49 }, media: { min: 50, max: 99 }, grande: { min: 100, max: null } },
};

const RANGES: Record<Sector, Record<Exclude<Porte, "">, EmployeeRange[]>> = {
  industria: {
    pequena: [{ label: "20 a 49", min: 20, max: 49 }, { label: "50 a 99", min: 50, max: 99 }],
    media: [{ label: "100 a 199", min: 100, max: 199 }, { label: "200 a 499", min: 200, max: 499 }],
    grande: [
      { label: "500 a 999", min: 500, max: 999 },
      { label: "1.000 a 4.999", min: 1000, max: 4999 },
      { label: "5.000 ou mais", min: 5000, max: null },
    ],
  },
  comercio_servicos: {
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
  return [...RANGES[sector].pequena, ...RANGES[sector].media, ...RANGES[sector].grande];
}

/** Deduz o setor a partir do segmento escolhido. */
export function sectorFromSegment(segment: string): Sector {
  return /ind[uú]stri|constru|manufat|f[aá]bric|metal|qu[ií]mic|t[eê]xtil|minera|petr[oó]le|energia|agroind/i.test(segment)
    ? "industria"
    : "comercio_servicos";
}
