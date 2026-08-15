import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useLanguage } from "@/i18n";
import { pt } from "@/i18n/pt";
import { getCompany } from "@/lib/company.functions";
import { AD_GOALS, generateAdBackground, generateAdCopy } from "@/lib/ad-social.functions";
import {
  SOCIAL_IMAGE_FORMATS,
  composeAdImage,
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

const SERVICES = pt.megaMenu.groups.flatMap((g) =>
  g.items.map((i) => ({ id: i.id, label: `${g.title} · ${i.label}` })),
);

const FORMATS: SocialFormatKey[] = ["linkedin", "instagram", "whatsapp"];

function AdPage() {
  const ready = useAuthReady();
  const { logoUrl } = useLanguage();
  const company = useQuery({
    queryKey: ["company"],
    queryFn: () => getCompany(),
    enabled: ready,
  });

  const [service, setService] = useState(SERVICES[0]?.label ?? "");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState<string>(AD_GOALS[0].label);
  const [lines, setLines] = useState({ pt: "", en: "", zh: "", es: "" });
  const [baseImage, setBaseImage] = useState("");
  const [arts, setArts] = useState<Partial<Record<SocialFormatKey, string>>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const site = (company.data?.website || "liberatoconsulting.com.br").replace(/^https?:\/\//, "");
  const phone = company.data?.phone || "";
  const footer = ["Liberato Consulting", site, phone].filter(Boolean).join(" · ");

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
    const res = await generateAdBackground({ data: { service, topic, goal } });
    setBusy(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setBaseImage(res.imageUrl);
    setArts({});
    toast.success("Imagem de fundo gerada.");
  }

  async function compose() {
    if (!baseImage) {
      toast.error("Gere primeiro a imagem de fundo.");
      return;
    }
    const list = [lines.pt, lines.en, lines.zh, lines.es];
    if (!list.some((l) => l.trim())) {
      toast.error("Gere ou escreva as frases.");
      return;
    }
    setBusy("compose");
    try {
      const out: Partial<Record<SocialFormatKey, string>> = {};
      for (const format of FORMATS) {
        out[format] = await composeAdImage({
          baseImage,
          format,
          lines: list,
          logoUrl,
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
            <label className="text-sm font-medium">Serviço da consultoria</label>
            <select className={field} value={service} onChange={(e) => setService(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.id} value={s.label}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Assunto do serviço</label>
            <input
              className={field}
              value={topic}
              placeholder="Ex.: redução de custos em operações industriais"
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Objetivo do post</label>
            <select className={field} value={goal} onChange={(e) => setGoal(e.target.value)}>
              {AD_GOALS.map((g) => (
                <option key={g.id} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
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

          {(["pt", "en", "zh", "es"] as const).map((k, i) => (
            <div key={k} className="space-y-1">
              <label className="text-sm font-medium">
                {i + 1}ª linha —{" "}
                {{ pt: "Português", en: "Inglês", zh: "Chinês", es: "Espanhol" }[k]}
              </label>
              <input
                className={field}
                value={lines[k]}
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
              <img
                src={arts[f]}
                alt={`Arte para ${SOCIAL_IMAGE_FORMATS[f].label}`}
                className="w-full rounded-xl border border-border"
              />
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
    </AdminShell>
  );
}
