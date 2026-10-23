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
