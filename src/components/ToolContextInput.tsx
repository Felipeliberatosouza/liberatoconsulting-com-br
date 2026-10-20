import { useState } from "react";
import { ALLOCATION_OPTIONS, completedMonths, contextKind } from "@/lib/tool-intake";
import type { ToolContextField } from "@/lib/tool-engine";

export function ToolContextInput({ field, value, onChange, className }: { field: ToolContextField; value: string; onChange: (value: string) => void; className: string }) {
  const [year, setYear] = useState(value.slice(0, 4));
  const kind = contextKind(field);
  if (kind === "month") {
    const periods = completedMonths();
    const years = [...new Set(periods.map(p => p.slice(0, 4)))];
    return <div className="grid grid-cols-2 gap-2">
      <select required aria-label="Ano de referência" className={className} value={year} onChange={e => { setYear(e.target.value); onChange(""); }}><option value="">Ano</option>{years.map(y => <option key={y}>{y}</option>)}</select>
      <select required aria-label="Mês de referência" className={className} value={value} disabled={!year} onChange={e => onChange(e.target.value)}><option value="">Mês</option>{periods.filter(p => p.startsWith(year)).map(p => <option key={p} value={p}>{new Date(`${p}-01T12:00:00Z`).toLocaleDateString("pt-BR", { month: "long", timeZone: "UTC" })}</option>)}</select>
    </div>;
  }
  if (kind === "allocation") {
    const selected = ALLOCATION_OPTIONS.find(o => value === o || value.startsWith(`${o}: `)) ?? "";
    return <><select required className={className} value={selected} onChange={e => onChange(e.target.value)}><option value="">Selecione o critério</option>{ALLOCATION_OPTIONS.map(o => <option key={o}>{o}</option>)}</select>
      {selected === "Outro critério justificado" && <input required minLength={3} maxLength={150} aria-label="Justificativa do outro critério" placeholder="Descreva a base utilizada" className={className} value={value.startsWith(`${selected}: `) ? value.slice(selected.length + 2) : ""} onChange={e => onChange(`${selected}: ${e.target.value}`)} />}
      <span className="mt-1 block text-xs font-normal text-muted-foreground">Escolha uma base que represente o consumo dos recursos. O critério documenta o rateio; informe a participação no campo percentual. Entre todos os itens, as parcelas devem somar 100%.</span>
    </>;
  }
  return <input required value={value} onChange={e => onChange(e.target.value)} className={className} maxLength={200} />;
}