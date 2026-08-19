import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useLanguage } from "@/i18n";
import { pt } from "@/i18n/pt";
import { getCompany } from "@/lib/company.functions";
import {
  AD_GOALS,
  generateAdBackground,
  generateAdCopy,
  generateAreasCopy,
  generateArticlePostCopy,
} from "@/lib/ad-social.functions";
import {
  AREAS_POST_HEADLINES,
  ARTICLE_POST_HEADLINES,
  SERVICE_AREAS,
  THEME_POST_HEADLINES,
} from "@/lib/ad-content";
import { listPublicIndicators } from "@/lib/indicators.functions";
import { listArticles } from "@/lib/admin.functions";
import {
  SOCIAL_IMAGE_FORMATS,
  composeAdArt,
  copyDataUrlImage,
  downloadDataUrl,
  type SocialFormatKey,
} from "@/lib/social-image";

export const Route = createFileRoute("/admin/propaganda")({
  head: () => ({
    meta: [
      { title: "Propaganda em redes sociais — Painel Liberato Consulting" },
      {
        name: "description",
        content: "Crie peças de propaganda para LinkedIn, Instagram e WhatsApp em quatro idiomas.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Propaganda em redes sociais — Painel Liberato Consulting" },
      {
        property: "og:description",
        content: "Gere artes publicitárias multilíngues com a marca da consultoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdPage,
});

const SERVICES = [
  ...pt.megaMenu.groups.flatMap((g) =>
    g.items.map((i) => ({ id: i.id, label: `${g.title} · ${i.label}` })),
  ),
  { id: "trabalhe-conosco", label: "Trabalhe conosco" },
];

const FORMATS: SocialFormatKey[] = ["linkedin", "instagram", "whatsapp"];

type Mode =
  "servico" | "area" | "areas" | "artigo" | "indicadores" | "brasil" | "gestao" | "insights";

const MODE_LABELS: Record<Mode, string> = {
  servico: "Propaganda de serviço",
  area: "Propaganda de uma área de serviço",
  areas: "As quatro áreas de serviço juntas",
  artigo: "Novo artigo publicado",
  indicadores: "Indicadores econômicos",
  brasil: "Dados do Brasil",
  gestao: "Conteúdos gerais sobre gestão",
  insights: "Insights",
};

/** Modos com título fixo e frase publicitária opcional em cada idioma. */
const THEME_MODES = ["indicadores", "brasil", "gestao", "insights"] as const;
type ThemeMode = (typeof THEME_MODES)[number];
const isTheme = (m: Mode): m is ThemeMode => (THEME_MODES as readonly string[]).includes(m);

const BRAZIL_SECTIONS = pt.brazil.sections.map((s) => ({ id: s.id, title: s.title }));

const AD_LANGS = ["pt", "en", "zh", "es"] as const;
type AdLang = (typeof AD_LANGS)[number];
const AD_LANG_LABELS: Record<AdLang, string> = {
  pt: "Português",
  en: "Inglês",
  zh: "Chinês",
  es: "Espanhol",
};

function AdPage() {
  const ready = useAuthReady();
  const { logoUrl } = useLanguage();
  const company = useQuery({
    queryKey: ["company"],
    queryFn: () => getCompany(),
    enabled: ready,
  });

  const articles = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => listArticles(),
    enabled: ready,
  });
  const published = (articles.data ?? []).filter((a) => a.published);

  const indicators = useQuery({
    queryKey: ["public-indicators"],
    queryFn: () => listPublicIndicators(),
  });
  const indicatorList = indicators.data ?? [];

  const [mode, setMode] = useState<Mode>("servico");
  const [articleId, setArticleId] = useState("");
  const article = published.find((a) => a.id === articleId);
  const [service, setService] = useState(SERVICES[0]?.label ?? "");
  const [areaId, setAreaId] = useState<string>(SERVICE_AREAS[0].id);
  const areaLabel =
    SERVICE_AREAS.find((a) => a.id === areaId)?.labels.pt ?? SERVICE_AREAS[0].labels.pt;
  const [areaTexts, setAreaTexts] = useState<Record<AdLang, Record<string, string>>>({
    pt: {},
    en: {},
    zh: {},
    es: {},
  });
  const [brazilId, setBrazilId] = useState<string>(BRAZIL_SECTIONS[0]?.id ?? "");
  const brazilTitle = BRAZIL_SECTIONS.find((b) => b.id === brazilId)?.title ?? "";
  const [picked, setPicked] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [goalId, setGoalId] = useState<string>(AD_GOALS[0].id);
  const goal = AD_GOALS.find((g) => g.id === goalId)?.label ?? AD_GOALS[0].label;
  const serviceForAi =
    mode === "area"
      ? areaLabel
      : mode === "areas"
        ? "Estratégia, Empreendedorismo, Operações e Pesquisa de Mercado"
        : mode === "indicadores"
          ? "Indicadores econômicos do Brasil"
          : mode === "brasil"
            ? `Dados do Brasil — ${brazilTitle}`
            : mode === "gestao"
              ? "Conteúdos gerais sobre gestão empresarial"
              : mode === "insights"
                ? "Insights da Liberato Consulting"
                : service;
  const goalForAi = isTheme(mode)
    ? (AD_GOALS.find(
        (g) =>
          (mode === "indicadores" && g.id === "brasil") ||
          (mode === "brasil" && g.id === "brasil") ||
          (mode === "gestao" && g.id === "conteudos") ||
          (mode === "insights" && g.id === "insights"),
      )?.label ?? goal)
    : goal;

  const [lines, setLines] = useState({ pt: "", en: "", zh: "", es: "" });
  const [langs, setLangs] = useState<Record<AdLang, boolean>>({
    pt: true,
    en: true,
    zh: true,
    es: true,
  });
  const [baseImage, setBaseImage] = useState("");
  const [arts, setArts] = useState<Partial<Record<SocialFormatKey, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [zoom, setZoom] = useState<SocialFormatKey | null>(null);

  async function copyArt(dataUrl: string) {
    const ok = await copyDataUrlImage(dataUrl);
    if (ok) toast.success("Imagem copiada — cole direto no LinkedIn, WhatsApp ou Instagram.");
    else toast.error("Seu navegador não permite copiar imagens. Use o botão Baixar.");
  }

  const site = (company.data?.website || "liberatoconsulting.com.br").replace(/^https?:\/\//, "");
  const phone = company.data?.phone || "";
  const articleLink =
    mode === "artigo" && article
      ? `${site}/content/${article.slug}`.replace(/^https?:\/\//, "")
      : "";

  const footer = ["Liberato Consulting", articleLink || site, phone].filter(Boolean).join(" · ");

  async function makeCopy() {
    setBusy("copy");
    const res = await generateAdCopy({ data: { service: serviceForAi, topic, goal: goalForAi } });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setLines({ pt: res.pt, en: res.en, zh: res.zh, es: res.es });
    toast.success("Frases geradas nos quatro idiomas.");
  }

  async function makeImage() {
    setBusy("image");
    const res = await generateAdBackground({
      data:
        mode === "artigo" && article
          ? {
              service: article.service || "conteúdo editorial",
              topic: article.title,
              goal: "Divulgar novo artigo publicado",
            }
          : { service: serviceForAi, topic, goal: goalForAi },
    });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setBaseImage(res.imageUrl);
    setArts({});
    toast.success("Imagem de fundo gerada.");
  }

  async function makeArticleCopy() {
    if (!article) {
      toast.error("Selecione um conteúdo publicado.");
      return;
    }
    setBusy("copy");
    const res = await generateArticlePostCopy({
      data: { title: article.title, summary: article.summary ?? "" },
    });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setLines({ pt: res.pt, en: res.en, zh: res.zh, es: res.es });
    toast.success("Nome do artigo traduzido nos quatro idiomas.");
  }

  async function makeAreasCopy() {
    setBusy("copy");
    const res = await generateAreasCopy({ data: { focus: topic } });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setAreaTexts({ pt: res.pt, en: res.en, zh: res.zh, es: res.es });
    toast.success("Frases geradas para as quatro áreas nos quatro idiomas.");
  }

  function areaLine(lang: AdLang, id: string) {
    const area = SERVICE_AREAS.find((a) => a.id === id);
    const label = area?.labels[lang] ?? area?.labels.pt ?? id;
    const text = areaTexts[lang]?.[id]?.trim();
    return text ? `${label} — ${text}` : label;
  }

  /** Indicadores escolhidos, no formato da tabela em colunas da arte. */
  function indicatorRows() {
    return indicatorList
      .filter((i) => picked.includes(i.id))
      .slice(0, 5)
      .map((i) => ({
        slug: i.slug ?? "",
        polarity: i.polarity ?? "auto",
        label: i.label ?? "",
        value: i.value ?? "",
        unit: i.unit ?? "",
        previous_value: i.previous_value ?? "",
        previous_period: i.previous_period ?? "",
      }));
  }

  /** Data curta dos indicadores, exibida sob a coluna "Atual". */
  const sendDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  async function compose() {
    const selected = AD_LANGS.filter((l) => langs[l]);
    const focus = topic.trim();
    const list =
      mode === "artigo"
        ? [
            ARTICLE_POST_HEADLINES[selected[0] ?? "pt"],
            ...selected.map((l) => lines[l]).filter((t) => t.trim()),
          ]
        : mode === "areas"
          ? [
              AREAS_POST_HEADLINES[selected[0] ?? "pt"],
              ...(focus ? [focus] : []),
              ...selected.flatMap((l) => SERVICE_AREAS.map((a) => areaLine(l, a.id))),
            ]
          : isTheme(mode)
            ? [
                THEME_POST_HEADLINES[mode][selected[0] ?? "pt"],
                ...(focus ? [focus] : []),
                ...selected.map((l) => lines[l]).filter((t) => t.trim()),
              ]
            : selected.map((l) => lines[l]);
    if (!list.some((l) => l.trim())) {
      toast.error("Selecione ao menos um idioma e preencha a frase correspondente.");
      return;
    }
    setBusy("compose");
    try {
      const out: Partial<Record<SocialFormatKey, string>> = {};
      for (const format of FORMATS) {
        out[format] = await composeAdArt({
          variant:
            mode === "indicadores"
              ? "indicadores"
              : (mode === "servico" || mode === "area") && goalId === "seguidor"
                ? "seguidor"
                : "card",
          format,
          lines: list,
          ...(mode === "indicadores"
            ? {
                indicators: indicatorRows(),
                currentDate: sendDate,
                ...(focus ? { date: focus } : {}),
              }
            : {}),
          ...(baseImage ? { baseImage } : {}),
          ...(logoUrl ? { logoUrl } : {}),
          footer,
        });
      }

      setArts(out);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";

  return (
    <AdminShell
      title="Propaganda em redes sociais"
      description="Monte peças para LinkedIn, Instagram e WhatsApp em português, inglês, chinês e espanhol."
      requireAdmin
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tipo de peça</label>
            <select
              className={field}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as Mode);
                setLines({ pt: "", en: "", zh: "", es: "" });
                setAreaTexts({ pt: {}, en: {}, zh: {}, es: {} });
                setArts({});
              }}
            >
              {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {mode === "artigo" ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Conteúdo publicado</label>
                <select
                  className={field}
                  value={articleId}
                  onChange={(e) => setArticleId(e.target.value)}
                >
                  <option value="">Selecione um conteúdo…</option>
                  {published.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                Título fixo da peça: “{ARTICLE_POST_HEADLINES.pt}” — abaixo entra o nome do artigo
                em cada idioma selecionado.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={makeArticleCopy}
                  disabled={busy !== null}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {busy === "copy" ? "Traduzindo…" : "Traduzir nome do artigo (4 idiomas)"}
                </button>
                <button
                  type="button"
                  onClick={makeImage}
                  disabled={busy !== null}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {busy === "image" ? "Gerando…" : "Gerar imagem de fundo"}
                </button>
              </div>
            </>
          ) : null}

          <div className={`space-y-1 ${mode === "servico" ? "" : "hidden"}`}>
            <label className="text-sm font-medium">Serviço da consultoria</label>
            <select className={field} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={`space-y-1 ${mode === "area" ? "" : "hidden"}`}>
            <label className="text-sm font-medium">Área de serviço</label>
            <select className={field} value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              {SERVICE_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.labels.pt}
                </option>
              ))}
            </select>
          </div>

          <div className={`space-y-1 ${mode === "brasil" ? "" : "hidden"}`}>
            <label className="text-sm font-medium">Tema de Dados do Brasil</label>
            <select
              className={field}
              value={brazilId}
              onChange={(e) => setBrazilId(e.target.value)}
            >
              {BRAZIL_SECTIONS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {mode === "indicadores" ? (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Indicadores no post (até 5)</p>
              {indicatorList.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum indicador publicado disponível.
                </p>
              ) : (
                <div className="max-h-56 space-y-1 overflow-auto">
                  {indicatorList.map((i) => (
                    <label key={i.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={picked.includes(i.id)}
                        onChange={(e) =>
                          setPicked(
                            e.target.checked
                              ? [...picked, i.id].slice(0, 5)
                              : picked.filter((id) => id !== i.id),
                          )
                        }
                      />
                      <span>
                        {i.label}: {[i.value, i.unit].filter(Boolean).join(" ")}
                        {i.reference_period ? ` (${i.reference_period})` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                O resumo entra em destaque na arte; as frases abaixo complementam o post.
              </p>
            </div>
          ) : null}

          <div className={`space-y-1 ${mode === "artigo" ? "hidden" : ""}`}>
            <label className="text-sm font-medium">
              {mode === "areas" || isTheme(mode) ? "Foco da peça (opcional)" : "Assunto do serviço"}
            </label>
            <input
              className={field}
              value={topic}
              placeholder="Ex.: redução de custos em operações industriais"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className={`space-y-1 ${mode === "servico" || mode === "area" ? "" : "hidden"}`}>
            <label className="text-sm font-medium">Objetivo do post</label>
            <select className={field} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              {AD_GOALS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div
            className={`flex flex-wrap gap-2 ${
              mode === "servico" || mode === "area" || isTheme(mode) ? "" : "hidden"
            }`}
          >
            <button
              type="button"
              onClick={makeCopy}
              disabled={busy !== null}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {busy === "copy" ? "Gerando…" : "Gerar frases (4 idiomas)"}
            </button>
            <button
              type="button"
              onClick={makeImage}
              disabled={busy !== null}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {busy === "image" ? "Gerando…" : "Gerar imagem de fundo"}
            </button>
          </div>

          {mode === "areas" ? (
            <>
              <p className="text-xs text-muted-foreground">
                Título fixo da peça: “{AREAS_POST_HEADLINES.pt}” — abaixo entram as quatro áreas em
                cada idioma selecionado.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={makeAreasCopy}
                  disabled={busy !== null}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                >
                  {busy === "copy" ? "Gerando…" : "Gerar frases das 4 áreas (4 idiomas)"}
                </button>
                <button
                  type="button"
                  onClick={makeImage}
                  disabled={busy !== null}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {busy === "image" ? "Gerando…" : "Gerar imagem de fundo"}
                </button>
              </div>
            </>
          ) : null}

          {isTheme(mode) ? (
            <p className="text-xs text-muted-foreground">
              Título fixo da peça: “{THEME_POST_HEADLINES[mode].pt}” — abaixo entram
              {mode === "indicadores" ? " o resumo dos indicadores e" : ""} as frases de cada idioma
              selecionado.
            </p>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Idiomas do post</p>
            <div className="flex flex-wrap gap-3">
              {AD_LANGS.map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={langs[k]}
                    onChange={(e) => setLangs({ ...langs, [k]: e.target.checked })}
                  />
                  {AD_LANG_LABELS[k]}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              O espaço da arte é redistribuído conforme o número de idiomas selecionados.
            </p>
          </div>

          {mode === "areas"
            ? AD_LANGS.map((k) => (
                <div key={k} className={`space-y-2 ${langs[k] ? "" : "opacity-50"}`}>
                  <p className="text-sm font-medium">Áreas — {AD_LANG_LABELS[k]}</p>
                  {SERVICE_AREAS.map((a) => (
                    <input
                      key={a.id}
                      className={field}
                      disabled={!langs[k]}
                      placeholder={a.labels[k]}
                      value={areaTexts[k]?.[a.id] ?? ""}
                      onChange={(e) =>
                        setAreaTexts({
                          ...areaTexts,
                          [k]: { ...areaTexts[k], [a.id]: e.target.value },
                        })
                      }
                    />
                  ))}
                </div>
              ))
            : null}

          {AD_LANGS.map((k, i) => (
            <div
              key={k}
              className={`space-y-1 ${langs[k] ? "" : "opacity-50"} ${mode === "areas" ? "hidden" : ""}`}
            >
              <label className="text-sm font-medium">
                {mode === "artigo"
                  ? `Nome do artigo — ${AD_LANG_LABELS[k]}`
                  : `${i + 1}ª linha — ${AD_LANG_LABELS[k]}`}
              </label>
              <input
                className={field}
                value={lines[k]}
                disabled={!langs[k]}
                onChange={(e) => setLines({ ...lines, [k]: e.target.value })}
              />
            </div>
          ))}

          <p className="text-xs text-muted-foreground">Rodapé da arte: {footer}</p>

          <button
            type="button"
            onClick={compose}
            disabled={busy !== null}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy === "compose" ? "Montando…" : "Montar artes nos três formatos"}
          </button>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {baseImage && !Object.keys(arts).length ? (
            <img
              src={baseImage}
              alt="Imagem de fundo gerada"
              className="rounded-xl border border-border"
            />
          ) : null}
          {FORMATS.filter((f) => arts[f]).map((f) => (
            <figure key={f} className="space-y-2">
              <button
                type="button"
                onClick={() => setZoom(f)}
                className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border"
                aria-label={`Ampliar arte para ${SOCIAL_IMAGE_FORMATS[f].label}`}
              >
                <img
                  src={arts[f]}
                  alt={`Arte para ${SOCIAL_IMAGE_FORMATS[f].label}`}
                  className="w-full"
                />
                <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-1 text-xs font-medium opacity-90 group-hover:opacity-100">
                  🔍 Ampliar
                </span>
              </button>
              <figcaption className="flex items-center justify-between text-sm">
                <span>
                  {SOCIAL_IMAGE_FORMATS[f].label} · {SOCIAL_IMAGE_FORMATS[f].width}×
                  {SOCIAL_IMAGE_FORMATS[f].height}
                </span>
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1"
                    onClick={() => copyArt(arts[f]!)}
                  >
                    Copiar imagem
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-border px-3 py-1"
                    onClick={() =>
                      downloadDataUrl(arts[f]!, `propaganda-${f}.${SOCIAL_IMAGE_FORMATS[f].ext}`)
                    }
                  >
                    Baixar
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
        </section>
      </div>

      {zoom && arts[zoom] ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-foreground/80 p-4"
          onClick={() => setZoom(null)}
        >
          <div
            className="flex max-h-full w-full max-w-5xl flex-col items-center gap-3 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={arts[zoom]}
              alt={`Arte ampliada para ${SOCIAL_IMAGE_FORMATS[zoom].label}`}
              className="max-h-[75vh] w-auto rounded-lg bg-background"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              {FORMATS.filter((f) => arts[f]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setZoom(f)}
                  className={`rounded-md px-3 py-1 text-sm ${
                    f === zoom
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-foreground"
                  }`}
                >
                  {SOCIAL_IMAGE_FORMATS[f].label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => copyArt(arts[zoom]!)}
                className="rounded-md bg-background px-3 py-1 text-sm text-foreground"
              >
                Copiar imagem
              </button>
              <button
                type="button"
                onClick={() => setZoom(null)}
                className="rounded-md bg-background px-3 py-1 text-sm text-foreground"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
