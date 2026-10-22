import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildEmailPreviewHtml } from "@/lib/email-brand";
import { listLinkRecipients } from "@/lib/satisfaction.functions";
import { ProspectKitCard } from "@/components/ProspectKitCard";
import { regenerateProspectKit } from "@/lib/prospect-kit-build";
import { getProspectSetup, removeProspectUnsubscribe, sendProspectEmails } from "@/lib/prospect-email.functions";

type Mode = "" | "to" | "cc" | "bcc";
type Person = { key: string; company: string; name: string; email: string; role: string; mode: Mode };

const MODE_LABEL: Record<Mode, string> = { "": "Não enviar", to: "Para", cc: "Cópia (CC)", bcc: "Cópia oculta (CCO)" };

function parseMode(v: unknown): Mode {
  const s = String(v ?? "").toLowerCase().trim();
  if (s.startsWith("cco") || s.startsWith("bcc") || s.includes("oculta")) return "bcc";
  if (s.startsWith("cc") || s.includes("cópia") || s.includes("copia")) return "cc";
  return "to";
}

export function ProspectEmailPanel() {
  const qc = useQueryClient();
  const setup = useQuery({ queryKey: ["prospect-setup"], queryFn: () => getProspectSetup() });
  const crm = useQuery({ queryKey: ["link-recipients"], queryFn: () => listLinkRecipients() });

  const [people, setPeople] = useState<Person[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sender, setSender] = useState("");
  const [filter, setFilter] = useState("");
  const [sending, setSending] = useState(false);
  const [includeInsight, setIncludeInsight] = useState(true);
  const [attachKit, setAttachKit] = useState(true);

  useEffect(() => {
    if (setup.data) {
      setSubject((s) => s || setup.data.subject);
      setBody((b) => b || setup.data.body);
      setSender((s) => s || setup.data.senderEmail);
    }
  }, [setup.data]);

  const blocked = useMemo(() => new Set((setup.data?.unsubscribes ?? []).map((u) => u.email.toLowerCase())), [setup.data]);

  const crmPeople: Person[] = useMemo(
    () =>
      (crm.data ?? []).flatMap((c) =>
        c.contacts.map((p) => ({ key: `crm:${c.id}:${p.email}`, company: c.name, name: p.name, email: p.email, role: p.role, mode: "" as Mode })),
      ),
    [crm.data],
  );

  const modeOf = (key: string) => people.find((p) => p.key === key)?.mode ?? "";
  const setMode = (p: Person, mode: Mode) =>
    setPeople((list) => {
      const rest = list.filter((x) => x.key !== p.key);
      return mode ? [...rest, { ...p, mode }] : rest;
    });

  const onFile = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer());
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]!]!, { defval: "" });
      const get = (r: Record<string, unknown>, names: string[]) => {
        const k = Object.keys(r).find((h) => names.includes(h.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
        return k ? String(r[k]).trim() : "";
      };
      const imported: Person[] = [];
      rows.forEach((r, i) => {
        const email = get(r, ["email", "e-mail"]);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
        imported.push({
          key: `xls:${i}:${email}`,
          company: get(r, ["empresa", "nome fantasia", "company"]),
          name: get(r, ["nome", "name", "contato"]),
          email,
          role: get(r, ["cargo", "role"]),
          mode: parseMode(get(r, ["tipo", "envio", "modo"])),
        });
      });
      setPeople((list) => [...list.filter((p) => !p.key.startsWith("xls:")), ...imported]);
      toast.success(`${imported.length} contatos importados da planilha.`);
    } catch {
      toast.error("Não foi possível ler a planilha.");
    }
  };

  const downloadModel = async () => {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["Empresa", "Nome", "Email", "Cargo", "Tipo"],
      ["Exemplo Ltda", "Maria Silva", "maria@exemplo.com.br", "Diretora", "Para"],
      ["Exemplo Ltda", "João Souza", "joao@exemplo.com.br", "Gerente", "CC"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contatos");
    XLSX.writeFile(wb, "modelo-prospeccao.xlsx");
  };

  const groups = useMemo(() => {
    const map = new Map<string, { company: string; to: Person[]; cc: Person[]; bcc: Person[] }>();
    for (const p of people) {
      if (!p.mode || blocked.has(p.email.toLowerCase())) continue;
      const k = p.company || p.email;
      const g = map.get(k) ?? { company: p.company, to: [], cc: [], bcc: [] };
      g[p.mode].push(p);
      map.set(k, g);
    }
    return [...map.values()];
  }, [people, blocked]);
  const noTo = groups.filter((g) => g.to.length === 0);

  const sample = groups[0];
  const previewHtml = useMemo(() => {
    const nome = sample?.to[0]?.name.split(" ")[0] ?? "Maria";
    const empresa = sample?.company || "Empresa Exemplo";
    const f = (s: string) => s.replaceAll("{{nome}}", nome).replaceAll("{{empresa}}", empresa);
    return buildEmailPreviewHtml({ subject: f(subject), body: f(body) });
  }, [subject, body, sample]);

  const send = async () => {
    const valid = groups.filter((g) => g.to.length > 0);
    if (valid.length === 0) {
      toast.error("Escolha ao menos um destinatário como “Para”.");
      return;
    }
    const total = valid.reduce((n, g) => n + g.to.length + g.cc.length + g.bcc.length, 0);
    if (!confirm(`Enviar ${valid.length} e-mail(s) para ${total} pessoa(s)?`)) return;
    setSending(true);
    try {
      // Material sempre atualizado com os dados atuais do painel antes do disparo.
      if (attachKit) {
        toast.message("Atualizando banner e resumo em PDF…");
        await regenerateProspectKit();
      }
      if (includeInsight) toast.message("Pesquisando notícias recentes do setor de cada empresa…");
      const strip = (l: Person[]) => l.map((p) => ({ name: p.name, email: p.email }));
      const r = await sendProspectEmails({
        data: { senderEmail: sender, senderName: "Liberato Consulting", subject, body, includeInsight, attachKit, groups: valid.map((g) => ({ company: g.company, to: strip(g.to), cc: strip(g.cc), bcc: strip(g.bcc) })) },
      });
      if (r.failed) toast.error(`${r.sent} enviados, ${r.failed} falharam. ${r.error ?? ""}`);
      else toast.success(`${r.sent} destinatários receberam o e-mail${r.skipped ? ` (${r.skipped} bloqueados)` : ""}.`);
      if (!r.failed) setPeople([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no envio");
    } finally {
      setSending(false);
    }
  };

  const shownCrm = crmPeople.filter((p) => `${p.company} ${p.name} ${p.email}`.toLowerCase().includes(filter.toLowerCase()));

  const ModeSelect = ({ p }: { p: Person }) => {
    const isBlocked = blocked.has(p.email.toLowerCase());
    return isBlocked ? (
      <span className="text-xs text-destructive">Descadastrado</span>
    ) : (
      <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={modeOf(p.key) || (p.key.startsWith("xls:") ? p.mode : "")} onChange={(e) => setMode(p, e.target.value as Mode)}>
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <option key={m} value={m}>{MODE_LABEL[m]}</option>
        ))}
      </select>
    );
  };

  return (
    <section className="mt-10 space-y-6 rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Envio de e-mail de prospecção</h2>
        <p className="text-sm text-muted-foreground">
          Envio pelo Brevo com logomarca e dados atuais da empresa (cadastro em Dados da consultoria) e link de descadastro. Use {"{{nome}}"} e {"{{empresa}}"} no texto.
        </p>
      </div>

      <ProspectKitCard compact />
      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={includeInsight} onChange={(e) => setIncludeInsight(e.target.checked)} /> Incluir parágrafo com notícia recente do setor (ou da economia do país)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={attachKit} onChange={(e) => setAttachKit(e.target.checked)} /> Incluir banner e anexar resumo de serviços (PDF)</label>
      </div>

      <Tabs defaultValue="crm">
        <TabsList>
          <TabsTrigger value="crm">Contatos do CRM</TabsTrigger>
          <TabsTrigger value="xls">Planilha Excel</TabsTrigger>
          <TabsTrigger value="out">Descadastrados ({setup.data?.unsubscribes.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-3">
          <Input placeholder="Filtrar por empresa, nome ou e-mail" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="max-h-80 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-2">Empresa</th><th className="p-2">Pessoa</th><th className="p-2">E-mail</th><th className="p-2">Envio</th></tr></thead>
              <tbody>
                {shownCrm.map((p) => (
                  <tr key={p.key} className="border-t border-border">
                    <td className="p-2">{p.company}</td>
                    <td className="p-2">{p.name}<div className="text-xs text-muted-foreground">{p.role}</div></td>
                    <td className="p-2">{p.email}</td>
                    <td className="p-2"><ModeSelect p={p} /></td>
                  </tr>
                ))}
                {shownCrm.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">{crm.isLoading ? "Carregando..." : "Nenhum contato com e-mail no CRM."}</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="xls" className="space-y-3">
          <p className="text-sm text-muted-foreground">Colunas: Empresa, Nome, Email, Cargo e Tipo (Para, CC ou CCO). Cada empresa recebe um e-mail.</p>
          <div className="flex flex-wrap gap-2">
            <Input type="file" accept=".xlsx,.xls,.csv" className="max-w-xs" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <Button variant="outline" onClick={downloadModel}>Baixar planilha modelo</Button>
          </div>
          {people.some((p) => p.key.startsWith("xls:")) && (
            <div className="max-h-80 overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {people.filter((p) => p.key.startsWith("xls:")).map((p) => (
                    <tr key={p.key} className="border-t border-border">
                      <td className="p-2">{p.company}</td><td className="p-2">{p.name}</td><td className="p-2">{p.email}</td>
                      <td className="p-2"><ModeSelect p={p} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="out">
          <p className="mb-2 text-sm text-muted-foreground">Esses endereços ficam bloqueados em todos os próximos envios de prospecção.</p>
          <div className="max-h-80 overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left"><tr><th className="p-2">E-mail</th><th className="p-2">Data</th><th className="p-2">IP</th><th /></tr></thead>
              <tbody>
                {(setup.data?.unsubscribes ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{new Date(u.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
                    <td className="p-2">{u.ip || "—"}</td>
                    <td className="p-2 text-right">
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm("Desbloquear este e-mail? Faça isso só se a pessoa pediu para voltar a receber.")) return;
                        await removeProspectUnsubscribe({ data: { id: u.id } });
                        void qc.invalidateQueries({ queryKey: ["prospect-setup"] });
                      }}>Desbloquear</Button>
                    </td>
                  </tr>
                ))}
                {(setup.data?.unsubscribes.length ?? 0) === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Ninguém se descadastrou ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Remetente (precisa estar validado no Brevo)
            <Input value={sender} onChange={(e) => setSender(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Assunto
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">Texto
            <Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">O modelo padrão é editável em E-mails automáticos (“Prospecção — apresentação da Liberato Consulting a leads”).</p>
          <div className="rounded-md bg-muted p-3 text-sm">
            {groups.length} e-mail(s) · {groups.reduce((n, g) => n + g.to.length + g.cc.length + g.bcc.length, 0)} pessoa(s)
            {noTo.length > 0 && <div className="text-destructive">{noTo.length} empresa(s) sem destinatário “Para” não serão enviadas.</div>}
          </div>
          <Button onClick={send} disabled={sending || groups.length === 0}>{sending ? "Enviando..." : "Enviar e-mails"}</Button>
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Pré-visualização{sample ? ` — ${sample.company || sample.to[0]?.email}` : ""}</div>
          <iframe title="Pré-visualização" srcDoc={previewHtml} className="h-[640px] w-full rounded-md border border-border bg-background" />
        </div>
      </div>
    </section>
  );
}
