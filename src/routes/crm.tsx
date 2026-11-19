import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import hero from "@/assets/hero-estrategia.webp";
import { useLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import { FechouLogo } from "@/components/fechou/Board";
import { fechouCopy } from "@/lib/fechou-copy";
import { headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";

export const Route = createFileRoute("/crm")({
  head: (ctx) => {
    const requested = headLang(ctx);
    const lang = requested === "en" || requested === "es" || requested === "zh" ? requested : "pt";
    const c = fechouCopy[lang];
    const title = `Fechou! CRM — ${c.title}`;
    return {
      links: seoLinks("/crm", lang),
      meta: [
        { title },
        { name: "description", content: c.body },
        { property: "og:title", content: title },
        { property: "og:description", content: c.body },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seoLocaleMeta(lang),
      ],
    };
  },
  component: CrmOffer,
});
function CrmOffer() {
  const { lang } = useLanguage();
  const c = fechouCopy[lang];
  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
        <img
          src={hero}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover opacity-25"
          fetchPriority="high"
        />
        <div className="mx-auto max-w-7xl px-6 py-14 md:py-20">
          <FechouLogo />
          <h1 className="mt-5 text-4xl font-extrabold sm:text-6xl">Fechou! CRM</h1>
          <p className="mt-3 max-w-xl text-2xl font-bold">{c.title}</p>
          <p className="mt-3 max-w-lg text-lg text-ink-foreground/85">{c.body}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-fechou-mint text-ink hover:bg-fechou-mint/80">
              <Link to="/demo/crm">
                {c.demo}
                <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-ink-foreground/50 bg-transparent text-ink-foreground"
            >
              <Link to="/escopoinicial" search={{ tipo: "crm" }}>
                {c.scope}
              </Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 border-b border-border py-4 font-semibold"
            >
              <Check className="size-5 shrink-0 text-accent" />
              {feature}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
