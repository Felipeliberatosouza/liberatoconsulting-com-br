import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { loadEffectiveKitContent, regenerateProspectKit } from "@/lib/prospect-kit-build";
import { editKitContent, getProspectKit, resetKitContent } from "@/lib/prospect-kit.functions";

export const Route = createFileRoute("/admin/material-prospeccao")({
  head: () => ({
    meta: [
      { title: "Banner e slides do e-mail — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KitEditor,
});

type Msg = { role: "user" | "ai"; text: string };

const EXAMPLES = [
  "Troque o título do banner por: IA e gestão para crescer com margem",
  "No slide 3, mude o subtítulo para convidar para um café de 30 minutos",
  "No slide 2, deixe o texto de Treinamentos In Company mais curto e direto",
];

function KitEditor() {
  const qc = useQueryClient();
  const kit = useQuery({ queryKey: ["prospect-kit"], queryFn: () => getProspectKit(), retry: false });
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<Msg[]>([]);

  async function apply() {
    const text = request.trim();
    if (text.length < 3) return;
    setBusy(true);
    setHistory((h) => [...h, { role: "user", text }]);
    try {
      const current = await loadEffectiveKitContent();
      const r = await editKitContent({ data: { request: text, current } });
      await regenerateProspectKit(r.content);
      await qc.invalidateQueries({ queryKey: ["prospect-kit"] });
      setHistory((h) => [...h, { role: "ai", text: r.summary }]);
      setRequest("");
      toast.success("Banner e slides atualizados.");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Falha ao aplicar o pedido";
      setHistory((h) => [...h, { role: "ai", text: m }]);
      toast.error(m);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!confirm("Voltar todos os textos ao padrão do painel?")) return;
    setBusy(true);
    try {
      await resetKitContent();
      await regenerateProspectKit(null);
      await qc.invalidateQueries({ queryKey: ["prospect-kit"] });
      setHistory((h) => [...h, { role: "ai", text: "Textos restaurados ao padrão." }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao restaurar");
    } finally {
      setBusy(false);
    }
  }

  const urls = kit.data?.urls;
  const stamp = kit.data?.updatedAt ?? "";
  return (
    <AdminShell
      title="Banner e slides do e-mail de prospecção"
      description="Escreva o que deseja mudar. O banner e o resumo em PowerPoint/PDF são refeitos na hora e passam a ir nos próximos e-mails."
      requireAdmin
    >
      <div className="space-y-6">

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {history.length === 0 ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Exemplos de pedido:</p>
                  {EXAMPLES.map((ex) => (
                    <button key={ex} type="button" onClick={() => setRequest(ex)} className="block w-full rounded-lg border border-border px-3 py-2 text-left hover:border-accent">
                      {ex}
                    </button>
                  ))}
                </div>
              ) : (
                history.map((m, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-muted text-foreground" : "border border-border text-muted-foreground"}`}>
                    {m.text}
                  </div>
                ))
              )}
            </div>
            <Textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Ex.: No banner, troque a métrica 20+ anos por 25+ anos"
              rows={4}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void apply();
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void apply()} disabled={busy || request.trim().length < 3}>
                <Send className="mr-1 size-4" /> {busy ? "Aplicando…" : "Aplicar alteração"}
              </Button>
              <Button variant="outline" onClick={() => void reset()} disabled={busy}>
                <RotateCcw className="mr-1 size-4" /> Restaurar padrão
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {urls ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <a href={urls.pdf} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> PDF</a>
                  <a href={urls.pptx} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> PowerPoint</a>
                  <a href={urls.banner} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Download className="size-3" /> Banner (PNG)</a>
                  <span className="text-xs text-muted-foreground">Atualizado em {new Date(stamp).toLocaleString("pt-BR")}</span>
                </div>
                <img key={`b-${stamp}`} src={urls.bannerView} alt="Banner do e-mail" className="w-full max-w-3xl rounded-lg border border-border" />
                <iframe key={`p-${stamp}`} src={urls.pdfView} title="Slides do resumo" className="h-[560px] w-full rounded-lg border border-border" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{kit.isLoading ? "Carregando…" : "Material ainda não gerado. Faça um pedido ou gere em Projetos → Apresentações."}</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
