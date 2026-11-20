import { describe, expect, it } from "vitest";
import { portfolioDefaults, resolvePortfolio } from "./portfolio-catalog";

describe("current editable portfolio", () => {
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