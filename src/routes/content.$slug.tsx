import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Linkedin, Instagram, MessageCircle, Star } from "lucide-react";

import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";
import {
  getArticleFileUrl,
  getPublicArticle,
  rateArticle,
  registerArticleRead,
  submitArticle,
} from "@/lib/content.functions";
import type { ArticleRecord } from "@/lib/site-config";
import { seoLinks } from "@/lib/seo";
import { articleSchema, breadcrumb, jsonLd } from "@/lib/schema";
import { getPublishedNewsletter } from "@/lib/newsletter-public.functions";

export const Route = createFileRoute("/content/$slug")({
  /** Endereços antigos de newsletter (/content/...) seguem para a página da newsletter. */
  loader: async ({ params }) => {
    const article = await getPublicArticle({ data: { slug: params.slug } }).catch(() => null);
    if (article) {
      return {
        title: article.title,
        summary: article.summary,
        authors: article.authors,
        coverUrl: article.cover_url,
        publishedAt:
          ((article as unknown as Record<string, string | null>)["created_at"] ?? null),
        updatedAt:
          ((article as unknown as Record<string, string | null>)["updated_at"] ?? null),
      };

    }
    const news = await getPublishedNewsletter({ data: { slug: params.slug } }).catch(() => null);
    if (news) throw redirect({ to: "/newsletter/$slug", params: { slug: params.slug } });
    return null;
  },
  head: ({ params, loaderData }) => {
    const fallbackTitle = params.slug.replace(/-/g, " ");
    const title = loaderData?.title || fallbackTitle;
    const summary =
      loaderData?.summary ||
      "Artigo publicado pela Liberato Consulting sobre gestão empresarial e inteligência artificial aplicada.";
    const pageTitle = `${title} — Liberato Consulting`.slice(0, 70);
    const image = loaderData?.coverUrl?.startsWith("http")
      ? loaderData.coverUrl
      : "https://liberatoconsulting.com.br/og-default.png";
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: summary.slice(0, 158) },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: summary.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: seoLinks(`/content/${params.slug}`),
      scripts: [
        jsonLd(
          breadcrumb([
            { name: "Início", path: "/" },
            { name: "Conteúdo", path: "/content" },
            { name: title, path: `/content/${params.slug}` },
          ]),
        ),
        jsonLd(
          articleSchema({
            headline: title,
            description: summary,
            path: `/content/${params.slug}`,
            authorName: loaderData?.authors || null,
            image: image,
            datePublished: loaderData?.publishedAt ?? null,
            dateModified: loaderData?.updatedAt ?? null,
          }),
        ),

      ],
    };
  },

  component: ArticlePage,
});

function ArticlePage() {
  const { slug } = Route.useParams();
  const { t, lang } = useLanguage();
  const a = t.content.article;

  const [article, setArticle] = useState<ArticleRecord | null | undefined>(undefined);
  const [reads, setReads] = useState(0);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicArticle({ data: { slug } })
      .then((r) => {
        if (cancelled) return;
        setArticle(r);
        if (r) {
          setReads(r.read_count ?? 0);
          setRating({
            average: r.rating_count ? r.rating_sum / r.rating_count : 0,
            count: r.rating_count ?? 0,
          });
        }
      })
      .catch(() => setArticle(null));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Contabiliza uma leitura por visitante (por navegador).
  useEffect(() => {
    const key = `liberato-read-${slug}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
    registerArticleRead({ data: { slug } })
      .then((r) => r.ok && setReads(r.reads))
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    const stored = window.localStorage.getItem(`liberato-rating-${slug}`);
    if (stored) setMyRating(Number(stored));
  }, [slug]);

  const view = useMemo(() => {
    if (!article) return null;
    const tr = (lang === "pt" ? undefined : article.translations?.[lang]) ?? {};
    return {
      kind: tr.kind ?? article.kind,
      title: tr.title ?? article.title,
      summary: tr.summary ?? article.summary,
      body: tr.body ?? article.body,
    };
  }, [article, lang]);

  async function onRate(value: number) {
    if (myRating) return;
    setMyRating(value);
    window.localStorage.setItem(`liberato-rating-${slug}`, String(value));
    const r = await rateArticle({ data: { slug, rating: value } });
    if (r.ok) {
      setRating({ average: r.average, count: r.count });
      toast.success(a.rateThanks);
    }
  }

  async function onDownload() {
    if (!article?.file_path) {
      if (article?.link_url) {
        window.open(article.link_url, "_blank", "noopener,noreferrer");
        return;
      }
      toast.info(a.noFile);
      return;
    }
    setDownloading(true);
    try {
      const r = await getArticleFileUrl({ data: { slug } });
      if (r.ok) window.open(r.url, "_blank", "noopener,noreferrer");
      else toast.error(r.error);
    } finally {
      setDownloading(false);
    }
  }

  if (article === undefined) {
    return <div className="mx-auto max-w-3xl px-6 py-32 text-sm text-muted-foreground">…</div>;
  }
  if (!article || !view) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-32">
        <p className="text-sm text-muted-foreground">Conteúdo não encontrado.</p>
        <Link to="/content" className="mt-4 inline-block text-sm font-semibold text-accent">
          {a.back}
        </Link>
      </div>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${view.title} — Liberato Consulting`;

  return (
    <div>
      {/* Capa com o título sobreposto */}
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        {article.cover_url && (
          <img
            src={article.cover_url}
            alt={view.title}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto flex min-h-[380px] max-w-4xl flex-col justify-end px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{view.kind}</p>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight md:text-5xl">
            {view.title}
          </h1>
          {article.authors && (
            <p className="mt-4 text-sm text-ink-foreground/80">
              {a.by} <span className="font-semibold">{article.authors}</span>
            </p>
          )}
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-14">
        {/* Resumo */}
        {view.summary && (
          <div className="border-l-4 border-accent bg-secondary/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {a.summaryLabel}
            </p>
            <p className="mt-2 text-lg leading-relaxed text-foreground/90">{view.summary}</p>
          </div>
        )}

        {/* Texto (até 500 palavras) */}
        {view.body && (
          <div className="mt-10 space-y-5 text-base leading-relaxed text-foreground/90">
            {view.body
              .split(/\n{2,}|\n/)
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>
        )}

        {/* Ações: download, leituras, contato dos autores */}
        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-border pt-8">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {downloading ? a.downloading : a.download}
          </button>
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground">{reads}</strong> {a.reads}
          </span>
          {article.author_contact && (
            <a
              href={
                article.author_contact.includes("@")
                  ? `mailto:${article.author_contact}`
                  : article.author_contact
              }
              className="text-sm font-semibold text-accent hover:underline"
            >
              {a.contactAuthors}
            </a>
          )}
        </div>

        {/* Avaliação */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{a.rateLabel}</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => onRate(n)}
                aria-label={`${n}/5`}
                disabled={Boolean(myRating)}
                className="transition-transform hover:scale-110 disabled:cursor-default"
              >
                <Star
                  className={`h-5 w-5 ${
                    n <= (myRating ?? Math.round(rating?.average ?? 0))
                      ? "fill-accent text-accent"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating && rating.count > 0 && (
            <span className="text-sm text-muted-foreground">
              {rating.average.toFixed(1)} · {rating.count} {a.ratingCount}
            </span>
          )}
        </div>

        {/* Compartilhar */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">{a.share}</span>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <button
            onClick={async () => {
              await navigator.clipboard?.writeText(`${shareText} ${shareUrl}`);
              toast.success("Link copiado para compartilhar no Instagram.");
              window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
            }}
            aria-label="Instagram"
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Instagram className="h-4 w-4" />
          </button>
        </div>

        <SubmitArticleBlock />

        <Link
          to="/content"
          className="mt-10 inline-block text-sm font-semibold text-muted-foreground hover:text-accent"
        >
          ← {a.back}
        </Link>
      </article>

      <CtaBand />
    </div>
  );
}

function SubmitArticleBlock() {
  const { t, lang } = useLanguage();
  const a = t.content.article;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const input =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const fileEntry = form.get("file");
    setBusy(true);
    try {
      let file: { name: string; dataUrl: string } | null = null;
      if (fileEntry instanceof File && fileEntry.size > 0) {
        if (fileEntry.size > 4_000_000) {
          toast.error(a.formError);
          return;
        }
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(fileEntry);
        });
        file = { name: fileEntry.name, dataUrl };
      }
      const r = await submitArticle({
        data: {
          full_name: String(form.get("full_name") ?? ""),
          email: String(form.get("email") ?? ""),
          title: String(form.get("title") ?? ""),
          summary: String(form.get("summary") ?? ""),
          message: String(form.get("message") ?? ""),
          website: String(form.get("website") ?? ""),
          language: lang,
          file,
        },
      });
      if (r.ok) {
        setDone(true);
        toast.success(a.formSuccess);
      } else toast.error(r.error);
    } catch {
      toast.error(a.formError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 rounded-lg border border-border bg-secondary/40 p-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border-2 border-accent px-5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {a.publishCta}
        </button>
      ) : done ? (
        <p className="text-sm font-medium text-foreground">{a.formSuccess}</p>
      ) : (
        <form onSubmit={onSubmit}>
          <h2 className="font-display text-lg font-bold">{a.publishTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{a.publishLead}</p>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium">
              {a.formName}
              <input name="full_name" required maxLength={160} className={input} />
            </label>
            <label className="text-sm font-medium">
              {a.formEmail}
              <input name="email" type="email" required maxLength={255} className={input} />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              {a.formTitle}
              <input name="title" required maxLength={300} className={input} />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              {a.formSummary}
              <textarea name="summary" rows={3} maxLength={2000} className={input} />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              {a.formMessage}
              <textarea name="message" rows={3} maxLength={4000} className={input} />
            </label>
            <label className="text-sm font-medium md:col-span-2">
              {a.formFile}
              <input
                name="file"
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.odt"
                className={input}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-5 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          >
            {busy ? a.formSending : a.formSubmit}
          </button>
        </form>
      )}
    </div>
  );
}
