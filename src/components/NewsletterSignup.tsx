import { useState } from "react";
import { toast } from "sonner";
import { useRouterState } from "@tanstack/react-router";

import { useLanguage } from "@/i18n";
import { trackEvent } from "@/lib/gtag";
import { subscribeNewsletter } from "@/lib/newsletter.functions";


export function NewsletterSignup({ variant = "footer" }: { variant?: "footer" | "page" }) {
  const { lang, t } = useLanguage();
  const tn = t.newsletterForm;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const dark = variant === "footer";

  if (done) {
    return (
      <p className={dark ? "text-sm text-ink-foreground/80" : "text-sm text-muted-foreground"}>
        {tn.done}
      </p>
    );
  }

  return (
    <form
      className="mt-4 flex w-full max-w-md flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const r = await subscribeNewsletter({
            data: { email, name, language: lang, sourcePath: pathname, website },
          });
          if (!r.ok) toast.error(r.error);
          else {
            setDone(true);
            setEmail("");
            setName("");
            toast.success(tn.success);
            trackEvent("form_submit", { form_name: "newsletter", location: pathname });
          }
        } catch {
          toast.error(tn.error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={tn.emailPlaceholder}
        className={
          dark
            ? "w-full rounded-md border border-ink-foreground/20 bg-transparent px-3 py-2 text-sm text-ink-foreground placeholder:text-ink-foreground/40 outline-none focus:border-accent"
            : "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        }
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? tn.sending : tn.submit}
      </button>
    </form>
  );
}
