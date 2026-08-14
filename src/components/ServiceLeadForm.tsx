import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { submitLead } from "@/lib/leads.functions";


type Props = { serviceSlug: string; serviceTitle: string };

export function ServiceLeadForm({ serviceSlug, serviceTitle }: Props) {
  const { t, lang } = useLanguage();
  const F = t.serviceDetail.form;
  const send = useServerFn(submitLead);

  const startedAt = useRef(Date.now());
  const challenge = useMemo(
    () => ({ a: 1 + Math.floor(Math.random() * 8), b: 1 + Math.floor(Math.random() * 8) }),
    [],
  );

  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setStatus("sending");
    setError(null);
    try {
      const result = await send({
        data: {
          name: String(fd.get("name") ?? ""),
          company: String(fd.get("company") ?? ""),
          country: String(fd.get("country") ?? ""),
          email: String(fd.get("email") ?? ""),
          message: String(fd.get("message") ?? ""),
          serviceSlug,
          serviceTitle,
          language: lang,
          sourcePath: typeof window !== "undefined" ? window.location.pathname : "",
          website: String(fd.get("website") ?? ""),
          elapsedMs: Date.now() - startedAt.current,
          captchaAnswer: String(fd.get("captcha") ?? ""),
          captchaA: challenge.a,
          captchaB: challenge.b,
        },
      });

      if (result.ok) {
        setStatus("done");
        trackEvent("form_submit", { form_name: "service_lead", service: serviceTitle });
        form.reset();
        return;
      }
      setStatus("idle");
      setError(
        result.reason === "captcha"
          ? F.errorCaptcha
          : result.reason === "tooFast"
            ? F.errorTooFast
            : result.reason === "rateLimited"
              ? F.errorRate
              : F.errorGeneric,
      );
    } catch {
      setStatus("idle");
      setError(F.errorGeneric);
    }
  }

  const field =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div id="contato" className="mt-12 rounded-2xl border border-border bg-secondary p-8">
      <h2 className="font-display text-2xl font-bold tracking-tight">{F.title}</h2>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{F.body}</p>

      {status === "done" ? (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium">
          {F.success}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            {F.name}
            <input name="name" required minLength={2} maxLength={100} className={field} />
          </label>
          <label className="text-sm font-medium">
            {F.company}
            <input name="company" required minLength={2} maxLength={120} className={field} />
          </label>
          <label className="text-sm font-medium">
            {F.country}
            <input name="country" required minLength={2} maxLength={80} className={field} />
          </label>
          <label className="text-sm font-medium">
            {F.email}
            <input name="email" type="email" maxLength={255} className={field} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.service}
            <input name="service" value={serviceTitle} readOnly className={`${field} opacity-70`} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.message}
            <textarea name="message" rows={3} maxLength={1500} className={field} />
          </label>

          {/* Honeypot: invisível para pessoas, preenchido por bots */}
          <div aria-hidden="true" className="hidden">
            <label>
              Website
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <label className="text-sm font-medium sm:col-span-2">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              {F.captcha} {challenge.a} + {challenge.b}?
            </span>
            <input
              name="captcha"
              required
              inputMode="numeric"
              autoComplete="off"
              className={`${field} sm:max-w-40`}
            />
          </label>

          {error && <p className="text-sm font-medium text-destructive sm:col-span-2">{error}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? F.sending : F.submit}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
