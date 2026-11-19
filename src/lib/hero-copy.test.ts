import { expect, it } from "vitest";
import { heroCopy, heroTextKey } from "./hero-copy";
import { heroSlideOrder } from "./site-config";

it("keeps the five configured banners in their original order", () => {
  const ids = ["consultoria", "pesquisas", "empreendedorismo", "operacoes", "estrategia"];
  expect(heroSlideOrder({ slides: ids.map((id) => ({ id, enabled: true })) }).filter((slide) => slide.enabled).map((slide) => slide.id)).toEqual(ids);
});

it("keeps saved copy on the named banner and ignores old position overrides", () => {
  const slides = heroCopy("pt", {
    "hero.slides[0].title": { pt: "Antigo título deslocado" },
    [heroTextKey("pesquisas", "title")]: { pt: "Pesquisa atualizada" },
  });
  expect(slides.find(({ id }) => id === "consultoria")?.title).toBe("Sua empresa vende, mas o lucro, as metas ou a equipe não acompanham?");
  expect(slides.find(({ id }) => id === "pesquisas")?.title).toBe("Pesquisa atualizada");
});