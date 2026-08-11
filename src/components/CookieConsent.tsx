import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";
import { legal } from "@/i18n/legal";

const STORAGE_KEY = "liberato-cookie-consent";

export function CookieConsent() {
  const { lang } = useLanguage();
  const c = (legal[lang] ?? legal.pt).cookies;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function decide(value: "accepted" | "rejected") {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* storage unavailable */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-foreground/10 bg-ink px-6 py-5 text-ink-foreground shadow-2xl"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-sm leading-relaxed text-ink-foreground/80">
          {c.text}{" "}
          <Link to="/privacy" className="font-medium text-accent hover:underline">
            {c.more}
          </Link>
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className="rounded-md border border-ink-foreground/25 px-4 py-2 text-sm font-medium text-ink-foreground/80 transition-colors hover:border-ink-foreground/50 hover:text-ink-foreground"
          >
            {c.reject}
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {c.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
