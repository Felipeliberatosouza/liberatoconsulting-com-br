import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteServiceProduct,
  draftServiceProduct,
  listServiceProducts,
  saveServiceProduct,
} from "@/lib/services.functions";
import { EMPTY_PRODUCT, type ServiceProduct } from "@/lib/services-catalog";
import { pt } from "@/i18n/pt";

export const Route = createFileRoute("/admin/servicos")({
  head: () => ({
    meta: [
      { title: "Cadastro de serviços — Painel Liberato Consulting" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminServicesPage,
});

const FAMILIES = pt.serviceFamilies.items.map((f) => ({
  id: f.id,
  title: f.title,
  code: f.code,
  groups: f.groups,
}));
const GROUPS = pt.megaMenu.groups.map((g) => ({ id: g.id, title: g.title }));

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea
        rows={4}
        value={value.join("\n")}
        onChange={(e) =>
          onChange(
            e.target.value
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean),
          )
        }
      />
      <p className="text-xs text-muted-foreground">Um item por linha.</p>
    </div>
  );
}

function AdminServicesPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ServiceProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiTitle, setAiTitle] = useState("");

  async function fillWithAi(force = false) {
    if (!draft) return;
    const title = draft.title.trim();
    if (title.length < 2) return;
    if (!force && title === aiTitle) return;
    setAiBusy(true);
    try {
      const res = await draftServiceProduct({
        data: {
          title,
          family_title: draft.family_title,
          group_title: GROUPS.find((g) => g.id === draft.group_id)?.title ?? "",
        },
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const d = res.draft;
      setAiTitle(title);
      setDraft((cur) =>
        cur
          ? {
              ...cur,
              lead: force || !cur.lead ? d.lead || cur.lead : cur.lead,
              problem: force || !cur.problem ? d.problem || cur.problem : cur.problem,
              body: force || !cur.body ? d.body || cur.body : cur.body,
              audience: force || !cur.audience ? d.audience || cur.audience : cur.audience,
              duration: force || !cur.duration ? d.duration || cur.duration : cur.duration,
              duration_corporate:
                force || !cur.duration_corporate
                  ? d.duration_corporate || cur.duration_corporate
                  : cur.duration_corporate,
              level: force || !cur.level ? d.level || cur.level : cur.level,
              bullets: force || cur.bullets.length === 0 ? d.bullets : cur.bullets,
              results: force || cur.results.length === 0 ? d.results : cur.results,
              modules: force || cur.modules.length === 0 ? d.modules : cur.modules,
              limits: force || !cur.limits ? d.limits || cur.limits : cur.limits,
              ai: force || !cur.ai ? d.ai || cur.ai : cur.ai,
              price_sme:
                force || !cur.price_sme ? d.price_sme || cur.price_sme || "" : cur.price_sme || "",
              price_corporate:
                force || !cur.price_corporate
                  ? d.price_corporate || cur.price_corporate || ""
                  : cur.price_corporate || "",
            }
          : cur,
      );
      toast.success("Campos e preços sugeridos pela IA. Revise e ajuste o que quiser.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao consultar a IA.");
    } finally {
      setAiBusy(false);
    }
  }

  const list = useQuery({
    queryKey: ["admin-service-products"],
    queryFn: () => listServiceProducts(),
  });

  const grouped = useMemo(() => {
    const rows = (list.data ?? []).filter((r) =>
      `${r.title} ${r.family_title} ${r.group_id}`.toLowerCase().includes(filter.toLowerCase()),
    );
    return FAMILIES.map((f) => ({
      family: f,
      rows: rows.filter((r) => r.family_id === f.id),
    })).filter((g) => g.rows.length > 0);
  }, [list.data, filter]);

  function set<K extends keyof ServiceProduct>(key: K, value: ServiceProduct[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    const slug = draft.slug || slugify(draft.title);
    setSaving(true);
    try {
      const res = await saveServiceProduct({
        data: {
          ...(draft.id ? { id: draft.id } : {}),
          slug,
          group_id: draft.group_id,
          groups: draft.groups.length > 0 ? draft.groups : draft.group_id ? [draft.group_id] : [],
          family_id: draft.family_id,
          family_title: draft.family_title,
          code: draft.code,
          title: draft.title,
          lead: draft.lead,
          problem: draft.problem,
          body: draft.body,
          audience: draft.audience,
          duration: draft.duration,
          duration_corporate: draft.duration_corporate,
          level: draft.level,
          price_sme: draft.price_sme ?? "",
          price_corporate: draft.price_corporate ?? "",
          bullets: draft.bullets,
          results: draft.results,
          modules: draft.modules,
          limits: draft.limits,
          ai: draft.ai,
          position: Number(draft.position) || 0,
          published: draft.published,
        },
      });
      if (res.ok) {
        toast.success("Serviço salvo e traduzido para EN, ES e ZH.");
        setDraft(null);
        qc.invalidateQueries({ queryKey: ["admin-service-products"] });
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string | undefined) {
    if (!id) return;
    if (!confirm("Excluir este serviço do site?")) return;
    const res = await deleteServiceProduct({ data: { id } });
    if (res.ok) {
      toast.success("Serviço excluído.");
      qc.invalidateQueries({ queryKey: ["admin-service-products"] });
    } else {
      toast.error(res.error);
    }
  }

  function openNew() {
    setSlugTouched(false);
    setAiTitle("");
    setDraft({
      ...EMPTY_PRODUCT,
      position: (list.data?.length ?? 0) + 1,
      family_id: FAMILIES[0]?.id ?? "",
      family_title: FAMILIES[0]?.title ?? "",
      code: FAMILIES[0]?.code ?? "",
      group_id: GROUPS[0]?.id ?? "",
      groups: GROUPS[0] ? [GROUPS[0].id] : [],
    });
  }

  return (
    <AdminShell
      title="Cadastro de serviços"
      description="Fonte única dos produtos exibidos em Serviços. Os textos salvos aqui alimentam automaticamente as páginas do site e a seção Áreas e textos. Preços são internos e nunca aparecem no site."
      requireAdmin
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar serviço, família ou frente…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex-1" />
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Novo serviço
        </Button>
      </div>

      {list.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      <div className="space-y-8">
        <div>
          <h2 className="mb-1 text-lg font-semibold">Serviços já cadastrados</h2>
          <p className="text-sm text-muted-foreground">
            {list.data?.length ?? 0} serviço(s) publicado(s) ou oculto(s) no site.
          </p>
        </div>

        {grouped.map(({ family, rows }) => (
          <section key={family.id}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {family.code} · {family.title}
            </h3>
            <div className="grid gap-3">
              {rows.map((r) => (
                <div
                  key={r.slug}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{r.lead}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.published ? "Publicado" : "Oculto"} · ordem {r.position} · {r.duration}
                      {r.price_sme ? ` · PME ${r.price_sme}` : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setDraft(r)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(r.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
            <DialogTitle>{draft?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo. Os preços são internos e não aparecem no site.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <div className="space-y-5 px-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Frente (grupo de produtos)</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.group_id}
                    onChange={(e) => {
                      set("group_id", e.target.value);
                      set("groups", [e.target.value]);
                    }}
                  >
                    {GROUPS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Família do produto</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.family_id}
                    onChange={(e) => {
                      const f = FAMILIES.find((x) => x.id === e.target.value);
                      set("family_id", e.target.value);
                      if (f) {
                        set("family_title", f.title);
                        set("code", f.code);
                      }
                    }}
                  >
                    {FAMILIES.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.code} · {f.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Nome do serviço</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDraft((d) =>
                        d
                          ? { ...d, title: value, ...(slugTouched ? {} : { slug: slugify(value) }) }
                          : d,
                      );
                    }}
                    onBlur={() => void fillWithAi(false)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ao sair do campo, a IA sugere os demais textos e os preços.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>Link (endereço da página)</Label>
                  <Input
                    value={draft.slug}
                    placeholder={slugify(draft.title)}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", slugify(e.target.value));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preenchido a partir do nome; pode ser editado.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-3">
                <p className="flex-1 text-sm text-muted-foreground">
                  A IA pesquisa serviços equivalentes no mercado e preenche todos os campos e as
                  faixas de preço por porte de empresa. Tudo continua editável.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiBusy || draft.title.trim().length < 2}
                  onClick={() => void fillWithAi(true)}
                >
                  {aiBusy ? "Consultando IA…" : "Preencher com IA"}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Frase abaixo do título (promessa de valor)</Label>
                <Textarea rows={2} value={draft.lead} onChange={(e) => set("lead", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Problema que resolvemos</Label>
                <Textarea
                  rows={2}
                  value={draft.problem}
                  onChange={(e) => set("problem", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição do que fazemos</Label>
                <Textarea rows={4} value={draft.body} onChange={(e) => set("body", e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Para quem é</Label>
                  <Input value={draft.audience} onChange={(e) => set("audience", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tempo estimado (exibido no site)</Label>
                  <Input value={draft.duration} onChange={(e) => set("duration", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duração corporativa (interno)</Label>
                  <Input
                    value={draft.duration_corporate}
                    onChange={(e) => set("duration_corporate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Formato de contratação recomendado</Label>
                  <Input value={draft.level} onChange={(e) => set("level", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço PME / startup (interno)</Label>
                  <Input
                    value={draft.price_sme ?? ""}
                    onChange={(e) => set("price_sme", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Preço corporativo (interno)</Label>
                  <Input
                    value={draft.price_corporate ?? ""}
                    onChange={(e) => set("price_corporate", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Os preços ficam somente no painel: nenhuma página pública exibe esses valores.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <ListField
                  label="O que fazemos (entregas)"
                  value={draft.bullets}
                  onChange={(v) => set("bullets", v)}
                />
                <ListField
                  label="Indicadores de sucesso"
                  value={draft.results}
                  onChange={(v) => set("results", v)}
                />
                <ListField
                  label="Capacidades envolvidas"
                  value={draft.modules}
                  onChange={(v) => set("modules", v)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Onde a inteligência artificial entra</Label>
                <Textarea rows={2} value={draft.ai} onChange={(e) => set("ai", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Premissas e limites de escopo</Label>
                <Textarea
                  rows={2}
                  value={draft.limits}
                  onChange={(e) => set("limits", e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="space-y-1.5">
                  <Label>Ordem</Label>
                  <Input
                    type="number"
                    className="w-24"
                    value={draft.position}
                    onChange={(e) => set("position", Number(e.target.value))}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={draft.published}
                    onCheckedChange={(v) => set("published", Boolean(v))}
                  />
                  Publicado no site
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setDraft(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando e traduzindo…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
