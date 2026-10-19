import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { AdminShell } from "@/components/AdminShell";
import { CrmProspect } from "@/components/CrmProspect";
import { ProspectEmailPanel } from "@/components/ProspectEmailPanel";

export const Route = createFileRoute("/admin/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção de leads com IA — Painel Liberato Consulting" },
      { name: "description", content: "Encontre empresas por segmento e região e importe para o CRM." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Prospecção de leads com IA — Painel Liberato Consulting" },
      { property: "og:description", content: "Encontre empresas por segmento e região e importe para o CRM." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProspectPage,
});

function ProspectPage() {
  const qc = useQueryClient();
  return (
    <AdminShell
      title="Prospecção de leads com IA"
      description="Encontre novas empresas por segmento e região, avalie a qualidade do contato e importe para o CRM."
      requireAdmin
    >
      <CrmProspect
        onImported={() => {
          void qc.invalidateQueries({ queryKey: ["crm-companies"] });
          void qc.invalidateQueries({ queryKey: ["crm-agenda"] });
        }}
      />
      <ProspectEmailPanel />
    </AdminShell>
  );
}
