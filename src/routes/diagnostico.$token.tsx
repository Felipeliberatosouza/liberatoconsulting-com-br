import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n";
import { getPublicDiagnostic, submitPublicDiagnostic } from "@/lib/projects.functions";
import { answerMissing, type ClientAnswer } from "@/lib/diagnostic-form";
import { isValidEmail } from "@/lib/validation";

export const Route = createFileRoute("/diagnostico/$token")({
  head: () => ({
    meta: [
      { title: "Diagnóstico detalhado — Liberato Consulting" },
      { name: "description", content: "Questionário de diagnóstico para preparar o escopo e a proposta do seu projeto." },
      { property: "og:title", content: "Diagnóstico detalhado — Liberato Consulting" },
      { property: "og:description", content: "Responda as perguntas do diagnóstico do seu projeto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicDiagnostic,
});

function PublicDiagnostic() {
  const { token } = Route.useParams();
  const { logoUrl } = useLanguage();
  const q = useQuery({ queryKey: ["public-diagnostic", token], queryFn: () => getPublicDiagnostic({ data: { token } }) });
  const [resp, setResp] = useState({ name: "", role: "", email: "" });
  const [answers, setAnswers] = useState<Record<string, ClientAnswer>>({});
  const [sent, setSent] = useState(false);
  const [tried, setTried] = useState(false);

  const send = useMutation({
    mutationFn: () => submitPublicDiagnostic({ data: { token, respondent: resp, answers } }),
    onSuccess: (r) => {
      if (!r.ok) return void toast.error(r.error);
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast.error("Revise os campos e tente novamente."),
  });

  const questions = q.data?.questions ?? [];
  const get = (id: string): ClientAnswer => answers[id] ?? { choices: [], detail: "" };
  const set = (id: string, a: ClientAnswer) => setAnswers({ ...answers, [id]: a });
  const missingIds = new Set(questions.filter((x) => answerMissing(x, answers[x.id])).map((x) => x.id));
  const invalid = resp.name.trim().length < 2 || !isValidEmail(resp.email) || missingIds.size > 0;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link to="/"><img src={logoUrl} alt="Liberato Consulting" className="h-10 w-auto" /></Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Diagnóstico</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        {q.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !q.data ? (
          <p className="text-sm">Link inválido ou expirado. Fale com a Liberato Consulting.</p>
        ) : sent || q.data.submitted ? (
          <div className="rounded-2xl border border-border bg-background p-8 text-center">
            <CheckCircle2 className="mx-auto size-10 text-accent" />
            <h1 className="mt-4 font-display text-2xl font-bold">Diagnóstico recebido</h1>
            <p className="mt-3 text-sm text-muted-foreground">Obrigado! Nossa equipe vai analisar as respostas e retornar em breve.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">Diagnóstico detalhado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {q.data.client_name ? `${q.data.client_name} · ` : ""}{q.data.service_title}. Escolha as alternativas e explique cada resposta com detalhes.
            </p>
            <section className="mt-6 grid gap-4 rounded-2xl border border-border bg-background p-6 sm:grid-cols-3">
              <div><Label>Seu nome *</Label><Input value={resp.name} onChange={(e) => setResp({ ...resp, name: e.target.value })} /></div>
              <div><Label>Cargo</Label><Input value={resp.role} onChange={(e) => setResp({ ...resp, role: e.target.value })} /></div>
              <div><Label>E-mail *</Label><Input type="email" value={resp.email} onChange={(e) => setResp({ ...resp, email: e.target.value })} /></div>
            </section>
            {Array.from(new Set(questions.map((x) => x.block))).map((block) => (
              <section key={block} className="mt-6 space-y-4">
                <h2 className="font-display text-lg font-semibold">{block}</h2>
                {questions.filter((x) => x.block === block).map((x) => {
                  const a = get(x.id);
                  const bad = tried && missingIds.has(x.id);
                  return (
                    <div key={x.id} className={`rounded-2xl border bg-background p-6 ${bad ? "border-destructive" : "border-border"}`}>
                      <div className="flex items-start gap-2">
                        <p className="font-medium">{x.question}{x.required ? <span className="text-destructive"> *</span> : null}</p>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" aria-label="Por que perguntamos" className="text-muted-foreground hover:text-accent"><HelpCircle className="size-4" /></button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs leading-5">{x.purpose}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {x.options.length ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {x.options.map((opt) => {
                            const on = a.choices.includes(opt);
                            return (
                              <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm">
                                {x.multi ? (
                                  <Checkbox checked={on} onCheckedChange={(v) => set(x.id, { ...a, choices: v ? [...a.choices, opt] : a.choices.filter((c) => c !== opt) })} />
                                ) : (
                                  <input type="radio" name={x.id} checked={on} onChange={() => set(x.id, { ...a, choices: [opt] })} />
                                )}
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                      <Textarea className="mt-3" rows={3} placeholder="Explique sua resposta com detalhes (obrigatório)" value={a.detail} onChange={(e) => set(x.id, { ...a, detail: e.target.value })} />
                      {bad ? <p className="mt-1 text-xs text-destructive">{x.options.length ? "Escolha uma alternativa e explique a resposta." : "Explique a resposta."}</p> : null}
                    </div>
                  );
                })}
              </section>
            ))}
            <Button className="mt-8" disabled={send.isPending} onClick={() => { setTried(true); if (invalid) return void toast.error("Preencha os campos destacados."); send.mutate(); }}>
              {send.isPending ? "Enviando…" : "Enviar diagnóstico"}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
