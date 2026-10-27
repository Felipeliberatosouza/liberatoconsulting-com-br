import { ProjectFlowGuide } from "@/components/ProjectFlowGuide";
import { Button } from "@/components/ui/button";
import { issueClientDocument, listClientDocuments, downloadClientDocument, inviteDocumentSigner } from "@/lib/client-signing.functions";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getCompany } from "@/lib/company.functions";
import { listQuotes, quoteFileUrl } from "@/lib/pricing.functions";
import { annexLines, buildContract, buildNda, type LegalDoc, type Party, type QuoteAnnex } from "@/lib/client-contracts";

export const Route = createFileRoute("/admin/projetos_/contratos")({
  head: () => ({
    meta: [
      { title: "Contrato e NDA — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Emissão e assinatura de NDA e contratos de consultoria." },
      { property: "og:title", content: "Contrato e NDA — Liberato Consulting" },
      { property: "og:description", content: "Documentos, orçamento anexo e registros de assinatura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContractsPage,
});

const EMPTY: Party = { legal_name: "", cnpj: "", address: "", representative: "", representative_cpf: "", representative_role: "", email: "" };
const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const today = () => new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const fmtDate = (d: string | null) => (d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : null);

function ContractsPage() {
  const company = useQuery({ queryKey: ["company"], queryFn: () => getCompany(), retry: false });
  const quotes = useQuery({ queryKey: ["quotes"], queryFn: () => listQuotes(), retry: false });
  const [doc, setDoc] = useState<"nda" | "contract">("nda");
  const [client, setClient] = useState<Party>(EMPTY);
  const [consultant, setConsultant] = useState<Party>(EMPTY);
  const [quoteId, setQuoteId] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(today());
  const [ndaDate, setNdaDate] = useState("");
  const [payment, setPayment] = useState("");
  const documents = useQuery({queryKey:["client-documents"],queryFn:()=>listClientDocuments(),retry:false});
  const [ndaId,setNdaId]=useState("");
  const [approved,setApproved]=useState(false);
  const [witnesses,setWitnesses]=useState([{name:"",cpf:"",email:""},{name:"",cpf:"",email:""}]);
  const [busy,setBusy]=useState(false);
  const [issued,setIssued]=useState<Awaited<ReturnType<typeof issueClientDocument>>|null>(null);
  async function issue(){setBusy(true);try{const r=await issueClientDocument({data:{kind:doc,client,consultant,city,date,paymentTerms:payment,quoteId:doc==="contract"?quoteId:undefined,ndaId:doc==="contract"?ndaId:undefined,witnesses,quoteApproved:approved}});setIssued(r);void documents.refetch();toast.success("Documento emitido. Envie o convite de cada signatário.");}catch(e){toast.error(e instanceof Error?e.message:"Falha ao emitir documento.");}finally{setBusy(false);}}


  useEffect(() => {
    const c = company.data;
    if (!c) return;
    const p = c.partners?.[0];
    setConsultant({
      legal_name: c.legal_name || c.trade_name,
      cnpj: c.cnpj,
      address: [c.address_street, c.address_number, c.address_complement, c.address_district, c.address_city && `${c.address_city}/${c.address_state}`, c.address_zip && `CEP ${c.address_zip}`].filter(Boolean).join(", "),
      representative: p?.name ?? "",
      representative_cpf: p?.cpf ?? "",
      representative_role: "sócio administrador",
      email: c.email,
    });
    if (!city && c.address_city) setCity(`${c.address_city}/${c.address_state}`);
  }, [company.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = quotes.data ?? [];
  const selected = rows.find((q) => q.id === quoteId);
  const quote: QuoteAnnex | null = selected
    ? {
        service_title: selected.service_title,
        total: Number(selected.total_currency ?? selected.total_brl).toLocaleString("pt-BR", { style: "currency", currency: selected.currency || "BRL" }),
        start_date: fmtDate((selected as { start_date?: string | null }).start_date ?? null),
        end_date: fmtDate((selected as { end_date?: string | null }).end_date ?? null),
        issued_at: new Date(selected.created_at).toLocaleDateString("pt-BR"),
        file_name: selected.file_name,
      }
    : null;

  function pickQuote(id: string) {
    setQuoteId(id);
    const q = rows.find((r) => r.id === id);
    if (q && !client.legal_name) setClient((c) => ({ ...c, legal_name: q.client_name }));
  }

  const legal: LegalDoc = useMemo(() => {
    const input = { consultant, client, city, date, quote, paymentTerms: payment, ndaDate };
    return doc === "nda" ? buildNda(input) : buildContract(input);
  }, [doc, consultant, client, city, date, quote, payment, ndaDate]);

  async function openQuote() {
    if (!selected) return;
    const r = await quoteFileUrl({ data: { path: selected.file_path, name: selected.file_name } });
    if (r.url) window.open(r.url, "_blank");
    else toast.error("Arquivo do orçamento indisponível.");
  }

  const partyFields = (p: Party, set: (p: Party) => void, label: string) => (
    <fieldset className="rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {([
          ["legal_name", "Razão social"], ["cnpj", "CNPJ"], ["address", "Endereço completo"], ["email", "E-mail"],
          ["representative", "Representante legal"], ["representative_cpf", "CPF do representante"], ["representative_role", "Cargo do representante"],
        ] as const).map(([k, l]) => (
          <label key={k} className="text-sm font-medium">{l}<input className={field} value={p[k]} onChange={(e) => set({ ...p, [k]: e.target.value })} /></label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <AdminShell title="5. Contrato e NDA" description="Primeiro o NDA, assinado antes de qualquer troca de informações. Depois o contrato de consultoria, com o orçamento aprovado como Anexo I." requireAdmin>
      <div className="print:hidden"><ProjectFlowGuide current={5} /></div>
      <div className="print:hidden">
        <div className="flex gap-2">
          {([["nda", "1. NDA (antes do escopo)"], ["contract", "2. Contrato de consultoria"]] as const).map(([k, l]) => (
            <Button key={k} onClick={() => setDoc(k)} className={`rounded-md px-4 py-2 text-sm font-semibold ${doc === k ? "bg-ink text-ink-foreground" : "bg-secondary"}`}>{l}</Button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {doc === "contract" && (
            <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-3">
              <label className="text-sm font-medium md:col-span-2">Orçamento aprovado (Anexo I)
                <select className={field} value={quoteId} onChange={(e) => pickQuote(e.target.value)}>
                  <option value="">Escolha o orçamento…</option>
                  {rows.map((q) => <option key={q.id} value={q.id}>{q.client_name} — {q.service_title} ({new Date(q.created_at).toLocaleDateString("pt-BR")})</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">NDA assinado<select className={field} value={ndaId} onChange={e=>{setNdaId(e.target.value);const d=documents.data?.find((d:any)=>d.id===e.target.value);setNdaDate(d?.completed_at?new Date(d.completed_at).toLocaleDateString("pt-BR"):"");}}><option value="">Selecione o NDA concluído</option>{documents.data?.filter((d:any)=>d.kind==="nda"&&d.completed_at).map((d:any)=><option key={d.id} value={d.id}>{d.client_name}</option>)}</select></label>
              <label className="flex items-start gap-2 text-sm md:col-span-3"><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>Confirmo que este orçamento foi aprovado pelo cliente.</label>
              <label className="text-sm font-medium md:col-span-3">Forma de pagamento<input className={field} value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="ex.: 50% na assinatura e 50% na entrega final, por boleto" /></label>
            </div>
          )}
          {partyFields(client, setClient, "Cliente")}
          {partyFields(consultant, setConsultant, "Liberato Consulting (vem do cadastro da empresa)")}
          <fieldset className="border border-border p-4"><legend className="text-sm font-semibold">Testemunhas</legend><div className="grid gap-4 md:grid-cols-2">{witnesses.map((w,i)=><div key={i}>{([['name','Nome'],['cpf','CPF'],['email','E-mail']] as const).map(([key,label])=><label key={key} className="mt-2 block text-sm">{label} — testemunha {i+1}<input type={key==='email'?'email':'text'} value={w[key]} className={field} onChange={e=>setWitnesses(current=>current.map((v,j)=>j===i?{...v,[key]:e.target.value}:v))}/></label>)}</div>)}</div></fieldset>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">Cidade (foro e assinatura)<input className={field} value={city} onChange={(e) => setCity(e.target.value)} /></label>
            <label className="text-sm font-medium">Data<input className={field} value={date} onChange={(e) => setDate(e.target.value)} /></label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>void issue()}>{busy?"Emitindo…":"Emitir documento para assinatura"}</Button>
          <Button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"><Printer className="size-4" /> Salvar em PDF / imprimir</Button>
          {doc === "contract" && selected && <Button onClick={() => void openQuote()} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold"><Download className="size-4" /> Baixar PDF do orçamento (Anexo I)</Button>}
        </div>
      </div>

      <section className="mt-8 space-y-4 print:hidden">
        {issued&&<div className="border-t border-border pt-4"><h2 className="text-lg font-bold">Convites individuais</h2>{issued.results.map((r:any)=><div key={r.id} className="mt-3 flex flex-wrap items-center gap-3"><span className="text-sm">{r.name} — {r.email}</span><Button size="sm" variant="outline" onClick={()=>{void navigator.clipboard.writeText(r.url);toast.success("Link copiado.");}}>Copiar link</Button><Button size="sm" disabled={busy} onClick={async()=>{setBusy(true);try{await inviteDocumentSigner({data:{slug:issued.slug,token:r.url.split('#')[1]??''}});toast.success("Convite enviado.");void documents.refetch();}catch(e){toast.error(e instanceof Error?e.message:"Falha no envio.");}finally{setBusy(false);}}}>Enviar convite por e-mail</Button></div>)}</div>}
        <h2 className="text-xl font-bold">Documentos emitidos e assinaturas</h2>
        {documents.error&&<p className="text-destructive">Não foi possível carregar os documentos.</p>}
        {documents.data?.map((d:any)=><details key={d.id} className="border-t border-border py-3"><summary className="cursor-pointer font-semibold">{d.kind==='nda'?'NDA':'Contrato'} — {d.client_name} · {d.completed_at?'Concluído':'Aguardando assinaturas'}</summary><div className="mt-3 space-y-2">{d.client_document_signers.map((s:any)=><p key={s.id} className="text-sm">{s.name} ({s.role}) — {s.signed_at?`${new Date(s.signed_at).toLocaleString('pt-BR')} · IP: ${s.ip??'não disponível'}`:'Pendente'}{s.invite_error?` · ${s.invite_error}`:''}</p>)}<Button size="sm" variant="outline" onClick={async()=>{try{const r=await downloadClientDocument({data:{id:d.id}});if(r.url)window.open(r.url,'_blank','noopener');}catch(e){toast.error(e instanceof Error?e.message:'Arquivo indisponível.');}}}><Download/> Abrir PDF e registro de assinaturas</Button></div></details>)}
      </section>
      <article className="mx-auto mt-8 max-w-3xl bg-background p-8 text-sm leading-relaxed shadow-sm print:mt-0 print:shadow-none">
        <h1 className="text-center font-display text-lg font-bold">{legal.title}</h1>
        {legal.preamble.map((p, i) => <p key={i} className="mt-4 text-justify">{p}</p>)}
        {legal.sections.map((s) => (
          <section key={s.title} className="mt-5">
            <h2 className="font-bold">{s.title}</h2>
            {s.paragraphs.map((p, i) => <p key={i} className="mt-2 text-justify">{p}</p>)}
          </section>
        ))}
        <p className="mt-6">E, por estarem justas e acordadas, as PARTES assinam este instrumento eletronicamente, juntamente com 2 (duas) testemunhas.</p>
        {legal.closing.map((p, i) => <p key={i} className="mt-4 text-right">{p}</p>)}
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          {[client, consultant].map((p, i) => (
            <div key={i} className="border-t border-foreground pt-2 text-center text-xs"><p className="font-semibold">{p.legal_name || "________________"}</p><p>{p.representative}</p></div>
          ))}
          <div className="border-t border-foreground pt-2 text-center text-xs">Testemunha 1 — Nome / CPF</div>
          <div className="border-t border-foreground pt-2 text-center text-xs">Testemunha 2 — Nome / CPF</div>
        </div>
        {doc === "contract" && (
          <section className="mt-10 break-before-page">
            <h2 className="text-center font-bold">ANEXO I – ORÇAMENTO E CRONOGRAMA APROVADOS</h2>
            {annexLines(quote).map((l, i) => <p key={i} className="mt-2">{l}</p>)}
          </section>
        )}
      </article>
    </AdminShell>
  );
}
