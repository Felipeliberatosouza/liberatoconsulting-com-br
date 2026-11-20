import { describe, expect, it } from "vitest";
import { currentServiceChoices, portfolioDefaults, resolvePortfolio } from "./portfolio-catalog";

describe("current editable portfolio", () => {
  it("includes CRM as solution number 8 in all four languages", () => {
    const crm = resolvePortfolio(portfolioDefaults()).solutions.find(s => s.slug === "crm-sob-medida");
    expect(crm?.n).toBe(8);
    for (const lang of ["pt", "en", "es", "zh"] as const) expect(crm?.title[lang]).toContain("CRM");
  });
  it("excludes archived and replaced services from every new selector", () => {
    const rows = [...portfolioDefaults(), { ...portfolioDefaults()[0], slug: "sprint-de-produtividade", published: true }, { ...portfolioDefaults()[0], slug: "old-service", published: false }];
    const choices = currentServiceChoices(rows);
    expect(choices).toHaveLength(14);
    expect(choices.some(row => row.slug === "sprint-de-produtividade")).toBe(false);
    expect(currentServiceChoices(rows, "old-service").some(row => row.slug === "old-service")).toBe(true);
  });
  it("has eight solutions and six trainings", () => {
    const catalog = resolvePortfolio(portfolioDefaults());
    expect(catalog.solutions).toHaveLength(8);
    expect(catalog.trainings).toHaveLength(6);
    expect(catalog.solutions[0]?.title.pt).toBe("Preço Certo e Lucro Real em Cada Venda");
  });
  it("uses saved edits without changing historic rows", () => {
    const rows = portfolioDefaults();
    const first = rows[0];
    if (!first) throw new Error("Missing first service");
    first.title = "Novo título";
    expect(resolvePortfolio(rows).solutions[0]?.title.pt).toBe("Novo título");
    expect(resolvePortfolio(portfolioDefaults()).solutions[0]?.title.pt).toBe("Preço Certo e Lucro Real em Cada Venda");
  });
  it("removes explicitly unpublished services", () => {
    const rows = portfolioDefaults();
    const first = rows[0];
    if (!first) throw new Error("Missing first service");
    first.published = false;
    expect(resolvePortfolio(rows).solutions).toHaveLength(7);
    expect(resolvePortfolio(rows.slice(1)).solutions).toHaveLength(7);
  });
});