import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
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
  to,
  onNavigate,
  children,
}: {
  title: string;
  to: "/services" | "/about" | "/content" | "/brasil";
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border">
      <div className="flex w-full items-center justify-between">
        <Link
          to={to}
          onClick={onNavigate}
          className="flex-1 py-3 text-left text-base font-medium transition-colors hover:text-accent"
        >
          {title}
        </Link>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={title}
          className="p-3 text-muted-foreground transition-colors hover:text-accent"
        >
          {expanded ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>
      </div>
      {expanded && <div className="pb-3">{children}</div>}
    </div>
  );
}


type AboutItem = { id: string; label: string };

/** Sobre/O que fazemos/... abrem página própria; os dois últimos vão para telas existentes. */
function AboutMenuLink({
  item,
  className,
  onClick,
}: {
  item: AboutItem;
  className?: string;
  onClick?: () => void;
}) {
  if (item.id === "trabalhe-conosco") {
    return (
      <Link to="/careers" className={className} onClick={onClick}>
        {item.label}
      </Link>
    );
  }
  if (item.id === "fale-conosco") {
    return (
      <Link to="/contact" className={className} onClick={onClick}>
        {item.label}
      </Link>
    );
  }
  return (
    <Link to="/about/$slug" params={{ slug: item.id }} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export function SiteHeader() {
  const { t, logoUrl } = useLanguage();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [servicesDismissed, setServicesDismissed] = useState(false);
  const servicesDismissedRef = useRef(false);
  const groups = t.megaMenu.groups;
  const aboutItems = t.aboutMenu.items;
  const contentGroups = t.contentMenu.groups;
  const brazilItems = t.brazilMenu.items;


  const closeAll = () => {
    setOpen(false);
    setServicesOpen(false);
    setServicesDismissed(true);
    servicesDismissedRef.current = true;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-center" onClick={closeAll}>
          <img
            src={logoUrl}
            alt="Liberato Consulting"
            width={280}
            height={79}
            fetchPriority="high"
            decoding="async"
            className="h-10 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <div
            onMouseEnter={() => {
              if (!servicesDismissedRef.current) setServicesOpen(true);
            }}
            onMouseLeave={() => {
              setServicesOpen(false);
              setServicesDismissed(false);
              servicesDismissedRef.current = false;
            }}
          >
            <Link
              to="/services"
              onFocus={() => {
                if (!servicesDismissedRef.current) setServicesOpen(true);
              }}
              onClick={closeAll}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.services}
              <ChevronDown className={`size-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
            </Link>

            <div
              className={`absolute inset-x-0 top-full z-40 max-h-[calc(100vh-5rem)] overflow-y-auto border-b border-border bg-background shadow-lg transition-all duration-200 ${
                servicesOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="mx-auto max-w-7xl px-6 py-7">
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
                  {groups.map((g, i) => (
                    <div
                      key={g.id}
                      className={`min-w-0 ${i > 0 ? "md:border-l md:border-border md:pl-8" : ""}`}
                    >
                      <p className="mb-4 text-sm font-semibold leading-snug text-accent">{g.title}</p>
                      <ul className="space-y-4">
                        {g.items.map((item) => {
                          const family = t.serviceFamilies.items.find((entry) => entry.id === item.id);
                          const products = t.serviceDetail.pages.filter(
                            (product) => product.family === family?.title && product.groups.includes(g.id),
                          );
                          return (
                            <li key={item.id}>
                              <Link
                                to="/services/$slug"
                                params={{ slug: item.id }}
                                onClick={closeAll}
                                className="block text-sm font-semibold leading-snug text-foreground transition-colors hover:text-accent"
                              >
                                {item.label}
                              </Link>
                              <ul className="mt-2 space-y-1.5 border-l border-border pl-3">
                                {products.map((product) => (
                                  <li key={product.id}>
                                    <Link
                                      to="/services/$slug"
                                      params={{ slug: product.id }}
                                      onClick={closeAll}
                                      className="block text-xs leading-snug text-muted-foreground transition-colors hover:text-accent"
                                    >
                                      {product.title}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>


                <div className="mt-8 text-right">
                  <Link
                    to="/services"
                    onClick={closeAll}
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
                          <AboutMenuLink
                            item={item}
                            className="block text-sm text-muted-foreground transition-colors hover:text-accent"
                          />
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

          <div className="group/menu">
            <Link
              to="/content"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.nav.content}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute inset-x-0 top-full z-40 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <p className="mb-5 text-sm font-semibold text-accent">{t.nav.content}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
                  {contentGroups.map((g, i) => (
                    <div
                      key={g.id}
                      className={`min-w-0 ${i > 0 ? "md:border-l md:border-border md:pl-8" : ""}`}
                    >
                      <Link
                        to="/content"
                        search={{ category: g.id }}
                        className="block text-sm font-normal text-muted-foreground transition-colors hover:text-accent"
                      >
                        {g.title}
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-right">
                  <Link
                    to="/content"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                  >
                    {t.contentMenu.more}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="group/menu">
            <Link
              to="/brasil"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
              activeProps={{ className: "flex items-center gap-1 text-sm font-medium text-foreground hover:text-accent" }}
            >
              {t.brazilMenu.label}
              <ChevronDown className="size-3.5 transition-transform group-hover/menu:rotate-180" />
            </Link>

            <div className="invisible absolute inset-x-0 top-full z-40 border-b border-border bg-background opacity-0 shadow-lg transition-all duration-200 group-hover/menu:visible group-hover/menu:opacity-100">
              <div className="mx-auto max-w-7xl px-6 py-8">
                <p className="mb-5 text-sm font-semibold text-accent">{t.brazilMenu.label}</p>
                <Link
                  to="/brasil"
                  hash="indicadores"
                  className="mb-5 block text-sm font-semibold text-foreground transition-colors hover:text-accent"
                >
                  {t.brazilMenu.indicatorsItem}
                </Link>
                <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">

                  {Array.from({ length: 4 }, (_, col) =>
                    brazilItems.slice(col * 2, col * 2 + 2),
                  ).map((chunk, col) => (
                    <ul
                      key={col}
                      className={`min-w-0 space-y-2.5 ${col > 0 ? "md:border-l md:border-border md:pl-8" : ""}`}
                    >
                      {chunk.map((item) => (
                        <li key={item.id}>
                          <Link
                            to="/brasil/$slug"
                            params={{ slug: item.id }}
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
                    to="/brasil"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-accent"
                  >
                    {t.brazilMenu.more}
                  </Link>
                </div>
              </div>
            </div>
          </div>
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
          <MobileAccordion title={t.nav.services} to="/services" onNavigate={closeAll}>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {groups.map((g) => (
                <div key={g.id} className="min-w-0">
                  <p className="pt-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {g.title}
                  </p>
                  {g.items.map((item) => {
                    const family = t.serviceFamilies.items.find((entry) => entry.id === item.id);
                    const products = t.serviceDetail.pages.filter(
                      (product) => product.family === family?.title && product.groups.includes(g.id),
                    );
                    return (
                      <div key={item.id} className="py-1.5">
                        <Link
                          to="/services/$slug"
                          params={{ slug: item.id }}
                          onClick={closeAll}
                          className="block text-sm font-semibold leading-snug text-foreground"
                        >
                          {item.label}
                        </Link>
                        <div className="mt-1.5 border-l border-border pl-2.5">
                          {products.map((product) => (
                            <Link
                              key={product.id}
                              to="/services/$slug"
                              params={{ slug: product.id }}
                              onClick={closeAll}
                              className="block py-1 text-xs leading-snug text-muted-foreground"
                            >
                              {product.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </MobileAccordion>

          <MobileAccordion title={t.nav.about} to="/about" onNavigate={closeAll}>
            <div className="border-l border-border pl-3">
              {aboutItems.map((item) => (
                <AboutMenuLink
                  key={item.id}
                  item={item}
                  onClick={closeAll}
                  className="block py-1.5 text-sm text-muted-foreground"
                />
              ))}
            </div>
          </MobileAccordion>

          <MobileAccordion title={t.nav.content} to="/content" onNavigate={closeAll}>
            <div className="grid grid-cols-2 gap-x-4">
              {contentGroups.map((g) => (
                <Link
                  key={g.id}
                  to="/content"
                  search={{ category: g.id }}
                  onClick={closeAll}
                  className="block py-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          </MobileAccordion>

          <MobileAccordion title={t.brazilMenu.label} to="/brasil" onNavigate={closeAll}>
            <Link
              to="/brasil"
              hash="indicadores"
              onClick={closeAll}
              className="block py-1.5 text-sm font-semibold text-foreground"
            >
              {t.brazilMenu.indicatorsItem}
            </Link>
            <div className="grid grid-cols-2 gap-x-4">
              {brazilItems.map((item) => (
                <Link
                  key={item.id}
                  to="/brasil/$slug"
                  params={{ slug: item.id }}
                  onClick={closeAll}
                  className="block py-1.5 text-sm text-muted-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </MobileAccordion>

        </nav>
      )}
    </header>
  );
}
