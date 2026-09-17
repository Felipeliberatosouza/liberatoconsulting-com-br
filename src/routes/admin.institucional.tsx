import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { getSiteConfig, saveInstitutionalSettings } from "@/lib/admin.functions";
import { DEFAULT_INSTITUTIONAL, type InstitutionalSettings } from "@/lib/site-config";

export const Route = createFileRoute("/admin/institucional")({
  head: () => ({ meta: [{ title: "Site institucional — Painel Liberato" }, { name: "description", content: "Edite a apresentação institucional, cases, impactos e perguntas frequentes." }, { name: "robots", content: "noindex, nofollow" }, { property: "og:title", content: "Site institucional — Painel Liberato" }, { property: "og:description", content: "Configurações do conteúdo institucional." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: AdminInstitutional,
});
const field = "mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
function imageData(file: File) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("read")); reader.readAsDataURL(file); }); }
/** Reduz a logomarca antes de salvar para o site continuar leve. */
async function logoData(file: File) {
  const original = await imageData(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = () => reject(new Error("image")); img.src = original; });
    const maxWidth = 360;
    const scale = Math.min(1, maxWidth / (image.width || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((image.width || maxWidth) * scale);
    canvas.height = Math.round((image.height || maxWidth) * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compact = canvas.toDataURL("image/webp", 0.9);
    return compact.startsWith("data:image/webp") && compact.length < original.length ? compact : original;
  } catch {
    return original;
  }
}
function AdminInstitutional() {
  const [data, setData] = useState<InstitutionalSettings>(DEFAULT_INSTITUTIONAL); const [busy, setBusy] = useState(false);
  useEffect(() => { getSiteConfig().then((config) => setData(config.institutional)).catch(() => undefined); }, []);
  const update = (patch: Partial<InstitutionalSettings>) => setData((value) => ({ ...value, ...patch }));
  return <AdminShell title="Site institucional" description="Edite os textos, números, logomarcas, impactos, missão, valores, propósito e FAQ exibidos no site."><div className="max-w-4xl space-y-8">
    <Section title="Banner de resultados"><label>Frase curta<input className={field} value={data.banner.eyebrow} onChange={(event) => update({ banner: { ...data.banner, eyebrow: event.target.value } })} /></label><label>Frase principal<textarea className={field} rows={3} value={data.banner.title} onChange={(event) => update({ banner: { ...data.banner, title: event.target.value } })} /></label><label>Imagem<input className={field} type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) update({ banner: { ...data.banner, imageUrl: await imageData(file) } }); }} /></label></Section>
    <Section title="Apresentação"><label>Chapéu<input className={field} value={data.introduction.eyebrow} onChange={(event) => update({ introduction: { ...data.introduction, eyebrow: event.target.value } })} /></label><label>Título<textarea className={field} rows={2} value={data.introduction.title} onChange={(event) => update({ introduction: { ...data.introduction, title: event.target.value } })} /></label><label>Texto<textarea className={field} rows={4} value={data.introduction.body} onChange={(event) => update({ introduction: { ...data.introduction, body: event.target.value } })} /></label></Section>
    <Section title="Números da consultoria">{data.metrics.map((item, index) => <div key={`${item.label}-${index}`} className="grid gap-3 md:grid-cols-[180px_1fr_auto]"><input className={field} value={item.value} onChange={(event) => update({ metrics: data.metrics.map((metric, n) => n === index ? { ...metric, value: event.target.value } : metric) })} /><input className={field} value={item.label} onChange={(event) => update({ metrics: data.metrics.map((metric, n) => n === index ? { ...metric, label: event.target.value } : metric) })} /><Button type="button" variant="ghost" size="icon" onClick={() => update({ metrics: data.metrics.filter((_, n) => n !== index) })}><Trash2 /></Button></div>)}<Button type="button" variant="outline" onClick={() => update({ metrics: [...data.metrics, { value: "", label: "" }] })}><Plus />Adicionar número</Button></Section>
    <Section title="Cases de Sucesso — logomarcas">{data.logos.map((logo, index) => <div key={`${logo.name}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"><input className={field} placeholder="Nome do cliente" value={logo.name} onChange={(event) => update({ logos: data.logos.map((item, n) => n === index ? { ...item, name: event.target.value } : item) })} /><input className={field} type="file" accept="image/*" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { const imageUrl = await imageData(file); update({ logos: data.logos.map((item, n) => n === index ? { ...item, imageUrl } : item) }); } }} /><Button type="button" variant="ghost" size="icon" onClick={() => update({ logos: data.logos.filter((_, n) => n !== index) })}><Trash2 /></Button></div>)}<Button type="button" variant="outline" onClick={() => update({ logos: [...data.logos, { name: "", imageUrl: "" }] })}><Plus />Adicionar logomarca</Button></Section>
    <Section title="Impactos para o negócio">{data.impact.map((item, index) => <div key={`${item.title}-${index}`} className="border-t border-border pt-4"><input className={field} value={item.title} onChange={(event) => update({ impact: data.impact.map((impact, n) => n === index ? { ...impact, title: event.target.value } : impact) })} /><textarea className={field} rows={2} value={item.body} onChange={(event) => update({ impact: data.impact.map((impact, n) => n === index ? { ...impact, body: event.target.value } : impact) })} /></div>)}</Section>
    <Section title="Missão, Valores e Propósito">{(["mission", "values", "purpose"] as const).map((key) => <label key={key} className="block capitalize">{key}<textarea className={field} rows={3} value={data[key]} onChange={(event) => update({ [key]: event.target.value })} /></label>)}</Section>
    <Section title="Perguntas frequentes">{data.faq.map((item, index) => <div key={`${item.question}-${index}`} className="grid gap-2 border-t border-border pt-4"><div className="flex gap-2"><input className={field} placeholder="Pergunta" value={item.question} onChange={(event) => update({ faq: data.faq.map((faq, n) => n === index ? { ...faq, question: event.target.value } : faq) })} /><Button type="button" variant="ghost" size="icon" onClick={() => update({ faq: data.faq.filter((_, n) => n !== index) })}><Trash2 /></Button></div><textarea className={field} rows={3} placeholder="Resposta" value={item.answer} onChange={(event) => update({ faq: data.faq.map((faq, n) => n === index ? { ...faq, answer: event.target.value } : faq) })} /></div>)}<Button type="button" variant="outline" onClick={() => update({ faq: [...data.faq, { question: "", answer: "" }] })}><Plus />Adicionar pergunta</Button></Section>
    <Button disabled={busy} onClick={async () => { setBusy(true); try { const result = await saveInstitutionalSettings({ data }); result.ok ? toast.success("Conteúdo atualizado.") : toast.error(result.error); } finally { setBusy(false); } }}>{busy ? "Salvando…" : "Salvar conteúdo institucional"}</Button>
  </div></AdminShell>;
}
function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="space-y-4 rounded-lg border border-border bg-background p-6"><h2 className="text-xl font-bold">{title}</h2>{children}</section>; }