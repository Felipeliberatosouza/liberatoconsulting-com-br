import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Briefcase, ExternalLink, GraduationCap, Mail, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Block, ContactForm, Initials, LogoRow } from "@/components/ConsultantsTeam";
import { listPublicConsultants, type PublicConsultant } from "@/lib/consultants.functions";
import { useLanguage } from "@/i18n";
import { OG_IMAGE, headLang, seoLinks, seoLocaleMeta } from "@/lib/seo";

export const Route = createFileRoute("/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug.toLowerCase();
    const list = await listPublicConsultants({ data: { lang: "pt" } });
    const consultant = list.find((c) => c.slug && c.slug.toLowerCase() === slug);
    if (!consultant) throw notFound();
    return { consultant };
  },
  head: ({ loaderData, params, ...ctx }) => {
    const c = loaderData?.consultant;
    if (!c) {
      return {
        meta: [
          { title: "Página não encontrada — Liberato Consulting" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${c.full_name} | Liberato Consulting`;
    const description =
      c.headline || `Perfil de ${c.full_name}, consultor da Liberato Consulting.`;
    const image = c.photo_url.startsWith("http") ? c.photo_url : OG_IMAGE;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "profile" },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        ...seoLocaleMeta(headLang(ctx)),
      ],
      links: seoLinks(`/${params.slug}`, headLang(ctx)),
    };
  },
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-2xl font-bold">Página indisponível</h1>
    </main>
  ),
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <Link to="/" className="mt-4 inline-block text-accent underline underline-offset-4">
        Voltar ao início
      </Link>
    </main>
  ),
  component: ConsultantPage,
});

function ConsultantPage() {
  const { consultant: initial } = Route.useLoaderData();
  const { t, lang } = useLanguage();
  const tt = t.team;
  const [contactOpen, setContactOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["public-consultants", lang],
    queryFn: () => listPublicConsultants({ data: { lang } }),
    staleTime: 0,
  });

  const c: PublicConsultant =
    data?.find((x) => x.id === initial.id) ?? (initial as PublicConsultant);

  return (
    <main className="pb-24">
      <section className="relative bg-ink">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[320px_1fr] md:py-24">
          <div className="overflow-hidden">
            {c.photo_url ? (
              <img
                src={c.photo_url}
                alt={`${tt.photoAlt} ${c.full_name}`}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <Initials name={c.full_name} className="aspect-[4/5] w-full" />
            )}
          </div>
          <div className="self-end">
            <Link
              to="/about/$slug"
              params={{ slug: "equipe" }}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-foreground/60 hover:text-accent"
            >
              <ArrowLeft className="size-4" />
              {tt.heading}
            </Link>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-ink-foreground md:text-5xl">
              {c.full_name}
            </h1>
            <div className="mt-5 h-1 w-12 bg-accent" />
            {c.headline && (
              <p className="mt-5 max-w-2xl text-base text-ink-foreground/75">{c.headline}</p>
            )}
            {c.years_experience > 0 && (
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                {c.years_experience}+ {tt.yearsValue} {tt.yearsLabel.toLowerCase()}
              </p>
            )}
            <Button className="mt-8 rounded-none" onClick={() => setContactOpen(true)}>
              <Mail className="size-4" />
              {tt.sendEmail}
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-12 px-6 py-16">
        {c.highlights.length > 0 && (
          <section>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.highlightsTitle}
            </p>
            <ul className="space-y-4">
              {c.highlights.map((h, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-bold text-accent">{String(i + 1).padStart(2, "0")}.</span>
                  <p className="text-sm leading-relaxed">{h}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {c.certifications.length > 0 && (
          <section>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.coursesTitle}
            </p>
            <ul className="space-y-2">
              {c.certifications.map((cert) => (
                <li key={cert} className="flex gap-3 text-sm leading-relaxed">
                  <span className="text-accent">—</span>
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <LogoRow title={tt.institutionsTitle} logos={c.academic_logos} />
        <LogoRow title={tt.clientLogosTitle} logos={c.client_logos} />

        <Block icon={GraduationCap} title={tt.education} text={c.education} />
        <Block icon={Briefcase} title={tt.experience} text={c.experience} />
        <Block icon={Users} title={tt.clients} text={c.clients} />
        <Block icon={Award} title={tt.works} text={c.works} />

        {c.specialties.length > 0 && (
          <section>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.specialties}
            </p>
            <div className="flex flex-wrap gap-2">
              {c.specialties.map((s) => (
                <span
                  key={s}
                  className="border border-border px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {c.segments.length > 0 && (
          <section>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.segments}
            </p>
            <p className="text-sm text-muted-foreground">{c.segments.join(" · ")}</p>
          </section>
        )}

        {c.publications.length > 0 && (
          <section>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.publicationsAll}
            </p>
            <ul className="divide-y divide-border border-y border-border">
              {c.publications.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/content/$slug"
                    params={{ slug: p.slug }}
                    className="group flex items-center justify-between gap-4 py-3"
                  >
                    <span className="text-sm leading-snug group-hover:text-accent">{p.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.date}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(c.orcid_url || c.lattes_url || c.website_url) && (
          <section>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              {tt.links}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { url: c.orcid_url, label: tt.orcid },
                { url: c.lattes_url, label: tt.lattes },
                { url: c.website_url, label: tt.website },
              ]
                .filter((l) => l.url)
                .map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4"
                  >
                    <ExternalLink className="size-4" />
                    {l.label}
                  </a>
                ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tt.contactTitle} {c.full_name}
            </DialogTitle>
            <DialogDescription>{tt.contactDescription}</DialogDescription>
          </DialogHeader>
          <ContactForm consultant={c} onDone={() => setContactOpen(false)} />
        </DialogContent>
      </Dialog>
    </main>
  );
}
