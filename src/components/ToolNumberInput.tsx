import { formatInput, inputKind, parseBrazilianNumber } from "@/lib/tool-intake";
import type { ToolInput } from "@/lib/tool-engine";

export function ToolNumberInput({ input, value, onChange, className }: { input: ToolInput; value: string; onChange: (value: string) => void; className: string }) {
  const kind = inputKind(input);
  return <input required aria-label={input.label} inputMode={kind === "integer" ? "numeric" : "decimal"} maxLength={30} value={value} className={className}
    onFocus={e => { const n = parseBrazilianNumber(value); if (Number.isFinite(n)) onChange(String(n).replace(".", ",")); e.currentTarget.setCustomValidity(""); }}
    onChange={e => { const v = e.target.value.replace(/[^0-9.,-]/g, ""); onChange(v); e.currentTarget.setCustomValidity(""); }}
    onBlur={e => {
      const n = parseBrazilianNumber(value);
      const invalid = !Number.isFinite(n) || (kind === "integer" && !Number.isInteger(n)) || (input.min !== null && n < input.min) || (input.max !== null && n > input.max);
      e.currentTarget.setCustomValidity(invalid ? `Informe um valor válido${kind === "integer" ? " inteiro" : ""} para ${input.label}.` : "");
      if (!invalid) onChange(formatInput(value, kind));
    }} />;
}