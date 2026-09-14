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
  orcid_url: "",
  lattes_url: "",
  website_url: "",
  contact_email: "",
  years_experience: 0,
  certifications: [],
  highlights: [],
  academic_logos: [],
  client_logos: [],
  position: 0,
  published: true,
};

/** Converte uma imagem em JPEG/PNG leve para uso como logomarca. */
async function fileToLogo(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode"));
    el.src = dataUrl;
  });
  const max = 320;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

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

  /** Redimensiona a foto para no máximo 512px e converte em JPEG leve. */
  async function onPhoto(file: File | undefined) {
    if (!file || !draft) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 10_000_000) {
      toast.error("Imagem acima de 10 MB.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode"));
        el.src = dataUrl;
      });
      const max = 512;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL("image/jpeg", 0.82);
      setDraft((prev) => (prev ? { ...prev, photo_url: compressed } : prev));
      toast.success("Foto carregada. Clique em Salvar para confirmar.");
    } catch {
      toast.error("Não foi possível processar a imagem.");
    }
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>ORCID</Label>
              <Input
                placeholder="https://orcid.org/0000-0000-0000-0000"
                value={draft.orcid_url}
                onChange={(e) => setDraft({ ...draft, orcid_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Currículo Lattes</Label>
              <Input
                placeholder="http://lattes.cnpq.br/0000000000000000"
                value={draft.lattes_url}
                onChange={(e) => setDraft({ ...draft, lattes_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Site próprio</Label>
              <Input
                placeholder="https://exemplo.com.br"
                value={draft.website_url}
                onChange={(e) => setDraft({ ...draft, website_url: e.target.value })}
              />
            </div>
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
