import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage, LANGS, LANG_LABELS, LANG_SHORT } from "@/i18n";

function LangSwitch() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border p-0.5">
      {LANGS.map((o) => (
        <button
          key={o}
          onClick={() => setLang(o)}
          aria-label={LANG_LABELS[o]}
          title={LANG_LABELS[o]}
          className={`rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-widest transition-colors ${
            lang === o
              ? "bg-ink text-ink-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LANG_SHORT[o]}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/services", label: t.nav.services },
    { to: "/about", label: t.nav.about },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-lg font-bold tracking-tight">LIBERATO</span>
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Consulting
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-sm font-medium text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitch />
          <Link
            to="/contact"
            className="hidden rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-ink-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t.nav.cta}
          </Link>
          <button
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-base font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
