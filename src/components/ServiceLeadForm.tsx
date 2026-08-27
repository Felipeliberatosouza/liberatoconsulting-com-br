import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { submitLead } from "@/lib/leads.functions";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { formatPhone, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";


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
  const successRef = useRef<HTMLParagraphElement>(null);
  const { validate, errorClass } = useFieldErrors();
  const [values, setValues] = useState({ name: "", company: "", country: "", email: "", phone: "", message: "", captcha: "" });
  const onField = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    if (!validate({ name: values.name, company: values.company, country: values.country, email: values.email, phone: values.phone, message: values.message, captcha: values.captcha })) return;
    if (!isValidPhone(values.phone)) {
      setError(PHONE_ERROR);
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const result = await send({
        data: {
          name: String(fd.get("name") ?? ""),
          company: String(fd.get("company") ?? ""),
          country: String(fd.get("country") ?? ""),
          email: String(fd.get("email") ?? ""),
           phone: values.phone,
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
        setValues({ name: "", company: "", country: "", email: "", phone: "", message: "", captcha: "" });
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
        <p
          ref={successRef}
          className="mt-6 scroll-mt-28 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium"
        >
          {F.success}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            {F.name}
            <input name="name" required minLength={2} maxLength={100} value={values.name} onChange={onField("name")} className={`${field}${errorClass("name", values.name)}`} />
          </label>
          <label className="text-sm font-medium">
            {F.company}
            <input name="company" required minLength={2} maxLength={120} value={values.company} onChange={onField("company")} className={`${field}${errorClass("company", values.company)}`} />
          </label>
          <label className="text-sm font-medium">
            {F.country}
            <input name="country" required minLength={2} maxLength={80} value={values.country} onChange={onField("country")} className={`${field}${errorClass("country", values.country)}`} />
          </label>
          <label className="text-sm font-medium">
            {F.email}
            <input name="email" type="email" maxLength={255} value={values.email} onChange={onField("email")} className={`${field}${errorClass("email", values.email)}`} />
          </label>
          <label className="text-sm font-medium">
            Telefone
            <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" maxLength={25} value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: formatPhone(e.target.value) }))} placeholder={PHONE_PLACEHOLDER} className={`${field}${errorClass("phone", values.phone)}${values.phone && !isValidPhone(values.phone) ? " border-destructive ring-1 ring-destructive" : ""}`} aria-invalid={Boolean(values.phone) && !isValidPhone(values.phone)} />
            {values.phone && !isValidPhone(values.phone) && <span className="mt-1 block text-xs text-destructive">Use o formato +55 (11) 9999-9999.</span>}
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.service}
            <input name="service" value={serviceTitle} readOnly className={`${field} opacity-70`} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.message}
            <textarea name="message" rows={3} maxLength={1500} value={values.message} onChange={onField("message")} className={`${field}${errorClass("message", values.message)}`} />
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
              inputMode="tel"
              autoComplete="off"
              value={values.captcha}
              onChange={onField("captcha")}
              className={`${field} sm:max-w-40${errorClass("captcha", values.captcha)}`}
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
