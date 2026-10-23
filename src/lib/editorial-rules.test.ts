import { describe, expect, it } from "vitest";
import { newsletterToolSection, pickFeature } from "./editorial-rules";

const a = { slug: "ponto-de-equilibrio", title: "A", summary: "" };
const b = { slug: "fluxo-caixa", title: "B", summary: "" };

describe("rodízio ferramenta / guia", () => {
  it("usa a última ferramenta quando não foi destaque na edição anterior", () => {
    expect(pickFeature(a, true, { kind: "guide", slug: "guia" })).toEqual({ kind: "tool", slug: a.slug });
  });
  it("troca para o guia quando a ferramenta já saiu na semana anterior", () => {
    expect(pickFeature(a, true, { kind: "tool", slug: a.slug }).kind).toBe("guide");
  });
  it("newsletter sem ferramenta nova traz guia e ferramenta diferente da anterior", () => {
    expect(newsletterToolSection([a, b], a.slug)).toEqual({ guide: true, tool: b });
  });
  it("newsletter com ferramenta nova traz só a ferramenta", () => {
    expect(newsletterToolSection([a, b], b.slug)).toEqual({ guide: false, tool: a });
  });
});
