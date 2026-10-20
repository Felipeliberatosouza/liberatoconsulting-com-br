import { describe, expect, it } from "vitest";
import { toolAccessSteps, toolPromotionLink, type PromotionTool } from "./tool-promotion";
const tool: PromotionTool = { id: "1", slug: "ponto-de-equilibrio", title: "Ponto de equilíbrio", summary: "", kind: "interactive", priceLabel: "Gratuita" };
describe("divulgação de ferramentas", () => {
  it("omite o passo a passo quando a opção está desmarcada", () => {
    expect(toolAccessSteps(tool, false)).toEqual([]);
  });
  it("inclui o acesso pelo site oficial quando marcado", () => {
    expect(toolAccessSteps(tool, true)[0]).toBe("Acesse liberatoconsulting.com.br/ferramentas");
  });
  it("vincula divulgação à ferramenta criada", () => {
    expect(toolPromotionLink(tool)).toBe("https://liberatoconsulting.com.br/ferramentas/ponto-de-equilibrio");
  });
});