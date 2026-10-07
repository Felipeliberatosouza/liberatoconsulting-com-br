import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ConsultantOnboardingForm, onboardingMissing } from "@/components/ConsultantOnboardingForm";
import { Button } from "@/components/ui/button";
import { EMPTY_ONBOARDING, type OnboardingData } from "@/lib/onboarding-fields";
import { getOnboardingByToken, submitOnboarding } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/novoconsultor")({
  validateSearch: (s) => z.object({ c: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Cadastro de novo consultor — Liberato Consulting" },
      { name: "description", content: "Cadastro de consultores aprovados para a equipe da Liberato Consulting." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Cadastro de novo consultor — Liberato Consulting" },
      { property: "og:description", content: "Cadastro de consultores aprovados para a equipe da Liberato Consulting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewConsultantPage,
});

const UUID = /^[0-9a-f-]{36}$/i;

function NewConsultantPage() {
  const { c } = Route.useSearch();
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  // Guarda o código do convite e deixa o endereço limpo: /novoconsultor
  useEffect(() => {
    const KEY = "liberato-onboarding-token";
    let t = c && UUID.test(c) ? c : "";
    if (t) window.sessionStorage.setItem(KEY, t);
    else t = window.sessionStorage.getItem(KEY) ?? "";
    if (window.location.search) window.history.replaceState(null, "", "/novoconsultor");
    setToken(UUID.test(t) ? t : "");
    setReady(true);
  }, [c]);
  const invite = useQuery({
    queryKey: ["onboarding-invite", token],
    queryFn: () => getOnboardingByToken({ data: { token } }),
    enabled: Boolean(token),
    retry: false,
  });
  const [form, setForm] = useState<OnboardingData>(EMPTY_ONBOARDING);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const d = invite.data;
    if (d && d.ok) {
      setForm((f) => ({ ...f, full_name: f.full_name || d.full_name, email: f.email || d.email, phone: f.phone || d.phone }));
    }
  }, [invite.data]);

  const send = useMutation({
    mutationFn: () =>
      submitOnboarding({
        data: {
          token,
          data: {
            ...form,
            specialties: form.specialties.filter(Boolean),
            segments: form.segments.filter(Boolean),
            certifications: form.certifications.filter(Boolean),
            highlights: form.highlights.filter(Boolean),
          },
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: () => toast.error("Revise os campos obrigatórios e tente novamente."),
  });

  const missing = onboardingMissing(form);
  const msg = (t: string) => (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Cadastro de novo consultor</h1>
      <p className="mt-4 text-muted-foreground">{t}</p>
    </div>
  );

  if (!ready) return msg("Carregando…");
  if (!token) return msg("Este endereço precisa do link pessoal enviado por e-mail. Abra o link recebido.");
  if (invite.isLoading) return msg("Carregando…");
  if (!invite.data?.ok) {
    const r = invite.data && !invite.data.ok ? invite.data.reason : "invalid";
    return msg(
      r === "used"
        ? "Este cadastro já foi enviado. Nossa equipe entrará em contato."
        : r === "expired"
          ? "Este link expirou. Peça um novo link à Liberato Consulting."
          : "Link inválido. Confira o endereço recebido por e-mail.",
    );
  }
  if (done) return msg("Cadastro enviado com sucesso! Nossa equipe vai revisar as informações e enviar o contrato para assinatura.");

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Liberato Consulting</span>
        <h1 className="mt-2 font-display text-3xl font-bold">Cadastro de novo consultor</h1>
        <p className="mt-3 text-muted-foreground">
          Parabéns pela aprovação! Preencha o seu perfil profissional e os dados para o contrato. Campos com * são obrigatórios.
        </p>
        <div className="mt-8">
          <ConsultantOnboardingForm value={form} onChange={setForm} />
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button size="lg" disabled={missing.length > 0 || send.isPending} onClick={() => send.mutate()}>
            {send.isPending ? "Enviando…" : "Enviar cadastro"}
          </Button>
          {missing.length > 0 ? <span className="text-sm text-muted-foreground">Falta preencher: {missing.join(", ")}.</span> : null}
        </div>
      </div>
    </div>
  );
}
