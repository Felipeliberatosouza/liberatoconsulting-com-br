import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { pt } from "@/i18n/pt";
import { getSiteConfig, saveAreaBanners, saveTexts } from "@/lib/admin.functions";
import {
  flattenTexts,
  type AreaBanners,
  type AreaKey,
  type TextOverrides,
} from "@/lib/site-config";

export const Route = createFileRoute("/admin/areas")({
  head: () => ({
    meta: [
      { title: "Áreas do site — Painel Liberato" },
      {
        name: "description",
        content: "Edite banners, títulos e textos de Serviços, Quem somos, Conteúdo e Dados do Brasil.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Áreas do site — Painel Liberato" },
      {
        property: "og:description",
        content: "Banners e textos das quatro grandes áreas do site.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAreas,
});

type Area = { key: AreaKey; label: string; hint: string; prefixes: string[] };

const AREAS: Area[] = [
  {
    key: "services",
    label: "Serviços",
    hint: "Página de serviços, páginas de cada produto e menu de serviços.",
    prefixes: ["services", "serviceFamilies", "serviceDetail", "megaMenu"],
  },
  {
    key: "about",
    label: "Quem somos",
    hint: "Página institucional, subpáginas e menu Quem somos.",
    prefixes: ["about", "aboutDetail", "aboutMenu", "team", "purpose", "approach"],
  },
  {
    key: "content",
    label: "Conteúdo",
    hint: "Página de conteúdos, menu, boletim e newsletter.",
    prefixes: ["content", "contentMenu", "bulletin", "newsletterPage", "newsletterForm"],
  },
  {
    key: "brazil",
    label: "Dados do Brasil",
    hint: "Página de dados do Brasil, temas, filtros e menu.",
    prefixes: ["brazil", "brazilMenu", "brazilFocus", "filters"],
  },
];

const FIELD_LABELS: Record<string, string> = {
  title: "Título",
  subtitle: "Subtítulo",
  eyebrow: "Chapéu",
  heading: "Título",
  description: "Descrição",
  body: "Texto",
  body2: "Texto complementar",
  lead: "Introdução",
  cta: "Botão",
  label: "Rótulo",
  summary: "Resumo",
  button: "Botão",
};

function humanize(path: string) {
  const parts = path.split(".");
  const last = parts[parts.length - 1]!;
  const base =
    FIELD_LABELS[last] ??
    last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^\w/, (c) => c.toUpperCase());
  const parent = parts.length > 1 ? parts.slice(0, -1).join(" › ") : "";
  return { base, parent };
}

function AdminAreas() {
  const all = useMemo(() => flattenTexts(pt), []);
  const [area, setArea] = useState<Area>(AREAS[0]!);
  const [search, setSearch] = useState("");
  const [overrides, setOverrides] = useState<TextOverrides>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [banners, setBanners] = useState<AreaBanners>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((c) => {
        setOverrides(c.texts ?? {});
        setBanners(c.banners ?? {});
      })
      .catch(() => undefined);
  }, []);

  const query = search.trim().toLowerCase();
  const items = all.filter((i) => {
    const root = i.path.split(".")[0]!;
    if (!area.prefixes.includes(root)) return false;
    if (!query) return true;
    return i.value.toLowerCase().includes(query) || i.path.toLowerCase().includes(query);
  });

  const changed = Object.keys(drafts);
  const bannerUrl = banners[area.key]?.imageUrl ?? "";

  async function pickBanner(file: File) {
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
    setBanners((b) => ({ ...b, [area.key]: { imageUrl: dataUrl } }));
    toast.success("Imagem carregada. Clique em Salvar banner.");
  }

  async function saveBanner() {
    setBusy(true);
    try {
      const payload = Object.fromEntries(
        AREAS.map((a) => [a.key, { imageUrl: banners[a.key]?.imageUrl?.trim() || undefined }]),
      );
      const r = await saveAreaBanners({ data: payload });
      if (!r.ok) toast.error(r.error);
      else toast.success("Banner salvo.");
    } catch {
      toast.error("Não foi possível salvar o banner.");
    } finally {
      setBusy(false);
    }
  }

  async function saveArea() {
    setBusy(true);
    try {
      const changes = changed.map((path) => ({ path, pt: drafts[path]! }));
      const r = await saveTexts({ data: { changes } });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success("Textos salvos e traduzidos para EN, ES e ZH.");
      const c = await getSiteConfig();
      setOverrides(c.texts ?? {});
      setDrafts({});
    } catch {
      toast.error("Não foi possível salvar os textos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell
      title="Áreas do site"
      requireAdmin
      description="Serviços, Quem somos, Conteúdo e Dados do Brasil: troque o banner de topo e edite títulos, caixas de texto e textos em geral. Você escreve em português e as versões em inglês, espanhol e mandarim são geradas automaticamente."
    >
      <div className="flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <button
            key={a.key}
            onClick={() => {
              setArea(a);
              setSearch("");
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              area.key === a.key
                ? "bg-ink text-ink-foreground"
                : "border border-border hover:border-accent"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{area.hint}</p>

      {/* Banner de topo da área */}
      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h2 className="font-display text-lg font-bold">Banner de topo</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Imagem de fundo da faixa escura no topo da página. Sem imagem, a faixa continua no
          fundo escuro padrão.
        </p>
        {bannerUrl && (
          <div className="mt-4 flex items-center gap-3">
            <img
              src={bannerUrl}
              alt=""
              className="h-20 w-36 rounded-md border border-border object-cover"
            />
            <button
              onClick={() => setBanners((b) => ({ ...b, [area.key]: { imageUrl: "" } }))}
              className="text-sm text-muted-foreground hover:text-accent"
            >
              Remover imagem
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pickBanner(file);
            e.target.value = "";
          }}
          className="mt-4 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
        />
        <input
          value={bannerUrl.startsWith("data:") ? "" : bannerUrl}
          onChange={(e) =>
            setBanners((b) => ({ ...b, [area.key]: { imageUrl: e.target.value } }))
          }
          placeholder="ou cole a URL de uma imagem"
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          disabled={busy}
          onClick={saveBanner}
          className="mt-4 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground disabled:opacity-60"
        >
          {busy ? "Salvando…" : "Salvar banner"}
        </button>
      </div>

      {/* Textos da área */}
      <div className="mt-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar em ${area.label}…`}
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <p className="mt-3 text-sm text-muted-foreground">{items.length} campo(s)</p>

        <div className="mt-4 space-y-3">
          {items.slice(0, 400).map((item) => {
            const current = drafts[item.path] ?? overrides[item.path]?.pt ?? item.value;
            const isCustom = Boolean(overrides[item.path]?.pt);
            const isDirty = item.path in drafts;
            const { base, parent } = humanize(item.path);
            return (
              <div
                key={item.path}
                className={`rounded-lg border bg-background p-4 ${
                  isDirty ? "border-accent" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{base}</span>
                  {parent && <span className="text-xs text-muted-foreground">{parent}</span>}
                  {isCustom && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      personalizado
                    </span>
                  )}
                  {(isCustom || isDirty) && (
                    <button
                      className="ml-auto text-xs text-muted-foreground hover:text-accent"
                      onClick={() => setDrafts((d) => ({ ...d, [item.path]: item.value }))}
                    >
                      Restaurar original
                    </button>
                  )}
                </div>
                <textarea
                  value={current}
                  rows={current.length > 110 ? 4 : 2}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.path]: e.target.value }))}
                  className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
                />
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum texto encontrado.</p>
          )}
        </div>
      </div>

      <div className="sticky bottom-4 mt-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-background p-4 shadow-lg">
        <p className="text-sm text-muted-foreground">
          {changed.length === 0
            ? "Nenhuma alteração pendente."
            : `${changed.length} texto(s) alterado(s).`}
        </p>
        {changed.length > 0 && (
          <button
            onClick={() => setDrafts({})}
            className="text-sm text-muted-foreground hover:text-accent"
          >
            Descartar alterações
          </button>
        )}
        <button
          disabled={busy || changed.length === 0}
          onClick={saveArea}
          className="ml-auto rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-50"
        >
          {busy ? "Salvando e traduzindo…" : "Salvar e traduzir"}
        </button>
      </div>
    </AdminShell>
  );
}
