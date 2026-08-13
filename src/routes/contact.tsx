import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { trackEvent } from "@/lib/gtag";
import { submitLead } from "@/lib/leads.functions";


export const Route = createFileRoute("/contact")({
  head: (ctx) => ({
    meta: [
      { title: "Contato — Liberato Consulting" },
      {
        name: "description",
        content:
          "Fale com a Liberato Consulting sobre gestão estratégica, empreendedorismo, pesquisas de mercado no Brasil e uso de inteligência artificial.",
      },
      { property: "og:title", content: "Contato — Liberato Consulting" },
      {
        property: "og:description",
        content: "Conte o desafio da sua empresa. Respondemos em até dois dias úteis.",
      },
      { property: "og:url", content: "https://liberatoconsulting.com.br/contact" },
      { property: "og:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:image", content: "https://liberatoconsulting.com.br/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Contato — Liberato Consulting" },
      { name: "twitter:description", content: "Conte o desafio da sua empresa. Respondemos em até dois dias úteis." },
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
          image: ["https://liberatoconsulting.com.br/og-default.png"],
          logo: "https://liberatoconsulting.com.br/logo.png",
          address: {
            "@type": "PostalAddress",
            addressLocality: "São Paulo",
            addressRegion: "SP",
            addressCountry: "BR",
          },

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

  const startedAt = useRef(Date.now());
  const challenge = useMemo(
    () => ({ a: 1 + Math.floor(Math.random() * 8), b: 1 + Math.floor(Math.random() * 8) }),
    [],
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
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
          serviceSlug: "contato",
          serviceTitle: "Contato geral",
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
        toast.success(t.contact.sent);
        trackEvent("form_submit", { form_name: "contact", service: "Contato geral" });
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
    "mt-2 w-full rounded-md border border-input bg-card px-4 py-3 text-sm outline-none focus:border-accent";

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
          <p className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium">
            {F.success}
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                {t.contact.name}
                <input required minLength={2} maxLength={100} name="name" className={field} />
              </label>
              <label className="block text-sm font-medium">
                {t.contact.email}
                <input required type="email" maxLength={255} name="email" className={field} />
              </label>
              <label className="block text-sm font-medium">
                {t.contact.company}
                <input required minLength={2} maxLength={120} name="company" className={field} />
              </label>
              <label className="block text-sm font-medium">
                {F.country}
                <input required minLength={2} maxLength={80} name="country" className={field} />
              </label>
            </div>
            <label className="mt-6 block text-sm font-medium">
              {t.contact.message}
              <textarea required maxLength={1500} name="message" rows={6} className={field} />
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
                required
                inputMode="numeric"
                autoComplete="off"
                className={`${field} sm:max-w-40`}
              />
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
