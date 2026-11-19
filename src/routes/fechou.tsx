import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/fechou/Workspace";

export const Route = createFileRoute("/fechou")({
  head: () => ({
    meta: [
      { title: "Área de vendas — Fechou! CRM" },
      { name: "description", content: "Área privada de gestão comercial do Fechou! CRM." },
      { property: "og:title", content: "Área de vendas — Fechou! CRM" },
      { property: "og:description", content: "Área privada de gestão comercial do Fechou! CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Workspace,
});
