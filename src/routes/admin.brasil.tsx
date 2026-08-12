import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getSiteConfig, saveBrazilSection } from "@/lib/admin.functions";
import { generateBrazilSectionAI } from "@/lib/indicators.functions";
import type { BrazilOverrides } from "@/lib/site-config";
import { pt } from "@/i18n/pt";

export const Route = createFileRoute("/admin/brasil")({
  head: () => ({
    meta: [
      { title: "Dados do Brasil — Painel Liberato" },
      {
        name: "description",
        content: "Atualize os textos de cada tema da seção Dados do Brasil.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Dados do Brasil — Painel Liberato" },
      { property: "og:description", content: "Edição dos temas da seção Dados do Brasil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBrazil,
});

type Draft = {
  title: string;
  body: string;
  bullets: string;
  sources: string;
  authors: string;
  authorContact: string;
};

function AdminBrazil() {
  const [overrides, setOverrides] = useState<BrazilOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string>(pt.brazil.sections[0]?.id ?? "");

  function hydrate(o: BrazilOverrides) {
    setOverrides(o);
    const next: Record<string, Draft> = {};
    for (const s of pt.brazil.sections) {
      const v = o[s.id]?.pt;
      const meta = o[s.id]?.meta;
      next[s.id] = {
        title: v?.title ?? s.title,
        body: v?.body ?? s.body,
        bullets: (v?.bullets ?? s.bullets).join("\n"),
        sources: meta?.sources ?? "",
        authors: meta?.authors ?? "",
        authorContact: meta?.authorContact ?? "",
      };
    }
    setDrafts(next);
  }

  useEffect(() => {
    getSiteConfig()
      .then((c) => hydrate(c.brazil ?? {}))
      .catch(() => hydrate({}));
  }, []);

  async function onSave(id: string) {
    const d = drafts[id];
    if (!d) return;
    setBusy(id);
    try {
      const r = await saveBrazilSection({
        data: {
          id,
          title: d.title.trim(),
          body: d.body.trim(),
          bullets: d.bullets
            .split("\n")
            .map((b) => b.trim())
            .filter(Boolean),
          sources: d.sources.trim(),
          authors: d.authors.trim(),
          authorContact: d.authorContact.trim(),
        },
      });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(
        "pending" in r && r.pending
          ? "Alteração enviada para aprovação do administrador."
          : "Tema atualizado e traduzido para EN, ES e ZH.",
      );
      const c = await getSiteConfig();
      hydrate(c.brazil ?? {});
    } catch {
      toast.error("Não foi possível salvar este tema.");
    } finally {
      setBusy(null);
    }
  }

  async function onReset(id: string) {
    setBusy(id);
    try {
      await saveBrazilSection({
        data: { id, title: "", body: "", bullets: [], sources: "", authors: "", authorContact: "" },
      });
      const c = await getSiteConfig();
      hydrate(c.brazil ?? {});
      toast.success("Texto original restaurado.");
    } catch {
      toast.error("Não foi possível restaurar o texto.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell
      title="Dados do Brasil"
      description="Cada bloco abaixo é um subitem do menu Dados do Brasil. Edite em português: ao salvar, o site é atualizado na hora e as versões em inglês, espanhol e mandarim são geradas automaticamente."
    >
      <div className="space-y-4">
        {pt.brazil.sections.map((s) => {
          const d =
            drafts[s.id] ??
            { title: "", body: "", bullets: "", sources: "", authors: "", authorContact: "" };
          const isCustom = Boolean(overrides[s.id]?.pt);
          const expanded = open === s.id;
          return (
            <div key={s.id} className="rounded-lg border border-border bg-background">
              <button
                type="button"
                onClick={() => setOpen(expanded ? "" : s.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="font-display text-base font-bold">{s.title}</span>
                {isCustom && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                    personalizado
                  </span>
                )}
                <span className="ml-auto text-sm text-muted-foreground">
                  {expanded ? "fechar" : "editar"}
                </span>
              </button>

              {expanded && (
                <div className="space-y-4 border-t border-border px-5 py-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Título do tema
                    </label>
                    <input
                      value={d.title}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...d, title: e.target.value } }))
                      }
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Texto de apresentação
                    </label>
                    <textarea
                      value={d.body}
                      rows={5}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...d, body: e.target.value } }))
                      }
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Dados e destaques (um por linha)
                    </label>
                    <textarea
                      value={d.bullets}
                      rows={8}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...d, bullets: e.target.value } }))
                      }
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Cada linha vira um item da lista exibida na página.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fontes de pesquisa (padrão acadêmico, uma por linha)
                    </label>
                    <textarea
                      value={d.sources}
                      rows={4}
                      placeholder="IBGE (2025). Contas Nacionais Trimestrais. https://…"
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [s.id]: { ...d, sources: e.target.value } }))
                      }
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Autores
                      </label>
                      <input
                        value={d.authors}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [s.id]: { ...d, authors: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contato dos autores
                      </label>
                      <input
                        value={d.authorContact}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [s.id]: { ...d, authorContact: e.target.value },
                          }))
                        }
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="rounded-md bg-secondary/60 p-4">
                    <p className="text-xs text-muted-foreground">
                      A inteligência artificial escreve uma versão atualizada deste tema em padrão
                      acadêmico, com dados-chave e fontes de pesquisa. Revise antes de salvar.
                    </p>
                    <button
                      type="button"
                      disabled={busy === s.id}
                      onClick={async () => {
                        setBusy(s.id);
                        try {
                          const r = await generateBrazilSectionAI({
                            data: { id: s.id, topic: d.title || s.title },
                          });
                          if (!r.ok) toast.error(r.error);
                          else {
                            setDrafts((prev) => ({
                              ...prev,
                              [s.id]: {
                                ...d,
                                title: r.title || d.title,
                                body: r.body,
                                bullets: r.bullets.join("\n"),
                                sources: r.sources.join("\n"),
                              },
                            }));
                            toast.success("Texto gerado. Revise e salve.");
                          }
                        } catch {
                          toast.error("Não foi possível gerar o texto.");
                        } finally {
                          setBusy(null);
                        }
                      }}
                      className="mt-3 rounded-md border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    >
                      Atualizar com IA
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      disabled={busy === s.id}
                      onClick={() => onSave(s.id)}
                      className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                    >
                      {busy === s.id ? "Salvando e traduzindo…" : "Salvar e traduzir"}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        disabled={busy === s.id}
                        onClick={() => onReset(s.id)}
                        className="text-xs text-muted-foreground hover:text-accent"
                      >
                        Restaurar texto original
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}
