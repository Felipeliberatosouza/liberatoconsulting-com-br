import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { pt } from "@/i18n/pt";
import { getSiteConfig, saveHeroSettings, saveTexts } from "@/lib/admin.functions";
import { HERO_FIELDS, heroCopy, heroTextKey, type HeroField } from "@/lib/hero-copy";
import { Button } from "@/components/ui/button";
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

type SlideTexts = Record<HeroField, string>;

function defaultTexts(id: string): SlideTexts {
  return pt.hero.slides.find((s) => s.id === id) ?? { eyebrow: "", title: "", body: "", primary: "", secondary: "" };
}

function AdminHero() {
  const [slides, setSlides] = useState<HeroSlideSetting[]>(heroSlideOrder(undefined));
  const [texts, setTexts] = useState<Record<string, SlideTexts>>(() =>
    Object.fromEntries(pt.hero.slides.map((s) => [s.id, defaultTexts(s.id)])),
  );
  const [autoplay, setAutoplay] = useState(DEFAULT_AUTOPLAY_MS);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [originalTexts, setOriginalTexts] = useState<Record<string, SlideTexts>>({});

  useEffect(() => {
    getSiteConfig()
      .then((c) => {
        setSlides(heroSlideOrder(c.hero));
        setAutoplay(c.hero?.autoplayMs ?? DEFAULT_AUTOPLAY_MS);
        const copy = Object.fromEntries(heroCopy("pt", c.texts).map((s) => [s.id, s]));
        setTexts(copy);
        setOriginalTexts(copy);
        setLoaded(true);
      })
      .catch(() => toast.error("Não foi possível carregar os banners. Recarregue a página antes de salvar."));
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

  function updateText(id: string, patch: Partial<SlideTexts>) {
    setTexts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? defaultTexts(id)), ...patch } }));
  }

  async function pickImage(index: number, file: File) {
    if (file.size > 2_500_000) {
      toast.error("Imagem acima de 2,5 MB. Use um arquivo menor.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });
    update(index, { imageUrl: dataUrl });
    toast.success("Imagem carregada. Clique em Salvar carrossel.");
  }

  return (
    <AdminShell
      title="Carrossel da página inicial"
      description="Edite a imagem de fundo e as frases de cada banner, escolha quais aparecem, em que ordem e por quanto tempo cada um fica na tela. Os textos são traduzidos automaticamente para inglês, espanhol e mandarim ao salvar."
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

        {slides.map((s, i) => {
          const st = texts[s.id] ?? defaultTexts(s.id);
          return (
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

              <div className="mt-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Chapéu (linha pequena acima do título)
                  </label>
                  <input
                    value={st.eyebrow}
                    onChange={(e) => updateText(s.id, { eyebrow: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Frase principal
                  </label>
                  <textarea
                    value={st.title}
                    rows={2}
                    onChange={(e) => updateText(s.id, { title: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Texto de apoio
                  </label>
                  <textarea
                    value={st.body}
                    rows={3}
                    onChange={(e) => updateText(s.id, { body: e.target.value })}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {([['primary', 'Texto do botão principal'], ['secondary', 'Texto do botão secundário']] as const).map(([key, label]) => (
                  <label key={key} className="text-sm font-medium">
                    {label}
                    <input value={st[key]} onChange={(e) => updateText(s.id, { [key]: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </label>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Imagem de fundo
                </label>
                {s.imageUrl && (
                  <div className="flex items-center gap-3">
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="h-20 w-32 rounded-md border border-border object-cover"
                    />
                    <button
                      onClick={() => update(i, { imageUrl: "" })}
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      Remover (voltar à imagem padrão)
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void pickImage(i, file);
                    e.target.value = "";
                  }}
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                />
                <input
                  value={s.imageUrl?.startsWith("data:") ? "" : (s.imageUrl ?? "")}
                  onChange={(e) => update(i, { imageUrl: e.target.value })}
                  placeholder="ou cole a URL de uma imagem"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>
            </div>
          );
        })}

        <Button
          disabled={busy || !loaded}
          onClick={async () => {
            setBusy(true);
            try {
              const r = await saveHeroSettings({
                data: {
                  autoplayMs: autoplay,
                  slides: slides.map((s) => ({
                    id: s.id,
                    enabled: s.enabled,
                    imageUrl: s.imageUrl?.trim() || undefined,
                  })),
                },
              });
              if (!r.ok) {
                toast.error(r.error);
                return;
              }
              const changes = slides.flatMap((s) => {
                const st = texts[s.id] ?? defaultTexts(s.id);
                return HERO_FIELDS.filter((field) => st[field] !== originalTexts[s.id]?.[field]).map((field) => ({
                  path: heroTextKey(s.id, field),
                  pt: st[field],
                }));
              });
              const rt = changes.length ? await saveTexts({ data: { changes } }) : { ok: true as const };
              if (rt.ok) {
                setOriginalTexts(texts);
                toast.success("Carrossel salvo.");
              }
              else toast.error(rt.error);
            } catch {
              toast.error("Não foi possível salvar.");
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar carrossel"}
        </Button>
      </div>
    </AdminShell>
  );
}
