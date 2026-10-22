import { describe, expect, it } from "vitest";
import { isRecent } from "./prospect-insight.server";

const now = new Date("2026-10-22T12:00:00Z");

describe("notícia do setor no e-mail de prospecção", () => {
  it("aceita notícia de até 3 meses", () => {
    expect(isRecent("2026-08-01", now)).toBe(true);
  });
  it("recusa notícia com mais de 3 meses", () => {
    expect(isRecent("2026-07-01", now)).toBe(false);
  });
  it("recusa data inválida", () => {
    expect(isRecent("sem data", now)).toBe(false);
  });
});
