import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import type { OnboardingData, OnboardingLogo } from "@/lib/onboarding-fields";
import { useServiceOptions } from "@/lib/use-service-options";
import { formatCep, formatCpf, formatPhone, isValidCpf, isValidEmail, isValidPhone } from "@/lib/validation";

/** Reduz a imagem enviada e devolve data URL (fotos e logomarcas). */
async function toSmallDataUrl(file: File, max = 600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const r = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * r);
    c.height = Math.round(img.height * r);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Props = { value: OnboardingData; onChange: (v: OnboardingData) => void };

export function ConsultantOnboardingForm({ value: v, onChange }: Props) {
  const services = useServiceOptions().filter((o) => o.kind === "family").map((o) => o.label);
  const [cepBusy, setCepBusy] = useState(false);
  const lookupCep = async (zip: string) => {
    const d = zip.replace(/\D+/g, "");
    if (d.length !== 8) return;
    setCepBusy(true);
    try {
      const r = (await (await fetch(`https://viacep.com.br/ws/${d}/json/`)).json()) as Record<string, string> & { erro?: boolean };
      if (!r.erro)
        onChange({
          ...v,
          address_zip: formatCep(zip),
          address_street: r["logradouro"] || v.address_street,
          address_district: r["bairro"] || v.address_district,
          address_city: r["localidade"] || v.address_city,
          address_state: r["uf"] || v.address_state,
        });
    } catch {
      /* sem CEP automático */
    } finally {
      setCepBusy(false);
    }
  };
  const masked = (k: "cpf" | "phone" | "address_zip" | "email", label: string, fmt: (s: string) => string, ok: (s: string) => boolean, required = false, onBlur?: () => void) => {
    const val = String(v[k] ?? "");
    const bad = val.length > 0 && !ok(val);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`f-${k}`}>{label}{required ? " *" : ""}</Label>
        <Input id={`f-${k}`} value={val} onBlur={onBlur} onChange={(e) => set(k, fmt(e.target.value) as never)} className={bad ? "border-destructive" : val ? "border-emerald-500" : ""} />
        {bad ? <p className="text-xs text-destructive">Verifique este campo.</p> : null}
      </div>
    );
  };
  const set = <K extends keyof OnboardingData>(k: K, val: OnboardingData[K]) => onChange({ ...v, [k]: val });
  const text = (k: keyof OnboardingData, label: string, opts: { area?: boolean; required?: boolean; type?: string; rows?: number } = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`}>
        {label}
        {opts.required ? " *" : ""}
      </Label>
      {opts.area ? (
        <Textarea id={`f-${k}`} rows={opts.rows ?? 4} value={String(v[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <Input id={`f-${k}`} type={opts.type ?? "text"} value={String(v[k] ?? "")} onChange={(e) => set(k, e.target.value as never)} />
      )}
    </div>
  );
  const listField = (k: "specialties" | "segments" | "certifications" | "highlights", label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`}>{label} <span className="text-xs text-muted-foreground">(um por linha)</span></Label>
      <Textarea
        id={`f-${k}`}
        rows={4}
        value={v[k].join("\n")}
        onChange={(e) => set(k, e.target.value.split("\n").map((s) => s.trimStart()).filter((s, i, a) => s || i === a.length - 1))}
      />
    </div>
  );
  const logoField = (k: "academic_logos" | "client_logos", label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-3">
        {v[k].map((l: OnboardingLogo, i: number) => (
          <div key={i} className="flex w-36 flex-col gap-1 rounded-md border border-border p-2">
            <img src={l.url} alt={l.name} className="h-14 w-full object-contain" />
            <Input
              value={l.name}
              placeholder="Nome"
              onChange={(e) => set(k, v[k].map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <button type="button" className="text-xs text-destructive" onClick={() => set(k, v[k].filter((_, j) => j !== i))}>
              Remover
            </button>
          </div>
        ))}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        className="text-sm"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          const added = await Promise.all(files.map(async (f) => ({ name: f.name.replace(/\.[^.]+$/, ""), url: await toSmallDataUrl(f, 400) })));
          set(k, [...v[k], ...added]);
          e.target.value = "";
        }}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold">Perfil profissional</h2>
        <p className="text-sm text-muted-foreground">Estas informações formam o seu perfil público no site, após aprovação.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {text("full_name", "Nome completo", { required: true })}
          {text("headline", "Título profissional (ex.: Consultor sênior em estratégia)")}
          <div className="space-y-1.5">
            <Label htmlFor="f-years">Anos de experiência</Label>
            <Input id="f-years" type="number" min={0} max={80} value={v.years_experience || ""} onChange={(e) => set("years_experience", Math.max(0, Math.min(80, Number(e.target.value) || 0)))} />
          </div>
          <div className="space-y-1.5">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              {v.photo_url ? <img src={v.photo_url} alt="Foto" className="size-16 rounded-full object-cover" /> : null}
              <input type="file" accept="image/*" className="text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set("photo_url", await toSmallDataUrl(f, 600)); }} />
            </div>
          </div>
        </div>
        {text("education", "Formação acadêmica", { area: true })}
        {text("experience", "Experiência profissional", { area: true, rows: 6 })}
        {text("clients", "Principais clientes", { area: true })}
        {text("works", "Trabalhos e projetos relevantes", { area: true, rows: 5 })}
        <div className="space-y-2">
          <Label>Áreas que atende (serviços da Liberato Consulting)</Label>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => {
              const on = v.specialties.includes(s);
              return (
                <button key={s} type="button" onClick={() => set("specialties", on ? v.specialties.filter((x) => x !== s) : [...v.specialties, s])}
                  className={`rounded-full border px-3 py-1.5 text-xs ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-background text-muted-foreground hover:border-accent"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {listField("segments", "Segmentos de mercado")}
          {listField("certifications", "Certificações")}
          {listField("highlights", "Destaques")}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {text("orcid_url", "ORCID (link)")}
          {text("lattes_url", "Currículo Lattes (link)")}
          {text("website_url", "Site / LinkedIn")}
        </div>
        {logoField("academic_logos", "Logomarcas das instituições de ensino")}
        {logoField("client_logos", "Logomarcas de clientes")}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold">Dados pessoais e contratuais</h2>
        <p className="text-sm text-muted-foreground">Usados somente no contrato e no seu acesso ao painel. Não aparecem no site.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {masked("email", "E-mail", (x) => x.trim(), isValidEmail, true)}
          {masked("phone", "Celular", formatPhone, isValidPhone, true)}
          {text("birth_date", "Data de nascimento", { type: "date" })}
          {masked("cpf", "CPF", formatCpf, isValidCpf, true)}
          {text("rg", "RG")}
          {text("nationality", "Nacionalidade")}
          {text("marital_status", "Estado civil")}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {masked("address_zip", cepBusy ? "CEP (buscando…)" : "CEP (preenche o endereço)", formatCep, (x) => x.replace(/\D/g, "").length === 8, false, () => void lookupCep(v.address_zip))}
          {text("address_street", "Rua")}
          {text("address_number", "Número")}
          {text("address_complement", "Complemento")}
          {text("address_district", "Bairro")}
          {text("address_city", "Cidade")}
          {text("address_state", "Estado")}
          {text("address_country", "País")}
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {text("bank_name", "Banco")}
          {text("bank_branch", "Agência")}
          {text("bank_account", "Conta")}
          {text("pix_key", "Chave Pix")}
        </div>
      </section>
    </div>
  );
}

export function onboardingMissing(v: OnboardingData) {
  const miss: string[] = [];
  if (v.full_name.trim().length < 2) miss.push("nome");
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) miss.push("e-mail");
  if (v.phone.replace(/\D/g, "").length < 8) miss.push("celular");
  if (v.cpf.replace(/\D/g, "").length < 11) miss.push("CPF");
  return miss;
}
