import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, ShieldCheck, Upload } from "lucide-react";

import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";
import { submitApplication } from "@/lib/careers.functions";

export const Route = createFileRoute("/careers")({
  head: () => {
    const title = "Trabalhe Conosco — Liberato Consulting";
    return {
      meta: [
        { title },
        { name: "description", content: pt.careers.metaDescription },
        { property: "og:title", content: title },
        { property: "og:description", content: pt.careers.metaDescription },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CareersPage,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function CareersPage() {
  const { t, lang } = useLanguage();
  const C = t.careers;
  const send = useServerFn(submitApplication);

  const startedAt = useRef(Date.now());
  const challenge = useMemo(
    () => ({ a: 1 + Math.floor(Math.random() * 8), b: 1 + Math.floor(Math.random() * 8) }),
    [],
  );

  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("resume");

    if (!(file instanceof File) || file.size === 0) {
      setError(C.errorFileType);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError(C.errorFileSize);
      return;
    }

    setStatus("sending");
    setError(null);
    try {
      const resumeBase64 = await fileToBase64(file);
      const result = await send({
        data: {
          fullName: String(fd.get("fullName") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          area: String(fd.get("area") ?? ""),
          linkedin: String(fd.get("linkedin") ?? ""),
          resumeName: file.name,
          resumeType: file.type,
          resumeBase64,
          language: lang,
          sourcePath: typeof window !== "undefined" ? window.location.pathname : "",
          website: String(fd.get("website") ?? ""),
          elapsedMs: Date.now() - startedAt.current,
          captchaAnswer: String(fd.get("captcha") ?? ""),
          captchaA: challenge.a,
          captchaB: challenge.b,
        },
      });

      if (result.ok) {
        setStatus("done");
        form.reset();
        setFileName("");
        return;
      }
      setStatus("idle");
      setError(
        result.reason === "captcha"
          ? C.errorCaptcha
          : result.reason === "tooFast"
            ? C.errorTooFast
            : result.reason === "rateLimited"
              ? C.errorRate
              : result.reason === "fileType"
                ? C.errorFileType
                : result.reason === "fileSize"
                  ? C.errorFileSize
                  : C.errorGeneric,
      );
    } catch {
      setStatus("idle");
      setError(C.errorGeneric);
    }
  }

  const field =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {C.eyebrow}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{C.title}</h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-foreground/75">{C.lead}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-6">
          {status === "done" ? (
            <p className="rounded-2xl border border-accent/40 bg-accent/10 px-6 py-5 text-sm font-medium">
              {C.success}
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="grid gap-4 rounded-2xl border border-border bg-secondary p-8 sm:grid-cols-2"
            >
              <label className="text-sm font-medium sm:col-span-2">
                {C.fullName}
                <input name="fullName" required minLength={3} maxLength={120} className={field} />
              </label>
              <label className="text-sm font-medium">
                {C.phone}
                <input
                  name="phone"
                  type="tel"
                  required
                  minLength={8}
                  maxLength={30}
                  className={field}
                />
              </label>
              <label className="text-sm font-medium">
                {C.email}
                <input name="email" type="email" required maxLength={255} className={field} />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {C.area}
                <select name="area" required defaultValue="" className={field}>
                  <option value="" disabled>
                    {C.areaPlaceholder}
                  </option>
                  {C.areaOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {C.resume}
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-3">
                  <Upload className="size-4 shrink-0 text-accent" />
                  <input
                    name="resume"
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,.rtf,.odt"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                    className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-accent-foreground"
                  />
                </div>
                {fileName && (
                  <span className="mt-1 block text-xs text-muted-foreground">{fileName}</span>
                )}
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {C.linkedin}
                <input
                  name="linkedin"
                  type="url"
                  maxLength={300}
                  placeholder={C.linkedinPlaceholder}
                  className={field}
                />
              </label>

              {/* Honeypot */}
              <div aria-hidden="true" className="hidden">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <label className="text-sm font-medium sm:col-span-2">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-accent" />
                  {C.captcha} {challenge.a} + {challenge.b}?
                </span>
                <input
                  name="captcha"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  className={`${field} sm:max-w-40`}
                />
              </label>

              {error && (
                <p className="text-sm font-medium text-destructive sm:col-span-2">{error}</p>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {status === "sending" ? C.sending : C.submit}
                  <ArrowRight className="size-4" />
                </button>
                <p className="mt-3 text-xs text-muted-foreground">{C.note}</p>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
