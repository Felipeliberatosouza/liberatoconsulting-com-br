import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";
import { seoLinks } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Liberato Consulting" },
      {
        name: "description",
        content:
          "Regras de uso do site da Liberato Consulting: conteúdo, propriedade intelectual, responsabilidade e foro.",
      },
      { property: "og:title", content: "Termos de Uso — Liberato Consulting" },
      {
        property: "og:description",
        content: "Condições de acesso e uso do site da Liberato Consulting.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
    links: seoLinks("/terms"),
  }),
  component: () => <LegalPage doc="terms" />,
});
