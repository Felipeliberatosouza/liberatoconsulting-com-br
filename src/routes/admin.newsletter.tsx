import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toInstagram, toLinkedIn, toWhatsApp } from "@/lib/social-formats";

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
import {
  buildNewsletterPdf,
  generateNewsletterAI,
  generateNewsletterImage,
} from "@/lib/newsletter-ai.functions";

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
  const [link, setLink] = useState("");
  const [socialDrafts, setSocialDrafts] = useState<Record<string, string>>({});
  const [authors, setAuthors] = useState("");
  const [authorContact, setAuthorContact] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fullText, setFullText] = useState("");
  const [sources, setSources] = useState("");
  const [referenceDate, setReferenceDate] = useState("");
  const [aiBusy, setAiBusy] = useState<"" | "text" | "image" | "pdf">("");
  const [pdfUrl, setPdfUrl] = useState("");

  const activeCount = (subscribers.data ?? []).filter((s) => s.status === "active").length;

  const socialFormats = useMemo(() => {
    const src = { title: subject, body, link: link.trim() || undefined };
    return [
      { key: "whatsapp", label: "WhatsApp", value: socialDrafts["whatsapp"] ?? toWhatsApp(src) },
      { key: "linkedin", label: "LinkedIn", value: socialDrafts["linkedin"] ?? toLinkedIn(src) },
      { key: "instagram", label: "Instagram", value: socialDrafts["instagram"] ?? toInstagram(src) },
    ];
  }, [subject, body, link, socialDrafts]);

  const resetForm = () => {
    setEditId(null);
    setSubject("");
    setPreheader("");
    setBody("");
    setAuthors("");
    setAuthorContact("");
    setImageUrl("");
    setFullText("");
    setSources("");
    setReferenceDate("");
    setPdfUrl("");
    setLink("");
    setSocialDrafts({});
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
                data: {
                  ...(editId ? { id: editId } : {}),
                  subject,
                  preheader,
                  body,
                  authors,
                  author_contact: authorContact,
                  image_url: imageUrl || null,
                  full_text: fullText,
                  sources,
                  reference_date: referenceDate || null,
                },
              });
              if (!r.ok) toast.error(r.error);
              else {
                toast.success(
                  "pending" in r && r.pending
                    ? "Newsletter enviada para aprovação do administrador."
                    : "Newsletter salva.",
                );
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

          <div className="rounded-md border border-accent/40 bg-accent/5 p-4">
            <p className="text-sm font-semibold">Gerar com inteligência artificial</p>
            <p className="mt-1 text-xs text-muted-foreground">
              A partir do título, a IA escreve a chamada curta, o texto de até 500 palavras, o
              material completo com fontes e cria a imagem de cabeçalho. Revise antes de enviar.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={aiBusy !== "" || subject.trim().length < 5}
                onClick={async () => {
                  setAiBusy("text");
                  try {
                    const r = await generateNewsletterAI({ data: { title: subject, authors } });
                    if (!r.ok) toast.error(r.error);
                    else {
                      setPreheader(r.preheader);
                      setBody(r.body);
                      setFullText(r.fullText);
                      setSources(r.sources);
                      setReferenceDate(r.referenceDate);
                      toast.success("Textos gerados. Revise antes de enviar.");
                    }
                  } catch {
                    toast.error("Não foi possível gerar o texto.");
                  } finally {
                    setAiBusy("");
                  }
                }}
                className={btn}
              >
                {aiBusy === "text" ? "Escrevendo…" : "Gerar textos"}
              </button>
              <button
                type="button"
                disabled={aiBusy !== "" || subject.trim().length < 5}
                onClick={async () => {
                  setAiBusy("image");
                  try {
                    const r = await generateNewsletterImage({ data: { title: subject } });
                    if (!r.ok) toast.error(r.error);
                    else {
                      setImageUrl(r.imageUrl);
                      toast.success("Imagem de cabeçalho gerada.");
                    }
                  } catch {
                    toast.error("Não foi possível gerar a imagem.");
                  } finally {
                    setAiBusy("");
                  }
                }}
                className="rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
              >
                {aiBusy === "image" ? "Criando imagem…" : "Gerar imagem de cabeçalho"}
              </button>
            </div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Cabeçalho gerado para a newsletter"
                className="mt-4 max-h-48 w-full rounded-md object-cover"
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="nl-authors">Autores</label>
              <input id="nl-authors" className={input} value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Nome dos autores" />
            </div>
            <div>
              <label className={label} htmlFor="nl-contact">Contato dos autores</label>
              <input id="nl-contact" className={input} value={authorContact} onChange={(e) => setAuthorContact(e.target.value)} placeholder="email@liberato.com" />
            </div>
            <div>
              <label className={label} htmlFor="nl-date">Data de atualização</label>
              <input id="nl-date" type="date" className={input} value={referenceDate} onChange={(e) => setReferenceDate(e.target.value)} />
            </div>
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
            <div className="flex flex-wrap items-center gap-3">
              <label className={label} htmlFor="nl-full">Material completo (até 5.000 palavras)</label>
              <span className="ml-auto text-xs text-muted-foreground">
                {fullText.trim() ? `${fullText.trim().split(/\s+/).length} palavras` : "vazio"}
              </span>
            </div>
            <textarea
              id="nl-full"
              className={`${input} min-h-56 leading-relaxed`}
              value={fullText}
              onChange={(e) => setFullText(e.target.value)}
              placeholder="Texto completo, com subtítulos, tabelas e descrição dos gráficos."
            />
          </div>

          <div>
            <label className={label} htmlFor="nl-sources">Fontes de pesquisa</label>
            <textarea
              id="nl-sources"
              className={`${input} min-h-24`}
              value={sources}
              onChange={(e) => setSources(e.target.value)}
              placeholder="IBGE (2025). Contas Nacionais. https://…"
            />
          </div>

          <div className="rounded-md border border-dashed border-border p-4">
            <p className="text-sm font-semibold">PDF para download</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gera o arquivo do material completo com a logomarca da Liberato Consulting como
              marca d’água, cabeçalho e rodapé com os dados de contato da consultoria.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={aiBusy !== "" || fullText.trim().length < 50}
                onClick={async () => {
                  setAiBusy("pdf");
                  try {
                    const r = await buildNewsletterPdf({
                      data: {
                        ...(editId ? { campaignId: editId } : {}),
                        title: subject,
                        subtitle: preheader,
                        authors,
                        authorContact,
                        body: fullText,
                        sources,
                      },
                    });
                    if (!r.ok) toast.error(r.error);
                    else {
                      setPdfUrl(r.url);
                      toast.success("PDF gerado.");
                      await campaigns.refetch();
                    }
                  } catch {
                    toast.error("Não foi possível gerar o PDF.");
                  } finally {
                    setAiBusy("");
                  }
                }}
                className={btn}
              >
                {aiBusy === "pdf" ? "Gerando PDF…" : "Gerar PDF do material completo"}
              </button>
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">
                  baixar PDF gerado
                </a>
              )}
            </div>
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
                    setAuthors(c.authors ?? "");
                    setAuthorContact(c.author_contact ?? "");
                    setImageUrl(c.image_url ?? "");
                    setFullText(c.full_text ?? "");
                    setSources(c.sources ?? "");
                    setReferenceDate(c.reference_date ?? "");
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
