import { createFileRoute } from "@tanstack/react-router";

import { SurveyShell } from "./satisfacao";

export const Route = createFileRoute("/atendimento")({
  head: () => ({
    meta: [
      { title: "Como foi nosso atendimento? — Liberato Consulting" },
      { name: "description", content: "Mesmo sem fechar, sua opinião vale muito. Avalie nosso atendimento em 3 perguntas." },
      { property: "og:title", content: "Como foi nosso atendimento? — Liberato Consulting" },
      { property: "og:description", content: "Três perguntas rápidas sobre o nosso atendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <SurveyShell kind="nao_executado" />,
});
