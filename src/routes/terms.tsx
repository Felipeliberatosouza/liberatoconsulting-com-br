import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: (ctx) => ({
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
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Termos de Uso — Liberato Consulting" },
      { name: "twitter:description", content: "Condições de acesso e uso do site da Liberato Consulting." },
      { name: "twitter:image", content: OG_IMAGE },
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/terms", headLang(ctx)),
  }),
  component: () => <LegalPage doc="terms" />,
});
