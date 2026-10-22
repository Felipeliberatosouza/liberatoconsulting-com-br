import { describe, it, expect } from "vitest";
import { logoBackground, presentationLogoBackground, presentationSize, referenceDuration, selectPresentationResources, STANDARD_NEXT_STEPS } from "./presentation-rules";

describe("commercial presentation rules", () => {
  it("adapts the background only for the proposal client's white logo", () => {
    expect(presentationLogoBackground("client", "1B2A41")).toBe("1B2A41");
    expect(presentationLogoBackground("client", "FFFFFF")).toBe("FFFFFF");
  });
  it("preserves the original white background of reference company logos", () => {
    expect(presentationLogoBackground("reference", "1B2A41")).toBe("FFFFFF");
    expect(presentationLogoBackground("reference", "FFFFFF")).toBe("FFFFFF");
  });
  it("keeps white logos on dark backgrounds without mutating pixels", () => {
    const pixels = [255, 255, 255, 255, 0, 0, 0, 0];
    expect(logoBackground(pixels)).toBe("1B2A41");
    expect(pixels).toEqual([255, 255, 255, 255, 0, 0, 0, 0]);
  });
  it("keeps dark logos on white backgrounds", () => {
    expect(logoBackground([10, 10, 10, 255])).toBe("FFFFFF");
  });
  it("selects only the SME duration without the size label", () => {
    expect(referenceDuration("4–8 semanas (PME e startups) · 6–12 semanas (corporativo)", "", "pme")).toBe("4–8 semanas");
  });
  it("selects only the corporate duration without the size label", () => {
    expect(referenceDuration("4–8 semanas (PME e startups) · 6–12 semanas (corporativo)", "", "corporativo")).toBe("6–12 semanas");
    expect(referenceDuration("4–8 semanas", "8–10 semanas (corporativo)", "corporativo")).toBe("8–10 semanas");
  });
  it("never replaces the required four next steps with AI suggestions", () => {
    expect(STANDARD_NEXT_STEPS).toEqual(["Escopo inicial e diagnóstico", "Reunião de alinhamentos e objetivos", "Proposta comercial. Assinatura de contrato e de NDA", "Início do cronograma"]);
  });
  it("selects a guide and relevant tool before a more popular unrelated tool", () => {
    const selected = selectPresentationResources([
      { title: "Guia", summary: "", kind: "guide", url: "/guia-gestao" },
      { title: "Controle de estoque", summary: "", kind: "tool", popularity: 500, url: "/estoque" },
      { title: "CRM e prospecção", summary: "", kind: "tool", popularity: 1, url: "/crm" },
    ], "Agência de marketing digital");
    expect(selected.map(r => r.url)).toEqual(["/guia-gestao", "/crm"]);
  });
  it("falls back to the most visible tool when no topic matches", () => {
    expect(selectPresentationResources([
      { title: "Estoque", summary: "", kind: "tool", popularity: 2, url: "/estoque" },
      { title: "Custos", summary: "", kind: "tool", popularity: 20, url: "/custos" },
    ], "Turismo")[0]?.url).toBe("/custos");
  });
  it("recognizes medium companies as SME and large companies as corporate", () => {
    expect(presentationSize("Média Empresa")).toBe("pme");
    expect(presentationSize("grande")).toBe("corporativo");
    expect(presentationSize("")).toBe("");
  });
});