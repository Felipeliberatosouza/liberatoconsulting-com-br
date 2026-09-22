import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, LockKeyhole, LogOut, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n";
import { getToolDownload, getToolsAccount, saveToolsProfile } from "@/lib/tools.functions";
import { CRM_SEGMENTS } from "@/lib/crm-segments";
import { formatPhone, isValidPhone } from "@/lib/validation";
import { pageText } from "@/lib/page-translations";

export const Route = createFileRoute("/ferramentas")({
  validateSearch: (search: Record<string, unknown>): { modo: "cadastro" | undefined } => ({ modo: search["modo"] === "cadastro" ? "cadastro" : undefined }),
  head: () => ({ meta: [{ title: "Ferramentas gratuitas de gestão — Liberato Consulting" }, { name: "description", content: "Guias e planilhas gratuitas para melhorar a gestão da sua empresa." }, { property: "og:title", content: "Ferramentas gratuitas de gestão — Liberato Consulting" }, { property: "og:description", content: "Biblioteca de guias e planilhas práticas para empresas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ToolsPage,
});

const input = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
type ToolsText = ReturnType<typeof pageText>["tools"];
const EMPTY = { first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", revenue_range: "", segment: "", receive_newsletter: true, receive_bulletin: true, receive_insights: true };

function ToolsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const p = pageText(lang).tools;
  const save = useServerFn(saveToolsProfile);
  const download = useServerFn(getToolDownload);
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>(null);
  const account = useQuery({ queryKey: ["tools-account"], queryFn: () => getToolsAccount(), enabled: Boolean(session), retry: false });
  const [profile, setProfile] = useState(EMPTY);
  const [justSaved, setJustSaved] = useState(false);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => { setSession(data.session); setSessionReady(true); }); const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setSessionReady(true); }); return () => data.subscription.unsubscribe(); }, []);
  useEffect(() => { if (account.data?.profile) setProfile(account.data.profile); }, [account.data?.profile]);
  useEffect(() => { const email = session?.user?.email ?? ""; if (email) setProfile((prev) => (prev.email ? prev : { ...prev, email })); }, [session]);

  if (!sessionReady) return <div className="mx-auto max-w-7xl px-6 py-24 text-muted-foreground">{pageText(lang).area.loading}</div>;
  if (!session) return <ToolsAuth onDone={() => { void supabase.auth.getSession().then(({ data }) => setSession(data.session)); }} />;
  const saved = (account.data?.profile ?? null) as Record<string, unknown> | null;
  // O acesso à biblioteca depende do perfil já salvo no banco, nunca do que está sendo digitado.
  const complete = Boolean(saved) && Object.keys(EMPTY).every((key) => String(saved?.[key] ?? "").trim()) && isValidPhone(String(saved?.["phone"] ?? ""));
  const formValid = Object.values(profile).every((value) => String(value).trim()) && isValidPhone(profile.phone);
   return <div className="bg-secondary/40 py-16"><div className="mx-auto max-w-7xl px-6"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">{p.eyebrow}</p><h1 className="mt-4 text-4xl font-bold md:text-6xl">{p.title}</h1></div><button onClick={async () => { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); navigate({ to: "/ferramentas", search: { modo: undefined }, replace: true }); }} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"><LogOut className="size-4" /> {p.signOut}</button></div>
    {!complete ? <form className="mt-12 grid gap-4 bg-background p-6 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); if (!formValid) { toast.error(p.saveError); return; } const result=await save({ data: profile }); if(result.ok){toast.success(p.saved); setJustSaved(true); void account.refetch();} else toast.error(result.error); }}><div className="md:col-span-2"><h2 className="text-2xl font-bold">{p.profileTitle}</h2><p className="mt-2 text-sm text-muted-foreground">{p.profileBody}</p></div>{([['first_name',p.firstName],['last_name',p.lastName],['email',p.email],['company',p.company],['job_title',p.jobTitle]] as const).map(([key,label])=><label key={key} className="text-sm font-medium">{label} *<input required type={key==='email'?'email':'text'} value={profile[key]} onChange={e=>setProfile({...profile,[key]:e.target.value})} className={input}/></label>)}<label className="text-sm font-medium">{p.phone} *<input required value={profile.phone} onFocus={()=>!profile.phone&&setProfile({...profile,phone:'+55'})} onChange={e=>setProfile({...profile,phone:formatPhone(e.target.value)})} className={input}/></label><label className="text-sm font-medium">{p.revenue} *<select required value={profile.revenue_range} onChange={e=>setProfile({...profile,revenue_range:e.target.value})} className={input}><option value="">{p.select}</option>{['Até R$ 360 mil/ano','R$ 360 mil a R$ 4,8 milhões/ano','R$ 4,8 milhões a R$ 300 milhões/ano','Acima de R$ 300 milhões/ano'].map(v=><option key={v}>{v}</option>)}</select></label><label className="text-sm font-medium">{p.segment} *<select required value={profile.segment} onChange={e=>setProfile({...profile,segment:e.target.value})} className={input}><option value="">{p.select}</option>{CRM_SEGMENTS.map(v=><option key={v}>{v}</option>)}</select></label><button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground md:col-span-2 md:w-fit">{p.saveAndAccess}</button></form> : <section className="mt-12">{justSaved ? <SignupSuccess materials={account.data?.welcomeMaterials ?? []} p={p}/> : null}<div className="grid gap-6 md:grid-cols-3">{account.data?.tools.length ? account.data.tools.map(tool=><article key={tool.id} className="border-t-2 border-accent bg-background p-6"><Wrench className="size-6 text-accent"/><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{tool.category}</p><h2 className="mt-2 text-xl font-bold">{tool.title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tool.summary}</p><DownloadButton toolId={tool.id} labels={p} onDownload={(id)=>download({data:{id}})}/></article>) : <div className="border border-border bg-background p-10 md:col-span-3"><LockKeyhole className="size-8 text-accent"/><h2 className="mt-5 text-2xl font-bold">{p.emptyTitle}</h2><p className="mt-3 text-muted-foreground">{p.emptyBody}</p></div>}</div></section>}</div></div>;
}

/** Confirmação exibida logo após o cadastro ser concluído. */
function SignupSuccess({ materials, p }: { materials: string[]; p: ToolsText }) {
  const many = materials.length > 1;
  const names = materials.length <= 1 ? materials[0] ?? "" : `${materials.slice(0, -1).join(", ")} ${p.listAnd} ${materials[materials.length - 1]}`;
  return (
    <div className="mb-10 border-l-4 border-accent bg-background p-6">
      <h2 className="text-2xl font-bold">{p.successTitle}</h2>
      <p className="mt-3 text-muted-foreground">
        {materials.length ? (many ? p.successMany(names) : p.successOne(names)) : p.successNone}
      </p>
    </div>
  );
}

/** Botão de download: fica laranja no hover e enquanto o arquivo é preparado. */
function DownloadButton({ toolId, labels, onDownload }: { toolId: string; labels: ToolsText; onDownload: (id: string) => Promise<{ ok: true; url: string } | { ok: false; error: string }> }) {
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
      <Download className={`size-4 ${busy ? "animate-pulse" : ""}`} /> {busy ? labels.downloading : labels.download}
    </button>
  );
}

function ToolsAuth({ onDone }: { onDone: () => void }) {
  const search = Route.useSearch();
  const { lang, t } = useLanguage();
  const p = pageText(lang).tools;
  const [mode,setMode]=useState<'login'|'signup'|'forgot'>(search.modo === 'cadastro' ? 'signup' : 'login'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState('');
  const [challenge,setChallenge]=useState(()=>({a:1+Math.floor(Math.random()*8),b:1+Math.floor(Math.random()*8)})); const [captcha,setCaptcha]=useState('');
  function newChallenge(){setChallenge({a:1+Math.floor(Math.random()*8),b:1+Math.floor(Math.random()*8)});setCaptcha('');}
  /** Traduz o erro do provedor de autenticação numa mensagem específica e acionável. */
  function describeError(error: { code?: string | undefined; status?: number | undefined; message: string }, current: 'login' | 'signup'): string {
    const code = error.code ?? '';
    const msg = error.message ?? '';
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || error.status === 429 || /rate limit/i.test(msg)) return t.toolsAuth.tooManyRequests;
    if (code === 'email_not_confirmed' || /email not confirmed/i.test(msg)) return t.toolsAuth.emailNotConfirmed;
    if (code === 'user_already_exists' || code === 'email_exists' || /already registered|already been registered|user already/i.test(msg)) return t.toolsAuth.emailInUse;
    if (code === 'weak_password' || /password should be|weak password/i.test(msg)) return t.toolsAuth.weakPassword;
    if (current === 'login' && (code === 'invalid_credentials' || code === 'user_not_found' || /invalid login/i.test(msg))) return t.toolsAuth.invalidLogin;
    return current === 'signup' ? t.toolsAuth.signupError : t.toolsAuth.errorGeneric;
  }
  async function submit(event: React.FormEvent){event.preventDefault(); if(Number(captcha)!==challenge.a+challenge.b){setMessage(p.captchaError);newChallenge();return;} setBusy(true);setMessage(''); if(mode==='forgot'){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});setBusy(false);newChallenge();setMessage(error?describeError(error,'login'):p.resetSent);return;} const result=mode==='signup'?await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/ferramentas'}}):await supabase.auth.signInWithPassword({email,password});setBusy(false);newChallenge();if(result.error){setMessage(describeError(result.error,mode==='signup'?'signup':'login'));return;}if(mode==='signup'&&!result.data.session){setMessage(p.confirmEmail);return;}onDone();}
  return <section className="min-h-[72vh] bg-secondary/40 py-16"><div className="mx-auto grid max-w-6xl overflow-hidden bg-background lg:grid-cols-2"><div className="bg-ink p-10 text-ink-foreground md:p-14"><p className="text-xs font-bold uppercase tracking-[0.3em] text-accent">{p.authEyebrow}</p><h1 className="mt-5 text-4xl font-bold leading-tight">{p.authTitle}</h1><p className="mt-5 leading-relaxed text-ink-foreground/70">{p.authText}</p><Wrench className="mt-16 size-16 text-accent" strokeWidth={1}/></div><form onSubmit={submit} className="p-8 md:p-14"><h2 className="text-2xl font-bold">{mode==='login'?p.login:mode==='signup'?p.signup:p.forgot}</h2><label className="mt-8 block text-sm font-medium">{p.email}<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className={input}/></label>{mode!=='forgot'&&<label className="mt-4 block text-sm font-medium">{p.password}<input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} className={input}/></label>}<label className="mt-4 block text-sm font-medium">{p.captcha(challenge.a, challenge.b)}<input required inputMode="numeric" value={captcha} onChange={e=>setCaptcha(e.target.value)} className={`${input} max-w-32`}/></label>{message&&<p className="mt-4 text-sm font-medium text-destructive">{message}</p>}<button disabled={busy} className="mt-6 w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground">{busy?p.wait:mode==='login'?p.enter:mode==='signup'?p.createAccount:p.sendLink}</button><div className="mt-5 flex flex-wrap justify-between gap-3 text-sm"><button type="button" onClick={()=>setMode(mode==='signup'?'login':'signup')} className="font-semibold text-accent">{mode==='signup'?p.haveAccount:p.createFree}</button><button type="button" onClick={()=>setMode(mode==='forgot'?'login':'forgot')} className="text-muted-foreground">{mode==='forgot'?p.back:p.forgotLink}</button></div><p className="mt-8 text-xs text-muted-foreground">{p.privacyBefore}<Link to="/privacy" className="underline">{p.privacyLink}</Link>.</p></form></div></section>;
}