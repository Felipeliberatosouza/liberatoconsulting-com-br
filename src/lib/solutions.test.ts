import { describe, expect, it } from "vitest";
import { SOLUTIONS, TRAININGS, findSolution, findTraining } from "./solutions";

describe("portfólio por dor", () => {
  it("tem 7 consultorias e 6 treinamentos", () => {
    expect(SOLUTIONS).toHaveLength(7);
    expect(TRAININGS).toHaveLength(6);
  });
  it("nome escolhido para a solução 1", () => {
    expect(SOLUTIONS[0]!.title.pt).toBe("Preço Certo e Lucro Real em Cada Venda");
  });
  it("cada treinamento aponta para uma consultoria existente e vice-versa", () => {
    for (const t of TRAININGS) expect(findSolution(t.solutionSlug)).toBeDefined();
    for (const s of SOLUTIONS) if (s.trainingSlug) expect(findTraining(s.trainingSlug)).toBeDefined();
  });
});
