import { describe, expect, it } from "vitest";
import { serviceMacro } from "./service-macro";

describe("serviceMacro", () => {
  it("classifica serviços da frente treinamento como Treinamento in Company", () => {
    expect(serviceMacro({ groups: ["treinamento"] })).toBe("treinamento");
  });
  it("classifica as demais frentes como Consultoria", () => {
    expect(serviceMacro({ groups: ["estrategia", "operacoes"] })).toBe("consultoria");
    expect(serviceMacro({ group_id: "pesquisas", groups: [] })).toBe("consultoria");
  });
});
