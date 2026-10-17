import { describe, expect, it } from "vitest";
import { findSimilarArticle } from "./article-match";

const arts = [
  { id: "1", title: "O fim da escala 6x1 no Brasil: impactos na economia e produtividade das empresas" },
  { id: "2", title: "Como a IA está mudando a gestão no Brasil" },
];

describe("findSimilarArticle", () => {
  it("encontra o artigo com o título idêntico", () => {
    expect(findSimilarArticle(arts[0]!.title, arts)?.id).toBe("1");
  });
  it("encontra o artigo com título digitado pela metade", () => {
    expect(findSimilarArticle("O fim da escala 6x1 no Brasil: impactos na econo", arts)?.id).toBe("1");
  });
  it("encontra o artigo com pequenas diferenças (acima de 80%)", () => {
    expect(findSimilarArticle("Fim da escala 6x1 no Brasil - impactos na economia e na produtividade das empresas", arts)?.id).toBe("1");
  });
  it("não vincula assunto pouco parecido", () => {
    expect(findSimilarArticle("Crescimento e expansão para novos mercados", arts)).toBeUndefined();
  });
});
