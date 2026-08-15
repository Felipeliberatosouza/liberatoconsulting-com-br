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
  /** Cor de exibição (verde para alta, vermelho para queda). */
  color: string;
};

const UP = "#15803d";
const DOWN = "#b91c1c";
const NEUTRAL = "#78716c";

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

/** Compara valor atual e anterior; devolve seta, rótulo e cor. */
export function compareIndicator(
  current: string | null | undefined,
  previous: string | null | undefined,
  unit = "",
  locale = "pt-BR",
): IndicatorDelta {
  const a = parseIndicatorNumber(current);
  const b = parseIndicatorNumber(previous);
  if (a === null || b === null) {
    return { direction: "none", arrow: "", label: "—", color: NEUTRAL };
  }
  const diff = a - b;
  const abs = Math.abs(diff);
  const pct = b !== 0 ? (diff / Math.abs(b)) * 100 : null;
  if (abs < 1e-9) {
    return { direction: "flat", arrow: "▬", label: `0${unit ? ` ${unit}` : ""}`, color: NEUTRAL };
  }
  const sign = diff > 0 ? "+" : "−";
  const main = `${sign}${formatNumber(abs, locale)}${unit ? ` ${unit}` : ""}`;
  const relative = pct !== null ? ` (${sign}${formatNumber(Math.abs(pct), locale)}%)` : "";
  return {
    direction: diff > 0 ? "up" : "down",
    arrow: diff > 0 ? "▲" : "▼",
    label: `${main}${relative}`,
    color: diff > 0 ? UP : DOWN,
  };
}
