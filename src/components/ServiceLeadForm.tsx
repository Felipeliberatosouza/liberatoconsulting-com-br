import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { submitLead } from "@/lib/leads.functions";
import { identifyVisitor } from "@/lib/crm-track.functions";
import { visitorId } from "@/components/CrmTracker";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import {
  formatPhone,
  isValidEmail,
  isValidPhone,
  PHONE_ERROR,
  PHONE_PLACEHOLDER,
} from "@/lib/validation";

type Props = { serviceSlug: string; serviceTitle: string };

const EMPTY = { name: "", company: "", country: "", email: "", phone: "", message: "", captcha: "" };

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
  const { validate, hasError, errorClass } = useFieldErrors();
  const [values, setValues] = useState({ ...EMPTY });
  const autoMessage = useRef("");

  const product = t.serviceDetail.pages.find((p) => p.id === serviceSlug);

  /** Mensagem sugerida com o problema do serviço e assinatura do visitante. */
  function buildMessage(name: string) {
    const problem = product?.problem ?? "";
    const lowered = problem ? problem.charAt(0).toLowerCase() + problem.slice(1) : "";
    return `${t.contact.messageIntro}${lowered}\n\n${t.contact.messageOutro}\n${name}`.trimEnd();
  }

  // Preenche a mensagem automática na abertura e ao trocar de idioma/serviço,
  // sem sobrescrever quando o visitante já editou o texto.
  useEffect(() => {
    const next = buildMessage(values.name);
    autoMessage.current = next;
    setValues((v) => ({ ...v, message: next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, serviceSlug]);

  const onField =
    (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const next = e.target.value;
      setValues((v) => {
        const updated = { ...v, [key]: next };
        // Atualiza a assinatura da mensagem automática quando o nome muda.
        if (key === "name" && (!v.message || v.message === autoMessage.current)) {
          const msg = buildMessage(next);
          autoMessage.current = msg;
          updated.message = msg;
        }
        return updated;
      });
    };

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  const emailInvalid = Boolean(values.email) && !isValidEmail(values.email);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    if (
      !validate({
        name: values.name,
        company: values.company,
        country: values.country,
        email: values.email,
        phone: values.phone,
        message: values.message,
        captcha: values.captcha,
      })
    )
      return;
    if (!isValidEmail(values.email)) {
      setError(t.contact.invalidEmail);
      return;
    }
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
        const vid = visitorId();
        if (vid && values.email) {
          void identifyVisitor({ data: { visitorId: vid, email: values.email } }).catch(() => {});
        }
        setStatus("done");
        trackEvent("form_submit", { form_name: "service_lead", service: serviceTitle });
        setValues({ ...EMPTY });
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
  const requiredMark = <span className="text-destructive"> *</span>;
  const requiredNote = (key: string, value: string) =>
    hasError(key, value) ? (
      <span className="mt-1 block text-xs text-destructive">{t.contact.required}</span>
    ) : null;

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
            {requiredMark}
            <input name="name" required minLength={2} maxLength={100} value={values.name} onChange={onField("name")} className={`${field}${errorClass("name", values.name)}`} />
            {requiredNote("name", values.name)}
          </label>
          <label className="text-sm font-medium">
            {F.company}
            {requiredMark}
            <input name="company" required minLength={2} maxLength={120} value={values.company} onChange={onField("company")} className={`${field}${errorClass("company", values.company)}`} />
            {requiredNote("company", values.company)}
          </label>
          <label className="text-sm font-medium">
            {F.country}
            {requiredMark}
            <input name="country" required minLength={2} maxLength={80} value={values.country} onChange={onField("country")} className={`${field}${errorClass("country", values.country)}`} />
            {requiredNote("country", values.country)}
          </label>
          <label className="text-sm font-medium">
            {F.email}
            {requiredMark}
            <input
              name="email"
              type="email"
              required
              maxLength={255}
              value={values.email}
              onChange={onField("email")}
              className={`${field}${errorClass("email", values.email)}${emailInvalid ? " border-destructive ring-1 ring-destructive" : ""}`}
              aria-invalid={hasError("email", values.email) || emailInvalid}
            />
            {hasError("email", values.email) ? (
              <span className="mt-1 block text-xs text-destructive">{t.contact.required}</span>
            ) : emailInvalid ? (
              <span className="mt-1 block text-xs text-destructive">{t.contact.invalidEmail}</span>
            ) : null}
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Telefone
            {requiredMark}
            <input name="phone" type="tel" required inputMode="tel" autoComplete="tel" maxLength={25} value={values.phone} onFocus={() => !values.phone && setValues((v) => ({ ...v, phone: "+55" }))} onChange={(e) => setValues((v) => ({ ...v, phone: formatPhone(e.target.value) }))} placeholder={PHONE_PLACEHOLDER} className={`${field}${errorClass("phone", values.phone)}${values.phone && !isValidPhone(values.phone) ? " border-destructive ring-1 ring-destructive" : ""}`} aria-invalid={Boolean(values.phone) && !isValidPhone(values.phone)} />
            {hasError("phone", values.phone) ? (
              <span className="mt-1 block text-xs text-destructive">{t.contact.required}</span>
            ) : values.phone && !isValidPhone(values.phone) ? (
              <span className="mt-1 block text-xs text-destructive">{PHONE_ERROR}</span>
            ) : null}
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.service}
            {requiredMark}
            <input name="service" value={serviceTitle} required readOnly className={`${field} opacity-70`} />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            {F.message}
            {requiredMark}
            <textarea name="message" rows={4} required maxLength={1500} value={values.message} onChange={onField("message")} className={`${field}${errorClass("message", values.message)}`} />
            {requiredNote("message", values.message)}
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
              {F.captcha} {challenge.a} + {challenge.b}?{requiredMark}
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
            {requiredNote("captcha", values.captcha)}
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
