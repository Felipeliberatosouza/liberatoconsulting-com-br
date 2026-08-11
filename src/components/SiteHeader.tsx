import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
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

function MobileAccordion({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border">
      <div className="flex items-center justify-between">
        <Link
          to={href}
          className="py-3 text-base font-medium transition-colors hover:text-accent"
        >
          {title}
        </Link>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Recolher" : "Expandir"}
          className="p-2 text-muted-foreground transition-colors hover:text-accent"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
      </div>
      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}

export function SiteHeader() {
  const { t, logoUrl } = useLanguage();
  const [open, setOpen] = useState(false);
  const groups = t.megaMenu.groups;
  const aboutItems = t.aboutMenu.items;

  const links = [{ to: "/content", label: t.nav.content }] as const;

  const closeAll = () => {
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-center" onClick={closeAll}>
          <img src={logoUrl} alt="Liberato Consulting" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <div className="group/menu">
            <Link
              to="/services"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.services}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute inset-x-0 top-full z-40 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
                  {groups.map((g, i) => (
                    <div
                      key={g.id}
                      className={`min-w-0 ${i > 0 ? "lg:border-l lg:border-border lg:pl-8" : ""}`}
                    >
                      <p className="mb-4 text-sm font-semibold text-accent">{g.title}</p>
                      <ul className="space-y-2.5">
                        {g.items.map((item) => (
                          <li key={item.id}>
                            <Link
                              to="/services/$slug"
                              params={{ slug: item.id }}
                              className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>


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

          <div className="group/menu">
            <Link
              to="/about"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.about}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute inset-x-0 top-full z-40 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <p className="mb-5 text-sm font-semibold text-accent">{t.nav.about}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
                  {Array.from({ length: Math.ceil(aboutItems.length / 2) }, (_, col) =>
                    aboutItems.slice(col * 2, col * 2 + 2),
                  ).map((chunk, col) => (
                    <ul
                      key={col}
                      className={`min-w-0 space-y-2.5 ${col > 0 ? "md:border-l md:border-border md:pl-8" : ""}`}
                    >
                      {chunk.map((item) => (
                        <li key={item.id}>
                          <Link
                            to="/about"
                            hash={item.id}
                            className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
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
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <MobileAccordion title={t.nav.services} href="/services">
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
          </MobileAccordion>

          <MobileAccordion title={t.nav.about} href="/about">
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
          </MobileAccordion>

          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={closeAll}
              className="flex items-center justify-between border-b border-border py-3 text-base font-medium transition-colors hover:text-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
