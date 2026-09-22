import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Download, FileText, LogOut, Mail, Newspaper, Search, Settings, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n";
import { LANG_HTML } from "@/i18n/config";
import { HEADER_TRANSLATIONS } from "@/lib/header-translations";
import { pageText } from "@/lib/page-translations";
import { getMemberContent, getToolDownload, getToolsAccount, requestMemberService, saveToolsProfile } from "@/lib/tools.functions";
import { formatPhone, isValidPhone } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Section = "ferramentas" | "guia" | "servicos" | "newsletter" | "boletim" | "insights" | "artigos" | "perfil";
const sections: Array<{ id: Section; label: string; icon: typeof Wrench }> = [
  { id: "ferramentas", label: "Ferramentas de Gestão", icon: Wrench }, { id: "guia", label: "Guia Gestão Completa", icon: BookOpen },
  { id: "servicos", label: "Serviços", icon: FileText }, { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "boletim", label: "Boletim Semanal", icon: Newspaper }, { id: "insights", label: "Insights", icon: BookOpen },
  { id: "artigos", label: "Artigos", icon: FileText }, { id: "perfil", label: "Configurar meus dados", icon: Settings },
];
const EMPTY = { first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", revenue_range: "", segment: "", receive_newsletter: true, receive_bulletin: true, receive_insights: true };
const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

export const Route = createFileRoute("/area-cliente")({
  validateSearch: (search: Record<string, unknown>) => ({ secao: typeof search["secao"] === "string" ? search["secao"] as Section : "ferramentas" as Section }),
  head: () => ({ meta: [{ title: "Área do cliente — Liberato Consulting" }, { name: "description", content: "Área reservada para materiais, conteúdos e preferências da Liberato Consulting." }, { property: "og:title", content: "Área do cliente — Liberato Consulting" }, { property: "og:description", content: "Materiais e conteúdos para apoiar sua gestão." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CustomerArea,
});

function CustomerArea() {
  const { secao } = Route.useSearch(); const navigate = useNavigate(); const queryClient = useQueryClient(); const { lang, t } = useLanguage();
  const p = pageText(lang).area; const m = HEADER_TRANSLATIONS[lang];
  const [ready, setReady] = useState(false); const [signedIn, setSignedIn] = useState(false); const [search, setSearch] = useState(""); const [service, setService] = useState(""); const [message, setMessage] = useState(""); const [profile, setProfile] = useState(EMPTY);
  const account = useQuery({ queryKey: ["customer-account"], queryFn: () => getToolsAccount(), enabled: signedIn, retry: false });
  const content = useQuery({ queryKey: ["customer-content"], queryFn: () => getMemberContent(), enabled: signedIn, retry: false });
  const save = useServerFn(saveToolsProfile); const request = useServerFn(requestMemberService); const getDownload = useServerFn(getToolDownload);
  useEffect(() => { void supabase.auth.getSession().then(({ data }) => { setSignedIn(Boolean(data.session)); setReady(true); }); }, []);
  useEffect(() => { if (account.data?.profile) setProfile({ ...EMPTY, ...account.data.profile }); }, [account.data?.profile]);
  const articles = useMemo(() => { const needle = search.trim().toLocaleLowerCase(); return (content.data?.articles ?? []).filter((item) => !needle || `${item.title} ${item.summary} ${item.authors}`.toLocaleLowerCase().includes(needle)); }, [content.data?.articles, search]);
  const recent = (content.data?.articles ?? []).filter((item) => new Date(item.article_date || item.created_at).getTime() >= Date.now() - 92 * 86400000);
  if (!ready) return <div className="mx-auto max-w-7xl px-6 py-20">{p.loading}</div>;
  if (!signedIn) return <section className="mx-auto max-w-3xl px-6 py-24 text-center"><h1 className="text-4xl font-bold">{p.signedOutTitle}</h1><p className="mt-4 text-muted-foreground">{p.signedOutText}</p><Button asChild className="mt-7 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/ferramentas" search={{ modo: undefined }}>{p.signedOutCta}</Link></Button></section>;
  const current = sections.some((item) => item.id === secao) ? secao : "ferramentas";
  return <div className="bg-secondary/40 py-12"><div className="mx-auto max-w-7xl px-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{m.areaTitle}</p><h1 className="mt-2 text-4xl font-bold">{m.greeting}, {account.data?.profile?.first_name || m.customer}</h1></div><Button variant="ghost" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground" onClick={async()=>{await queryClient.cancelQueries();queryClient.clear();await supabase.auth.signOut();navigate({to:"/ferramentas",search:{ modo: undefined },replace:true});}}><LogOut/> {m.signOut}</Button></div>
  <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]"><nav className="flex gap-2 overflow-x-auto lg:flex-col">{sections.map((item)=><Button key={item.id} asChild variant={current===item.id?"default":"ghost"} className="justify-start whitespace-nowrap"><Link to="/area-cliente" search={{secao:item.id}}><item.icon/>{m[item.key]}</Link></Button>)}</nav><main className="min-w-0 bg-background p-6 md:p-9">
  {current==="ferramentas" && <ContentTitle title={p.toolsTitle} body={p.toolsBody}/>}{current==="ferramentas" && <div className="mt-7 grid gap-5 md:grid-cols-2">{account.data?.tools.map((tool)=><article key={tool.id} className="border-t-2 border-accent py-5"><h2 className="text-xl font-bold">{tool.title}</h2><p className="mt-2 text-sm text-muted-foreground">{tool.summary}</p><Button className="mt-5" onClick={async()=>{const result=await getDownload({data:{id:tool.id}});if(result.ok)window.location.assign(result.url);else toast.error(result.error)}}><Download/>{p.download}</Button></article>)}</div>}
  {current==="guia" && <><ContentTitle title={m.guide} body={p.guideBody}/><Button asChild className="mt-6"><Link to="/guia-gestao">{p.guideCta}</Link></Button></>}
  {current==="servicos" && <><ContentTitle title={p.servicesTitle} body={p.servicesBody}/><form className="mt-7 max-w-2xl space-y-5" onSubmit={async(e)=>{e.preventDefault();const item=t.serviceDetail.pages.find(p=>p.id===service);if(!item)return;const result=await request({data:{serviceSlug:service,serviceTitle:item.title,message}});if(result.ok){toast.success(p.requestSent);setMessage("");}else toast.error(result.error)}}><label className="block text-sm font-medium">{p.serviceLabel}<select required value={service} onChange={e=>setService(e.target.value)} className={field}><option value="">{p.select}</option>{t.serviceDetail.pages.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="block text-sm font-medium">{p.howHelp}<textarea required minLength={5} rows={5} value={message} onChange={e=>setMessage(e.target.value)} className={field}/></label><Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{p.sendRequest}</Button></form></>}
  {current==="newsletter" && <><ContentTitle title={m.newsletter} body={p.newsletterBody}/><SimpleList locale={LANG_HTML[lang]} empty={p.emptyPeriod} items={(content.data?.newsletters??[]).map(item=>({id:item.id,title:item.subject,date:item.reference_date||item.published_at,slug:item.slug}))}/></>}
  {current==="boletim" && <><ContentTitle title={m.bulletin} body={p.bulletinBody}/><SimpleList locale={LANG_HTML[lang]} empty={p.emptyPeriod} items={(content.data?.bulletins??[]).map(item=>({id:item.id,title:item.subject,date:item.created_at,subtitle:item.date_label}))}/></>}
  {current==="insights" && <><ContentTitle title={m.insights} body={p.insightsBody}/><ArticleList empty={p.emptyContent} items={recent.filter(item=>item.kind.toLocaleLowerCase().includes("insight"))}/></>}
  {current==="artigos" && <><ContentTitle title={m.articles} body={p.articlesBody}/><label className="relative mt-6 block"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={p.searchPlaceholder} className={`${field} pl-10`}/></label><ArticleList empty={p.emptyContent} items={articles}/></>}
  {current==="perfil" && <><ContentTitle title={m.settings} body={p.profileBody}/><form className="mt-7 grid gap-4 md:grid-cols-2" onSubmit={async(e)=>{e.preventDefault();if(!isValidPhone(profile.phone)){toast.error(p.invalidPhone);return;}const result=await save({data:profile});if(result.ok){toast.success(p.saved);void account.refetch();}else toast.error(result.error)}}>{([['first_name',p.firstName],['last_name',p.lastName],['email',p.email],['company',p.company],['job_title',p.jobTitle],['revenue_range',p.revenue],['segment',p.segment]] as const).map(([key,label])=><label key={key} className="text-sm font-medium">{label}<input required type={key==='email'?'email':'text'} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})} className={field}/></label>)}<label className="text-sm font-medium">{p.phone}<input required value={profile.phone} onChange={e=>setProfile({...profile,phone:formatPhone(e.target.value)})} className={field}/></label><div className="space-y-4 border-t border-border pt-5 md:col-span-2">{([['receive_newsletter',p.prefNewsletter],['receive_bulletin',p.prefBulletin],['receive_insights',p.prefInsights]] as const).map(([key,label])=><label key={key} className="flex items-center justify-between gap-4 text-sm font-medium"><span>{label}</span><Switch checked={profile[key]} onCheckedChange={checked=>setProfile({...profile,[key]:checked})}/></label>)}</div><Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 md:col-span-2 md:w-fit">{p.save}</Button></form></>}
  </main></div></div></div>;
}

function ContentTitle({title,body}:{title:string;body:string}) { return <div><h2 className="text-3xl font-bold">{title}</h2><p className="mt-2 text-muted-foreground">{body}</p></div>; }
function SimpleList({items,locale,empty}:{locale:string;empty:string;items:Array<{id:string;title:string;date:string|null;slug?:string|null;subtitle?:string}>}) { return <div className="mt-7 divide-y divide-border">{items.map(item=><article key={item.id} className="py-5"><p className="text-xs text-muted-foreground">{item.subtitle || (item.date ? new Date(item.date).toLocaleDateString(locale) : "")}</p><h3 className="mt-1 text-lg font-bold">{item.slug?<Link to="/newsletter/$slug" params={{slug:item.slug}} className="hover:text-accent">{item.title}</Link>:item.title}</h3></article>)}{!items.length&&<p className="py-7 text-muted-foreground">{empty}</p>}</div>; }
function ArticleList({items,empty}:{empty:string;items:Array<{id:string;slug:string;title:string;summary:string}>}) { return <div className="mt-7 grid gap-5 md:grid-cols-2">{items.map(item=><article key={item.id} className="border-t-2 border-ink py-5"><h3 className="text-lg font-bold"><Link to="/content/$slug" params={{slug:item.slug}} className="hover:text-accent">{item.title}</Link></h3><p className="mt-2 text-sm text-muted-foreground">{item.summary}</p></article>)}{!items.length&&<p className="text-muted-foreground">{empty}</p>}</div>; }