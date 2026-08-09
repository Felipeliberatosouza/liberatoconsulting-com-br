import { Link } from "@tanstack/react-router";
import { Linkedin, Youtube } from "lucide-react";
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
          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/liberatoglobal"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              title="LinkedIn"
              className="inline-flex size-10 items-center justify-center rounded-full border border-ink-foreground/20 text-ink-foreground/80 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href="https://www.youtube.com/@LiberatoConsulting"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="inline-flex size-10 items-center justify-center rounded-full border border-ink-foreground/20 text-ink-foreground/80 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Youtube className="size-4" />
            </a>
          </div>
        </div>

        <nav className="flex flex-col gap-3 text-sm">
          <Link to="/services" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.services}
          </Link>
          <Link to="/about" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.about}
          </Link>
          <Link to="/content" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.content}
          </Link>
          <Link to="/contact" className="text-ink-foreground/70 hover:text-ink-foreground">
            {t.nav.cta}
          </Link>
          <div className="mt-4 border-t border-ink-foreground/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {t.footer.careers}
            </p>
            <Link
              to="/careers"
              className="mt-3 block text-ink-foreground/70 hover:text-ink-foreground"
            >
              {t.footer.careersResume}
            </Link>

            <a
              href="https://www.linkedin.com/company/liberatoglobal"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-ink-foreground/70 hover:text-ink-foreground"
            >
              {t.footer.careersLinkedin}
            </a>

          </div>
        </nav>

      </div>
      <div className="border-t border-ink-foreground/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-foreground/50">
          <span>© {new Date().getFullYear()} Liberato Consulting. {t.footer.rights}</span>
          <Link
            to="/admin"
            className="text-ink-foreground/30 transition-colors hover:text-accent"
          >
            Área administrativa
          </Link>
        </div>
      </div>
    </footer>
  );
}
