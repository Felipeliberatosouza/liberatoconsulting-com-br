import { describe, expect, it } from "vitest";
import { scopeQuestionsForKind } from "@/lib/scope-form-i18n";

describe("escopo por tipo de projeto", () => {
  it("treinamento tem 10 perguntas próprias", () => {
    const q = scopeQuestionsForKind("treinamento", "pt");
    expect(q).toHaveLength(10);
    expect(q[0]!.id).toBe("t1");
  });
  it("pacote combina 10 de consultoria + 10 de treinamento", () => {
    expect(scopeQuestionsForKind("pacote", "en")).toHaveLength(20);
  });
  it.each(["Prospecção de Clientes: Novos Clientes", "Gestão de Carteira de Clientes"])(
    "oferece %s no primeiro tema de Treinamento",
    (option) => {
      const theme = scopeQuestionsForKind("treinamento", "pt").find((q) => q.id === "t1");
      expect(theme?.options).toContain(option);
    },
  );
  it("traduções mantêm o mesmo número de opções", () => {
    const pt = scopeQuestionsForKind("pacote", "pt");
    for (const lang of ["en", "es", "zh"] as const) {
      scopeQuestionsForKind("pacote", lang).forEach((q, i) => expect(q.options.length).toBe(pt[i]!.options.length));
    }
  });
});
