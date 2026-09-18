import { ArrowRight, Download } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/i18n";
import resultImage from "@/assets/resultados-consultoria.jpg";

function ClientMarquee({ logos }: { logos: Array<{ name: string; imageUrl: string }> }) {
  // Duas cópias da lista garantem o loop sem emenda visível.
  const sets = [...logos, ...logos];

  return (
    <div
      className="client-logo-marquee mt-7 overflow-hidden"
      aria-label="Clientes da Liberato Consulting"
    >
      <div className="client-logo-track flex w-max items-center will-change-transform">
        {sets.map((logo, index) => (
          <div key={`logo-${index}`} className="flex h-20 w-44 shrink-0 items-center justify-center px-6 sm:w-52">
            <img
              src={logo.imageUrl}
              alt={logo.name || "Cliente da Liberato Consulting"}
              loading="lazy"
              className="max-h-12 max-w-32 object-contain grayscale sm:max-w-36"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InstitutionalShowcase() {
  const { institutional } = useLanguage();
  const logos = institutional.logos.filter((logo) => logo.imageUrl);
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid overflow-hidden bg-ink text-ink-foreground lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{institutional.introduction.eyebrow}</p>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">{institutional.introduction.title}</h2>
            <p className="mt-5 max-w-xl leading-relaxed text-ink-foreground/70">{institutional.introduction.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
               <Link to="/ferramentas" search={{ modo: undefined }} className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground"><Download className="size-4" /> Ferramentas de gestão grátis</Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full border border-ink-foreground/30 px-6 py-3 text-sm font-semibold">Fale com nossos especialistas <ArrowRight className="size-4" /></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 border-l border-ink-foreground/10">
            {institutional.metrics.map((metric) => (
              <div key={metric.label} className="flex min-h-36 flex-col justify-center border-b border-r border-ink-foreground/10 p-6">
                <strong className="font-display text-3xl text-accent md:text-4xl">{metric.value}</strong>
                <span className="mt-2 text-sm text-ink-foreground/65">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <h3 className="text-center text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Clientes</h3>
          {logos.length ? <ClientMarquee logos={logos} /> : <div className="mt-7 h-px bg-border" />}
        </div>
        <div className="relative mt-16 overflow-hidden bg-ink text-ink-foreground">
          <img src={institutional.banner.imageUrl || resultImage} alt="Consultoria orientada a resultados" width={1600} height={912} loading="lazy" className="absolute inset-0 size-full object-cover opacity-35" />
          <div className="relative max-w-3xl p-8 md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{institutional.banner.eyebrow}</p>
            <h2 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">{institutional.banner.title}</h2>
             <div className="mt-8 flex flex-wrap gap-3"><Link to="/contact" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground">Fale conosco</Link><Link to="/ferramentas" search={{ modo: undefined }} className="rounded-full border border-ink-foreground/30 px-6 py-3 text-sm font-semibold">Baixe Ferramentas de Gestão — Grátis!</Link></div>
          </div>
        </div>
      </div>
    </section>
  );
}
