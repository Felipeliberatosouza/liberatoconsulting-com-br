import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getPanelSession } from "@/lib/users.functions";
import { canAccess } from "@/lib/roles";

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/users", label: "Usuários" },
  { to: "/admin/approvals", label: "Aprovações" },
  { to: "/admin/content", label: "Conteúdo" },
  { to: "/admin/brasil", label: "Dados do Brasil" },
  { to: "/admin/indicadores", label: "Indicadores" },
  { to: "/admin/newsletter", label: "Newsletter" },
  { to: "/admin/leads", label: "Leads" },
  { to: "/admin/applications", label: "Candidaturas" },
  { to: "/admin/empresa", label: "Dados da consultoria" },
  { to: "/admin/settings", label: "Configurações" },
];

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

  useEffect(() => {
    if (!session.isSuccess) return;
    if (!session.data || roles.length === 0) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    if (needsContract && pathname !== "/admin/contrato") {
      navigate({ to: "/admin/contrato", replace: true });
      return;
    }
    if (!allowed && pathname !== "/admin") navigate({ to: "/admin", replace: true });
  }, [session.isSuccess, session.data, roles.length, allowed, needsContract, pathname, navigate]);

  if (session.isLoading) {
    return <div className="p-16 text-sm text-muted-foreground">Carregando painel…</div>;
  }
  if (!session.data || roles.length === 0) {
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

  const items = NAV.filter((item) => canAccess(roles, item.to));

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="Liberato Consulting" className="h-9 w-auto" />
            <span className="text-sm font-semibold text-accent">admin</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {items.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-ink text-ink-foreground"
                      : "text-muted-foreground hover:text-accent"
                  }`}
                >
                  {item.label}
                </Link>
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
