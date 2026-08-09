import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";

export function SiteFooter() {
  const { t } = useLanguage();
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold tracking-tight">LIBERATO</span>
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
              Consulting
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm text-ink-foreground/70">{t.footer.tagline}</p>
          <a
            href="mailto:contato@liberato.com"
            className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
          >
            contato@liberato.com
          </a>
        </div>
        <nav className="flex flex-col gap-3 text-sm">
          <Link to="/services" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.services}
          </Link>
          <Link to="/about" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.about}
          </Link>
          <Link to="/contact" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.contact}
          </Link>
          <div className="mt-4 border-t border-ink-foreground/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t.footer.careers}
            </p>
            <a
              href="mailto:parceria@liberato.com?subject=Curr%C3%ADculo"
              className="mt-3 block text-ink-foreground/70 hover:text-ink-foreground"
            >
              {t.footer.careersResume}
            </a>
            <a
              href="mailto:parceria@liberato.com?subject=LinkedIn"
              className="mt-2 block text-ink-foreground/70 hover:text-ink-foreground"
            >
              {t.footer.careersLinkedin}
            </a>
          </div>
        </nav>

      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-ink-foreground/50">
          © {new Date().getFullYear()} Liberato Consulting. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
