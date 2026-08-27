import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CtaBand } from "@/components/CtaBand";
import { useLanguage } from "@/i18n";
import { submitArticle } from "@/lib/content.functions";
import { formatCpf, formatPhone, isValidCpf, isValidEmail, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, jsonLd, webPageSchema } from "@/lib/schema";
import { useFieldErrors } from "@/hooks/useFieldErrors";

export const Route = createFileRoute("/content_/enviar")({
  head: (ctx) => ({
    meta: [
      { title: "Envie seu artigo | Conteúdo — Liberato Consulting" },
      {
        name: "description",
        content:
          "Envie seu artigo sobre gestão, empreendedorismo, pesquisas de mercado ou inteligência artificial para a curadoria da Liberato Consulting.",
      },
      { property: "og:title", content: "Envie seu artigo — Liberato Consulting" },
      {
        property: "og:description",
        content: "Publique com a Liberato Consulting: envie seu artigo para nossa curadoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Envie seu artigo — Liberato Consulting" },
      {
        name: "twitter:description",
        content: "Publique com a Liberato Consulting: envie seu artigo para nossa curadoria.",
      },
      ...seoLocaleMeta(headLang(ctx)),
    ],
    links: seoLinks("/content/enviar", headLang(ctx)),
    scripts: [
      jsonLd(
        breadcrumb([
          { name: "Início", path: "/" },
          { name: "Conteúdo", path: "/content" },
          { name: "Envie seu artigo", path: "/content/enviar" },
        ]),
      ),
      jsonLd(
        webPageSchema({
          name: "Envie seu artigo — Liberato Consulting",
          description:
            "Formulário para envio de artigos à curadoria da Liberato Consulting.",
          path: "/content/enviar",
          type: "WebPage",
        }),
      ),
    ],
  }),
  component: SubmitArticlePage,
});

function SubmitArticlePage() {
  const { t, lang } = useLanguage();
  const a = t.content.article;
  const groups = t.megaMenu.groups;

  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const { validate, fieldProps } = useFieldErrors();

  const services = groups.flatMap((g) => g.items.map((i) => ({ id: i.id, label: i.label })));

  const input =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const ok = validate({
      full_name: String(form.get("full_name") ?? ""),
      role_label: String(form.get("role_label") ?? ""),
      email,
      phone,
      title: String(form.get("title") ?? ""),
      summary: String(form.get("summary") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    if (!ok) return;
    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error(PHONE_ERROR);
      return;
    }
    if (cpf && !isValidCpf(cpf)) {
      toast.error("Informe um CPF válido.");
      return;
    }
    const fileEntry = form.get("file");
    setBusy(true);
    try {
      let file: { name: string; dataUrl: string } | null = null;
      if (fileEntry instanceof File && fileEntry.size > 0) {
        if (fileEntry.size > 4_000_000) {
          toast.error("Arquivo acima de 4 MB.");
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
          email,
          title: String(form.get("title") ?? ""),
          summary: String(form.get("summary") ?? ""),
          message: String(form.get("message") ?? ""),
          role_label: String(form.get("role_label") ?? ""),
          institution: String(form.get("institution") ?? ""),
          phone,
          cpf,
          group_id: groupId,
          service: String(form.get("service") ?? ""),
          website: String(form.get("website") ?? ""),
          language: lang,
          file,
        },
      });
      if (r.ok) {
        setDone(true);
        toast.success(a.formSuccess);
        window.setTimeout(
          () => successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
          50,
        );
      } else toast.error(r.error);
    } catch {
      toast.error(a.formError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {t.content.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
            {a.publishTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-foreground/75">{a.publishLead}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        {done ? (
          <div ref={successRef} className="rounded-lg border-l-4 border-accent bg-secondary/50 p-6">
            <p className="text-base font-semibold text-foreground">{a.formSuccess}</p>
            <button
              onClick={() => setDone(false)}
              className="mt-4 rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              {a.formSubmit}
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="rounded-lg border border-border p-6">
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                {a.formName} *
                <input name="full_name" required maxLength={160} {...fieldProps("full_name", input)} />
              </label>
              <label className="text-sm font-medium">
                {a.formRole} *
                <input
                  name="role_label"
                  required
                  maxLength={120}
                  placeholder="Autor"
                  {...fieldProps("role_label", input)}
                />
              </label>
              <label className="text-sm font-medium">
                {a.formEmail} *
                <input name="email" type="email" required maxLength={255} {...fieldProps("email", input)} />
              </label>
              <label className="text-sm font-medium">
                {a.formPhone} *
                <input
                  name="phone"
                   type="tel"
                   required
                   inputMode="tel"
                   autoComplete="tel"
                   maxLength={25}
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                   placeholder={PHONE_PLACEHOLDER}
                   className={`${input}${phone && !isValidPhone(phone) ? " border-destructive ring-1 ring-destructive" : ""}`}
                   aria-invalid={Boolean(phone) && !isValidPhone(phone)}
                />
                 {phone && !isValidPhone(phone) && <span className="mt-1 block text-xs text-destructive">Use o formato +55 (11) 9999-9999.</span>}
              </label>
              <label className="text-sm font-medium">
                {a.formCpf}
                <input
                  name="cpf"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className={input}
                />
              </label>
              <label className="text-sm font-medium">
                {a.formInstitution}
                <input name="institution" maxLength={160} className={input} />
              </label>
              <label className="text-sm font-medium">
                {a.formCategory}
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className={input}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                {a.formService}
                <select name="service" className={input} defaultValue="">
                  <option value="">—</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium md:col-span-2">
                {a.formTitle} *
                <input name="title" required maxLength={300} {...fieldProps("title", input)} />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                {a.formSummary}
                <textarea name="summary" rows={3} maxLength={2000} {...fieldProps("summary", input)} />
              </label>
              <label className="text-sm font-medium md:col-span-2">
                {a.formMessage}
                <textarea name="message" rows={3} maxLength={4000} {...fieldProps("message", input)} />
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
              className="mt-6 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60"
            >
              {busy ? a.formSending : a.formSubmit}
            </button>
          </form>
        )}

        <Link
          to="/content"
          className="mt-8 inline-block text-sm font-semibold text-muted-foreground hover:text-accent"
        >
          ← {a.back}
        </Link>
      </section>

      <CtaBand />
    </div>
  );
}
