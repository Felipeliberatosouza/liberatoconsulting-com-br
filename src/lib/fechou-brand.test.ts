import { expect, it } from "vitest";
import { emptyCompanyBrand, mergeCompanyDefaults, companyBrandSchema } from "./fechou-brand";
import { extractWebsiteBrand, publicWebsiteUrl } from "./fechou-brand.server";

it("aproveita dados do cadastro sem substituir correções manuais, mesmo vazias", () => {
  const current = { ...emptyCompanyBrand, name: "Nome escolhido", email: "" };
  const next = mergeCompanyDefaults(current, { name: "Cadastro", contact: "Ana", email: "ana@empresa.com" }, new Set(["name","email"]));
  expect(next.name).toBe("Nome escolhido"); expect(next.email).toBe(""); expect(next.contact).toBe("Ana");
});
it("extrai somente informações publicadas pelo site, incluindo marca e contato", () => {
  const result = extractWebsiteBrand(`<title>Empresa Exemplo</title><meta name="theme-color" content="#123456"><script type="application/ld+json">{"@type":"Organization","name":"Exemplo Ltda","logo":"/logo.png","email":"contato@exemplo.com","telephone":"11999999999","address":{"@type":"PostalAddress","addressLocality":"São Paulo"}}</script><a href="https://www.linkedin.com/company/exemplo">LinkedIn</a>`, "https://exemplo.com/");
  expect(result).toMatchObject({ name: "Exemplo Ltda", color: "#123456", logo: "https://exemplo.com/logo.png", email: "contato@exemplo.com", phone: "11999999999", address: "São Paulo", linkedin: "https://www.linkedin.com/company/exemplo" });
  expect(result.instagram).toBe(""); expect(result.segment).toBe("");
});
it("bloqueia endereços internos e não executa instruções contidas no site", () => {
  for (const address of ["https://127.0.0.1","https://host.local","https://example.com:8443","https://user:pass@example.com","http://example.com"]) expect(() => publicWebsiteUrl(address)).toThrow();
  expect(extractWebsiteBrand('<script>fetch("private")</script><title>Exemplo</title>',"https://exemplo.com").name).toBe("Exemplo");
});
it("aceita PNG de marca e rejeita código disfarçado de logomarca", () => {
  expect(companyBrandSchema.safeParse({ ...emptyCompanyBrand, name: "Minha empresa", logo: "data:image/png;base64,aGVsbG8=" }).success).toBe(true);
  expect(companyBrandSchema.safeParse({ ...emptyCompanyBrand, name: "Minha empresa", logo: "javascript:alert(1)" }).success).toBe(false);
});