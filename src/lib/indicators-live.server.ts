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
  /**
   * monthly = Mês/Ano, yearly = Ano, daily = Mês/Ano da data da cotação,
   * step = série diária que só muda por decisão (ex.: Selic): o valor anterior
   * é o último patamar diferente, e não o dia anterior.
   */
  period: "monthly" | "yearly" | "daily" | "step" | "quarterly";
  /**
   * "qoq" = a série é um índice; o valor exibido é a variação percentual
   * em relação à observação imediatamente anterior (ex.: PIB trimestral).
   */
  transform?: "qoq";
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
    period: "step",
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
    // PIB trimestral (índice encadeado dessazonalizado): usamos a variação
    // percentual do trimestre mais recente sobre o trimestre imediatamente
    // anterior, para que o dado nunca fique preso ao fechamento anual.
    slug: "pib",
    series: 22109,
    unit: "%",
    period: "quarterly",
    transform: "qoq",
    decimals: 2,
    source_name: "IBGE (Contas Nacionais Trimestrais) / Banco Central do Brasil",
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
  if (period === "quarterly") {
    const quarter = Math.floor((Number(month) - 1) / 3) + 1;
    return `${quarter}º trimestre/${year}`;
  }
  const index = Number(month) - 1;
  const name = MONTHS[index] ?? month;
  return `${name}/${year}`;
}

/** Variação percentual entre duas observações de um índice. */
function percentChange(current: string, base: string, decimals: number): string {
  const a = Number(current);
  const b = Number(base);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return "";
  return (((a - b) / b) * 100).toFixed(decimals).replace(".", ",");
}

/**
 * Séries de índice (ex.: PIB trimestral): o valor exibido é a variação do
 * período mais recente, e o "anterior" é a variação do período imediatamente
 * anterior — sempre as duas últimas divulgações disponíveis.
 */
async function fetchChangeSeries(spec: SeriesSpec): Promise<LiveIndicator | null> {
  try {
    const response = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${spec.series}/dados/ultimos/3?formato=json`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;
    const points = (await response.json()) as SgsPoint[];
    if (!Array.isArray(points) || points.length < 2) return null;
    const last = points[points.length - 1]!;
    const prior = points[points.length - 2]!;
    const older = points.length > 2 ? points[points.length - 3] : undefined;
    const value = percentChange(last.valor, prior.valor, spec.decimals);
    if (!value) return null;
    const previousValue = older ? percentChange(prior.valor, older.valor, spec.decimals) : "";
    const a = Number(value.replace(",", "."));
    const b = Number(previousValue.replace(",", "."));
    const trend =
      previousValue && Number.isFinite(a) && Number.isFinite(b)
        ? a > b
          ? "alta"
          : a < b
            ? "baixa"
            : "estável"
        : "";
    return {
      slug: spec.slug,
      value,
      unit: spec.unit,
      reference_period: formatPeriod(last.data, spec.period),
      previous_value: previousValue,
      previous_period: previousValue ? formatPeriod(prior.data, spec.period) : "",
      source_name: spec.source_name,
      source_url: spec.source_url,
      trend,
    };
  } catch {
    return null;
  }
}

function formatValue(raw: string, spec: SeriesSpec): string {
  const number = Number(raw);
  if (!Number.isFinite(number)) return raw;
  const scaled = spec.divide ? number / spec.divide : number;
  return scaled.toFixed(spec.decimals).replace(".", ",");
}

async function fetchSeries(spec: SeriesSpec): Promise<LiveIndicator | null> {
  // Séries "step" (Selic) precisam de histórico para achar o patamar anterior:
  // a API só aceita "ultimos/N" pequeno, então usamos intervalo de datas (2 anos).
  const base = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${spec.series}/dados`;
  let url = `${base}/ultimos/2?formato=json`;
  if (spec.period === "step") {
    const today = new Date();
    const fmt = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    const start = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    url = `${base}?formato=json&dataInicial=${fmt(start)}&dataFinal=${fmt(today)}`;
  }
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const points = (await response.json()) as SgsPoint[];
    if (!Array.isArray(points) || points.length === 0) return null;

    const current = points[points.length - 1];
    let previous = points.length > 1 ? points[points.length - 2] : undefined;
    if (!current?.valor || !current?.data) return null;

    if (spec.period === "step") {
      // último dia com patamar diferente do atual
      previous = undefined;
      for (let i = points.length - 2; i >= 0; i--) {
        const point = points[i];
        if (point && Number(point.valor) !== Number(current.valor)) {
          previous = point;
          break;
        }
      }
    }

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

/** Risco-país (CDS soberano de 5 anos do Brasil): última cotação e o patamar distinto anterior. */
async function fetchCountryRisk(): Promise<LiveIndicator | null> {
  try {
    const payload = {
      GLOBALVAR: {
        JS_VARIABLE: "jsGlobalVars",
        FUNCTION: "CDS",
        DOMESTIC: true,
        ENDPOINT: "http://www.worldgovernmentbonds.com/wp-json/common/v1/historical",
        DATE_RIF: "2099-12-31",
        DEBUG: true,
        OBJ: { UNIT: "", DECIMAL: 2, UNIT_DELTA: "%", DECIMAL_DELTA: 2 },
        COUNTRY1: {
          SYMBOL: "7",
          PAESE: "Brazil",
          PAESE_UPPERCASE: "BRAZIL",
          BANDIERA: "br",
          URL_PAGE: "brazil",
        },
        COUNTRY2: null,
        OBJ1: { DURATA_STRING: "5 Years", DURATA: 60 },
        OBJ2: null,
      },
    };
    const response = await fetch(
      "http://www.worldgovernmentbonds.com/wp-json/common/v1/historical",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Origin: "http://www.worldgovernmentbonds.com",
          Referer: "http://www.worldgovernmentbonds.com/cds-historical-data/brazil/5-years/",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as {
      success?: boolean;
      result?: {
        quote?: Record<string, { CLOSE_VAL?: number | null; DATA_VAL?: string | null }>;
      };
    };
    if (!json.success) return null;
    const points = Object.values(json.result?.quote ?? {})
      .filter(
        (p): p is { CLOSE_VAL: number; DATA_VAL: string } =>
          typeof p.CLOSE_VAL === "number" && Number.isFinite(p.CLOSE_VAL) && !!p.DATA_VAL,
      )
      .sort((a, b) => a.DATA_VAL.localeCompare(b.DATA_VAL));
    if (points.length === 0) return null;
    const current = points[points.length - 1]!;
    // Ignora repetições do mesmo patamar: usa a última cotação com valor diferente.
    let previous: { CLOSE_VAL: number; DATA_VAL: string } | undefined;
    for (let i = points.length - 2; i >= 0; i -= 1) {
      const candidate = points[i]!;
      if (Math.round(candidate.CLOSE_VAL) !== Math.round(current.CLOSE_VAL)) {
        previous = candidate;
        break;
      }
    }
    const label = (iso?: string) => {
      if (!iso) return "";
      const [year, month, day] = iso.slice(0, 10).split("-");
      return `${day}/${month}/${year}`;
    };
    const trend = previous
      ? current.CLOSE_VAL > previous.CLOSE_VAL
        ? "alta"
        : current.CLOSE_VAL < previous.CLOSE_VAL
          ? "baixa"
          : "estável"
      : "";
    return {
      slug: "risco-pais",
      value: String(Math.round(current.CLOSE_VAL)),
      unit: "pontos",
      reference_period: label(current.DATA_VAL),
      previous_value: previous ? String(Math.round(previous.CLOSE_VAL)) : "",
      previous_period: previous ? label(previous.DATA_VAL) : "",
      source_name: "World Government Bonds (CDS soberano 5 anos)",
      source_url: "https://www.worldgovernmentbonds.com/cds-historical-data/brazil/5-years/",
      trend,
    };
  } catch {
    return null;
  }
}


/** Retorna as leituras oficiais mais recentes disponíveis na internet, por slug. */
export async function fetchLiveIndicators(): Promise<Map<string, LiveIndicator>> {
  const results = await Promise.all([...SPECS.map((spec) => fetchSeries(spec)), fetchCountryRisk()]);
  const map = new Map<string, LiveIndicator>();
  for (const item of results) {
    if (item) map.set(item.slug, item);
  }
  return map;
}
