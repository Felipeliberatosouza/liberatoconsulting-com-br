import { computeTotals, type DiagnosticBudget, type ScopeModule } from "./diagnostic-catalog";
import type { PhaseId, PricedActivity, PricingRates } from "./pricing-catalog";

const PHASE: Record<string, PhaseId> = {
  Planejamento: "p1",
  Diagnóstico: "p2",
  Análise: "p2",
  Campo: "p2",
  Solução: "p3",
  Gestão: "p3",
  Entrega: "p4",
};

/**
 * Converte os módulos do diagnóstico em etapas do orçamento, preservando o
 * mesmo preço final: dias viram horas e o valor-dia vira valor-hora.
 */
export function diagnosticToQuote(modules: ScopeModule[], budget: DiagnosticBudget, hoursPerDay = 8) {
  const hpd = hoursPerDay || 8;
  const activities: PricedActivity[] = modules
    .filter((m) => m.include && m.qty * m.unitDays > 0)
    .map((m) => {
      const days = m.qty * m.unitDays;
      return {
        id: `diag-${m.id}`,
        phase: PHASE[m.phase] ?? "p3",
        label: m.label,
        consultant: days * m.senior * hpd,
        assistant: days * m.analyst * hpd,
        freelancer: days * m.pm * hpd,
        thirdParty: m.qty * m.directCost,
        reps: 1,
        onsite: false,
        enabled: true,
      };
    });
  const rates: PricingRates = {
    consultant: budget.rateSenior / hpd,
    assistant: budget.rateAnalyst / hpd,
    freelancer: budget.ratePm / hpd,
  };
  const markupFactor = (1 + budget.contingencyPct / 100) * (1 + budget.taxPct / 100);
  return {
    activities,
    override: { rates, markupFactor },
    discountPct: budget.discountPct,
    expectedTotal: Math.round(computeTotals(modules, budget).final),
  };
}
