import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatNumberKind, parseLocaleNumber, type NumberKind } from "@/lib/number-format";

/** Campo numérico que mostra R$, % e separadores no formato brasileiro após a digitação. */
export function FormattedNumberInput({
  value,
  kind,
  onChange,
  className,
  decimals = 2,
}: {
  value: number;
  kind: NumberKind;
  onChange: (v: number) => void;
  className?: string;
  decimals?: number;
}) {
  const [text, setText] = useState(formatNumberKind(value, kind, decimals));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(formatNumberKind(value, kind, decimals));
  }, [value, kind, focused, decimals]);
  return (
    <Input
      inputMode="decimal"
      className={className}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        setText(value ? String(value).replace(".", ",") : "");
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d.,R$%\s-]/g, "");
        setText(t);
        onChange(parseLocaleNumber(t));
      }}
      onBlur={() => {
        setFocused(false);
        const n = parseLocaleNumber(text);
        onChange(n);
        setText(formatNumberKind(n, kind, decimals));
      }}
    />
  );
}
