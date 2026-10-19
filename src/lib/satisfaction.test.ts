import { describe, expect, it } from "vitest";
import { csatScore, npsScore } from "./satisfaction";

describe("satisfação", () => {
  it("NPS = promotores (9-10) menos detratores (0-6)", () => {
    expect(npsScore([10, 9, 8, 6])).toBe(25);
  });
  it("CSAT conta notas 4 e 5", () => {
    expect(csatScore([5, 4, 3, 2])).toBe(50);
  });
});
