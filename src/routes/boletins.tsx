import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Newspaper } from "lucide-react";
import { listRecentBulletins } from "@/lib/newsletter-public.functions";
import { BulletinSignup } from "@/components/BulletinSignup";
import { useLanguage } from "@/i18n";
import { LANG_HTML } from "@/i18n/config";
import { pageText } from "@/lib/page-translations";

export const Route = createFileRoute("/boletins")({
  head: () => ({ meta: [{ title: "Boletins Semanais — Liberato Consulting" }, { name: "description", content: "Boletins semanais publicados pela Liberato Consulting nos últimos três meses." }, { property: "og:title", content: "Boletins Semanais — Liberato Consulting" }, { property: "og:description", content: "Indicadores e análises recentes para apoiar decisões empresariais." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: BulletinsPage,
});

function BulletinsPage() {
  const { lang } = useLanguage();
  const p = pageText(lang).bulletins;
  const query = useQuery({ queryKey: ["recent-bulletins"], queryFn: () => listRecentBulletins() });
  return (
    <div>
      <section className="bg-ink py-16 text-ink-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <Newspaper className="size-8 text-accent" />
          <h1 className="mt-5 text-4xl font-bold md:text-6xl">{p.title}</h1>
          <p className="mt-4 max-w-2xl text-ink-foreground/70">{p.subtitle}</p>
          <a
            href="#boletim-semanal"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {p.cta}
          </a>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {query.data?.map((item) => (
            <article key={item.id} className="border-t-2 border-accent py-6">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="size-4" />
                {item.date_label || new Date(item.created_at).toLocaleDateString(LANG_HTML[lang])}
              </p>
              <h2 className="mt-3 text-xl font-bold">{item.subject}</h2>
            </article>
          ))}
        </div>
        {!query.isLoading && !query.data?.length && (
          <p className="text-muted-foreground">{p.empty}</p>
        )}
        <div className="mt-12">
          <BulletinSignup />
        </div>
      </section>
    </div>
  );
}
