import { describe, it, expect } from "vitest";
import { employeeRangesFor, PORTE_LIMITS } from "./company-size";

describe("porte Sebrae", () => {
  it("indústria: pequena 20-99, média 100-499, grande 500+", () => {
    expect(PORTE_LIMITS.industria).toEqual({ micro: { min: 1, max: 19 }, pequena: { min: 20, max: 99 }, media: { min: 100, max: 499 }, grande: { min: 500, max: null } });
  });
  it("comércio/serviços: pequena 10-49, média 50-99, grande 100+", () => {
    expect(PORTE_LIMITS.comercio_servicos).toEqual({ micro: { min: 1, max: 9 }, pequena: { min: 10, max: 49 }, media: { min: 50, max: 99 }, grande: { min: 100, max: null } });
  });
  it("faixas ficam dentro do porte escolhido", () => {
    for (const sector of ["industria", "comercio_servicos"] as const)
      for (const porte of ["pequena", "media", "grande"] as const) {
        const lim = PORTE_LIMITS[sector][porte];
        for (const r of employeeRangesFor(porte, sector)) {
          expect(r.min).toBeGreaterThanOrEqual(lim.min);
          if (lim.max !== null) expect(r.max).not.toBeNull(), expect(r.max!).toBeLessThanOrEqual(lim.max);
        }
      }
  });
});
