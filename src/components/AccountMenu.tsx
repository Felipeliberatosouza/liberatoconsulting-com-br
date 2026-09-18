import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronDown, FileText, LogIn, LogOut, Mail, Newspaper, Settings, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getToolsAccount } from "@/lib/tools.functions";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/i18n";
import { HEADER_TRANSLATIONS } from "@/lib/header-translations";

const links = [
  { labelKey: "tools", section: "ferramentas", icon: Wrench },
  { labelKey: "guide", section: "guia", icon: BookOpen },
  { labelKey: "services", section: "servicos", icon: FileText },
  { labelKey: "newsletter", section: "newsletter", icon: Mail },
  { labelKey: "bulletin", section: "boletim", icon: Newspaper },
  { labelKey: "insights", section: "insights", icon: BookOpen },
  { labelKey: "articles", section: "artigos", icon: FileText },
  { labelKey: "settings", section: "perfil", icon: Settings },
] as const;

export function AccountMenu({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { lang } = useLanguage();
  const copy = HEADER_TRANSLATIONS[lang];
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
      <Button asChild variant="ghost" size="sm"><Link to="/ferramentas" search={{ modo: undefined }} hash="entrar" onClick={onNavigate}><LogIn /> {copy.signIn}</Link></Button>
      <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/ferramentas" search={{ modo: "cadastro" }} onClick={onNavigate}>{copy.createAccount}</Link></Button>
    </div>
  );

  const firstName = account.data?.profile?.first_name?.trim() || copy.customer;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={mobile ? "w-full justify-between" : "hidden max-w-44 lg:inline-flex"}>{copy.greeting}, {firstName}<ChevronDown /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>{copy.areaTitle}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map((item) => <DropdownMenuItem key={item.section} asChild><Link to="/area-cliente" search={{ secao: item.section }} onClick={onNavigate}><item.icon />{copy[item.labelKey]}</Link></DropdownMenuItem>)}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground focus:bg-accent focus:text-accent-foreground" onSelect={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); onNavigate?.(); navigate({ to: "/ferramentas", search: { modo: undefined }, replace: true }); }}><LogOut /> {copy.signOut}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}