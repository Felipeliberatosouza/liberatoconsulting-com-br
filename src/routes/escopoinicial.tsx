import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, FileText, Mail, Newspaper, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n";
import { getPublicCompanyIdentity } from "@/lib/company-public.functions";
import { submitScopeForm } from "@/lib/projects.functions";
import { SCOPE_HELP, SCOPE_INTRO, SCOPE_NOTE, SCOPE_QUESTIONS } from "@/lib/scope-form";

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

const FREE_LINKS = [
  { to: "/guia-gestao", label: "Guia de Gestão Completa", icon: BookOpen },
  { to: "/newsletters", label: "Newsletter", icon: Mail },
  { to: "/content", label: "Artigos", icon: FileText },
  { to: "/boletins", label: "Boletim Semanal", icon: Newspaper },
] as const;

function ScopePage() {
  const { logoUrl } = useLanguage();
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
        data: { ...form, answers, comments, lang: "pt" },
      }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error("Não foi possível enviar. Tente novamente.");
        return;
      }
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast.error("Verifique os campos obrigatórios e tente novamente."),
  });

  const missing =
    form.company.trim().length < 2 ||
    form.respondent_name.trim().length < 2 ||
    !form.email.includes("@") ||
    SCOPE_QUESTIONS.some((q) => !answers[q.id]);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link to="/">
            <img src={logoUrl} alt="Liberato Consulting" className="h-10 w-auto" />
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Escopo inicial
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {sent ? (
          <div className="rounded-2xl border border-border bg-background p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto size-10 text-accent" />
            <h1 className="mt-4 font-display text-2xl font-bold">Recebemos suas respostas!</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Obrigado por compartilhar o contexto do seu projeto. Nossa equipe vai analisar as
              informações e entrar em contato pelo e-mail informado.
            </p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold">
              Escopo inicial de necessidade do cliente
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{SCOPE_INTRO}</p>
            <p className="mt-2 text-sm text-muted-foreground">{SCOPE_HELP}</p>

            <section className="mt-8 rounded-2xl border border-border bg-background p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold">Identificação do contato</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome de quem responde *</Label>
                  <Input
                    id="name"
                    value={form.respondent_name}
                    onChange={(e) => setForm({ ...form, respondent_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Cargo</Label>
                  <Input
                    id="role"
                    value={form.respondent_role}
                    onChange={(e) => setForm({ ...form, respondent_role: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="mt-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Perguntas essenciais</h2>
              {SCOPE_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                    {q.index}. {q.theme}
                  </p>
                  <p className="mt-2 font-medium">{q.question}</p>
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
                  <div className="mt-4">
                    <Label htmlFor={`c-${q.id}`} className="text-xs text-muted-foreground">
                      Comentários (opcional)
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
              {SCOPE_NOTE}
            </p>

            <Button
              className="mt-6 w-full sm:w-auto"
              disabled={missing || send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Enviando…" : "Enviar respostas"}
            </Button>
            {missing ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Preencha empresa, nome, e-mail e todas as 10 perguntas para enviar.
              </p>
            ) : null}
          </>
        )}
      </main>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-6 py-10 text-center">
          <p className="font-display text-lg font-semibold">
            Receba ferramentas gratuitas de gestão
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {FREE_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border p-5 transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
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
