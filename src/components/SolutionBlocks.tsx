import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useLanguage } from "@/i18n";
import { SOLUTIONS, SOLUTION_UI as U, TRAININGS, pick, pickList } from "@/lib/solutions";

export function SolutionCards() {
  const { lang } = useLanguage();
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {SOLUTIONS.map((s) => (
        <Link
          key={s.slug}
          to="/solucoes/$slug"
          params={{ slug: s.slug }}
          id={s.slug}
          className="group flex scroll-mt-28 flex-col rounded-lg border border-border bg-card p-7 transition-colors hover:border-accent"
        >
          <span className="font-display text-sm font-bold text-accent">{String(s.n).padStart(2, "0")}</span>
          <h3 className="mt-3 text-xl font-bold leading-snug">{pick(s.title, lang)}</h3>
          <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">{pick(s.pain, lang)}</p>
          <p className="mt-4 text-sm leading-relaxed">{pick(s.promise, lang)}</p>
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{pick(U.measure, lang)}:</span>{" "}
            {pickList(s.kpi, lang).join(" · ")}
          </p>
          <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold group-hover:text-accent">
            {pick(U.see, lang)} <ArrowRight className="size-4" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function PainChips() {
  const { lang } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {SOLUTIONS.map((s) => (
        <Link
          key={s.slug}
          to="/solucoes/$slug"
          params={{ slug: s.slug }}
          className="rounded-full border border-ink-foreground/25 px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          {pick(s.chip, lang)}
        </Link>
      ))}
    </div>
  );
}

export function StartLadder() {
  const { lang } = useLanguage();
  const steps = U.ladder[lang as keyof typeof U.ladder] ?? U.ladder.pt;
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map(([t, d], i) => (
        <div key={t} className="border-t-2 border-ink pt-5">
          <span className="font-display text-sm font-bold text-accent">{i + 1}</span>
          <h3 className="mt-2 text-lg font-bold">{t}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{d}</p>
        </div>
      ))}
    </div>
  );
}

export function TrainingCards() {
  const { lang } = useLanguage();
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {TRAININGS.map((t) => (
        <Link
          key={t.slug}
          to="/treinamentos/$slug"
          params={{ slug: t.slug }}
          className="group flex flex-col rounded-lg border border-border bg-background p-7 transition-colors hover:border-accent"
        >
          <h3 className="text-lg font-bold leading-snug">{pick(t.title, lang)}</h3>
          <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{pick(t.audience, lang)}</p>
          <p className="mt-4 text-sm leading-relaxed">{pick(t.outcome, lang)}</p>
          <ArrowRight className="mt-auto size-4 pt-0 group-hover:text-accent" />
        </Link>
      ))}
    </div>
  );
}

export function TrainingBadges() {
  const { lang } = useLanguage();
  const list = U.badges[lang as keyof typeof U.badges] ?? U.badges.pt;
  return (
    <ul className="flex flex-wrap gap-3">
      {list.map((b) => (
        <li key={b} className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium">
          <Check className="size-4 text-accent" /> {b}
        </li>
      ))}
    </ul>
  );
}
