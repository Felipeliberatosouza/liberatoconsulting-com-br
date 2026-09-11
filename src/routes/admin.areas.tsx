import { createFileRoute, Link } from "@tanstack/react-router";
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
      { title: "Áreas e textos do site — Painel Liberato" },
      {
        name: "description",
        content: "Banners, títulos e textos de todas as áreas do site, com tradução automática.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Áreas e textos do site — Painel Liberato" },
      {
        property: "og:description",
        content: "Banners e textos de todas as áreas do site em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAreas,
});

/** Grandes áreas do site: têm banner de topo próprio. */
type Area = {
  id: string;
  label: string;
  hint: string;
  prefixes: string[];
  banner?: AreaKey;
};

const MAIN_AREAS: Area[] = [
  {
    id: "services",
    label: "Serviços",
    hint: "Página de serviços, páginas de cada produto e menu de serviços.",
    prefixes: ["services", "serviceFamilies", "serviceDetail", "megaMenu"],
    banner: "services",
  },
  {
    id: "about",
    label: "Quem somos",
    hint: "Página institucional, subpáginas e menu Quem somos.",
    prefixes: ["about", "aboutDetail", "aboutMenu", "team", "purpose", "approach"],
    banner: "about",
  },
  {
    id: "content",
    label: "Conteúdo",
    hint: "Página de conteúdos, menu, boletim e newsletter.",
    prefixes: ["content", "contentMenu", "bulletin", "newsletterPage", "newsletterForm"],
    banner: "content",
  },
  {
    id: "brazil",
    label: "Dados do Brasil",
    hint: "Página de dados do Brasil, temas, filtros e menu.",
    prefixes: ["brazil", "brazilMenu", "brazilFocus", "filters"],
    banner: "brazil",
  },
];

/** Rótulos amigáveis das demais seções de texto do site. */
const OTHER_LABELS: Record<string, string> = {
  nav: "Menu principal",
  hero: "Página inicial — carrossel",
  home: "Página inicial",
  contact: "Contato",
  careers: "Trabalhe conosco",
  footer: "Rodapé",
  cta: "Chamada final",
  leadForm: "Formulário de contato",
  newsletter: "Newsletter (assinatura)",
  legal: "Textos legais",
  common: "Termos gerais",
};

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
  placeholder: "Texto de apoio",
  name: "Nome",
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

/** Campos de cada produto: editados apenas no cadastro de serviços. */
function isProductField(path: string) {
  return path.startsWith("serviceDetail.pages") || path.startsWith("serviceFamilies.items");
}

function AdminAreas() {
  const all = useMemo(() => flattenTexts(pt).filter((i) => !isProductField(i.path)), []);

  // Toda seção de texto aparece uma única vez: nas grandes áreas ou em "Outras áreas".
  const areas = useMemo<Area[]>(() => {
    const covered = new Set(MAIN_AREAS.flatMap((a) => a.prefixes));
    const roots = Array.from(new Set(all.map((i) => i.path.split(".")[0]!)));
    const others = roots
      .filter((r) => !covered.has(r))
      .map<Area>((r) => ({
        id: r,
        label: OTHER_LABELS[r] ?? r.replace(/([a-z])([A-Z])/g, "$1 $2"),
        hint: "Títulos e textos desta seção do site.",
        prefixes: [r],
      }));
    return [...MAIN_AREAS, ...others];
  }, [all]);

  const [areaId, setAreaId] = useState(MAIN_AREAS[0]!.id);
  const area = areas.find((a) => a.id === areaId) ?? areas[0]!;

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
    if (query) {
      return i.value.toLowerCase().includes(query) || i.path.toLowerCase().includes(query);
    }
    return area.prefixes.includes(i.path.split(".")[0]!);
  });

  const changed = Object.keys(drafts);
  const bannerKey = area.banner;
  const bannerUrl = bannerKey ? banners[bannerKey]?.imageUrl ?? "" : "";

  const customCount = (a: Area) =>
    Object.keys(overrides).filter(
      (p) => a.prefixes.includes(p.split(".")[0]!) && overrides[p]?.pt,
    ).length;

  async function pickBanner(file: File) {
    if (!bannerKey) return;
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
    setBanners((b) => ({ ...b, [bannerKey]: { imageUrl: dataUrl } }));
    toast.success("Imagem carregada. Clique em Salvar banner.");
  }

  async function saveBanner() {
    setBusy(true);
    try {
      const payload = Object.fromEntries(
        MAIN_AREAS.map((a) => [
          a.banner!,
          { imageUrl: banners[a.banner!]?.imageUrl?.trim() || undefined },
        ]),
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

  async function onSave() {
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
      title="Áreas e textos do site"
      requireAdmin
      description="Um único lugar para banners, títulos, caixas de texto e textos em geral de todas as áreas do site. Você escreve em português e as versões em inglês, espanhol e mandarim são geradas automaticamente."
    >
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar em todos os textos…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="mt-3 flex flex-col gap-1 lg:max-h-[60vh] lg:overflow-auto">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Grandes áreas
            </p>
            {areas.map((a, idx) => {
              const first = idx === MAIN_AREAS.length;
              const active = !query && area.id === a.id;
              const custom = customCount(a);
              return (
                <div key={a.id}>
                  {first && (
                    <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Outras áreas
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setAreaId(a.id);
                      setSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      active ? "bg-ink text-ink-foreground" : "hover:bg-secondary"
                    }`}
                  >
                    <span>{a.label}</span>
                    {custom > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[11px] ${
                          active ? "bg-ink-foreground/20" : "bg-accent/10 text-accent"
                        }`}
                      >
                        {custom}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground">
            {query ? `Resultados para “${search}”` : area.hint} · {items.length} campo(s)
          </p>

          {!query && area.id === "services" && (
            <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-6">
              <h2 className="font-display text-lg font-bold">Serviços cadastrados</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Nome, promessa, problema que resolvemos, entregas, tempo estimado, família e
                frente de cada serviço são editados no cadastro de serviços — e aparecem no site
                automaticamente. Aqui ficam apenas os títulos e textos gerais da área.
              </p>
              <Link
                to="/admin/servicos"
                className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Abrir cadastro de serviços
              </Link>
            </div>
          )}


          {/* Banner de topo (apenas grandes áreas) */}
          {!query && bannerKey && (
            <div className="mt-6 rounded-lg border border-border bg-background p-6">
              <h2 className="font-display text-lg font-bold">Banner de topo</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Imagem de fundo da faixa escura no topo da página. Sem imagem, a faixa continua
                no fundo escuro padrão.
              </p>
              {bannerUrl && (
                <div className="mt-4 flex items-center gap-3">
                  <img
                    src={bannerUrl}
                    alt=""
                    className="h-20 w-36 rounded-md border border-border object-cover"
                  />
                  <button
                    onClick={() => setBanners((b) => ({ ...b, [bannerKey]: { imageUrl: "" } }))}
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
                  setBanners((b) => ({ ...b, [bannerKey]: { imageUrl: e.target.value } }))
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
          )}

          {/* Textos */}
          <div className="mt-6 space-y-3">
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
                    {isDirty && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                        não salvo
                      </span>
                    )}
                    <div className="ml-auto flex items-center gap-3">
                      {isDirty && (
                        <button
                          className="text-xs text-muted-foreground hover:text-accent"
                          onClick={() =>
                            setDrafts((d) => {
                              const n = { ...d };
                              delete n[item.path];
                              return n;
                            })
                          }
                        >
                          Desfazer
                        </button>
                      )}
                      {(isCustom || isDirty) && (
                        <button
                          className="text-xs text-muted-foreground hover:text-accent"
                          onClick={() => setDrafts((d) => ({ ...d, [item.path]: item.value }))}
                        >
                          Restaurar original
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={current}
                    rows={current.length > 110 ? 4 : 2}
                    onChange={(e) => setDrafts((d) => ({ ...d, [item.path]: e.target.value }))}
                    className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent"
                  />
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {current.length} caracteres
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum texto encontrado.</p>
            )}
          </div>
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
          onClick={onSave}
          className="ml-auto rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-50"
        >
          {busy ? "Salvando e traduzindo…" : "Salvar e traduzir"}
        </button>
      </div>
    </AdminShell>
  );
}
