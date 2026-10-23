import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { PricedActivity, QuoteResult, QuoteScenario } from "@/lib/pricing-catalog";

type Props = {
  activities: PricedActivity[];
  base: QuoteResult;
  scenarios: QuoteScenario[];
  onChange: (list: QuoteScenario[]) => void;
  compute: (s: QuoteScenario) => QuoteResult;
  money: (brl: number) => string;
};

/** Cenários 2 e 3: o cenário 1 é sempre o orçamento planejado, sem alterações. */
export function QuoteScenarios({ activities, base, scenarios, onChange, compute, money }: Props) {
  const enabled = activities.filter((a) => a.enabled);
  const patch = (i: number, p: Partial<QuoteScenario>) =>
    onChange(scenarios.map((s, j) => (j === i ? { ...s, ...p } : s)));

  return (
    <div className="space-y-4 border-t border-border px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Cenários do orçamento</p>
          <p className="text-sm text-muted-foreground">
            Cenário 1 (planejado): {money(base.totalBrl)}. Crie até dois cenários alternativos.
          </p>
        </div>
        {scenarios.length < 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([...scenarios, { note: "", removedIds: [], reducePct: 0 }])}
          >
            <Plus className="size-4" /> Adicionar cenário {scenarios.length + 2}
          </Button>
        )}
      </div>

      {scenarios.map((s, i) => {
        const q = compute(s);
        const withoutReduction = compute({ ...s, reducePct: 0 });
        return (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">Cenário {i + 2}</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold">{money(q.totalBrl)}</p>
                <span className="text-xs text-muted-foreground">
                  {base.totalBrl > 0 ? `${Math.round((1 - q.totalBrl / base.totalBrl) * 100)}% abaixo do planejado` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover cenário ${i + 2}`}
                  onClick={() => onChange(scenarios.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observação: o que muda neste cenário (vai no orçamento) *</Label>
              <Textarea
                rows={2}
                value={s.note}
                placeholder="Ex.: sem pesquisa quantitativa; relatório final simplificado."
                onChange={(e) => patch(i, { note: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Retirar atividades</Label>
              <div className="grid gap-1.5 md:grid-cols-2">
                {enabled.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={s.removedIds.includes(a.id)}
                      onCheckedChange={(v) =>
                        patch(i, {
                          removedIds: v ? [...s.removedIds, a.id] : s.removedIds.filter((x) => x !== a.id),
                        })
                      }
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Redução proporcional em todas as atividades (%)</Label>
                <FormattedNumberInput
                  kind="percent"
                  value={s.reducePct}
                  onChange={(v) => patch(i, { reducePct: Math.max(0, Math.min(90, v)) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ou informe o preço final desejado (R$)</Label>
                <FormattedNumberInput
                  kind="currency"
                  value={q.totalBrl}
                  onChange={(target) => {
                    if (!target || withoutReduction.totalBrl <= 0) return;
                    const pct = (1 - target / withoutReduction.totalBrl) * 100;
                    patch(i, { reducePct: Math.max(0, Math.min(90, Number(pct.toFixed(2)))) });
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
