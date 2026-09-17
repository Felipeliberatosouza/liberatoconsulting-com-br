import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronDown, FileText, LogIn, LogOut, Mail, Newspaper, Settings, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getToolsAccount } from "@/lib/tools.functions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const links = [
  { label: "Ferramentas de Gestão", section: "ferramentas", icon: Wrench },
  { label: "Guia Gestão Completa para Crescer com Controle", section: "guia", icon: BookOpen },
  { label: "Serviços", section: "servicos", icon: FileText },
  { label: "Newsletter", section: "newsletter", icon: Mail },
  { label: "Boletim Semanal", section: "boletim", icon: Newspaper },
  { label: "Insights", section: "insights", icon: BookOpen },
  { label: "Artigos", section: "artigos", icon: FileText },
  { label: "Configurar meus dados", section: "perfil", icon: Settings },
] as const;

export function AccountMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionReady, setSessionReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const account = useQuery({ queryKey: ["header-tools-account"], queryFn: () => getToolsAccount(), enabled: signedIn, retry: false });

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setSessionReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSignedIn(Boolean(next)); setSessionReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!sessionReady) return null;
  if (!signedIn) return (
    <div className={mobile ? "flex gap-3 py-4" : "hidden items-center gap-2 lg:flex"}>
      <Button asChild variant="ghost" size="sm"><Link to="/ferramentas" hash="entrar" onClick={onNavigate}><LogIn /> Entrar</Link></Button>
      <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/ferramentas" search={{ modo: "cadastro" }} onClick={onNavigate}>Criar conta</Link></Button>
    </div>
  );

  const firstName = account.data?.profile?.first_name?.trim() || "Cliente";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={mobile ? "w-full justify-between" : "hidden max-w-44 lg:inline-flex"}>Olá, {firstName}<ChevronDown /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Sua área de materiais</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((item) => <DropdownMenuItem key={item.section} asChild><Link to="/area-cliente" search={{ secao: item.section }} onClick={onNavigate}><item.icon />{item.label}</Link></DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground focus:bg-accent focus:text-accent-foreground" onSelect={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); onNavigate?.(); navigate({ to: "/ferramentas", replace: true }); }}><LogOut /> Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}