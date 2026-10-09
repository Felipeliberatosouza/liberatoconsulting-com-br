import { describe, expect, it } from "vitest";
import { isLargeCompany, leadQuality } from "./lead-quality";

describe("leadQuality", () => {
  it("completo: decisor com cargo e canal direto", () => {
    expect(
      leadQuality({ phone: "+55 11 3000-0000", contacts: [{ full_name: "Ana", role_title: "Diretora", email: "ana@x.com" }] }),
    ).toBe("completo");
  });
  it("parcial: só telefone geral", () => {
    expect(leadQuality({ phone: "+55 11 3000-0000", contacts: [] })).toBe("parcial");
  });
  it("básico: sem canal de contato", () => {
    expect(leadQuality({ website: "x.com", contacts: [] })).toBe("basico");
  });
});

describe("isLargeCompany", () => {
  it("corporação é grande", () => expect(isLargeCompany({ size: "corporacao" }, null)).toBe(true));
  it("acima de 499 sem faixa definida é grande", () => expect(isLargeCompany({ employees: 800 }, null)).toBe(true));
  it("PME com 120 funcionários não é grande", () => expect(isLargeCompany({ size: "pme", employees: 120 }, null)).toBe(false));
});
