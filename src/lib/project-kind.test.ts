import { describe, it, expect } from "vitest";
import { PROJECT_KINDS, PROJECT_KIND_KEY, projectKindFromAnswers, isProjectKind } from "./project-kind";

describe("modalidade de projeto", () => {
  it("oferece consultoria, treinamento e pacote sem criar uma terceira área de serviço", () => {
    expect(PROJECT_KINDS).toEqual(["consultoria", "treinamento", "pacote"]);
  });
  it("mantém a seleção estável quando as respostas são salvas e carregadas", () => {
    for (const kind of PROJECT_KINDS) expect(projectKindFromAnswers(JSON.parse(JSON.stringify({ [PROJECT_KIND_KEY]: kind })))).toBe(kind);
  });
  it("não reclassifica projetos anteriores sem seleção", () => {
    expect(projectKindFromAnswers({ q1: "Avaliar a viabilidade do negócio" })).toBe("");
    expect(isProjectKind("outro")).toBe(false);
  });
});