import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getAdminSession } from "@/lib/admin.functions";

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/theme", label: "Cores" },
  { to: "/admin/texts", label: "Textos" },
  { to: "/admin/content", label: "Conteúdo" },
  { to: "/admin/leads", label: "Leads" },
  { to: "/admin/applications", label: "Candidaturas" },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const session = useQuery({
    queryKey: ["admin-session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { isAdmin: false, userId: null as string | null };
      try {
        return await getAdminSession();
      } catch {
        return { isAdmin: false, userId: null as string | null };
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (session.isSuccess && !session.data.isAdmin) {
      navigate({ to: "/admin/login", replace: true });
    }
  }, [session.isSuccess, session.data, navigate]);

  if (session.isLoading) {
    return <div className="p-16 text-sm text-muted-foreground">Carregando painel…</div>;
  }
  if (!session.data?.isAdmin) {
    return <div className="p-16 text-sm text-muted-foreground">Redirecionando…</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
          <Link to="/" className="font-display text-sm font-bold tracking-tight">
            LIBERATO <span className="text-accent">admin</span>
          </Link>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => {
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
              navigate({ to: "/admin/login", replace: true });
            }}
            className="ml-auto text-sm text-muted-foreground hover:text-accent"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
