import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, LockKeyhole, LogOut, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getToolDownload, getToolsAccount, saveToolsProfile } from "@/lib/tools.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";
import { formatPhone, isValidPhone } from "@/lib/validation";

export const Route = createFileRoute("/ferramentas")({
  validateSearch: (search: Record<string, unknown>): { modo: "cadastro" | undefined } => ({ modo: search["modo"] === "cadastro" ? "cadastro" : undefined }),
  head: () => ({ meta: [{ title: "Ferramentas gratuitas de gestão — Liberato Consulting" }, { name: "description", content: "Guias e planilhas gratuitas para melhorar a gestão da sua empresa." }, { property: "og:title", content: "Ferramentas gratuitas de gestão — Liberato Consulting" }, { property: "og:description", content: "Biblioteca de guias e planilhas práticas para empresas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ToolsPage,
});

const input = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const EMPTY = { first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", revenue_range: "", segment: "", receive_newsletter: true, receive_bulletin: true, receive_insights: true };

function ToolsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const save = useServerFn(saveToolsProfile);
  const download = useServerFn(getToolDownload);
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const account = useQuery({ queryKey: ["tools-account"], queryFn: () => getToolsAccount(), enabled: Boolean(session), retry: false });
  const [profile, setProfile] = useState(EMPTY);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setSessionReady(true); }); const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setSessionReady(true); }); return () => data.subscription.unsubscribe(); }, []);
  useEffect(() => { if (account.data?.profile) setProfile(account.data.profile); }, [account.data?.profile]);
  useEffect(() => { const email = session?.user?.email ?? ""; if (email) setProfile((prev) => (prev.email ? prev : { ...prev, email })); }, [session]);

  if (!sessionReady) return <div className="mx-auto max-w-7xl px-6 py-24 text-muted-foreground">Carregando…</div>;
  if (!session) return <ToolsAuth onDone={() => { void supabase.auth.getSession().then(({ data }) => setSession(data.session)); }} />;
  const saved = (account.data?.profile ?? null) as Record<string, unknown> | null;
  // O acesso à biblioteca depende do perfil já salvo no banco, nunca do que está sendo digitado.
  const complete = Boolean(saved) && Object.keys(EMPTY).every((key) => String(saved?.[key] ?? "").trim()) && isValidPhone(String(saved?.["phone"] ?? ""));
  const formValid = Object.values(profile).every((value) => String(value).trim()) && isValidPhone(profile.phone);
   return <div className="bg-secondary/40 py-16"><div className="mx-auto max-w-7xl px-6"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Biblioteca gratuita</p><h1 className="mt-4 text-4xl font-bold md:text-6xl">Ferramentas para melhorar sua gestão</h1></div><button onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: "/ferramentas", search: { modo: undefined }, replace: true }); }} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"><LogOut className="size-4" /> Sair</button></div>
    {!complete ? <form className="mt-12 grid gap-4 bg-background p-6 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); if (!formValid) { toast.error("Preencha todos os campos corretamente."); return; } const result=await save({ data: profile }); if(result.ok){toast.success("Perfil salvo."); void account.refetch();} else toast.error(result.error); }}><div className="md:col-span-2"><h2 className="text-2xl font-bold">Complete seu perfil</h2><p className="mt-2 text-sm text-muted-foreground">Esses dados ajudam a Liberato Consulting a preparar materiais mais relevantes.</p></div>{([['first_name','Nome'],['last_name','Sobrenome'],['email','E-mail'],['company','Empresa'],['job_title','Cargo']] as const).map(([key,label])=><label key={key} className="text-sm font-medium">{label} *<input required type={key==='email'?'email':'text'} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})} className={input}/></label>)}<label className="text-sm font-medium">Celular *<input required value={profile.phone} onFocus={()=>!profile.phone&&setProfile({...profile,phone:'+55'})} onChange={e=>setProfile({...profile,phone:formatPhone(e.target.value)})} className={input}/></label><label className="text-sm font-medium">Faixa de faturamento *<select required value={profile.revenue_range} onChange={e=>setProfile({...profile,revenue_range:e.target.value})} className={input}><option value="">Selecione</option>{['Até R$ 360 mil/ano','R$ 360 mil a R$ 4,8 milhões/ano','R$ 4,8 milhões a R$ 300 milhões/ano','Acima de R$ 300 milhões/ano'].map(v=><option key={v}>{v}</option>)}</select></label><label className="text-sm font-medium">Segmento *<select required value={profile.segment} onChange={e=>setProfile({...profile,segment:e.target.value})} className={input}><option value="">Selecione</option>{CRM_SEGMENTS.map(v=><option key={v}>{v}</option>)}</select></label><button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground md:col-span-2 md:w-fit">Salvar e acessar</button></form> : <section className="mt-12"><div className="grid gap-6 md:grid-cols-3">{account.data?.tools.length ? account.data.tools.map(tool=><article key={tool.id} className="border-t-2 border-accent bg-background p-6"><Wrench className="size-6 text-accent"/><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{tool.category}</p><h2 className="mt-2 text-xl font-bold">{tool.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tool.summary}</p><DownloadButton toolId={tool.id} onDownload={(id)=>download({data:{id}})}/></article>) : <div className="border border-border bg-background p-10 md:col-span-3"><LockKeyhole className="size-8 text-accent"/><h2 className="mt-5 text-2xl font-bold">Novos materiais em preparação</h2><p className="mt-3 text-muted-foreground">Sua área já está pronta. Os primeiros guias e planilhas serão publicados aqui.</p></div>}</div></section>}</div></div>;
}

/** Botão de download: fica laranja no hover e enquanto o arquivo é preparado. */
function DownloadButton({ toolId, onDownload }: { toolId: string; onDownload: (id: string) => Promise<{ ok: true; url: string } | { ok: false; error: string }> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const result = await onDownload(toolId);
          if (result.ok) window.location.assign(result.url);
          else toast.error(result.error);
        } finally {
          setBusy(false);
        }
      }}
      className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${busy ? "bg-accent text-accent-foreground" : "bg-ink text-ink-foreground hover:bg-accent hover:text-accent-foreground"}`}
    >
      <Download className={`size-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? "Baixando…" : "Baixar"}
    </button>
  );
}

function ToolsAuth({ onDone }: { onDone: () => void }) {
  const search = Route.useSearch();
  const [mode,setMode]=useState<'login'|'signup'|'forgot'>(search.modo === 'cadastro' ? 'signup' : 'login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [challenge,setChallenge]=useState(()=>({a:1+Math.floor(Math.random()*8),b:1+Math.floor(Math.random()*8)})); const [captcha,setCaptcha]=useState('');
  function newChallenge(){setChallenge({a:1+Math.floor(Math.random()*8),b:1+Math.floor(Math.random()*8)});setCaptcha('');}
  async function submit(event: React.FormEvent){event.preventDefault(); if(Number(captcha)!==challenge.a+challenge.b){setMessage('Resultado da conta de verificação incorreto.');newChallenge();return;} setBusy(true);setMessage(''); if(mode==='forgot'){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});setBusy(false);newChallenge();setMessage(error?error.message:'Confira seu e-mail para redefinir a senha.');return;} const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/ferramentas'}}):await supabase.auth.signInWithPassword({email,password});setBusy(false);newChallenge();if(result.error){setMessage(result.error.message);return;}if(mode==='signup'&&!result.data.session){setMessage('Confira seu e-mail e confirme a conta para continuar.');return;}onDone();}
  return <section className="min-h-[72vh] bg-secondary/40 py-16"><div className="mx-auto grid max-w-6xl overflow-hidden bg-background lg:grid-cols-2"><div className="bg-ink p-10 text-ink-foreground md:p-14"><p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">Conteúdo prático</p><h1 className="mt-5 text-4xl font-bold leading-tight">Guias e planilhas para uma gestão melhor</h1><p className="mt-5 leading-relaxed text-ink-foreground/70">Crie sua conta gratuita e acesse materiais preparados pela Liberato Consulting.</p><Wrench className="mt-16 size-16 text-accent" strokeWidth={1}/></div><form onSubmit={submit} className="p-8 md:p-14"><h2 className="text-2xl font-bold">{mode==='login'?'Acesse sua conta':mode==='signup'?'Crie sua conta':'Redefina sua senha'}</h2><label className="mt-8 block text-sm font-medium">E-mail<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={input}/></label>{mode!=='forgot'&&<label className="mt-4 block text-sm font-medium">Senha<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className={input}/></label>}<label className="mt-4 block text-sm font-medium">Verificação: quanto é {challenge.a} + {challenge.b}? *<input required inputMode="numeric" value={captcha} onChange={e=>setCaptcha(e.target.value)} className={`${input} max-w-32`}/></label>{message&&<p className="mt-4 text-sm text-muted-foreground">{message}</p>}<button disabled={busy} className="mt-6 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground">{busy?'Aguarde…':mode==='login'?'Entrar':mode==='signup'?'Criar conta':'Enviar link'}</button><div className="mt-5 flex flex-wrap justify-between gap-3 text-sm"><button type="button" onClick={()=>setMode(mode==='signup'?'login':'signup')} className="font-semibold text-accent">{mode==='signup'?'Já tenho conta':'Criar conta gratuita'}</button><button type="button" onClick={()=>setMode(mode==='forgot'?'login':'forgot')} className="text-muted-foreground">{mode==='forgot'?'Voltar':'Esqueci minha senha'}</button></div><p className="mt-8 text-xs text-muted-foreground">Ao continuar, você concorda com nossa <Link to="/privacy" className="underline">Política de Privacidade</Link>.</p></form></div></section>;
}