import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/i18n";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contato | Contact — Liberato Consulting" },
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
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
    toast.success(t.contact.sent);
    e.currentTarget.reset();
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
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {t.contact.name}
              <input required name="name" className={field} />
            </label>
            <label className="block text-sm font-medium">
              {t.contact.email}
              <input required type="email" name="email" className={field} />
            </label>
          </div>
          <label className="mt-6 block text-sm font-medium">
            {t.contact.company}
            <input name="company" className={field} />
          </label>
          <label className="mt-6 block text-sm font-medium">
            {t.contact.message}
            <textarea required name="message" rows={6} className={field} />
          </label>
          <button
            type="submit"
            className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {t.contact.submit}
          </button>
          {sent && <p className="mt-4 text-sm text-muted-foreground">{t.contact.sent}</p>}
        </form>

        <aside className="border-t-2 border-ink pt-6">
          <p className="text-sm text-muted-foreground">{t.contact.info}</p>
          <a
            href="mailto:contato@liberato.com"
            className="mt-2 block font-display text-lg font-bold hover:text-accent"
          >
            contato@liberato.com
          </a>
          <p className="mt-8 text-sm text-muted-foreground">São Paulo · Brasil</p>
        </aside>
      </section>
    </div>
  );
}
