import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
const scope = z.object({slug:z.string().min(1).max(100),token:z.string().min(32).max(100)});
async function hash(v:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join(''); }
async function db() { const {supabaseAdmin}=await import('@/integrations/supabase/client.server'); return supabaseAdmin as any; }
export const referTool = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({toolId:z.string().uuid(),channel:z.enum(['email','whatsapp']),recipient:z.string().trim().min(5).max(160),permission:z.literal(true)}).parse(d)).handler(async({data,context})=>{
 const sb=await db();
 const recipient=data.channel==='email'?z.string().email().parse(data.recipient).toLowerCase():data.recipient.replace(/\D/g,'');
 if(data.channel==='whatsapp'&&!/^[1-9]\d{9,14}$/.test(recipient)) throw new Error('Informe o WhatsApp com código do país e DDD.');
 if(data.channel==='email'&&recipient===String(context.claims?.email??'').toLowerCase()) throw new Error('Indique outra pessoa, não seu próprio contato.');
 const {data:profile,error:profileError}=await sb.from('tool_user_profiles').select('phone').eq('user_id',context.userId).maybeSingle();
 if(profileError) throw profileError;
 if(data.channel==='whatsapp'&&profile?.phone?.replace(/\D/g,'')===recipient) throw new Error('Indique outra pessoa, não seu próprio contato.');
 const {data:t,error:te}=await sb.from('interactive_tools').select('id,slug,title,summary,status,pricing_mode').eq('id',data.toolId).eq('status','published').maybeSingle();
 if(te) throw te; if(!t||t.pricing_mode!=='referral') throw new Error('Esta ferramenta não está disponível por indicação.');
 const rh=await hash(`${data.channel}:${recipient}`);
 const {data:block,error:be}=await sb.from('tool_referral_blocks').select('recipient_hash').eq('recipient_hash',rh).maybeSingle(); if(be) throw be;
 if(block) throw new Error('Este contato optou por não receber indicações.');
 const {data:old,error:oe}=await sb.from('tool_referrals').select('id,state').eq('tool_id',t.id).eq('recipient_hash',rh).maybeSingle(); if(oe) throw oe;
 if(old) throw new Error('Esta ferramenta já foi indicada a esse contato. Escolha outro amigo.');
 const token=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
 const {data:r,error}=await sb.from('tool_referrals').insert({tool_id:t.id,slug:t.slug,user_id:context.userId,channel:data.channel,recipient,recipient_hash:rh,token_hash:await hash(token)}).select('id').single(); if(error) throw error;
 const url=`https://liberatoconsulting.com.br/indicar/${t.slug}#${token}`;
 const message=`Um amigo indicou a ferramenta ${t.title}, da Liberato Consulting.\n${t.summary}\nExperimente uma vez gratuitamente, sem cadastro: ${url}\nPara não receber mais indicações, abra o mesmo link e escolha “Não receber indicações”.`;
 try {
  if(data.channel==='email') {
   // Convite promocional a terceiro: Brevo, nunca o serviço de e-mails de ação do aplicativo.
   const {sendBrevoEmail}=await import('./prospect-email.server');
   const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
   await sendBrevoEmail({sender:{email:'contato@liberatoconsulting.com.br',name:'Liberato Consulting'},to:[{email:recipient}],subject:`Um amigo indicou: ${t.title}`,html:`<h1>${esc(t.title)}</h1><p>Um amigo indicou esta ferramenta da Liberato Consulting.</p><p>${esc(t.summary)}</p><p><a href="${esc(url)}">Experimentar gratuitamente uma vez</a></p><p><a href="${esc(url)}">Não receber mais indicações</a></p>`,text:message,unsubscribeUrl:url});
  } else {
   if(!process.env['EVOLUTION_API_URL']||!process.env['EVOLUTION_API_KEY']||!process.env['EVOLUTION_INSTANCE']) throw new Error('O envio de indicações requer a conexão Evolution configurada.');
   const {sendWhatsAppMessage}=await import('./bulletin.server'); await sendWhatsAppMessage({to:recipient,caption:message});
  }
  const {error:ue}=await sb.from('tool_referrals').update({state:'accepted',accepted_at:new Date().toISOString()}).eq('id',r.id); if(ue) throw ue;
  return {ok:true as const};
 }catch(e){ const message=e instanceof Error?e.message:'Falha no envio'; await sb.from('tool_referrals').update({state:/12 segundos|timeout/i.test(message)?'unknown':'failed',error:message}).eq('id',r.id); return {ok:false as const,error:message}; }
});
export const referralInfo=createServerFn({method:'POST'}).inputValidator((d:unknown)=>scope.parse(d)).handler(async({data})=>{
 const sb=await db(); const {data:r,error}=await sb.from('tool_referrals').select('tool_id,state,used_at,expires_at').eq('slug',data.slug).eq('token_hash',await hash(data.token)).maybeSingle(); if(error) throw error;
 if(!r) return {available:false,title:''};
 const {data:t}=await sb.from('interactive_tools').select('title,status').eq('id',r.tool_id).maybeSingle();
 const {referralAvailable}=await import('./access-rules');
 return {available:t?.status==='published'&&referralAvailable(r,Date.now()),title:String(t?.title??'')};
});
export const openReferredTool=createServerFn({method:'POST'}).inputValidator((d:unknown)=>scope.extend({lang:z.enum(['pt','en','es','zh'])}).parse(d)).handler(async({data})=>{
 const sb=await db(); const {data:id,error}=await sb.rpc('claim_tool_referral',{p_hash:await hash(data.token),p_slug:data.slug}); if(error) throw error;
 if(!id) return {ok:false as const};
 const {data:t,error:te}=await sb.from('interactive_tools').select('id,title,summary,category,spec').eq('id',id).eq('status','published').single(); if(te) throw te;
 const {translateTool}=await import('./tool-i18n.server');const tr=await translateTool(data.lang,t,t.spec); return {ok:true as const,tool:{...t,...tr.tool},spec:tr.spec};
});
export const stopReferrals=createServerFn({method:'POST'}).inputValidator((d:unknown)=>scope.parse(d)).handler(async({data})=>{
 const sb=await db();const {data:r,error}=await sb.from('tool_referrals').select('recipient_hash,channel').eq('slug',data.slug).eq('token_hash',await hash(data.token)).maybeSingle(); if(error) throw error; if(!r) throw new Error('Link inválido.');
 const {error:be}=await sb.from('tool_referral_blocks').upsert({recipient_hash:r.recipient_hash,channel:r.channel}); if(be) throw be;
 const {error:ue}=await sb.from('tool_referrals').update({opted_out_at:new Date().toISOString()}).eq('recipient_hash',r.recipient_hash); if(ue) throw ue; return {ok:true};
});
