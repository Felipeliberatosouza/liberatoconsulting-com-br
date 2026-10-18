import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getPanelSession } from "@/lib/users.functions";
import { canAccess } from "@/lib/roles";
import { useLanguage } from "@/i18n";

type NavItem = { to: string; label: string; exact?: boolean };
const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Visão geral", items: [{ to: "/admin", label: "Visão geral", exact: true }] },
  {
    label: "Pessoas e clientes",
    items: [
      { to: "/admin/users", label: "Central de usuários" },
      { to: "/admin/consultores", label: "Consultores" },
      { to: "/admin/cadastros-consultores", label: "Cadastros de novos consultores" },
      { to: "/admin/crm", label: "CRM de clientes" },
    ],
  },
  {
    label: "Projetos",
    items: [
      { to: "/admin/projetos", label: "Visão das 4 etapas", exact: true },
      { to: "/admin/projetos/escopos", label: "1. Escopos iniciais" },
      { to: "/admin/projetos/diagnostico", label: "2. Diagnóstico detalhado" },
      { to: "/admin/precificacao", label: "3. Precificação" },
      { to: "/admin/projetos/apresentacoes", label: "4. Apresentações e orçamentos" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/admin/content", label: "Artigos e estudos" },
      { to: "/admin/brasil", label: "Dados do Brasil" },
      { to: "/admin/indicadores", label: "Indicadores econômicos" },
      { to: "/admin/ferramentas", label: "Ferramentas gratuitas" },
      { to: "/admin/approvals", label: "Aprovações" },
    ],
  },
  {
    label: "Envios e marketing",
    items: [
      { to: "/admin/envios", label: "Painel de envios" },
      { to: "/admin/newsletter", label: "Newsletter" },
      { to: "/admin/boletim", label: "Boletim Semanal" },
      { to: "/admin/propaganda", label: "Propaganda" },
      { to: "/admin/historico", label: "Histórico de publicações" },
    ],
  },
  {
    label: "Site e sistema",
    items: [
      { to: "/admin/institucional", label: "Site institucional" },
      { to: "/admin/servicos", label: "Cadastro de serviços" },
      { to: "/admin/empresa", label: "Dados da consultoria" },
      { to: "/admin/settings", label: "Configurações" },
    ],
  },
];

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.to || pathname === `${item.to}/` : pathname.startsWith(item.to);
}

export function AdminShell({
  title,
  description,
  requireAdmin = false,
  children,
}: {
  title: string;
  description?: string;
  requireAdmin?: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { logoUrl } = useLanguage();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
    staleTime: 30_000,
  });

  const roles = session.data?.roles ?? [];
  const isAdmin = Boolean(session.data?.isAdmin);
  const allowed = Boolean(session.data) && (requireAdmin ? isAdmin : canAccess(roles, pathname));
  const needsContract = session.data?.needsContract ?? null;

  const needsMfa = Boolean(session.data?.needsMfa);

  useEffect(() => {
    if (!session.isSuccess) return;
    if (!session.data || needsMfa || roles.length === 0) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    if (needsContract && pathname !== "/admin/contrato") {
      navigate({ to: "/admin/contrato", replace: true });
      return;
    }
    if (!allowed && pathname !== "/admin") navigate({ to: "/admin", replace: true });
  }, [session.isSuccess, session.data, needsMfa, roles.length, allowed, needsContract, pathname, navigate]);

  if (session.isLoading) {
    return <div className="p-16 text-sm text-muted-foreground">Carregando painel…</div>;
  }
  if (!session.data || needsMfa || roles.length === 0) {
    return <div className="p-16 text-sm text-muted-foreground">Redirecionando…</div>;
  }
  if (needsContract && pathname !== "/admin/contrato") {
    return <div className="p-16 text-sm text-muted-foreground">Redirecionando ao contrato…</div>;
  }
  if (!allowed) {
    return (
      <div className="p-16 text-sm text-muted-foreground">
        Você não tem permissão para acessar esta área.
      </div>
    );
  }

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => canAccess(roles, item.to)),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="Liberato Consulting" className="h-9 w-auto" />
            <span className="text-sm font-semibold text-accent">admin</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {groups.map((g) => {
              const active = g.items.some((i) => isActive(i, pathname));
              const cls = `rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:text-accent"
              }`;
              if (g.items.length === 1) {
                return (
                  <Link key={g.label} to={g.items[0].to} className={cls}>
                    {g.label}
                  </Link>
                );
              }
              return (
                <div key={g.label} className="group relative">
                  <button type="button" className={cls} aria-haspopup="true">
                    {g.label} ▾
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="min-w-60 rounded-lg border border-border bg-background p-1 shadow-lg">
                      {g.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`block rounded-md px-3 py-2 text-sm ${
                            isActive(item, pathname)
                              ? "bg-secondary font-semibold text-accent"
                              : "text-foreground hover:bg-secondary hover:text-accent"
                          }`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/", replace: true });
            }}
            className="ml-auto text-sm text-muted-foreground hover:text-accent"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
