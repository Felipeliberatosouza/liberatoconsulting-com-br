/** Formatação pt-BR de campos numéricos: moeda, percentual e número absoluto. */
export type NumberKind = "currency" | "percent" | "number";

/** Converte texto digitado ("R$ 1.500,50", "010", "5%") em número. */
export function parseLocaleNumber(text: string): number {
  const clean = text.replace(/R\$|%/gi, "").replace(/\s/g, "");
  if (!clean) return 0;
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(clean)
      ? clean.replace(/\./g, "")
      : clean;
  const n = Number(normalized.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatNumberKind(value: number, kind: NumberKind, decimals = 2): string {
  const body = value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (kind === "currency") return `R$ ${body}`;
  if (kind === "percent") return `${body}%`;
  return body;
}
