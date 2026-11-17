import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import heroImage from "@/assets/hero.webp";
import heroEmpreendedorismo from "@/assets/hero-empreendedorismo.webp";
import heroOperacoes from "@/assets/hero-operacoes.webp";
import heroEstrategia from "@/assets/hero-estrategia.webp";
import { CtaBand } from "@/components/CtaBand";
import { FaqSection } from "@/components/FaqSection";
import { ImpactSection } from "@/components/ImpactSection";
import { InstitutionalShowcase } from "@/components/InstitutionalShowcase";
import { PainChips, SolutionCards, StartLadder, TrainingBadges, TrainingCards } from "@/components/SolutionBlocks";
import { SOLUTION_UI as U, SOLUTIONS, pick } from "@/lib/solutions";
import { SeoKeywordLinks } from "@/components/SeoKeywordLinks";
import { FilterScopeBadge } from "@/components/SiteFilterBar";
import { useAudienceFilters } from "@/lib/audience-filters";
import { useLanguage } from "@/i18n";
import { homeText } from "@/lib/home-translations";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { seoPageMeta } from "@/lib/seo-meta";
import { itemList, jsonLd, webPageSchema } from "@/lib/schema";
import { DEFAULT_AUTOPLAY_MS, heroSlideOrder } from "@/lib/site-config";


export const Route = createFileRoute("/")({
  head: (ctx) => ({
    meta: [
      ...seoPageMeta("/", headLang(ctx)),
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/", headLang(ctx)),
    scripts: [
      jsonLd(
        webPageSchema({
          name: "Liberato Consulting — Consultoria em gestão com IA",
          description:
            "Gestão estratégica, operações, empreendedorismo e pesquisas de mercado sobre o Brasil, com inteligência artificial embarcada.",
          path: "/",
        }),
      ),
      jsonLd(
        itemList({
          name: "Frentes de atuação",
          items: [
            ...SOLUTIONS.map((s) => ({ name: s.title.pt, path: `/solucoes/${s.slug}` })),
            { name: "Treinamento in Company", path: "/treinamentos" },
            { name: "Dados do Brasil", path: "/brasil" },
            { name: "Quem somos", path: "/about" },
            { name: "Conteúdo", path: "/content" },
          ],
        }),
      ),
    ],
  }),
  component: Index,
});



const SLIDE_IMAGES: Record<string, string> = {
  consultoria: heroImage,
  pesquisas: heroImage,
  empreendedorismo: heroEmpreendedorismo,
  operacoes: heroOperacoes,
  estrategia: heroEstrategia,
};

function HeroCarousel() {
  const { t, hero, lang } = useLanguage();
  const h = homeText(lang);
  const scope = useAudienceFilters();
  const [index, setIndex] = useState(0);
  const [loadedAll, setLoadedAll] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Só busca as imagens dos demais slides depois que a página fica ociosa,
  // preservando a largura de banda para o LCP.
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (w.requestIdleCallback) {
      w.requestIdleCallback(() => setLoadedAll(true));
      return;
    }
    const id = window.setTimeout(() => setLoadedAll(true), 2000);
    return () => window.clearTimeout(id);
  }, []);

  const slides = useMemo(() => {
    const order = heroSlideOrder(hero).filter((s) => s.enabled);
    const byId = new Map(t.hero.slides.map((s) => [s.id, s]));
    const list = order
      .map((cfg) => {
        const content = byId.get(cfg.id);
        if (!content) return null;
        return { ...content, image: cfg.imageUrl || SLIDE_IMAGES[cfg.id] || heroImage };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    return list.length > 0
      ? list
      : t.hero.slides.slice(0, 1).map((s) => ({ ...s, image: heroImage }));
  }, [hero, t]);

  const count = slides.length;
  const configuredAutoplay = Number(hero?.autoplayMs);
  const autoplay =
    Number.isFinite(configuredAutoplay) && configuredAutoplay >= 2000
      ? configuredAutoplay
      : DEFAULT_AUTOPLAY_MS;

  const nextSlide = useCallback(() => {
    setIndex((current) => (current + 1) % count);
  }, [count]);

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count < 2) return;

    let timeoutId: number | undefined;
    const schedule = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        nextSlide();
        schedule();
      }, autoplay);
    };
    const resume = () => {
      if (document.visibilityState === "visible") schedule();
      else window.clearTimeout(timeoutId);
    };

    schedule();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("pageshow", resume);
    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("pageshow", resume);
    };
  }, [count, autoplay, nextSlide]);

  const slide = slides[Math.min(index, count - 1)];
  if (!slide) return null;

  return (
    <section
      className="relative touch-pan-y overflow-hidden bg-ink text-ink-foreground"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < 50 || count < 2) return;
        setIndex((i) => (dx < 0 ? (i + 1) % count : (i - 1 + count) % count));
      }}
      onTouchCancel={() => {
        touchStartX.current = null;
      }}
    >
      {slides.map((s, i) => (
        <img
          key={s.id}
          src={i === 0 || i === index || loadedAll ? s.image : undefined}
          alt=""
          width={1600}
          height={1008}
          decoding={i === 0 ? "sync" : "async"}
          {...(i === 0
            ? { fetchPriority: "high" as const, loading: "eager" as const }
            : { loading: "lazy" as const })}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
            i === index ? "opacity-35" : "opacity-0"
          }`}
        />
      ))}
      <div className="relative mx-auto max-w-7xl px-6 py-8 sm:py-10 md:py-16">

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {slide.eyebrow}
          </p>
          <FilterScopeBadge />
        </div>
        <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
          {slide.title}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-foreground/75">{slide.body}</p>
        {scope.applied && (
          <p className="mt-4 max-w-xl text-sm text-ink-foreground/70">
            {h.highlightedFor}{" "}
            <span className="font-semibold text-accent">{scope.label}</span>.
          </p>
        )}
        <div className="mt-8 max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.question, lang)}</p>
          <div className="mt-4">
            <PainChips toContact />
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {slide.id === "treinamento" ? (
            <Link
              to="/treinamentos"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {slide.primary} <ArrowRight className="size-4" />
            </Link>
          ) : slide.id === "pesquisas" ? (
            <Link
              to="/brasil"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {slide.primary} <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to="/solucoes"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {slide.primary} <ArrowRight className="size-4" />
            </Link>
          )}
          {slide.id === "consultoria" ? (
            <Link
              to="/treinamentos"
              className="inline-flex items-center rounded-full border border-ink-foreground/25 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-ink-foreground/10"
            >
              {slide.secondary}
            </Link>
          ) : (
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-ink-foreground/25 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-ink-foreground/10"
            >
              {slide.secondary}
            </Link>
          )}
        </div>

        {count > 1 && (
          <div className="mt-8 flex items-center gap-4 md:mt-12">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
              aria-label={h.prevBanner}
              className="rounded-full border border-ink-foreground/25 p-3 transition-colors hover:bg-ink-foreground/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % count)}
              aria-label={h.nextBanner}
              className="rounded-full border border-ink-foreground/25 p-3 transition-colors hover:bg-ink-foreground/10"
            >
              <ChevronRight className="size-4" />
            </button>

            <div className="flex gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={s.eyebrow}
                  aria-current={i === index}
                  className={`h-2.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-accent" : "w-4 bg-ink-foreground/30"
                  }`}
                />
              ))}
            </div>

          </div>
        )}
      </div>
    </section>
  );
}

function Index() {
  const { t, lang } = useLanguage();

  return (
    <div>
      <HeroCarousel />

      <InstitutionalShowcase />

      <ImpactSection />



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
              {/* Bloco oculto visualmente (sr-only), mantido no HTML para SEO */}
              <div className="sr-only">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  {t.brazilFocus.sectorsLabel}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {t.brazilFocus.sectors.map((s) => (
                    <li
                      key={s}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section hidden>
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
            <Compass className="size-8 text-accent" strokeWidth={1.5} />
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.solutionsEyebrow, lang)}</p>
          <h2 className="mb-12 mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">{pick(U.solutionsTitle, lang)}</h2>
          <SolutionCards />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{pick(U.trainingsEyebrow, lang)}</p>
        <h2 className="mt-5 max-w-3xl text-3xl font-bold leading-tight md:text-5xl">{pick(U.trainingsTitle, lang)}</h2>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{pick(U.trainingsBody, lang)}</p>
        <div className="mt-8"><TrainingBadges /></div>
        <div className="mt-10"><TrainingCards /></div>
        <Link to="/treinamentos" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold hover:text-accent">
          {pick(U.allTrainings, lang)} <ArrowRight className="size-4" />
        </Link>
      </section>

      <section className="bg-secondary py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-3xl font-bold md:text-4xl">{pick(U.ladderTitle, lang)}</h2>
          <StartLadder />
        </div>
      </section>

      <div hidden>
      <SeoKeywordLinks
        themeIds={["gestao", "operacoes", "treinamento", "ia", "pesquisas", "brasil", "financas"]}
        title={homeText(lang).keywordsTitle}
      />
      </div>

      <FaqSection />

      <CtaBand />
    </div>
  );
}
