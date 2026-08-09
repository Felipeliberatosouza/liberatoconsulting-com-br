import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
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
  const groups = t.megaMenu.groups;
  const aboutItems = t.aboutMenu.items;
  const [tab, setTab] = useState(groups[0]?.id ?? "");
  const active = groups.find((g) => g.id === tab) ?? groups[0];

  const links = [{ to: "/content", label: t.nav.content }] as const;

  const closeAll = () => {
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-center" onClick={closeAll}>
          <img src="/logo.png" alt="Liberato Consulting" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <div className="group/menu relative">
            <Link
              to="/services"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.services}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="flex flex-wrap gap-1 border-b border-border">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onMouseEnter={() => setTab(g.id)}
                      onFocus={() => setTab(g.id)}
                      className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                        g.id === active?.id
                          ? "border-accent text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g.title}
                    </button>
                  ))}
                </div>

                {active && (
                  <div className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    {active.items.map((item) => (
                      <Link
                        key={item.id}
                        to="/services/$slug"
                        params={{ slug: item.id }}
                        className="text-sm text-muted-foreground transition-colors hover:text-accent"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-8 text-right">
                  <Link
                    to="/services"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                  >
                    {t.megaMenu.more}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="group/menu relative">
            <Link
              to="/about"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.about}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute left-1/2 top-full z-50 w-screen -translate-x-1/2 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                  {aboutItems.map((item) => (
                    <Link
                      key={item.id}
                      to="/about"
                      hash={item.id}
                      className="text-sm text-muted-foreground transition-colors hover:text-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-8 text-right">
                  <Link
                    to="/about"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                  >
                    {t.aboutMenu.more}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "text-sm font-medium text-foreground hover:text-accent" }}
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
          <Link
            to="/services"
            onClick={closeAll}
            className="block py-2.5 text-base font-medium transition-colors hover:text-accent"
          >
            {t.nav.services}
          </Link>

          {groups.map((g) => (
            <div key={g.id} className="border-l border-border pl-3">
              <p className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                {g.title}
              </p>
              {g.items.map((item) => (
                <Link
                  key={item.id}
                  to="/services/$slug"
                  params={{ slug: item.id }}
                  onClick={closeAll}
                  className="block py-1.5 text-sm text-muted-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}

          <Link
            to="/about"
            onClick={closeAll}
            className="mt-2 block py-2.5 text-base font-medium transition-colors hover:text-accent"
          >
            {t.nav.about}
          </Link>

          <div className="border-l border-border pl-3">
            {aboutItems.map((item) => (
              <Link
                key={item.id}
                to="/about"
                hash={item.id}
                onClick={closeAll}
                className="block py-1.5 text-sm text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={closeAll}
              className="mt-1 block py-2.5 text-base font-medium transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
