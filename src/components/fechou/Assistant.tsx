import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { askFechou } from "@/lib/fechou-ai.functions";
import { metrics, money, type Deal, type Stage, type Member } from "@/lib/fechou";

type Draft = { company: string; contact: string; segment: string; notes: string };
export function Assistant({
  workspace,
  canManage,
  deals,
  stages,
  members,
  fill,
}: {
  workspace: string;
  canManage: boolean;
  deals: Deal[];
  stages: Stage[];
  members: Member[];
  fill: (draft: Draft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"help" | "report" | "draft">("help");
  const [text, setText] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof askFechou>>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const metric = result?.metric;
  const grouped =
    result?.group === "stage"
      ? stages.map((s) => ({ label: s.name, deals: deals.filter((d) => d.stage_id === s.id) }))
      : result?.group === "seller"
        ? members.map((m) => ({
            label: m.name,
            deals: deals.filter((d) => d.owner_id === m.user_id),
          }))
        : [{ label: "Total", deals }];
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles /> Assistente
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88dvh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Assistente Fechou!</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setResult(undefined);
              setError("");
              try {
                setResult(await askFechou({ data: { workspace, mode, question: text } }));
              } catch {
                setError("Não foi possível consultar o assistente agora.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="grid gap-1 text-sm">
              Solicitação
              <select
                className="h-9 rounded-md border border-input bg-background px-2"
                value={mode}
                disabled={busy}
                onChange={(e) => {
                  setMode(
                    e.target.value === "draft"
                      ? "draft"
                      : e.target.value === "report"
                        ? "report"
                        : "help",
                  );
                  setResult(undefined);
                }}
              >
                <option value="help">Tirar dúvida</option>
                <option value="draft">Rascunhar oportunidade</option>
                {canManage && <option value="report">Montar indicador</option>}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Mensagem
              <Textarea
                value={text}
                minLength={3}
                maxLength={600}
                required
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "report"
                    ? "Ex.: ticket médio por vendedor"
                    : "Não inclua dados pessoais ou confidenciais."
                }
              />
            </label>
            <Button disabled={busy}>{busy ? "Consultando…" : "Consultar"}</Button>
          </form>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {result && (
            <div className="grid gap-3 border-t border-border pt-4 text-sm" role="status">
              <p className="whitespace-pre-wrap break-words">{result.answer}</p>
              {metric && mode === "report" && (
                <ul className="divide-y divide-border">
                  {grouped.map(({ label, deals: rows }, i) => {
                    const n = metric === "count" ? rows.length : metrics(rows, stages)[metric];
                    return (
                      <li key={i} className="flex justify-between gap-2 py-1">
                        <span>{label}</span>
                        <strong>
                          {metric === "count"
                            ? n
                            : metric === "conversion"
                              ? `${n.toFixed(1)}%`
                              : metric === "days"
                                ? `${n.toFixed(1)} dias`
                                : money.format(n)}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              )}
              {result.draft && mode === "draft" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (result.draft) {
                      fill(result.draft);
                      setOpen(false);
                    }
                  }}
                >
                  Revisar no cadastro
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
