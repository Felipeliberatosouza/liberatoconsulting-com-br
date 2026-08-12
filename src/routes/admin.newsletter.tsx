import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import {
  addSubscriber,
  deleteCampaign,
  deleteSubscriber,
  getNewsletterSettings,
  listCampaigns,
  listSubscribers,
  saveCampaign,
  saveNewsletterSettings,
  sendCampaign,
  setSubscriberStatus,
} from "@/lib/newsletter.functions";

export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({
    meta: [
      { title: "Newsletter — Painel Liberato Consulting" },
      { name: "description", content: "Gerencie inscritos e envios da newsletter." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Newsletter — Painel Liberato Consulting" },
      { property: "og:description", content: "Gerencie inscritos e envios da newsletter." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNewsletter,
});

const card = "rounded-lg border border-border bg-background p-6";
const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const btn =
  "rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60";
const label = "mb-1 block text-sm font-semibold";


function AdminNewsletter() {
  const subscribers = useQuery({ queryKey: ["nl-subs"], queryFn: () => listSubscribers(), retry: false });
  const campaigns = useQuery({ queryKey: ["nl-camps"], queryFn: () => listCampaigns(), retry: false });
  const settings = useQuery({
    queryKey: ["nl-settings"],
    queryFn: () => getNewsletterSettings(),
    retry: false,
  });

  const [fromName, setFromName] = useState("Liberato Consulting");
  const [fromEmail, setFromEmail] = useState("");
  const [autoSend, setAutoSend] = useState(false);
  useEffect(() => {
    if (settings.data) {
      setFromName(settings.data.fromName);
      setFromEmail(settings.data.fromEmail);
      setAutoSend(settings.data.autoSendOnPublish);
    }
  }, [settings.data]);

  const [editId, setEditId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const activeCount = (subscribers.data ?? []).filter((s) => s.status === "active").length;

  const resetForm = () => {
    setEditId(null);
    setSubject("");
    setPreheader("");
    setBody("");
  };

  return (
    <AdminShell
      title="Newsletter"
      description="Gerencie inscritos, escreva campanhas e envie automaticamente para toda a base."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className={card}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Inscritos ativos</p>
          <p className="mt-2 font-display text-3xl font-bold">{activeCount}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total de cadastros</p>
          <p className="mt-2 font-display text-3xl font-bold">{subscribers.data?.length ?? 0}</p>
        </div>
        <div className={card}>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Campanhas enviadas</p>
          <p className="mt-2 font-display text-3xl font-bold">
            {(campaigns.data ?? []).filter((c) => c.status === "sent").length}
          </p>
        </div>
      </div>

      {/* Configurações */}
      <div className={`mt-8 ${card} max-w-2xl`}>
        <h2 className="font-display text-lg font-bold">Configurações de envio</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Defina o remetente. O e-mail precisa usar o domínio de e-mail conectado ao site.
        </p>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await saveNewsletterSettings({
              data: { fromName, fromEmail, autoSendOnPublish: autoSend },
            });
            if (!r.ok) toast.error(r.error);
            else toast.success("Configurações salvas.");
          }}
        >
          <input className={input} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Nome do remetente" />
          <input className={input} type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="newsletter@seudominio.com" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} />
            Enviar automaticamente para todos os inscritos quando um novo conteúdo for publicado
          </label>
          <div className="sm:col-span-2">
            <button className={btn} type="submit">Salvar configurações</button>
          </div>
        </form>
      </div>

      {/* Campanha */}
      <div className={`mt-8 ${card}`}>
        <h2 className="font-display text-lg font-bold">
          {editId ? "Editar newsletter" : "Nova newsletter"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha o título e o texto, ou carregue um arquivo com o texto completo. Os formatos para
          WhatsApp, LinkedIn e Instagram são gerados automaticamente.
        </p>
        <form
          className="mt-5 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const r = await saveCampaign({
                data: { ...(editId ? { id: editId } : {}), subject, preheader, body },
              });
              if (!r.ok) toast.error(r.error);
              else {
                toast.success("Newsletter salva.");
                resetForm();
                await campaigns.refetch();
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <label className={label} htmlFor="nl-title">Título da newsletter</label>
            <input id="nl-title" className={input} required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex.: Como a IA está mudando a gestão no Brasil" />
          </div>

          <div>
            <label className={label} htmlFor="nl-pre">Chamada curta (aparece na caixa de entrada)</label>
            <input id="nl-pre" className={input} value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Uma frase que convida à leitura" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <label className={label} htmlFor="nl-body">Texto da newsletter</label>
              <span className="ml-auto text-xs text-muted-foreground">
                {body.trim() ? `${body.trim().split(/\s+/).length} palavras` : "vazio"}
              </span>
            </div>
            <textarea
              id="nl-body"
              className={`${input} min-h-56 leading-relaxed`}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva o conteúdo. Separe os parágrafos com uma linha em branco."
            />
          </div>

          <div className="rounded-md border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Carregar arquivo com o texto completo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Aceita arquivos .txt e .md. O conteúdo é inserido no campo de texto acima.
            </p>
            <input
              type="file"
              accept=".txt,.md,.markdown,text/plain,text/markdown"
              className="mt-3 text-sm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.size > 1_000_000) {
                  toast.error("Arquivo muito grande (máx. 1 MB).");
                  return;
                }
                if (!/\.(txt|md|markdown)$/i.test(file.name)) {
                  toast.error("Formato não suportado. Salve o texto como .txt ou .md.");
                  return;
                }
                const text = await file.text();
                setBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${text.trim()}` : text.trim()));
                if (!subject.trim()) setSubject(file.name.replace(/\.[^.]+$/, ""));
                toast.success("Texto importado do arquivo.");
              }}
            />
          </div>

          <div>
            <label className={label} htmlFor="nl-link">Link do conteúdo (opcional, usado nas redes)</label>
            <input id="nl-link" className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://liberato.com/content/..." />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className={btn} type="submit" disabled={busy}>
              {busy ? "Salvando…" : editId ? "Salvar alterações" : "Criar newsletter"}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="text-sm text-muted-foreground hover:text-accent">
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {/* Formatos para redes sociais */}
        <div className="mt-8 border-t border-border pt-6">
          <h3 className="font-display text-base font-bold">Formatos para redes sociais</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerados a partir do título e do texto acima. Edite se quiser e copie com um clique.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {socialFormats.map((f) => (
              <div key={f.key} className="rounded-md border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{f.label}</span>
                  <button
                    type="button"
                    className="ml-auto text-xs font-semibold text-accent hover:underline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(f.value);
                        toast.success(`Texto para ${f.label} copiado.`);
                      } catch {
                        toast.error("Não foi possível copiar.");
                      }
                    }}
                  >
                    Copiar
                  </button>
                </div>
                <textarea
                  className={`${input} mt-2 min-h-48 text-xs leading-relaxed`}
                  value={f.value}
                  onChange={(e) => setSocialDrafts((d) => ({ ...d, [f.key]: e.target.value }))}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{f.value.length} caracteres</p>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Lista de campanhas */}
      <div className={`mt-8 ${card}`}>
        <h2 className="font-display text-lg font-bold">Campanhas</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input className={`${input} max-w-xs`} value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="E-mail para teste" />
          <span className="text-xs text-muted-foreground">use “Enviar teste” em uma campanha abaixo</span>
        </div>
        <div className="mt-4 space-y-3">
          {(campaigns.data ?? []).map((c) => (
            <div key={c.id} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{c.subject}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  {c.status === "sent" ? `enviada • ${c.sent_count} envios` : c.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              {c.last_error && <p className="mt-2 text-xs text-destructive">{c.last_error}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <button
                  className="text-muted-foreground hover:text-accent"
                  onClick={() => {
                    setEditId(c.id);
                    setSubject(c.subject);
                    setPreheader(c.preheader ?? "");
                    setBody(c.body);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Editar
                </button>
                <button
                  className="font-semibold text-accent hover:underline"
                  onClick={async () => {
                    if (!confirm(`Enviar “${c.subject}” para ${activeCount} inscritos?`)) return;
                    const r = await sendCampaign({ data: { id: c.id } });
                    if (!r.ok) toast.error(r.error);
                    else toast.success(`Enviada para ${r.sent} inscritos.`);
                    await campaigns.refetch();
                  }}
                >
                  Enviar para todos
                </button>
                <button
                  className="text-muted-foreground hover:text-accent"
                  onClick={async () => {
                    if (!testEmail) {
                      toast.error("Informe um e-mail para teste.");
                      return;
                    }
                    const r = await sendCampaign({ data: { id: c.id, testEmail } });
                    if (!r.ok) toast.error(r.error);
                    else toast.success("Teste enviado.");
                  }}
                >
                  Enviar teste
                </button>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    if (!confirm("Excluir esta campanha?")) return;
                    await deleteCampaign({ data: { id: c.id } });
                    await campaigns.refetch();
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
          {campaigns.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma campanha criada ainda.</p>
          )}
        </div>
      </div>

      {/* Inscritos */}
      <div className={`mt-8 ${card}`}>
        <h2 className="font-display text-lg font-bold">Inscritos</h2>
        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const r = await addSubscriber({ data: { email: newEmail } });
            if (!r.ok) toast.error(r.error);
            else {
              setNewEmail("");
              toast.success("Inscrito adicionado.");
              await subscribers.refetch();
            }
          }}
        >
          <input className={`${input} max-w-xs`} type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Adicionar e-mail manualmente" />
          <button className={btn} type="submit">Adicionar</button>
          <a
            className="rounded-md border border-border px-4 py-2 text-sm hover:border-accent"
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              "email,nome,idioma,status,data\n" +
                (subscribers.data ?? [])
                  .map((s) => [s.email, s.name, s.language ?? "", s.status, s.created_at].join(","))
                  .join("\n"),
            )}`}
            download="inscritos-newsletter.csv"
          >
            Exportar CSV
          </a>
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2">E-mail</th>
                <th className="py-2">Idioma</th>
                <th className="py-2">Status</th>
                <th className="py-2">Data</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(subscribers.data ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-2">{s.email}</td>
                  <td className="py-2">{s.language ?? "—"}</td>
                  <td className="py-2">{s.status === "active" ? "Ativo" : "Cancelado"}</td>
                  <td className="py-2">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="py-2 text-right">
                    <button
                      className="mr-3 text-xs text-muted-foreground hover:text-accent"
                      onClick={async () => {
                        await setSubscriberStatus({
                          data: { id: s.id, status: s.status === "active" ? "unsubscribed" : "active" },
                        });
                        await subscribers.refetch();
                      }}
                    >
                      {s.status === "active" ? "Cancelar" : "Reativar"}
                    </button>
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        if (!confirm("Excluir este inscrito?")) return;
                        await deleteSubscriber({ data: { id: s.id } });
                        await subscribers.refetch();
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscribers.data?.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum inscrito ainda.</p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
