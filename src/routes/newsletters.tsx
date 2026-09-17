import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Mail } from "lucide-react";
import { listRecentNewsletters } from "@/lib/newsletter-public.functions";

export const Route = createFileRoute("/newsletters")({
  head: () => ({ meta: [{ title: "Newsletters — Liberato Consulting" }, { name: "description", content: "Newsletters publicadas pela Liberato Consulting nos últimos três meses." }, { property: "og:title", content: "Newsletters — Liberato Consulting" }, { property: "og:description", content: "Acompanhe as newsletters recentes sobre gestão, mercados e negócios." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: NewslettersPage,
});

function NewslettersPage() {
  const query = useQuery({ queryKey: ["recent-newsletters"], queryFn: () => listRecentNewsletters() });
  return <div><section className="bg-ink py-16 text-ink-foreground"><div className="mx-auto max-w-7xl px-6"><Mail className="size-8 text-accent"/><h1 className="mt-5 text-4xl font-bold md:text-6xl">Newsletters</h1><p className="mt-4 max-w-2xl text-ink-foreground/70">Publicações dos últimos três meses.</p></div></section><section className="mx-auto max-w-7xl px-6 py-16"><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{query.data?.map((item) => <article key={item.id} className="border-t-2 border-accent py-6"><p className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-4"/>{new Date(item.reference_date || item.published_at || "").toLocaleDateString("pt-BR")}</p><h2 className="mt-3 text-xl font-bold">{item.subject}</h2><p className="mt-3 text-sm text-muted-foreground">{item.preheader}</p>{item.slug && <Link to="/newsletter/$slug" params={{ slug: item.slug }} className="mt-5 inline-block font-semibold text-accent">Ler newsletter</Link>}</article>)}</div>{!query.isLoading && !query.data?.length && <p className="text-muted-foreground">Nenhuma newsletter publicada neste período.</p>}</section></div>;
}