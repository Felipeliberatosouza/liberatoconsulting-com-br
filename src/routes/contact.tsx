import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { seoPageMeta } from "@/lib/seo-meta";
import { keywordsMeta } from "@/lib/keywords";
import { trackEvent } from "@/lib/gtag";
import { submitLead } from "@/lib/leads.functions";
import { getPublicCompanyAddress } from "@/lib/company-public.functions";
import { postalAddressSchema } from "@/lib/company-address";
import { formatPhone, isValidEmail, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";


export const Route = createFileRoute("/contact")({
  loader: () => getPublicCompanyAddress(),
  head: (ctx) => ({
    meta: [
      ...seoPageMeta("/contact", headLang(ctx)),
      keywordsMeta(undefined, headLang(ctx) as never),
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/contact", headLang(ctx)),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": "https://liberatoconsulting.com.br/#organization",
          name: "Liberato Consulting",
          description:
            "Consultoria em gestão empresarial com inteligência artificial no centro de cada entrega.",
          url: "https://liberatoconsulting.com.br/contact",
          email: "contato@liberatoconsulting.com.br",
          telephone: "+5511913258668",
          priceRange: "$$",
          image: ["https://liberatoconsulting.com.br/og-default.jpg"],
          logo: "https://liberatoconsulting.com.br/logo.png",
          address: postalAddressSchema(ctx.loaderData),


          areaServed: [
            { "@type": "Country", name: "Brasil" },
            { "@type": "Place", name: "Global" },
          ],
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "09:00",
              closes: "18:00",
            },
          ],
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              email: "contato@liberatoconsulting.com.br",
              telephone: "+5511913258668",
              availableLanguage: ["Portuguese", "English", "Spanish", "Chinese"],
            },
          ],
        }),
      },

      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Início",
              item: "https://liberatoconsulting.com.br/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Contato",
              item: "https://liberatoconsulting.com.br/contact",
            },
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t, lang } = useLanguage();
  const F = t.serviceDetail.form;
  const send = useServerFn(submitLead);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const successRef = useRef<HTMLParagraphElement>(null);

  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    captcha: "",
  });
  const [touched, setTouched] = useState(false);
  const autoMessage = useRef("");

  const products = t.serviceDetail.pages;

  /** Monta a mensagem sugerida com o problema do serviço escolhido. */
  function buildMessage(serviceId: string, name: string) {
    const product = products.find((p) => p.id === serviceId);
    const problem = product?.problem ?? "";
    const lowered = problem ? problem.charAt(0).toLowerCase() + problem.slice(1) : "";
    return `${t.contact.messageIntro}${lowered}\n\n${t.contact.messageOutro}\n${name}`.trimEnd();
  }

  function onService(serviceId: string) {
    const next = buildMessage(serviceId, values.name);
    setValues((v) => ({
      ...v,
      service: serviceId,
      message: v.message === autoMessage.current || !v.message ? next : v.message,
    }));
    autoMessage.current = next;
  }

  function onName(name: string) {
    setValues((v) => {
      const shouldSync = v.service && v.message === autoMessage.current;
      const next = shouldSync ? buildMessage(v.service, name) : v.message;
      if (shouldSync) autoMessage.current = next;
      return { ...v, name, message: next };
    });
  }

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [status]);

  const startedAt = useRef(Date.now());
  const challenge = useMemo(
    () => ({ a: 1 + Math.floor(Math.random() * 8), b: 1 + Math.floor(Math.random() * 8) }),
    [],
  );

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e['name'] = t.contact.required;
    if (!values.email.trim()) e['email'] = t.contact.required;
    else if (!isValidEmail(values.email)) e['email'] = t.contact.invalidEmail;
    if (!values.phone.trim()) e['phone'] = t.contact.required;
    else if (!isValidPhone(values.phone)) e['phone'] = PHONE_ERROR;
    if (!values.company.trim()) e['company'] = t.contact.required;
    if (!values.service) e['service'] = t.contact.required;
    if (!values.message.trim()) e['message'] = t.contact.required;
    if (!values.captcha.trim()) e['captcha'] = t.contact.required;
    return e;
  }, [values, t]);

  function show(key: string) {
    return touched ? fieldErrors[key] : undefined;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setTouched(true);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error(t.contact.required);
      return;
    }
    const product = products.find((p) => p.id === values.service);
    setStatus("sending");
    setError(null);
    try {
      const result = await send({
        data: {
          name: values.name,
          company: values.company,
          country: "Não informado",
          email: values.email,
          phone: values.phone,
          message: values.message,
          serviceSlug: values.service || "contato",
          serviceTitle: product?.title ?? t.contact.serviceOther,
          language: lang,
          sourcePath: typeof window !== "undefined" ? window.location.pathname : "",
          website: String(new FormData(form).get("website") ?? ""),
          elapsedMs: Date.now() - startedAt.current,
          captchaAnswer: values.captcha,
          captchaA: challenge.a,
          captchaB: challenge.b,
        },
      });

      if (result.ok) {
        setStatus("done");
        toast.success(t.contact.sent);
        trackEvent("form_submit", { form_name: "contact", service: product?.title ?? "Outros" });
        form.reset();
        setTouched(false);
        setValues({ name: "", email: "", phone: "", company: "", service: "", message: "", captcha: "" });
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
    "mt-2 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none focus:border-accent";
  const cls = (key: string) =>
    show(key) ? `${field} border-destructive ring-1 ring-destructive` : field;

  return (
    <div>
      <section className="bg-ink py-24 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.contact.eyebrow}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            {t.contact.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-foreground/75">{t.contact.body}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-24 md:grid-cols-[1.2fr_1fr]">
        {status === "done" ? (
          <p
            ref={successRef}
            className="scroll-mt-28 self-start rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium"
          >
            {F.success}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                {t.contact.name}
                <input
                  maxLength={100}
                  name="name"
                  value={values.name}
                  onChange={(e) => onName(e.target.value)}
                  aria-invalid={Boolean(show("name"))}
                  className={cls("name")}
                />
                {show("name") && (
                  <span className="mt-1 block text-xs text-destructive">{show("name")}</span>
                )}
              </label>
              <label className="block text-sm font-medium">
                {t.contact.email}
                <input
                  type="email"
                  maxLength={255}
                  name="email"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  aria-invalid={Boolean(show("email"))}
                  className={cls("email")}
                />
                {show("email") && (
                  <span className="mt-1 block text-xs text-destructive">{show("email")}</span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Telefone
                <input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={25}
                  value={values.phone}
                  onFocus={() => !values.phone && setValues((v) => ({ ...v, phone: "+55" }))}
                  onChange={(e) => setValues((v) => ({ ...v, phone: formatPhone(e.target.value) }))}
                  placeholder={PHONE_PLACEHOLDER}
                  aria-invalid={Boolean(show("phone"))}
                  className={cls("phone")}
                />
                {show("phone") && (
                  <span className="mt-1 block text-xs text-destructive">{show("phone")}</span>
                )}
              </label>
              <label className="block text-sm font-medium">
                {t.contact.company}
                <input
                  maxLength={120}
                  name="company"
                  value={values.company}
                  onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
                  aria-invalid={Boolean(show("company"))}
                  className={cls("company")}
                />
                {show("company") && (
                  <span className="mt-1 block text-xs text-destructive">{show("company")}</span>
                )}
              </label>
              <label className="block text-sm font-medium sm:col-span-2">
                {t.contact.serviceLabel}
                <select
                  name="service"
                  value={values.service}
                  onChange={(e) => onService(e.target.value)}
                  aria-invalid={Boolean(show("service"))}
                  className={cls("service")}
                >
                  <option value="">{t.contact.servicePlaceholder}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.family ? `${p.family} — ${p.title}` : p.title}
                    </option>
                  ))}
                  <option value="outros">{t.contact.serviceOther}</option>
                </select>
                {show("service") && (
                  <span className="mt-1 block text-xs text-destructive">{show("service")}</span>
                )}
              </label>
            </div>
            <label className="mt-6 block text-sm font-medium">
              {t.contact.message}
              <textarea
                maxLength={1500}
                name="message"
                rows={7}
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                aria-invalid={Boolean(show("message"))}
                className={cls("message")}
              />
              {show("message") && (
                <span className="mt-1 block text-xs text-destructive">{show("message")}</span>
              )}
            </label>

            {/* Honeypot: invisível para pessoas, preenchido por bots */}
            <div aria-hidden="true" className="hidden">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <label className="mt-6 block text-sm font-medium">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-accent" />
                {F.captcha} {challenge.a} + {challenge.b}?
              </span>
              <input
                name="captcha"
                inputMode="tel"
                autoComplete="off"
                value={values.captcha}
                onChange={(e) => setValues((v) => ({ ...v, captcha: e.target.value }))}
                aria-invalid={Boolean(show("captcha"))}
                className={`${cls("captcha")} sm:max-w-40`}
              />
              {show("captcha") && (
                <span className="mt-1 block text-xs text-destructive">{show("captcha")}</span>
              )}
            </label>

            {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === "sending" ? F.sending : t.contact.submit}
            </button>
          </form>
        )}

        <aside className="border-t-2 border-ink pt-6">
          <p className="text-sm text-muted-foreground">{t.contact.info}</p>
          <a
            href="mailto:contato@liberatoconsulting.com.br"
            className="mt-2 block font-display text-lg font-bold hover:text-accent"
          >
            contato@liberatoconsulting.com.br
          </a>
          <p className="mt-8 text-sm text-muted-foreground">São Paulo · Brasil</p>
        </aside>
      </section>
    </div>
  );
}
