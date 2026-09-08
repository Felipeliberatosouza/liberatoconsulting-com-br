/**
 * Busca automática dos indicadores brasileiros direto nas fontes oficiais na internet
 * (séries do Banco Central do Brasil / SGS, que consolidam também IBGE e MDIC).
 * Sempre retorna a última observação publicada como valor ATUAL e a penúltima como ANTERIOR.
 */

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export type LiveIndicator = {
  slug: string;
  value: string;
  unit: string;
  reference_period: string;
  previous_value: string;
  previous_period: string;
  source_name: string;
  source_url: string;
  trend: string;
};

type SeriesSpec = {
  slug: string;
  series: number;
  unit: string;
  /** monthly = Mês/Ano, yearly = Ano, daily = Mês/Ano da data da cotação */
  period: "monthly" | "yearly" | "daily";
  /** divisor aplicado ao valor bruto (ex.: US$ milhões -> US$ bilhões) */
  divide?: number;
  decimals: number;
  source_name: string;
  source_url: string;
};

const SPECS: SeriesSpec[] = [
  {
    slug: "selic",
    series: 432,
    unit: "% a.a.",
    period: "daily",
    decimals: 2,
    source_name: "Banco Central do Brasil (Copom)",
    source_url: "https://www.bcb.gov.br/controleinflacao/taxaselic",
  },
  {
    slug: "cambio",
    series: 3698,
    unit: "R$/USD",
    period: "monthly",
    decimals: 2,
    source_name: "Banco Central do Brasil",
    source_url: "https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes",
  },
  {
    slug: "inflacao",
    series: 13522,
    unit: "%",
    period: "monthly",
    decimals: 2,
    source_name: "IBGE (IPCA acumulado 12 meses)",
    source_url: "https://www.ibge.gov.br/estatisticas/economicas/precos-e-custos.html",
  },
  {
    slug: "desemprego",
    series: 24369,
    unit: "%",
    period: "monthly",
    decimals: 1,
    source_name: "IBGE (PNAD Contínua)",
    source_url: "https://www.ibge.gov.br/estatisticas/sociais/trabalho.html",
  },
  {
    slug: "pib",
    series: 7326,
    unit: "%",
    period: "yearly",
    decimals: 2,
    source_name: "IBGE / Banco Central do Brasil",
    source_url: "https://www.ibge.gov.br/estatisticas/economicas/contas-nacionais.html",
  },
  {
    slug: "balanca",
    series: 22707,
    unit: "US$ bi",
    period: "monthly",
    divide: 1000,
    decimals: 1,
    source_name: "MDIC/Comex Stat (via Banco Central)",
    source_url: "http://comexstat.mdic.gov.br/pt/home",
  },
  {
    slug: "ide",
    series: 22885,
    unit: "US$ bi",
    period: "monthly",
    divide: 1000,
    decimals: 1,
    source_name: "Banco Central do Brasil",
    source_url: "https://www.bcb.gov.br/estatisticas/estatisticassetorexterno",
  },
];

type SgsPoint = { data: string; valor: string };

function formatPeriod(dateBr: string, period: SeriesSpec["period"]): string {
  const [, month, year] = dateBr.split("/");
  if (!year) return dateBr;
  if (period === "yearly") return year;
  const index = Number(month) - 1;
  const name = MONTHS[index] ?? month;
  return `${name}/${year}`;
}

function formatValue(raw: string, spec: SeriesSpec): string {
  const number = Number(raw);
  if (!Number.isFinite(number)) return raw;
  const scaled = spec.divide ? number / spec.divide : number;
  return scaled.toFixed(spec.decimals).replace(".", ",");
}

async function fetchSeries(spec: SeriesSpec): Promise<LiveIndicator | null> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${spec.series}/dados/ultimos/2?formato=json`;
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const points = (await response.json()) as SgsPoint[];
    if (!Array.isArray(points) || points.length === 0) return null;

    const current = points[points.length - 1];
    const previous = points.length > 1 ? points[points.length - 2] : undefined;
    if (!current?.valor || !current?.data) return null;

    const currentNumber = Number(current.valor);
    const previousNumber = previous ? Number(previous.valor) : Number.NaN;
    const trend =
      Number.isFinite(previousNumber) && Number.isFinite(currentNumber)
        ? currentNumber > previousNumber
          ? "alta"
          : currentNumber < previousNumber
            ? "baixa"
            : "estável"
        : "";

    return {
      slug: spec.slug,
      value: formatValue(current.valor, spec),
      unit: spec.unit,
      reference_period: formatPeriod(current.data, spec.period),
      previous_value: previous ? formatValue(previous.valor, spec) : "",
      previous_period: previous ? formatPeriod(previous.data, spec.period) : "",
      source_name: spec.source_name,
      source_url: spec.source_url,
      trend,
    };
  } catch {
    return null;
  }
}

/** Retorna as leituras oficiais mais recentes disponíveis na internet, por slug. */
export async function fetchLiveIndicators(): Promise<Map<string, LiveIndicator>> {
  const results = await Promise.all(SPECS.map((spec) => fetchSeries(spec)));
  const map = new Map<string, LiveIndicator>();
  for (const item of results) {
    if (item) map.set(item.slug, item);
  }
  return map;
}
