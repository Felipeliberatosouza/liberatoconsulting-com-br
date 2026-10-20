import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n";
import { submitSatisfaction } from "@/lib/satisfaction.functions";
import { REASONS, SURVEY_TEXTS, surveyQuestions, type Lang, type SurveyKind } from "@/lib/satisfaction";
import { isValidEmail } from "@/lib/validation";

export const Route = createFileRoute("/satisfacao")({
  validateSearch: z.object({ tipo: z.enum(["executado", "nao-executado"]).optional() }),
  head: () => ({
    meta: [
      { title: "Pesquisa de satisfação — Liberato Consulting" },
      { name: "description", content: "Avalie sua experiência com a Liberato Consulting em apenas 3 perguntas." },
      { property: "og:title", content: "Pesquisa de satisfação — Liberato Consulting" },
      { property: "og:description", content: "Três perguntas rápidas para ouvirmos sua opinião." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurveyPage,
});

function Stars({ value, onChange }: { value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="mt-3 flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" aria-label={`${n}`} onClick={() => onChange(n)}>
          <Star className={`size-8 ${value && n <= value ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

function SurveyPage() {
  const { tipo } = Route.useSearch();
  const { lang: rawLang, logoUrl } = useLanguage();
  const lang = (["pt", "en", "es", "zh"].includes(rawLang) ? rawLang : "pt") as Lang;
  const t = SURVEY_TEXTS[lang];
  const kind: SurveyKind | null = tipo === "executado" ? "executado" : tipo === "nao-executado" ? "nao_executado" : null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Liberato Consulting" className="h-10 w-auto" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t.eyebrow}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        {kind ? (
          <SurveyForm key={kind} kind={kind} lang={lang} />
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">{t.choose}</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(["executado", "nao-executado"] as const).map((k) => (
                <Link
                  key={k}
                  to="/satisfacao"
                  search={{ tipo: k }}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm hover:border-accent"
                >
                  <h2 className="font-display text-lg font-semibold">{k === "executado" ? t.exec : t.nonExec}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{k === "executado" ? t.execDesc : t.nonExecDesc}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SurveyForm({ kind, lang }: { kind: SurveyKind; lang: Lang }) {
  const t = SURVEY_TEXTS[lang];
  const questions = surveyQuestions(kind, lang);
  const reasons = REASONS[lang];
  const [form, setForm] = useState({ company: "", respondent_name: "", email: "", service: "", comment: "", website: "" });
  const [scores, setScores] = useState<Partial<Record<"score1" | "score2" | "score3", number>>>({});
  const [reason, setReason] = useState("");
  const [reasonOther, setReasonOther] = useState("");
  const [sent, setSent] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const isOther = reason === reasons[reasons.length - 1];

  const missing =
    form.company.trim().length < 2 ||
    form.respondent_name.trim().length < 2 ||
    !isValidEmail(form.email) ||
    scores.score1 == null ||
    scores.score3 == null ||
    (kind === "executado" ? scores.score2 == null : !reason || (isOther && !reasonOther.trim()));

  const send = useMutation({
    mutationFn: () =>
      submitSatisfaction({
        data: {
          kind,
          ...form,
          score1: scores.score1!,
          score2: kind === "executado" ? scores.score2! : null,
          score3: scores.score3!,
          reason: kind === "nao_executado" ? (isOther ? `${reason}: ${reasonOther.trim()}` : reason) : "",
          lang,
          elapsedMs: Date.now() - startedAt,
        },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(t.error);
        return;
      }
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast.error(t.error),
  });

  if (sent)
    return (
      <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto size-10 text-accent" />
        <h1 className="mt-4 font-display text-2xl font-bold">{t.sentTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{t.sentText}</p>
      </div>
    );

  return (
    <>
      <h1 className="font-display text-3xl font-bold">{kind === "executado" ? t.execTitle : t.nonExecTitle}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{t.intro}</p>
      <section className="mt-8 grid gap-4 rounded-2xl border border-border bg-background p-6 shadow-sm sm:grid-cols-2">
        {(["company", "respondent_name", "email", "service"] as const).map((f) => (
          <div key={f}>
            <Label htmlFor={f}>
              {f === "company" ? t.company : f === "respondent_name" ? t.name : f === "email" ? t.email : t.service}
              {f !== "service" ? " *" : ""}
            </Label>
            <Input
              id={f}
              type={f === "email" ? "email" : "text"}
              value={form[f]}
              aria-invalid={f === "email" && form.email.length > 0 && !isValidEmail(form.email)}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            />
          </div>
        ))}
        <input
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </section>

      {questions.map((q, i) => (
        <section key={q.id} className="mt-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
          <p className="font-medium">
            {i + 1}. {q.label} *
          </p>
          {q.type === "stars" ? (
            <Stars value={scores[q.id]} onChange={(v) => setScores({ ...scores, [q.id]: v })} />
          ) : q.type === "nps" ? (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: 11 }, (_, n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setScores({ ...scores, [q.id]: n })}
                    className={`size-10 rounded-md border text-sm font-medium ${scores[q.id] === n ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex max-w-[480px] justify-between text-xs text-muted-foreground">
                <span>{t.low}</span>
                <span>{t.high}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {reasons.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
                  {r}
                </label>
              ))}
              {isOther ? (
                <Input value={reasonOther} placeholder={t.other} onChange={(e) => setReasonOther(e.target.value)} aria-invalid={!reasonOther.trim()} />
              ) : null}
            </div>
          )}
        </section>
      ))}

      <section className="mt-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
        <Label htmlFor="comment">{t.comment}</Label>
        <Textarea id="comment" rows={4} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
      </section>

      {missing ? <p className="mt-4 text-sm text-destructive">{t.required}</p> : null}
      <Button className="mt-4 w-full" size="lg" disabled={missing || send.isPending} onClick={() => send.mutate()}>
        {t.send}
      </Button>
    </>
  );
}
