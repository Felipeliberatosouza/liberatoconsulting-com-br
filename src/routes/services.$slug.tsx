import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Clock, Gauge, Layers, ShieldAlert, Sparkles, Target, Users } from "lucide-react";
import { pt } from "@/i18n/pt";
import { useLanguage } from "@/i18n";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";
import { breadcrumb, jsonLd, serviceSchema } from "@/lib/schema";
import { ServiceLeadForm } from "@/components/ServiceLeadForm";
import { LEGACY_SERVICE_REDIRECTS } from "@/lib/service-redirects";
import { listPublicServiceSlugs } from "@/lib/services.functions";

const PRODUCT_SLUGS = pt.serviceDetail.pages.map((p) => p.id);
const FAMILY_SLUGS = pt.serviceFamilies.items.map((f) => f.id);

export const Route = createFileRoute("/services/$slug")({
  loader: async ({ params }) => {
    const target = LEGACY_SERVICE_REDIRECTS[params.slug];
    if (target) throw redirect({ to: "/services/$slug", params: { slug: target } });
    if (PRODUCT_SLUGS.includes(params.slug) || FAMILY_SLUGS.includes(params.slug)) return null;
    // Serviços cadastrados no painel ainda não estão no dicionário estático.
    const slugs = await listPublicServiceSlugs().catch(() => [] as string[]);
    if (!slugs.includes(params.slug)) throw notFound();
    return null;
  },
  head: ({ params, ...ctx }) => {
    const product = pt.serviceDetail.pages.find((p) => p.id === params.slug);
    const family = pt.serviceFamilies.items.find((f) => f.id === params.slug);
    const name = product?.title ?? family?.title;
    const description = product?.lead ?? family?.problem;
    if (!name || !description) {
      return {
        meta: [
          { title: "Serviço não encontrado — Liberato Consulting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${name} — Consultoria Liberato Consulting`;
    return {
      meta: [
        { title },
        { name: "description", content: description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { property: "og:image", content: OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description.slice(0, 155) },
        { name: "twitter:image", content: OG_IMAGE },
        ...seoLocaleMeta(headLang(ctx)),
      ],
      links: seoLinks(`/services/${params.slug}`, headLang(ctx)),
      scripts: [
        jsonLd(
          breadcrumb([
            { name: "Início", path: "/" },
            { name: "Serviços", path: "/services" },
            { name, path: `/services/${params.slug}` },
          ]),
        ),
        jsonLd(
          serviceSchema({
            name,
            description,
            path: `/services/${params.slug}`,
            category: product?.family ?? family?.title ?? "Consultoria",
          }),
        ),
      ],
    };
  },
  component: ServiceDetailPage,
});

function Card({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border p-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <Icon className="size-4" />
        {label}
      </p>
      <div className="mt-3 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function ServiceDetailPage() {
  const { slug } = Route.useParams();
  const { t } = useLanguage();
  const family = t.serviceFamilies.items.find((f) => f.id === slug);
  if (family) return <FamilyPage slug={slug} />;
  return <ProductPage slug={slug} />;
}

function FamilyPage({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const L = t.serviceDetail.labels;
  const family = t.serviceFamilies.items.find((f) => f.id === slug)!;
  const products = t.serviceDetail.pages.filter((p) => family.products.includes(p.id));

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {L.breadcrumb}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{family.title}</h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{family.problem}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Card icon={Users} label={L.audience}>
            {family.audience}
          </Card>

          <h2 className="mt-12 text-2xl font-bold">{L.familyProducts}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{L.familyIntro}</p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {products.map((p) => (
              <Link
                key={p.id}
                to="/services/$slug"
                params={{ slug: p.id }}
                className="flex flex-col rounded-2xl border border-border p-6 transition-colors hover:border-accent"
              >
                <h3 className="font-display text-lg font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.lead}</p>
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  <Clock className="size-3.5" />
                  {p.duration}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm text-muted-foreground">{L.ctaBody}</p>
            <Link
              to="/contact"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {L.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductPage({ slug }: { slug: string }) {
  const { t } = useLanguage();
  const L = t.serviceDetail.labels;
  const page = t.serviceDetail.pages.find((p) => p.id === slug) ?? t.serviceDetail.pages[0]!;
  const family = t.serviceFamilies.items.find((f) => f.title === page.family || f.products.includes(page.id));
  const related = t.serviceDetail.pages.filter((p) => p.family === page.family && p.id !== page.id);

  return (
    <div>
      <section className="bg-ink py-20 text-ink-foreground">
        <div className="mx-auto max-w-4xl px-6">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            <ArrowLeft className="size-3.5" />
            {L.breadcrumb}
            {` · ${page.family}`}
          </Link>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl">{page.title}</h1>
          <p className="mt-5 text-lg text-ink-foreground/75">{page.lead}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-2xl border-l-4 border-accent bg-secondary p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{L.problem}</p>
            <p className="mt-3 text-base leading-relaxed">{page.problem}</p>
          </div>

          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{page.body}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Card icon={Users} label={L.audience}>
              {page.audience}
            </Card>
            <Card icon={Clock} label={L.duration}>
              {page.duration}
            </Card>
            <Card icon={Layers} label={L.level}>
              {page.level}
            </Card>
          </div>

          <h2 className="mt-14 text-2xl font-bold">{L.scope}</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.bullets.map((b) => (
              <li key={b} className="flex gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {b}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 flex items-center gap-2 text-2xl font-bold">
            <Gauge className="size-5 text-accent" />
            {L.results}
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {page.results.map((r) => (
              <li
                key={r}
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground"
              >
                {r}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 flex items-center gap-2 text-2xl font-bold">
            <Target className="size-5 text-accent" />
            {L.modules}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.modules.map((m) => (
              <li key={m} className="flex gap-3 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                {m}
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl bg-ink p-8 text-ink-foreground">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Sparkles className="size-4" />
              {L.ai}
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-foreground/80">{page.ai}</p>
          </div>

          <div className="mt-8 flex gap-3 rounded-2xl border border-border p-6 text-sm text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-accent" />
            <span>
              <strong className="font-semibold text-foreground">{L.limits}: </strong>
              {page.limits}
            </span>
          </div>

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-secondary p-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-sm text-muted-foreground">{L.ctaBody}</p>
            <Link
              to="/contact"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              {L.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ServiceLeadForm serviceSlug={page.id} serviceTitle={page.title} />

          {related.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {L.related}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    to="/services/$slug"
                    params={{ slug: r.id }}
                    className="text-sm text-muted-foreground transition-colors hover:text-accent"
                  >
                    {r.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-6">
            {family && (
              <Link
                to="/services/$slug"
                params={{ slug: family.id }}
                className="text-sm font-semibold text-accent"
              >
                ← {family.title}
              </Link>
            )}
            <Link to="/services" className="text-sm font-semibold text-accent">
              {L.back}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
