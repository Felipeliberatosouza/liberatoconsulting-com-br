import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { contactConsultant, listPublicConsultants, type PublicConsultant } from "@/lib/consultants.functions";
import { useLanguage } from "@/i18n";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { formatPhone, isValidPhone, PHONE_ERROR, PHONE_PLACEHOLDER } from "@/lib/validation";

function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-ink-foreground">
      {initials}
    </div>
  );
}

function Block({
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
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <Icon className="size-4" />
        {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function ContactForm({ consultant, onDone }: { consultant: PublicConsultant; onDone: () => void }) {
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
  const { t } = useLanguage();
  const tt = t.team;
  const [openId, setOpenId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["public-consultants"],
    queryFn: () => listPublicConsultants(),
    staleTime: 60_000,
  });

  const consultants = useMemo(() => data ?? [], [data]);
  const selected = consultants.find((c) => c.id === openId) ?? null;
  const contactTarget = consultants.find((c) => c.id === contactId) ?? null;

  if (isLoading) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">{tt.loading}</p>
    );
  }
  if (consultants.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold">{tt.heading}</h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {consultants.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              {c.photo_url ? (
                <img
                  src={c.photo_url}
                  alt={`${tt.photoAlt} ${c.full_name}`}
                  loading="lazy"
                  className="size-20 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Initials name={c.full_name} />
              )}
              <div className="min-w-0">
                <h4 className="font-semibold">{c.full_name}</h4>
                {c.headline && (
                  <p className="mt-1 text-sm text-muted-foreground">{c.headline}</p>
                )}
                {c.specialties.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.specialties.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenId(c.id)}>
                {tt.viewProfile}
              </Button>
              <Button size="sm" onClick={() => setContactId(c.id)}>
                <Mail className="size-4" />
                {tt.sendEmail}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.full_name}</DialogTitle>
                {selected.headline && (
                  <DialogDescription>{selected.headline}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-5">
                <Block icon={GraduationCap} title={tt.education} text={selected.education} />
                <Block icon={Briefcase} title={tt.experience} text={selected.experience} />
                <Block icon={Users} title={tt.clients} text={selected.clients} />
                <Block icon={Award} title={tt.works} text={selected.works} />
                {selected.specialties.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.specialties}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.specialties.join(" · ")}
                    </p>
                  </div>
                )}
                {selected.segments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      {tt.segments}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.segments.join(" · ")}
                    </p>
                  </div>
                )}
                {(selected.orcid_url || selected.lattes_url || selected.website_url) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
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
                  onClick={() => {
                    setContactId(selected.id);
                    setOpenId(null);
                  }}
                >
                  <Mail className="size-4" />
                  {tt.sendEmail}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(contactTarget)} onOpenChange={(o) => !o && setContactId(null)}>
        <DialogContent className="sm:max-w-md">
          {contactTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{tt.contactTitle} {contactTarget.full_name}</DialogTitle>
                <DialogDescription>
                  {tt.contactDescription}
                </DialogDescription>
              </DialogHeader>
              <ContactForm consultant={contactTarget} onDone={() => setContactId(null)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
