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
  generateArticlePostCopy,
} from "@/lib/ad-social.functions";
import { ARTICLE_POST_HEADLINES } from "@/lib/ad-content";
import { listArticles } from "@/lib/admin.functions";
import {
  SOCIAL_IMAGE_FORMATS,
  composeAdArt,
  downloadDataUrl,
  type SocialFormatKey,
} from "@/lib/social-image";

export const Route = createFileRoute("/admin/propaganda")({
  head: () => ({
    meta: [
      { title: "Propaganda em redes sociais — Painel Liberato Consulting" },
      {
        name: "description",
        content:
          "Crie peças de propaganda para LinkedIn, Instagram e WhatsApp em quatro idiomas.",
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

  const [mode, setMode] = useState<"servico" | "artigo">("servico");
  const [articleId, setArticleId] = useState("");
  const article = published.find((a) => a.id === articleId);
  const [service, setService] = useState(SERVICES[0]?.label ?? "");
  const [topic, setTopic] = useState("");
  const [goalId, setGoalId] = useState<string>(AD_GOALS[0].id);
  const goal = AD_GOALS.find((g) => g.id === goalId)?.label ?? AD_GOALS[0].label;
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

  const site = (company.data?.website || "liberatoconsulting.com.br").replace(/^https?:\/\//, "");
  const phone = company.data?.phone || "";
  const articleLink =
    mode === "artigo" && article
      ? (article.link_url || `${site}/content/${article.slug}`).replace(/^https?:\/\//, "")
      : "";
  const footer = ["Liberato Consulting", articleLink || site, phone]
    .filter(Boolean)
    .join(" · ");

  async function makeCopy() {
    setBusy("copy");
    const res = await generateAdCopy({ data: { service, topic, goal } });
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
          : { service, topic, goal },
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

  async function compose() {
    const selected = AD_LANGS.filter((l) => langs[l]);
    const list =
      mode === "artigo"
        ? [
            ARTICLE_POST_HEADLINES[selected[0] ?? "pt"],
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
          variant: mode === "servico" && goalId === "seguidor" ? "seguidor" : "card",
          format,
          lines: list,
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
                setMode(e.target.value as "servico" | "artigo");
                setLines({ pt: "", en: "", zh: "", es: "" });
                setArts({});
              }}
            >
              <option value="servico">Propaganda de serviço</option>
              <option value="artigo">Novo artigo publicado</option>
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

          <div className={`space-y-1 ${mode === "artigo" ? "hidden" : ""}`}>
            <label className="text-sm font-medium">Serviço da consultoria</label>
            <select className={field} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={`space-y-1 ${mode === "artigo" ? "hidden" : ""}`}>
            <label className="text-sm font-medium">Assunto do serviço</label>
            <input
              className={field}
              value={topic}
              placeholder="Ex.: redução de custos em operações industriais"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className={`space-y-1 ${mode === "artigo" ? "hidden" : ""}`}>
            <label className="text-sm font-medium">Objetivo do post</label>
            <select className={field} value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              {AD_GOALS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className={`flex flex-wrap gap-2 ${mode === "artigo" ? "hidden" : ""}`}>
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

          {AD_LANGS.map((k, i) => (
            <div key={k} className={`space-y-1 ${langs[k] ? "" : "opacity-50"}`}>
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
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-1"
                  onClick={() =>
                    downloadDataUrl(arts[f]!, `propaganda-${f}.${SOCIAL_IMAGE_FORMATS[f].ext}`)
                  }
                >
                  Baixar
                </button>
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
