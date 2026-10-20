import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/AdEditor";

export const Route = createFileRoute("/admin/propaganda")({
  head: () => ({
    meta: [
      { title: "Propaganda em redes sociais — Painel Liberato Consulting" },
      {
        name: "description",
        content: "Crie peças de propaganda para LinkedIn, Instagram e WhatsApp em quatro idiomas.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Propaganda em redes sociais — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Gere artes publicitárias multilíngues com a marca da consultoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdEditor,
});

