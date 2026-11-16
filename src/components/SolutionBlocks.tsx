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

export function PainChips({ toContact = false }: { toContact?: boolean }) {
  const { lang } = useLanguage();
  return (
    <div className="flex flex-wrap gap-2">
      {SOLUTIONS.map((s) => (
        <Link
          key={s.slug}
          to="/solucoes/$slug"
          params={{ slug: s.slug }}
          {...(toContact ? { hash: "contato" } : {})}
          className="rounded-full border border-ink-foreground/25 bg-ink/40 px-4 py-2 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
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

/** Conteúdo do menu "O que você precisa resolver?" (desktop e celular). */
export function SolveMenuGrid({ onNavigate }: { onNavigate?: () => void }) {
  const { lang } = useLanguage();
  return (
    <div className="grid gap-x-8 gap-y-6 md:grid-cols-[2fr_1fr]">
      <div className="min-w-0">
        <Link to="/solucoes" onClick={onNavigate} className="mb-3 block text-sm font-semibold text-accent">
          {pick(U.solutionsEyebrow, lang)}
        </Link>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {SOLUTIONS.map((s) => (
            <li key={s.slug}>
              <Link to="/solucoes/$slug" params={{ slug: s.slug }} onClick={onNavigate} className="block text-sm font-semibold leading-snug text-foreground hover:text-accent">
                {pick(s.title, lang)}
              </Link>
              <span className="mt-0.5 block text-xs text-muted-foreground">{pick(s.chip, lang)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 md:border-l md:border-border md:pl-8">
        <Link to="/treinamentos" onClick={onNavigate} className="mb-3 block text-sm font-semibold text-accent">
          {pick(U.trainingsEyebrow, lang)}
        </Link>
        <ul className="space-y-2.5">
          {TRAININGS.map((t) => (
            <li key={t.slug}>
              <Link to="/treinamentos/$slug" params={{ slug: t.slug }} onClick={onNavigate} className="block text-sm leading-snug text-muted-foreground hover:text-accent">
                {pick(t.title, lang)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
