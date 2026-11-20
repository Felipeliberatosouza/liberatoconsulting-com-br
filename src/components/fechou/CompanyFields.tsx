import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { companyBrandCopy, mergeCompanyDefaults, type CompanyBrand } from "@/lib/fechou-brand";
import { getCrmCompanyDefaults, readCompanyWebsite } from "@/lib/fechou-brand.functions";

export function CompanyFields({ value, onChange }: { value: CompanyBrand; onChange: (next: CompanyBrand | ((prev: CompanyBrand) => CompanyBrand)) => void }) {
  const { lang } = useLanguage(); const c = companyBrandCopy[lang];
  const defaults = useServerFn(getCrmCompanyDefaults); const read = useServerFn(readCompanyWebsite);
  const edited = useRef(new Set<keyof CompanyBrand>());
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      try { const profile = await defaults(); if (active) onChange(prev => mergeCompanyDefaults(prev, profile, edited.current)); } catch { /* manual entry stays available */ }
    });
    return () => { active = false; };
  }, []);
  const change = (key: keyof CompanyBrand, text: string) => { edited.current.add(key); onChange(prev => ({ ...prev, [key]: text })); };
  async function importSite() {
    if (busy || !value.website.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try { const r = await read({ data: { url: value.website } }); if (!r.ok) { setError(c.manual); return; }
      onChange(prev => { const next = { ...prev }; for (const key of Object.keys(r.company) as (keyof CompanyBrand)[]) if (!edited.current.has(key) && r.company[key]) next[key] = r.company[key]; return next; }); setMessage(c.done);
    } catch { setError(c.manual); } finally { setBusy(false); }
  }
  return <div className="grid gap-3">
    <label className="grid gap-1 text-sm">{c.website}<Input value={value.website} placeholder="https://empresa.com.br" onChange={e => change("website", e.target.value)} onBlur={() => void importSite()} maxLength={300} /></label>
    <Button type="button" variant="outline" disabled={busy || !value.website.trim()} onClick={() => void importSite()}>{busy ? c.reading : c.read}</Button>
    <label className="grid gap-1 text-sm">{c.name}<Input value={value.name} onChange={e => change("name",e.target.value)} required maxLength={120} /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">{c.logo}<Input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => {
        const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
        if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 2000000) { setError(c.image); return; }
        const data = await new Promise<string>((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
        change("logo", data); setError("");
      }} />{value.logo && <img src={value.logo} alt={c.logo} className="h-12 max-w-48 object-contain object-left" />}</label>
      <label className="grid gap-1 text-sm">{c.color}<Input type="color" value={value.color || undefined} onChange={e => change("color",e.target.value)} /></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">{(["contact","email","phone","segment","address"] as const).map(key => <label key={key} className="grid gap-1 text-sm">{c[key]}<Input type={key === "email" ? "email" : "text"} value={value[key]} onChange={e => change(key,e.target.value)} maxLength={key === "address" ? 500 : 200} /></label>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">{(["linkedin","instagram"] as const).map(key => <label key={key} className="grid gap-1 text-sm">{key === "linkedin" ? "LinkedIn" : "Instagram"}<Input value={value[key]} onChange={e => change(key,e.target.value)} maxLength={300} /></label>)}</div>
    <label className="grid gap-1 text-sm">{c.description}<Textarea value={value.description} onChange={e => change("description",e.target.value)} maxLength={2000} /></label>
    {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}