import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";

export function CtaBand() {
  const { t } = useLanguage();
  return (
    <section className="border-y border-border bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-16 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">{t.cta.title}</h2>
          <p className="mt-3 text-muted-foreground">{t.cta.body}</p>
        </div>
        <Link
          to="/contact"
          className="inline-flex w-fit items-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {t.cta.button}
        </Link>
      </div>
    </section>
  );
}
