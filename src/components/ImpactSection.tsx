import { Bot, ChartNoAxesCombined, Globe2, Settings2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n";
import brazilImage from "@/assets/impacto-brasil.jpg";
import marginImage from "@/assets/value-margem.jpg";
import salesImage from "@/assets/value-vendas.jpg";
import processImage from "@/assets/value-processos.jpg";
import autonomyImage from "@/assets/impacto-autonomia.jpg";

const icons = [ChartNoAxesCombined, TrendingUp, Settings2, Globe2, Bot];
export function ImpactSection() {
  const { institutional } = useLanguage();
  return <section className="bg-secondary py-24"><div className="mx-auto max-w-7xl px-6"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Resultados</p><h2 className="mt-5 text-3xl font-bold md:text-5xl">O Impacto que traremos para o seu negócio</h2><div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2 lg:grid-cols-5">{institutional.impact.map((item, index) => { const Icon=icons[index] ?? Bot; const fallbacks=[marginImage,salesImage,processImage,brazilImage,autonomyImage]; const image=item.imageUrl || fallbacks[index] || autonomyImage; return <article key={`${item.title}-${index}`} className="relative min-h-72 bg-background p-6">{image && <img src={image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-15" />}<div className="relative"><Icon className="size-7 text-accent"/><h3 className="mt-12 text-xl font-bold leading-tight">{item.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p></div></article>; })}</div></div></section>;
}