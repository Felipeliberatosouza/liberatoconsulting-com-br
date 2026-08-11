import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe2,
  Rocket,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import heroImage from "@/assets/hero.jpg";
import heroEmpreendedorismo from "@/assets/hero-empreendedorismo.jpg";
import heroOperacoes from "@/assets/hero-operacoes.jpg";
import heroEstrategia from "@/assets/hero-estrategia.jpg";
import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";
import { DEFAULT_AUTOPLAY_MS, heroSlideOrder } from "@/lib/site-config";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Pesquisas de mercado sobre o Brasil e gestão com IA — Liberato Consulting",
      },
      {
        name: "description",
        content:
          "Estudos setoriais e dados sobre o mercado brasileiro para investidores internacionais: agronegócio, energia, mineração, indústria, tecnologia, saúde e varejo, com gestão estratégica e IA.",
      },
      {
        name: "keywords",
        content:
          "pesquisa de mercado Brasil, mercado brasileiro, economia brasileira, setores do mercado brasileiro, investir no Brasil, investimento estrangeiro no Brasil, estudo setorial Brasil, agronegócio, energia renovável, mineração, indústria brasileira, fintechs, consultoria de gestão empresarial, inteligência artificial",
      },
      {
        property: "og:title",
        content: "Pesquisas de mercado sobre o Brasil — Liberato Consulting",
      },
      {
        property: "og:description",
        content:
          "Inteligência sobre setores da economia brasileira para empresas internacionais, com gestão estratégica e IA no centro.",
      },
    ],
  }),
  component: Index,
});


const icons = [Compass, Rocket, Globe2];

function Index() {
  const { t } = useLanguage();

  return (
    <div>
      <section className="relative overflow-hidden bg-ink text-ink-foreground">
        <img
          src={heroImage}
          alt=""
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover opacity-35"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-28 md:py-40">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.hero.eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-foreground/75">{t.hero.body}</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/brasil"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {t.hero.primary} <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-ink-foreground/25 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-ink-foreground/10"
            >
              {t.hero.secondary}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-px bg-border sm:grid-cols-3">
          {t.stats.map((s) => (
            <div key={s.label} className="bg-background px-6 py-10">
              <div className="font-display text-4xl font-bold text-accent">{s.value}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                {t.brazilFocus.eyebrow}
              </p>
              <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
                {t.brazilFocus.title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {t.brazilFocus.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/brasil"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90"
                >
                  {t.brazilFocus.primary} <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:text-accent"
                >
                  {t.brazilFocus.secondary}
                </Link>
              </div>
            </div>
            <div>
              <ul className="space-y-6">
                {t.brazilFocus.points.map((p) => (
                  <li key={p.t} className="border-t border-border pt-5">
                    <h3 className="text-lg font-bold">{p.t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {t.brazilFocus.sectorsLabel}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.brazilFocus.sectors.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              {t.purpose.eyebrow}
            </p>
            <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
              {t.purpose.title}
            </h2>
          </div>
          <div>
            <BrainCircuit className="size-8 text-accent" />
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.purpose.body}</p>
            <ul className="mt-8 space-y-4 border-t border-border pt-6">
              {t.purpose.points.map((p) => (
                <li key={p} className="flex gap-3 text-sm font-medium">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.services.eyebrow}
          </p>
          <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            {t.services.title}
          </h2>
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {t.services.items.map((s, i) => {
              const Icon = icons[i] ?? Compass;
              return (
                <article key={s.title} className="border-t-2 border-ink bg-card p-8">
                  <Icon className="size-7 text-accent" />
                  <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              );
            })}
          </div>
          <Link
            to="/services"
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold hover:text-accent"
          >
            {t.hero.primary} <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          {t.approach.eyebrow}
        </p>
        <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
          {t.approach.title}
        </h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {t.approach.steps.map((s) => (
            <div key={s.n} className="border-t border-border pt-5">
              <span className="font-display text-sm font-bold text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
