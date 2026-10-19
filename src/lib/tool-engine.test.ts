import { describe, expect, it } from "vitest";
import { evaluate, priceFromCost, runTool, verifySpec, type ToolSpec } from "./tool-engine";

const breakeven: ToolSpec = {
  title: "Ponto de equilíbrio", summary: "", category: "Finanças", methodology: "",
  context_fields: [],
  inputs: [
    { id: "custo_fixo", label: "Custo fixo", unit: "R$", help: "", min: 0, max: null },
    { id: "preco", label: "Preço", unit: "R$", help: "", min: 0, max: null },
    { id: "custo_var", label: "Custo variável", unit: "R$", help: "", min: 0, max: null },
    { id: "qtd", label: "Quantidade", unit: "un", help: "", min: 0, max: null },
  ],
  outputs: [
    { id: "margem", label: "Margem", unit: "R$", formula: "preco - custo_var", format: "currency", explanation: "" },
    { id: "pe_qtd", label: "PE", unit: "un", formula: "ceil(custo_fixo / margem)", format: "integer", explanation: "" },
    { id: "preco_min", label: "Preço mínimo", unit: "R$", formula: "custo_var + custo_fixo / qtd", format: "currency", explanation: "" },
  ],
  chart: { type: "line", title: "", x_input: "qtd", x_label: "", x_max_formula: "pe_qtd * 2", series: [{ label: "Receita", formula: "preco * qtd" }] },
  recommendations: [{ condition: "qtd < pe_qtd", text: "Abaixo do equilíbrio" }],
  test_cases: [
    { inputs: [{ id: "custo_fixo", value: 10000 }, { id: "preco", value: 50 }, { id: "custo_var", value: 30 }, { id: "qtd", value: 400 }], expected: [{ id: "pe_qtd", value: 500 }, { id: "preco_min", value: 55 }] },
    { inputs: [{ id: "custo_fixo", value: 5000 }, { id: "preco", value: 20 }, { id: "custo_var", value: 10 }, { id: "qtd", value: 1000 }], expected: [{ id: "pe_qtd", value: 500 }, { id: "preco_min", value: 15 }] },
  ],
};

describe("tool engine", () => {
  it("respects operator precedence", () => { expect(evaluate("2 + 3 * 4 ^ 2", {})).toBe(50); });
  it("break-even: 10.000 fixed, margin 20 → 500 units", () => {
    const r = runTool(breakeven, { custo_fixo: 10000, preco: 50, custo_var: 30, qtd: 400 });
    expect(r.ok && r.values["pe_qtd"]).toBe(500);
    expect(r.ok && r.recommendations).toEqual(["Abaixo do equilíbrio"]);
  });
  it("refuses division by zero instead of returning Infinity", () => {
    expect(runTool(breakeven, { custo_fixo: 1000, preco: 30, custo_var: 30, qtd: 1 }).ok).toBe(false);
  });
  it("valid spec passes verification", () => { expect(verifySpec(breakeven)).toEqual([]); });
  it("wrong expected test value is caught", () => {
    const bad = { ...breakeven, test_cases: [breakeven.test_cases[0]!, { ...breakeven.test_cases[1]!, expected: [{ id: "pe_qtd", value: 499 }] }] };
    expect(verifySpec(bad).length).toBe(1);
  });
  it("blocks code injection", () => { expect(() => evaluate("constructor.constructor('x')()", {})).toThrow(); });
  it("price = cost × (1 + markup)", () => { expect(priceFromCost(0.5, 200)).toBe(1.5); });
});
