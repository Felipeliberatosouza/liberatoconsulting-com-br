import { describe, expect, it } from "vitest";
import { formatNumberKind, parseLocaleNumber } from "./number-format";

describe("number-format", () => {
  it("remove zero à esquerda", () => expect(parseLocaleNumber("0100")).toBe(100));
  it("aceita R$ digitado sem duplicar", () => expect(formatNumberKind(parseLocaleNumber("R$ 1.500,5"), "currency")).toBe("R$ 1.500,50"));
  it("aceita % digitado sem duplicar", () => expect(formatNumberKind(parseLocaleNumber("10%"), "percent")).toBe("10,00%"));
  it("número absoluto com milhar e 2 casas", () => expect(formatNumberKind(12345, "number")).toBe("12.345,00"));
});
