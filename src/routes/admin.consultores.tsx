import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  deleteConsultant,
  listConsultants,
  saveConsultant,
  type ConsultantRecord,
} from "@/lib/consultants.functions";
import { DEFAULT_SEGMENTS } from "@/lib/audience-filters";
import { pt } from "@/i18n/pt";

export const Route = createFileRoute("/admin/consultores")({
  head: () => ({
    meta: [
      { title: "Consultores — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminConsultantsPage,
});

const SERVICES: string[] = pt.megaMenu.groups.flatMap((g) =>
  g.items.map((i) => `${g.title} · ${i.label}`),
);

const EMPTY: ConsultantRecord = {
  id: "",
  full_name: "",
  photo_url: "",
  headline: "",
  education: "",
  experience: "",
  clients: "",
  works: "",
  specialties: [],
  segments: [],
  contact_email: "",
  position: 0,
  published: true,
};

function AdminConsultantsPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ConsultantRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const list = useQuery({
    queryKey: ["admin-consultants"],
    queryFn: () => listConsultants(),
  });

  function toggle(field: "specialties" | "segments", value: string) {
    if (!draft) return;
    const current = draft[field];
    setDraft({
      ...draft,
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  }

  async function onPhoto(file: File | undefined) {
    if (!file || !draft) return;
    if (file.size > 2_500_000) {
      toast.error("Imagem acima de 2,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft({ ...draft, photo_url: String(reader.result) });
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const { id, ...rest } = draft;
      const res = await saveConsultant({ data: id ? { id, ...rest } : rest });
      if (res.ok) {
        toast.success("Consultor salvo.");
        setDraft(null);
        qc.invalidateQueries({ queryKey: ["admin-consultants"] });
        qc.invalidateQueries({ queryKey: ["public-consultants"] });
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este consultor?")) return;
    const res = await deleteConsultant({ data: { id } });
    if (res.ok) {
      toast.success("Consultor excluído.");
      qc.invalidateQueries({ queryKey: ["admin-consultants"] });
      qc.invalidateQueries({ queryKey: ["public-consultants"] });
    } else {
      toast.error(res.error);
    }
  }

  return (
    <AdminShell
      title="Consultores"
      description="Cadastro dos consultores exibidos na seção Equipe do site."
      requireAdmin
    >
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="size-4" />
          Novo consultor
        </Button>
      </div>

      {list.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="grid gap-4">
        {(list.data ?? []).map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"
          >
            {c.photo_url ? (
              <img src={c.photo_url} alt="" className="size-12 rounded-full object-cover" />
            ) : (
              <div className="size-12 rounded-full bg-secondary" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{c.full_name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {c.headline || c.specialties.join(", ")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.published ? "Publicado" : "Oculto"} · ordem {c.position}
                {c.contact_email ? ` · ${c.contact_email}` : " · sem e-mail"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDraft(c)}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {list.data?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum consultor cadastrado ainda.</p>
        )}
      </div>

      {draft && (
        <div className="mt-8 space-y-5 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold">
            {draft.id ? "Editar consultor" : "Novo consultor"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={draft.full_name}
                onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>E-mail de contato (não aparece no site)</Label>
              <Input
                type="email"
                value={draft.contact_email}
                onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Resumo / cargo</Label>
            <Input
              value={draft.headline}
              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Foto</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => onPhoto(e.target.files?.[0])}
              />
              <Input
                className="mt-2"
                placeholder="ou cole a URL da imagem"
                value={draft.photo_url.startsWith("data:") ? "" : draft.photo_url}
                onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })}
              />
            </div>
            {draft.photo_url && (
              <img
                src={draft.photo_url}
                alt=""
                className="size-24 rounded-full object-cover"
              />
            )}
          </div>

          <div>
            <Label>Formação acadêmica</Label>
            <Textarea
              rows={3}
              value={draft.education}
              onChange={(e) => setDraft({ ...draft, education: e.target.value })}
            />
          </div>
          <div>
            <Label>Experiências profissionais</Label>
            <Textarea
              rows={4}
              value={draft.experience}
              onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
            />
          </div>
          <div>
            <Label>Clientes</Label>
            <Textarea
              rows={3}
              value={draft.clients}
              onChange={(e) => setDraft({ ...draft, clients: e.target.value })}
            />
          </div>
          <div>
            <Label>Trabalhos realizados</Label>
            <Textarea
              rows={4}
              value={draft.works}
              onChange={(e) => setDraft({ ...draft, works: e.target.value })}
            />
          </div>

          <div>
            <Label>Especializações (serviços da consultoria)</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.specialties.includes(s)}
                    onChange={() => toggle("specialties", s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>Segmentos de especialidade</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {DEFAULT_SEGMENTS.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.segments.includes(s)}
                    onChange={() => toggle("segments", s)}
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                className="w-28"
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) || 0 })}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={draft.published}
                onCheckedChange={(v) => setDraft({ ...draft, published: v })}
              />
              Publicado no site
            </label>
          </div>

          <div className="flex gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
