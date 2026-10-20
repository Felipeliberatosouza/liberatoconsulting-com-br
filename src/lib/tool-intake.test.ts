import { describe, expect, it } from "vitest";
import { completedMonths, formatInput, parseBrazilianNumber, prefillCompany, validateIntake } from "./tool-intake";
import type { ToolSpec } from "./tool-engine";

const now = new Date("2026-10-20T19:14:00Z");
const spec = { context_fields: [{ id: "mes_referencia", label: "Mês de referência" }], inputs: [] } as unknown as ToolSpec;
describe("tool intake rules", () => {
  const companyFields = [{ id: "empresa", label: "Nome da empresa — identifica o negócio no relatório" }, { id: "produto", label: "Produto ou serviço analisado" }];
  it("prefills only the company from the signed-in user's registration", () => {
    expect(prefillCompany(companyFields, {}, "Liberato Consulting")).toEqual({ empresa: "Liberato Consulting" });
    expect(prefillCompany(companyFields, {}, null)).toEqual({});
  });
  it("preserves edits and intentional clearing when the account is loaded again", () => {
    expect(prefillCompany(companyFields, { empresa: "Outra empresa" }, "Liberato Consulting")["empresa"]).toBe("Outra empresa");
    expect(prefillCompany(companyFields, { empresa: "" }, "Liberato Consulting")["empresa"]).toBe("");
  });
  it("offers exactly the last 36 completed months, never the current month", () => {
    const periods = completedMonths(now);
    expect(periods).toHaveLength(36);
    expect(periods[0]).toBe("2026-09");
    expect(periods[35]).toBe("2023-10");
    expect(periods).not.toContain("2026-10");
  });
  it("enforces period limits on submitted values", () => {
    expect(validateIntake(spec, { mes_referencia: "2026-09" }, {}, now)).toBeNull();
    for (const month of ["2026-10", "2026-11", "2023-09"]) expect(validateIntake(spec, { mes_referencia: month }, {}, now)).not.toBeNull();
  });
  it("uses Brasília month at the UTC month boundary", () => {
    expect(completedMonths(new Date("2026-11-01T01:00:00Z"))[0]).toBe("2026-09");
  });
  it("formats reais and preserves the numeric amount", () => {
    expect(formatInput("1234567,89", "currency").replace(/\s/g, " ")).toBe("R$ 1.234.567,89");
    expect(parseBrazilianNumber(formatInput("1234567,89", "currency"))).toBe(1234567.89);
  });
  it("formats percentage with exactly two decimal places without dividing by 100", () => {
    expect(formatInput("12,5", "percent")).toBe("12,50%");
    expect(parseBrazilianNumber("12,50%")).toBe(12.5);
  });
  it("formats absolute quantities with thousands and no decimal places", () => {
    expect(formatInput("12345", "integer")).toBe("12.345");
  });
  it("rejects fractional units and missing numbers", () => {
    const units = { context_fields: [], inputs: [{ id: "q", label: "Quantidade", unit: "unidades/mês" }] } as unknown as ToolSpec;
    expect(validateIntake(units, {}, { q: 1.5 })).not.toBeNull();
    expect(validateIntake(units, {}, { q: 1000 })).toBeNull();
    expect(Number.isNaN(parseBrazilianNumber(""))).toBe(true);
  });
  it("requires an allowed allocation option and justification for other", () => {
    const allocation = { context_fields: [{ id: "criterio_rateio", label: "Critério de rateio" }], inputs: [] } as unknown as ToolSpec;
    expect(validateIntake(allocation, { criterio_rateio: "Receita de vendas / faturamento" }, {})).toBeNull();
    expect(validateIntake(allocation, { criterio_rateio: "Outro critério justificado" }, {})).not.toBeNull();
    expect(validateIntake(allocation, { criterio_rateio: "Outro critério justificado: Consumo registrado" }, {})).toBeNull();
    expect(validateIntake(allocation, { criterio_rateio: "Inventado" }, {})).not.toBeNull();
  });
});