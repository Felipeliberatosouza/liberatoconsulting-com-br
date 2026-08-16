import { useState } from "react";
import { toast } from "sonner";
import { useRouterState } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";

import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { subscribeBulletin } from "@/lib/bulletin.functions";
import { useFieldErrors } from "@/hooks/useFieldErrors";


/** Chamada para o Boletim Semanal (Dados do Brasil e Conteúdo). */
export function BulletinSignup() {
  const { lang, segments, t } = useLanguage();
  const tb = t.bulletin;
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [segment, setSegment] = useState("Todos");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [viaEmail, setViaEmail] = useState(true);
  const [viaWhatsApp, setViaWhatsApp] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { validate, errorClass } = useFieldErrors();

  const field =
    "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <section
      id="boletim-semanal"
      className="rounded-xl border border-border bg-secondary/40 p-6 md:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
        {tb.eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold">
        {tb.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        {tb.description}
      </p>

      {done ? (
        <p className="mt-6 rounded-md border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium text-accent">
          {tb.done}
        </p>
      ) : (
        <form
          noValidate
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validate({ fullName, company, email })) return;
            if (!viaEmail && !viaWhatsApp) {
              toast.error(tb.chooseChannel);
              return;
            }
            setBusy(true);
            try {
              const r = await subscribeBulletin({
                data: {
                  fullName,
                  company,
                  segment,
                  email,
                  whatsapp,
                  viaEmail,
                  viaWhatsApp,
                  language: lang,
                  sourcePath: pathname,
                  website,
                },
              });
              if (!r.ok) toast.error(r.error);
              else {
                setDone(true);
                toast.success(tb.success);
                trackEvent("form_submit", { form_name: "bulletin", location: pathname });
              }
            } catch {
              toast.error(tb.error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
          />

          <label className="text-sm font-medium">
            {tb.name}
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${field}${errorClass("fullName", fullName)}`}
            />
          </label>

          <label className="text-sm font-medium">
            {tb.company}
            <input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={`${field}${errorClass("company", company)}`}
            />
          </label>

          <label className="text-sm font-medium">
            {tb.email}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tb.emailPlaceholder}
              className={`${field}${errorClass("email", email)}`}
            />
          </label>

          <label className="text-sm font-medium">
            {tb.whatsapp}
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 91234-5678"
              className={field}
            />
          </label>

          <label className="text-sm font-medium">
            {tb.segment}
            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className={field}
            >
              <option value="Todos">{tb.allSegments}</option>
              {segments.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="text-sm font-medium">
            <legend>{tb.channels}</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-normal">
                <input
                  type="checkbox"
                  checked={viaEmail}
                  onChange={(e) => setViaEmail(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                <Mail className="size-4 text-accent" /> {tb.channelEmail}
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-normal">
                <input
                  type="checkbox"
                  checked={viaWhatsApp}
                  onChange={(e) => setViaWhatsApp(e.target.checked)}
                  className="size-4 accent-[var(--accent)]"
                />
                <MessageCircle className="size-4 text-accent" /> {tb.channelWhatsApp}
              </label>
            </div>
          </fieldset>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-ink px-6 py-2.5 text-sm font-semibold text-ink-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
            >
              {busy ? tb.sending : tb.submit}
            </button>
            <p className="mt-3 text-xs text-muted-foreground">
              {tb.note}
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
