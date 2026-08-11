import { Link } from "@tanstack/react-router";
import { Linkedin, Youtube } from "lucide-react";
import { useLanguage } from "@/i18n";
import { legal } from "@/i18n/legal";
import { normalizeWhatsApp, openWhatsApp } from "@/lib/whatsapp";

export function SiteFooter() {
  const { t, logoUrl, lang, whatsapp } = useLanguage();
  const lg = (legal[lang] ?? legal.pt).footer;

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
        <div className="md:col-span-2">
          <img
            src={logoUrl === "/logo.png" ? "/logo-light.png" : logoUrl}
            alt="Liberato Consulting"
            className="h-11 w-auto"
          />
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
            {normalizeWhatsApp(whatsapp) ? (
              <a
                href={`https://wa.me/${normalizeWhatsApp(whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                onClick={(e) => {
                  e.preventDefault();
                  openWhatsApp(normalizeWhatsApp(whatsapp)!);
                }}
                className="inline-flex size-10 items-center justify-center rounded-full border border-ink-foreground/20 text-ink-foreground/80 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.35c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.81 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.69 8.2-8.23 8.2z" />
                </svg>
              </a>
            ) : null}
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

          <div className="mt-4 border-t border-ink-foreground/10 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {lg.legal}
            </p>
            <Link to="/privacy" className="mt-3 block text-ink-foreground/70 hover:text-ink-foreground">
              {lg.privacy}
            </Link>
            <Link to="/terms" className="mt-2 block text-ink-foreground/70 hover:text-ink-foreground">
              {lg.terms}
            </Link>
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
