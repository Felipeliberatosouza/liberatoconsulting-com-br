import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AdminShell } from "@/components/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { getPanelSession } from "@/lib/users.functions";
import { canAccess, ROLE_DESCRIPTION, ROLE_LABEL, type PanelRole } from "@/lib/roles";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Liberato Consulting" },
      { name: "description", content: "Gerencie usuários, conteúdos, dados e configurações." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel administrativo — Liberato Consulting" },
      {
        property: "og:description",
        content: "Gerencie usuários, conteúdos, dados e configurações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

const CARDS = [
  {
    to: "/admin/users",
    title: "Usuários",
    text: "Equipe com acesso ao painel, assinantes da newsletter, candidatos e leads.",
  },
  {
    to: "/admin/consultores",
    title: "Consultores",
    text: "Equipe de consultores exibida no site, com perfil e áreas de atuação.",
  },
  {
    to: "/admin/approvals",
    title: "Aprovações",
    text: "Alterações enviadas por consultores e autores aguardando sua liberação.",
  },
  {
    to: "/admin/content",
    title: "Conteúdos",
    text: "Publique artigos, guias e estudos que aparecem na seção Conteúdo.",
  },
  {
    to: "/admin/brasil",
    title: "Dados do Brasil",
    text: "Textos dos subitens, com geração por IA, fontes de pesquisa e autores.",
  },
  {
    to: "/admin/indicadores",
    title: "Indicadores econômicos",
    text: "Números macroeconômicos atualizados automaticamente nas fontes oficiais.",
  },
  {
    to: "/admin/newsletter",
    title: "Newsletter",
    text: "Escreva com IA, gere imagem e PDF, e envie para toda a base de inscritos.",
  },
  {
    to: "/admin/boletim",
    title: "Boletim Semanal",
    text: "Inscritos, pré-visualização e envio por e-mail e WhatsApp, por segmento.",
  },
  {
    to: "/admin/propaganda",
    title: "Propaganda",
    text: "Artes e textos para divulgação do serviço em redes sociais e anúncios.",
  },
  {
    to: "/admin/historico",
    title: "Histórico de publicações",
    text: "Newsletters enviadas, boletins semanais disparados e conteúdos publicados.",
  },
  {
    to: "/admin/leads",
    title: "Leads recebidos",
    text: "Contatos enviados pelos formulários das páginas de serviço.",
  },
  {
    to: "/admin/applications",
    title: "Candidaturas",
    text: "Currículos enviados pelo formulário Trabalhe Conosco.",
  },
  {
    to: "/admin/empresa",
    title: "Dados da consultoria",
    text: "Razão social, CNPJ, sócios, logomarca e contratos de vínculo.",
  },
  {
    to: "/admin/settings",
    title: "Configurações",
    text: "Cores, textos, carrossel, logomarca, contatos e e-mails automáticos.",
  },
];

function AdminHome() {
  const session = useQuery({
    queryKey: ["panel-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return null;
      try {
        return await getPanelSession();
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const roles = session.data?.roles ?? [];
  const cards = CARDS.filter((c) => canAccess(roles, c.to));
  const roleLabels = roles
    .map((r) => ROLE_LABEL[r as PanelRole])
    .filter(Boolean)
    .join(", ");

  return (
    <AdminShell
      title="Painel administrativo"
      description="Tudo que você alterar aqui vale para o site publicado, em todos os idiomas."
    >
      {roleLabels && (
        <div className="mb-8 rounded-lg border border-border bg-background p-5">
          <p className="text-sm">
            Você está conectado como <strong>{roleLabels}</strong>.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {ROLE_DESCRIPTION[(roles[0] as PanelRole) ?? "admin"]}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-border bg-background p-6 transition-colors hover:border-accent"
          >
            <h2 className="font-display text-lg font-bold">{c.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
