import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { pt } from "@/i18n/pt";
import { getSiteConfig, saveHeroSettings } from "@/lib/admin.functions";
import {
  DEFAULT_AUTOPLAY_MS,
  heroSlideOrder,
  type HeroSlideSetting,
} from "@/lib/site-config";

export const Route = createFileRoute("/admin/hero")({
  head: () => ({
    meta: [
      { title: "Carrossel da home — Painel Liberato" },
      { name: "description", content: "Configure os banners da página inicial." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Carrossel da home — Painel Liberato" },
      { property: "og:description", content: "Configure os banners da página inicial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHero,
});

const LABELS: Record<string, string> = Object.fromEntries(
  pt.hero.slides.map((s) => [s.id, `${s.eyebrow} — ${s.title}`]),
);

function AdminHero() {
  const [slides, setSlides] = useState<HeroSlideSetting[]>(heroSlideOrder(undefined));
  const [autoplay, setAutoplay] = useState(DEFAULT_AUTOPLAY_MS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((c) => {
        setSlides(heroSlideOrder(c.hero));
        setAutoplay(c.hero?.autoplayMs ?? DEFAULT_AUTOPLAY_MS);
      })
      .catch(() => undefined);
  }, []);

  function move(index: number, dir: -1 | 1) {
    const next = [...slides];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSlides(next);
  }

  function update(index: number, patch: Partial<HeroSlideSetting>) {
    setSlides(slides.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  return (
    <AdminShell
      title="Carrossel da página inicial"
      description="Escolha quais banners aparecem, em que ordem e por quanto tempo cada um fica na tela. Os textos de cada banner são editados em Textos."
    >
      <div className="max-w-3xl space-y-4">
        <div className="rounded-lg border border-border bg-background p-6">
          <label className="text-sm font-medium" htmlFor="autoplay">
            Tempo de cada banner (segundos) — use 0 para não trocar sozinho
          </label>
          <input
            id="autoplay"
            type="number"
            min={0}
            max={30}
            value={Math.round(autoplay / 1000)}
            onChange={(e) => setAutoplay(Math.max(0, Number(e.target.value) || 0) * 1000)}
            className="mt-2 w-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>

        {slides.map((s, i) => (
          <div key={s.id} className="rounded-lg border border-border bg-background p-6">
            <div className="flex flex-wrap items-start gap-4">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={(e) => update(i, { enabled: e.target.checked })}
                  className="size-4 accent-current"
                />
                Exibir
              </label>
              <p className="flex-1 text-sm text-muted-foreground">{LABELS[s.id] ?? s.id}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => move(i, -1)}
                  aria-label="Mover para cima"
                  className="rounded-md border border-border p-1.5 hover:text-accent"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  aria-label="Mover para baixo"
                  className="rounded-md border border-border p-1.5 hover:text-accent"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </div>
            <input
              value={s.imageUrl ?? ""}
              onChange={(e) => update(i, { imageUrl: e.target.value })}
              placeholder="URL de imagem personalizada (opcional)"
              className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
        ))}

        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await saveHeroSettings({
                data: {
                  autoplayMs: autoplay === 0 ? 2000 : Math.max(2000, autoplay),
                  slides: slides.map((s) => ({
                    id: s.id,
                    enabled: s.enabled,
                    imageUrl: s.imageUrl?.trim() || undefined,
                  })),
                },
              });
              if (r.ok) toast.success("Carrossel salvo.");
              else toast.error(r.error);
            } catch {
              toast.error("Não foi possível salvar.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground disabled:opacity-60"
        >
          Salvar carrossel
        </button>
      </div>
    </AdminShell>
  );
}
