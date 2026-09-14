import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Mail, GraduationCap, Briefcase, Users, Award, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  contactConsultant,
  listPublicConsultants,
  type ConsultantLogo,
  type PublicConsultant,
} from "@/lib/consultants.functions";
import { useLanguage } from "@/i18n";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { formatPhone, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";

export function Initials({ name, className = "" }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center bg-ink text-3xl font-bold text-ink-foreground ${className}`}
    >
      {initials}
    </div>
  );
}

export function Block({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Award;
  title: string;
  text: string;
}) {
  if (!text.trim()) return null;
  return (
    <div>
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        <Icon className="size-4" />
        {title}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

export function LogoRow({ title, logos }: { title: string; logos: ConsultantLogo[] }) {
  if (logos.length === 0) return null;
  return (
    <section>
      <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {logos.map((logo, i) => (
          <div
            key={`${logo.url}-${i}`}
            className="flex h-14 items-center justify-center border border-border bg-secondary/40 px-3"
          >
            <img
              src={logo.url}
              alt={logo.name}
              loading="lazy"
              className="max-h-8 w-full object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ContactForm({ consultant, onDone }: { consultant: PublicConsultant; onDone: () => void }) {
  const { t } = useLanguage();
  const tt = t.team;
  const startedAt = useRef(Date.now());
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "", website: "" });
  const { validate, errorClass } = useFieldErrors();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate({ name: form.name, email: form.email, phone: form.phone, message: form.message })) return;
    if (!isValidPhone(form.phone)) {
      toast.error(PHONE_ERROR);
      return;
    }
    setSending(true);
    try {
      const res = await contactConsultant({
        data: {
          consultantId: consultant.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: form.message,
          website: form.website,
          elapsedMs: Date.now() - startedAt.current,
        },
      });
      if (res.ok) {
        toast.success(`${tt.sent} ${consultant.full_name}.`);
        onDone();
      } else {
        toast.error(res.error ?? tt.error);
      }
    } catch {
      toast.error(tt.error);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-3">
      <input
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <Input
        required
        placeholder={tt.namePlaceholder}
        className={errorClass("name", form.name)}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        required
        type="email"
        placeholder={tt.emailPlaceholder}
        className={errorClass("email", form.email)}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={25}
        placeholder={PHONE_PLACEHOLDER}
        className={`${errorClass("phone", form.phone)}${form.phone && !isValidPhone(form.phone) ? " border-destructive ring-1 ring-destructive" : ""}`}
        value={form.phone}
        onFocus={() => !form.phone && setForm({ ...form, phone: "+55" })}
        onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
        aria-invalid={Boolean(form.phone) && !isValidPhone(form.phone)}
      />
      {form.phone && !isValidPhone(form.phone) && <p className="text-xs text-destructive">{PHONE_ERROR}</p>}
      <Input
        placeholder={tt.companyPlaceholder}
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
      />
      <Textarea
        required
        rows={4}
        placeholder={tt.messagePlaceholder}
        className={errorClass("message", form.message)}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? <Loader2 className="size-4 animate-spin" /> : tt.submit}
      </Button>
    </form>
  );
}

/** Vitrine pública dos consultores da equipe. */
export function ConsultantsTeam() {
  const { t, lang } = useLanguage();
  const tt = t.team;
  const [openId, setOpenId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-consultants", lang],
    queryFn: () => listPublicConsultants({ data: { lang } }),
    staleTime: 0,
  });

  const consultants = useMemo(() => data ?? [], [data]);
  const selected = consultants.find((c) => c.id === openId) ?? null;
  const contactTarget = consultants.find((c) => c.id === contactId) ?? null;

  if (isLoading) {
    return <p className="mt-6 text-sm text-muted-foreground">{tt.loading}</p>;
  }
  if (consultants.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold">{tt.heading}</h3>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {consultants.map((c) => (
          <article
            key={c.id}
            className="group overflow-hidden border border-border bg-card shadow-sm transition-shadow duration-300 hover:shadow-xl"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-ink">
              {c.photo_url ? (
                <img
                  src={c.photo_url}
                  alt={`${tt.photoAlt} ${c.full_name}`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <Initials name={c.full_name} className="size-full" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent opacity-80" />
              <div className="absolute inset-x-6 bottom-6">
                <h4 className="text-2xl font-bold leading-none tracking-tight text-ink-foreground">
                  {c.full_name}
                </h4>
                {c.headline && (
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-accent">
                    {c.headline}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 p-6">
              {c.years_experience > 0 && (
                <div className="border-b border-border pb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt.yearsLabel}
                  </p>
                  <p className="text-lg font-bold">
                    {c.years_experience}+ {tt.yearsValue}
                  </p>
                </div>
              )}

              {c.certifications.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt.certificationsLabel}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {c.certifications.map((cert) => (
                      <li key={cert} className="flex gap-2 text-sm leading-snug">
                        <span className="text-accent">—</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <LogoRow title={tt.institutionsTitle} logos={c.academic_logos} />
              <LogoRow title={tt.clientLogosTitle} logos={c.client_logos} />

              {c.specialties.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt.specialties}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.specialties.map((s) => (
                      <span
                        key={s}
                        className="border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {c.segments.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt.segments}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{c.segments.join(" · ")}</p>
                </div>
              )}

              {c.publications.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tt.publicationsTitle}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {c.publications.slice(0, 3).map((p) => (
                      <li key={p.slug}>
                        <Link
                          to="/content/$slug"
                          params={{ slug: p.slug }}
                          className="line-clamp-2 text-sm leading-snug text-accent underline-offset-4 hover:underline"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}


              <div className="flex gap-2">
                {c.slug ? (
                  <Button asChild className="flex-1 rounded-none">
                    <Link to="/$slug" params={{ slug: c.slug }} target="_blank">
                      {tt.viewProfile}
                    </Link>
                  </Button>
                ) : (
                  <Button className="flex-1 rounded-none" onClick={() => setOpenId(c.id)}>
                    {tt.viewProfile}

                </Button>
                <Button
                  variant="outline"
                  className="rounded-none"
                  aria-label={tt.sendEmail}
                  onClick={() => setContactId(c.id)}
                >
                  <Mail className="size-4" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-4xl">
          {selected && (
            <div className="flex max-h-[90vh] flex-col md:flex-row">
              <div className="relative shrink-0 bg-ink md:w-2/5">
                {selected.photo_url ? (
                  <img
                    src={selected.photo_url}
                    alt={`${tt.photoAlt} ${selected.full_name}`}
                    className="h-64 w-full object-cover opacity-90 md:h-full"
                  />
                ) : (
                  <Initials name={selected.full_name} className="h-64 w-full md:h-full" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/40 to-ink" />
                <div className="absolute inset-x-8 bottom-8">
                  <DialogTitle className="text-3xl font-bold leading-tight text-ink-foreground">
                    {selected.full_name}
                  </DialogTitle>
                  <div className="mt-4 h-1 w-12 bg-accent" />
                  {selected.headline && (
                    <DialogDescription className="mt-4 text-sm text-ink-foreground/70">
                      {selected.headline}
                    </DialogDescription>
                  )}
                </div>
              </div>

              <div className="space-y-10 overflow-y-auto p-8 md:w-3/5 md:p-12">
                {selected.highlights.length > 0 && (
                  <section>
                    <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.highlightsTitle}
                    </p>
                    <ul className="space-y-4">
                      {selected.highlights.map((h, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="font-bold text-accent">
                            {String(i + 1).padStart(2, "0")}.
                          </span>
                          <p className="text-sm leading-relaxed">{h}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {selected.years_experience > 0 && (
                  <section>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.yearsLabel}
                    </p>
                    <p className="text-2xl font-bold">
                      {selected.years_experience}+ {tt.yearsValue}
                    </p>
                  </section>
                )}

                {selected.certifications.length > 0 && (
                  <section>
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.coursesTitle}
                    </p>
                    <ul className="space-y-2">
                      {selected.certifications.map((c) => (
                        <li key={c} className="flex gap-3 text-sm leading-relaxed">
                          <span className="text-accent">—</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <LogoRow title={tt.institutionsTitle} logos={selected.academic_logos} />
                <LogoRow title={tt.clientLogosTitle} logos={selected.client_logos} />


                {selected.publications.length > 0 && (
                  <section>
                    <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.publicationsAll}
                    </p>
                    <ul className="divide-y divide-border border-y border-border">
                      {selected.publications.map((p) => (
                        <li key={p.slug}>
                          <Link
                            to="/content/$slug"
                            params={{ slug: p.slug }}
                            onClick={() => setOpenId(null)}
                            className="group flex items-center justify-between gap-4 py-3"
                          >
                            <span className="text-sm leading-snug group-hover:text-accent">
                              {p.title}
                            </span>
                            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {p.date}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Block icon={GraduationCap} title={tt.education} text={selected.education} />
                <Block icon={Briefcase} title={tt.experience} text={selected.experience} />
                <Block icon={Users} title={tt.clients} text={selected.clients} />
                <Block icon={Award} title={tt.works} text={selected.works} />

                {selected.specialties.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.specialties}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.specialties.join(" · ")}
                    </p>
                  </div>
                )}
                {selected.segments.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.segments}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.segments.join(" · ")}
                    </p>
                  </div>
                )}
                {(selected.orcid_url || selected.lattes_url || selected.website_url) && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.links}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {selected.orcid_url && (
                        <a
                          href={selected.orcid_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4"
                        >
                          <ExternalLink className="size-4" />
                          {tt.orcid}
                        </a>
                      )}
                      {selected.lattes_url && (
                        <a
                          href={selected.lattes_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4"
                        >
                          <ExternalLink className="size-4" />
                          {tt.lattes}
                        </a>
                      )}
                      {selected.website_url && (
                        <a
                          href={selected.website_url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1.5 text-accent underline underline-offset-4"
                        >
                          <ExternalLink className="size-4" />
                          {tt.website}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full rounded-none"
                  onClick={() => {
                    setContactId(selected.id);
                    setOpenId(null);
                  }}
                >
                  <Mail className="size-4" />
                  {tt.sendEmail}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(contactTarget)} onOpenChange={(o) => !o && setContactId(null)}>
        <DialogContent className="sm:max-w-md">
          {contactTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{tt.contactTitle} {contactTarget.full_name}</DialogTitle>
                <DialogDescription>{tt.contactDescription}</DialogDescription>
              </DialogHeader>
              <ContactForm consultant={contactTarget} onDone={() => setContactId(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
