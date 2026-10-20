import { createFileRoute } from "@tanstack/react-router";
import { AdEditor } from "@/components/AdEditor";

export const Route = createFileRoute("/admin/divulgacao-ferramentas")({
  head: () => ({ meta: [
    { title: "Divulgação de ferramentas — Liberato Consulting" },
    { name: "description", content: "Prepare artes e legendas das ferramentas de gestão para LinkedIn, WhatsApp e Instagram." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Divulgação de ferramentas — Liberato Consulting" },
    { property: "og:description", content: "Divulgue ferramentas publicadas com identidade oficial e passo a passo opcional de acesso." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ToolPromotionPage,
});

function ToolPromotionPage() {
  return <AdEditor toolsOnly />;
}