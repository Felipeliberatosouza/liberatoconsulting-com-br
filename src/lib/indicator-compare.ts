/**
 * Comparação entre o valor atual de um indicador e o valor anterior.
 * Funciona no servidor (e-mail do Boletim) e no navegador (arte de redes).
 */

export type IndicatorDelta = {
  /** Direção da variação. */
  direction: "up" | "down" | "flat" | "none";
  /** Seta correspondente (vazia quando não há comparação). */
  arrow: string;
  /** Rótulo curto da variação, ex.: "+0,40 p.p." ou "—". */
  label: string;
  /** Cor de exibição (verde quando a variação é boa para a economia). */
  color: string;
  /** Leitura econômica da variação: boa, ruim ou neutra. */
  sentiment: "good" | "bad" | "neutral";
};

/** Se uma queda no número é boa, ruim ou indiferente para a economia. */
export type IndicatorPolarity = "higher-better" | "lower-better" | "neutral";

const UP = "#15803d";
const DOWN = "#b91c1c";
const NEUTRAL = "#78716c";

/** Indicadores em que a QUEDA do número é positiva. */
const LOWER_IS_BETTER = [
  "inflac",
  "inflaç",
  "inflation",
  "inflaci",
  "ipca",
  "inpc",
  "igp",
  "ipp",
  "ipc",
  "desemprego",
  "desocupa",
  "unemployment",
  "desempleo",
  "juros",
  "selic",
  "interest rate",
  "cdi",
  "spread",
  "divida",
  "dívida",
  "debt",
  "endivida",
  "deficit",
  "déficit",
  "risco pais",
  "risco país",
  "country risk",
  "embi",
  "pobreza",
  "poverty",
  "desigualdade",
  "gini",
  "inadimplen",
  "inadimplên",
  "default rate",
  "informalidade",
  "custo",
  "cost",
  "tributaria",
  "tributária",
  "tax burden",
  "carga",
  "desmatamento",
  "deforestation",
  "emiss",
  "co2",
  "mortalidade",
  "evasao",
  "evasão",
  "criminalidade",
  "homic",
];

/** Indicadores em que a ALTA do número é positiva. */
const HIGHER_IS_BETTER = [
  "pib",
  "gdp",
  "produto interno",
  "producao",
  "produção",
  "production",
  "industrial",
  "manufatur",
  "varejo",
  "retail",
  "vendas",
  "sales",
  "servicos",
  "serviços",
  "services",
  "emprego",
  "employment",
  "ocupa",
  "caged",
  "vagas",
  "renda",
  "rendimento",
  "salario",
  "salário",
  "wage",
  "income",
  "exporta",
  "export",
  "balanca",
  "balança",
  "trade balance",
  "superavit",
  "superávit",
  "investimento",
  "investment",
  "fbcf",
  "capital",
  "confianca",
  "confiança",
  "confidence",
  "pmi",
  "expectativa",
  "reservas",
  "reserves",
  "produtividade",
  "productivity",
  "safra",
  "colheita",
  "harvest",
  "agro",
  "crescimento",
  "growth",
  "idh",
  "hdi",
  "escolaridade",
  "expectativa de vida",
  "saneamento",
  "credito",
  "crédito",
  "credit",
  "turismo",
  "energia limpa",
  "renovav",
  "renováv",
];

/** Indicadores sem leitura óbvia de bom/ruim (câmbio, população etc.). */
const NEUTRAL_KEYS = [
  "cambio",
  "câmbio",
  "dolar",
  "dólar",
  "dollar",
  "euro",
  "exchange rate",
  "populacao",
  "população",
  "population",
  "importa",
  "import",
];

function norm(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Descobre, pelo slug/rótulo do indicador, se a queda do número é positiva.
 * Ex.: inflação em queda = seta para baixo com cor verde.
 */
export function indicatorPolarity(...keys: Array<string | null | undefined>): IndicatorPolarity {
  const text = norm(keys.filter(Boolean).join(" "));
  if (!text.trim()) return "neutral";
  const has = (list: string[]) => list.some((k) => text.includes(norm(k)));
  if (has(NEUTRAL_KEYS)) return "neutral";
  if (has(LOWER_IS_BETTER)) return "lower-better";
  if (has(HIGHER_IS_BETTER)) return "higher-better";
  return "neutral";
}

/** Converte "1.234,56 %" em número. Retorna null quando não há número. */
export function parseIndicatorNumber(raw: string | null | undefined): number | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  const cleaned = text.replace(/[^\d,.\-+]/g, "");
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatNumber(n: number, locale = "pt-BR") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Compara valor atual e anterior; devolve seta, rótulo e cor.
 * A cor segue a leitura econômica: por exemplo, inflação em queda fica verde
 * com seta para baixo, porque a queda é positiva para esse indicador.
 */
export function compareIndicator(
  current: string | null | undefined,
  previous: string | null | undefined,
  unit = "",
  locale = "pt-BR",
  polarity: IndicatorPolarity | string | null | undefined = "higher-better",
): IndicatorDelta {
  const resolved: IndicatorPolarity =
    polarity === "higher-better" || polarity === "lower-better" || polarity === "neutral"
      ? polarity
      : indicatorPolarity(polarity);
  const a = parseIndicatorNumber(current);
  const b = parseIndicatorNumber(previous);
  if (a === null || b === null) {
    return { direction: "none", arrow: "", label: "—", color: NEUTRAL, sentiment: "neutral" };
  }
  const diff = a - b;
  const abs = Math.abs(diff);
  const pct = b !== 0 ? (diff / Math.abs(b)) * 100 : null;
  if (abs < 1e-9) {
    return {
      direction: "flat",
      arrow: "▬",
      label: `0${unit ? ` ${unit}` : ""}`,
      color: NEUTRAL,
      sentiment: "neutral",
    };
  }
  const sign = diff > 0 ? "+" : "−";
  const main = `${sign}${formatNumber(abs, locale)}${unit ? ` ${unit}` : ""}`;
  const relative = pct !== null ? ` (${sign}${formatNumber(Math.abs(pct), locale)}%)` : "";
  const good = resolved === "neutral" ? null : resolved === "lower-better" ? diff < 0 : diff > 0;
  const sentiment: IndicatorDelta["sentiment"] = good === null ? "neutral" : good ? "good" : "bad";
  return {
    direction: diff > 0 ? "up" : "down",
    arrow: diff > 0 ? "▲" : "▼",
    label: `${main}${relative}`,
    color: sentiment === "good" ? UP : sentiment === "bad" ? DOWN : NEUTRAL,
    sentiment,
  };
}
