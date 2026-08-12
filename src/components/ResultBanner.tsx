import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n";

export function ResultBanner() {
  const { t } = useLanguage();
  const b = t.about.banner;

  return (
    <section className="rounded-2xl border border-border bg-secondary px-8 py-12 md:px-12">
      <p className="font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
        {b.word}
      </p>
      <p className="mt-3 text-2xl leading-tight tracking-tight text-muted-foreground md:text-4xl">
        <span className="font-extrabold text-foreground">{b.strong1}</span>
        {b.middle}{" "}
        <span className="font-extrabold text-foreground">{b.strong2}</span>
      </p>
      <div className="mt-8 flex flex-col gap-6 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{b.body}</p>
        <Link
          to="/contact"
          className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          {b.cta}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
