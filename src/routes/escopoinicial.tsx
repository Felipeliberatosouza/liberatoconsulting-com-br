import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileText, HelpCircle, Mail, Newspaper, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLanguage } from "@/i18n";
import { getPublicCompanyIdentity } from "@/lib/company-public.functions";
import { submitScopeForm } from "@/lib/projects.functions";
import { scopeQuestions, scopeTexts } from "@/lib/scope-form-i18n";
import { pageText } from "@/lib/page-translations";
import {
  formatPhone,
  isValidEmail,
  isValidPhone,
  PHONE_ERROR,
  PHONE_PLACEHOLDER,
} from "@/lib/validation";

export const Route = createFileRoute("/escopoinicial")({
  head: () => ({
    meta: [
      { title: "Escopo inicial de necessidade — Liberato Consulting" },
      {
        name: "description",
        content:
          "Formulário rápido para entendermos sua necessidade e preparar uma proposta de consultoria adequada.",
      },
      { property: "og:title", content: "Escopo inicial de necessidade — Liberato Consulting" },
      {
        property: "og:description",
        content: "Responda 10 perguntas objetivas para recebermos o escopo do seu projeto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ScopePage,
});

const SITE = "https://liberatoconsulting.com.br";

const FREE_LINKS = [
  { href: `${SITE}/ferramentas`, key: "freeGuide", icon: BookOpen },
  { href: `${SITE}/newsletters`, key: "freeNewsletter", icon: Mail },
  { href: `${SITE}/content`, key: "freeArticles", icon: FileText },
  { href: `${SITE}/boletins`, key: "freeBulletin", icon: Newspaper },
] as const;

function QuestionHelp({ text, label }: { text: string; label: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="text-muted-foreground transition-colors hover:text-accent"
          >
            <HelpCircle className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-5">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ScopePage() {
  const { lang, logoUrl } = useLanguage();
  const p = pageText(lang).scope;
  const texts = scopeTexts(lang);
  const questions = scopeQuestions(lang);
  const company = useQuery({
    queryKey: ["public-company-identity"],
    queryFn: () => getPublicCompanyIdentity(),
    staleTime: 5 * 60 * 1000,
  });
  const c = company.data;

  const [form, setForm] = useState({
    company: "",
    respondent_name: "",
    respondent_role: "",
    email: "",
    phone: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: () =>
      submitScopeForm({
        data: { ...form, answers, comments, lang },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(p.sendError);
        return;
      }
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast.error(p.fieldError),
  });

  const emailInvalid = form.email.trim().length > 0 && !isValidEmail(form.email);
  const phoneInvalid = !isValidPhone(form.phone);
  const missing =
    form.company.trim().length < 2 ||
    form.respondent_name.trim().length < 2 ||
    !isValidEmail(form.email) ||
    phoneInvalid ||
    questions.some((q) => !answers[q.id]);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Liberato Consulting" className="h-10 w-auto" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {p.eyebrow}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {sent ? (
          <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto size-10 text-accent" />
            <h1 className="mt-4 font-display text-2xl font-bold">{p.sentTitle}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {p.sentText}
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">{p.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{texts.intro}</p>
            <p className="mt-2 text-sm text-muted-foreground">{texts.help}</p>

            <section className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold">{p.contactTitle}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="company">{p.company}</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">{p.name}</Label>
                  <Input
                    id="name"
                    value={form.respondent_name}
                    onChange={(e) => setForm({ ...form, respondent_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">{p.role}</Label>
                  <Input
                    id="role"
                    value={form.respondent_role}
                    onChange={(e) => setForm({ ...form, respondent_role: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{p.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    aria-invalid={emailInvalid}
                    className={
                      emailInvalid ? "border-destructive ring-1 ring-destructive" : undefined
                    }
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {emailInvalid ? (
                    <span className="mt-1 block text-xs text-destructive">
                      {p.emailError}
                    </span>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="phone">{p.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={25}
                    placeholder={PHONE_PLACEHOLDER}
                    value={form.phone}
                    aria-invalid={phoneInvalid && form.phone.trim().length > 0}
                    className={
                      phoneInvalid && form.phone.trim().length > 0
                        ? "border-destructive ring-1 ring-destructive"
                        : undefined
                    }
                    onFocus={() => !form.phone && setForm({ ...form, phone: "+55" })}
                    onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  />
                  {phoneInvalid && form.phone.trim().length > 0 ? (
                    <span className="mt-1 block text-xs text-destructive">{PHONE_ERROR}</span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="mt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">{p.questionsTitle}</h2>
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    {q.index}. {q.theme}
                  </p>
                  <div className="mt-2 flex items-start gap-2">
                    <p className="font-medium">{q.question}</p>
                    <QuestionHelp text={q.purpose} label={p.helpAria} />
                  </div>
                  {q.hint ? (
                    <p className="mt-1 text-xs text-muted-foreground/80">{q.hint}</p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                          answers[q.id] === opt
                            ? "border-accent bg-accent/10 font-medium"
                            : "border-border hover:border-accent/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="accent-[hsl(var(--accent))]"
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                  {q.dateWhen && answers[q.id] === q.dateWhen ? (
                    <div className="mt-4">
                      <Label htmlFor={`d-${q.id}`} className="text-xs text-muted-foreground">
                        {p.dateLabel}
                      </Label>
                      <Input
                        id={`d-${q.id}`}
                        type="date"
                        className="mt-1 w-full sm:w-56"
                        value={answers[`${q.id}_data`] ?? ""}
                        onChange={(e) =>
                          setAnswers({ ...answers, [`${q.id}_data`]: e.target.value })
                        }
                      />
                    </div>
                  ) : null}
                  <div className="mt-4">
                    <Label htmlFor={`c-${q.id}`} className="text-xs text-muted-foreground">
                      {p.comments}
                    </Label>
                    <Textarea
                      id={`c-${q.id}`}
                      rows={2}
                      value={comments[q.id] ?? ""}
                      onChange={(e) => setComments({ ...comments, [q.id]: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </section>

            <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
              {texts.note}
            </p>

            <Button
              className="mt-6 w-full sm:w-auto"
              disabled={missing || send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? p.sending : p.submit}
            </Button>
            {missing ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {p.missing}
              </p>
            ) : null}
          </>
        )}
      </main>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold">
            {p.freeTitle}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {FREE_LINKS.map(({ href, key, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border p-5 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{p[key]}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-ink-foreground">
        <div className="mx-auto max-w-3xl px-6 py-8 text-sm leading-6">
          <p className="font-bold">{c?.tradeName || "Liberato Consulting"}</p>
          {c?.cnpj ? <p className="text-ink-foreground/75">CNPJ {c.cnpj}</p> : null}
          {c?.address ? <p className="text-ink-foreground/75">{c.address}</p> : null}
          {c?.phone ? <p className="text-ink-foreground/75">{c.phone}</p> : null}
          <p className="text-ink-foreground/75">
            {c?.website || "liberatoconsulting.com.br"}
          </p>
          <p className="text-ink-foreground/75">
            {c?.email || "contato@liberatoconsulting.com.br"}
          </p>
        </div>
      </footer>
    </div>
  );
}
