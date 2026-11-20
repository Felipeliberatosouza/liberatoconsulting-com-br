import { describe, expect, it } from "vitest";
import { applyScenarioDays, type QuoteResult } from "./pricing-catalog";

const q = { totalDays: 12.4, start: "2026-11-23", end: "2026-12-08" } as QuoteResult;

describe("prazo manual do cenário", () => {
  it("substitui o prazo por número inteiro de dias úteis", () => {
    expect(applyScenarioDays(q, 1000).totalDays).toBe(1000);
    expect(applyScenarioDays(q, 5).end).toBe("2026-11-27");
  });
  it("sem prazo manual mantém a soma das etapas", () => {
    expect(applyScenarioDays(q, 0).totalDays).toBe(12.4);
  });
});
