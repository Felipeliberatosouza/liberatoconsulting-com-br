import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, GraduationCap, Briefcase, Users, Award, Loader2 } from "lucide-react";
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
  const startedAt = useRef(Date.now());
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", website: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await contactConsultant({
        data: {
          consultantId: consultant.id,
          name: form.name,
          email: form.email,
          company: form.company,
          message: form.message,
          website: form.website,
          elapsedMs: Date.now() - startedAt.current,
        },
      });
      if (res.ok) {
        toast.success(`Mensagem enviada para ${consultant.full_name}.`);
        onDone();
      } else {
        toast.error(res.error ?? "Não foi possível enviar.");
      }
    } catch {
      toast.error("Não foi possível enviar agora.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <input
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <Input
        required
        placeholder="Seu nome"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        required
        type="email"
        placeholder="Seu e-mail"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        placeholder="Empresa (opcional)"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
      />
      <Textarea
        required
        rows={4}
        placeholder="Como podemos ajudar?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      <Button type="submit" disabled={sending} className="w-full">
        {sending ? <Loader2 className="size-4 animate-spin" /> : "Enviar mensagem"}
      </Button>
    </form>
  );
}

/** Vitrine pública dos consultores da equipe. */
export function ConsultantsTeam() {
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
      <p className="mt-6 text-sm text-muted-foreground">Carregando consultores…</p>
    );
  }
  if (consultants.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold">Nossos consultores</h3>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {consultants.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-start gap-4">
              {c.photo_url ? (
                <img
                  src={c.photo_url}
                  alt={`Foto de ${c.full_name}`}
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
                Ver perfil
              </Button>
              <Button size="sm" onClick={() => setContactId(c.id)}>
                <Mail className="size-4" />
                Enviar e-mail
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
                <Block icon={GraduationCap} title="Formação acadêmica" text={selected.education} />
                <Block icon={Briefcase} title="Experiências profissionais" text={selected.experience} />
                <Block icon={Users} title="Clientes" text={selected.clients} />
                <Block icon={Award} title="Trabalhos realizados" text={selected.works} />
                {selected.specialties.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Especializações
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.specialties.join(" · ")}
                    </p>
                  </div>
                )}
                {selected.segments.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Segmentos
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selected.segments.join(" · ")}
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => {
                    setContactId(selected.id);
                    setOpenId(null);
                  }}
                >
                  <Mail className="size-4" />
                  Enviar e-mail
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
                <DialogTitle>Enviar e-mail para {contactTarget.full_name}</DialogTitle>
                <DialogDescription>
                  Sua mensagem é encaminhada diretamente ao consultor. O contato dele permanece
                  privado.
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
