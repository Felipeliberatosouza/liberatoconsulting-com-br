import { describe, it, expect } from "vitest";
import { pt } from "@/i18n/pt";
import { LEGACY_SERVICE_REDIRECTS } from "./service-redirects";
import { questionsForFamily } from "./diagnostic-catalog";
import { courseSchema, trainingProgramSchema } from "./schema";

describe("catálogo reorganizado", () => {
  it.each(["estrategia", "operacoes", "empreendedorismo", "pesquisas"])("mantém três consultorias na área %s", (group) => {
    expect(pt.serviceDetail.pages.filter((p) => p.group === group)).toHaveLength(3);
  });
  it("mantém seis treinamentos e links com até duas palavras", () => {
    expect(pt.serviceDetail.pages.filter((p) => p.group === "treinamento")).toHaveLength(6);
    for (const p of pt.serviceDetail.pages) expect(p.id.split("-").length).toBeLessThanOrEqual(2);
  });
  it("todos os links anteriores terminam em uma página atual sem ciclos", () => {
    const slugs = [...pt.serviceDetail.pages.map((p) => p.id), ...pt.serviceFamilies.items.map((f) => f.id)];
    for (const target of Object.values(LEGACY_SERVICE_REDIRECTS)) {
      let current = target;
      const seen = new Set<string>();
      while (true) {
        const next = LEGACY_SERVICE_REDIRECTS[current];
        if (!next) break;
        expect(seen.has(current)).toBe(false);
        seen.add(current);
        current = next;
      }
      expect(slugs).toContain(current);
    }
  });
  it("usa perguntas de capacitação em treinamentos e não questões de dimensionamento", () => {
    const qs = questionsForFamily("treinamento-in-company");
    expect(qs.some((q) => q.id === "TRN-02")).toBe(true);
    expect(qs.some((q) => q.id === "TAM-01")).toBe(false);
  });
  it("publica curso e programa sem preços nem certificações inventadas", () => {
    const course = courseSchema({ name: "IA", description: "Prática", path: "/services/ia-gestores", audience: "Gestores", teaches: ["IA"] });
    expect(course["@type"]).toBe("Course");
    expect(course).not.toHaveProperty("offers");
    expect(trainingProgramSchema({ name: "Treinamento", description: "Ação", path: "/services/treinamento-in-company", courses: [{ name: "IA", path: "/services/ia-gestores" }] }).hasCourse).toHaveLength(1);
  });
});