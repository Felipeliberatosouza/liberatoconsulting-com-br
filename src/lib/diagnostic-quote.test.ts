import { describe, expect, it } from "vitest";
import { DEFAULT_BUDGET, DEFAULT_MODULES, computeTotals } from "./diagnostic-catalog";
import { DEFAULT_PRICING, buildQuote } from "./pricing-catalog";
import { diagnosticToQuote } from "./diagnostic-quote";

describe("orçamento herdado do diagnóstico", () => {
  it("mantém o mesmo preço final do diagnóstico", () => {
    const budget = { ...DEFAULT_BUDGET, rateSenior: 200, rateAnalyst: 150, ratePm: 150, taxPct: 5, contingencyPct: 10 };
    const conv = diagnosticToQuote(DEFAULT_MODULES, budget, 8);
    const q = buildQuote(conv.activities, DEFAULT_PRICING, {
      companyType: "sme", country: "US", currency: "BRL", startDate: "2026-11-02",
      remoteOnly: false, discountPct: conv.discountPct, fxRate: 1, override: conv.override,
    });
    expect(q.totalBrl).toBe(Math.round(computeTotals(DEFAULT_MODULES, budget).final));
  });
});

import { buildScenarioQuote } from "./pricing-catalog";
describe("cenários do orçamento", () => {
  const conv = diagnosticToQuote(DEFAULT_MODULES, DEFAULT_BUDGET, 8);
  const opts = { companyType: "sme" as const, country: "BR", currency: "BRL", startDate: "2026-11-02", remoteOnly: true, discountPct: 0, fxRate: 1, override: conv.override };
  const base = buildQuote(conv.activities, DEFAULT_PRICING, opts);
  it("redução proporcional de 20% reduz o total em 20%", () => {
    const s = buildScenarioQuote(conv.activities, DEFAULT_PRICING, opts, { note: "", removedIds: [], reducePct: 20 });
    expect(s.totalBrl).toBe(Math.round(base.totalBrl * 0.8));
  });
  it("retirar atividade reduz o total pelo valor dela", () => {
    const first = base.phases[0]!.items[0]!;
    const s = buildScenarioQuote(conv.activities, DEFAULT_PRICING, opts, { note: "", removedIds: [first.id], reducePct: 0 });
    expect(s.totalBrl).toBe(Math.round(base.totalBrl - first.priceBrl));
  });
});
