import { parseHTML } from "linkedom";
import { emptyCompanyBrand, type CompanyBrand } from "./fechou-brand";

export function publicWebsiteUrl(raw: string): URL {
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || !host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":") || /(^|\.)(localhost|local|internal|lan|home|corp|test|invalid|onion)$/.test(host)) throw new Error("Invalid public site");
  return url;
}
function publicIp(ip: string): boolean {
  if (ip.includes(":")) return /^2[0-9a-f]{3}:/i.test(ip) && !/^2001:(db8|0):/i.test(ip);
  const parts = ip.split(".").map(Number); const a = parts[0] ?? 0; const b = parts[1] ?? 0;
  return parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255) && a > 0 && a < 224 && ![10,127].includes(a) && !(a === 169 && b === 254) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && [0,168].includes(b)) && !(a === 100 && b >= 64 && b <= 127) && !(a === 198 && [18,19,51].includes(b)) && !(a === 203 && b === 0);
}
async function checkedFetch(raw: string, max: number, image = false): Promise<{ url: string; type: string; bytes: Uint8Array }> {
  let url = publicWebsiteUrl(raw);
  const signal = AbortSignal.timeout(12000);
  for (let hop = 0; hop < 4; hop++) {
    const answers = await Promise.all(["A", "AAAA"].map(async type => {
      const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(url.hostname)}&type=${type}`, { headers: { accept: "application/dns-json" }, signal });
      if (!response.ok) throw new Error("DNS failed");
      const dns = await response.json() as { Answer?: { type: number; data: string }[] };
      return (dns.Answer ?? []).filter(a => a.type === 1 || a.type === 28).map(a => a.data);
    }));
    const ips = answers.flat(); if (!ips.length || !ips.every(publicIp)) throw new Error("Private address");
    const res = await fetch(url, { redirect: "manual", signal, headers: { Accept: image ? "image/png,image/jpeg,image/webp" : "text/html", "User-Agent": "LiberatoConsulting/1.0" } });
    if (res.status >= 300 && res.status < 400) { const location = res.headers.get("location"); if (!location) throw new Error("Redirect failed"); url = publicWebsiteUrl(new URL(location, url).href); continue; }
    const type = (res.headers.get("content-type") ?? "").split(";")[0] ?? "";
    if (!res.ok || (image ? !["image/png","image/jpeg","image/webp"].includes(type) : !type.includes("text/html")) || Number(res.headers.get("content-length")) > max) throw new Error("Invalid response");
    const reader = res.body?.getReader(); if (!reader) throw new Error("Empty response");
    const chunks: Uint8Array[] = []; let size = 0;
    try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) throw new Error("Response too large"); chunks.push(value); } } finally { await reader.cancel(); }
    const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
    return { url: url.href, bytes, type };
  }
  throw new Error("Too many redirects");
}

export function extractWebsiteBrand(html: string, website: string): CompanyBrand {
  const { document } = parseHTML(html);
  const meta = (selector: string) => document.querySelector(selector)?.getAttribute("content")?.trim() ?? "";
  const brand = { ...emptyCompanyBrand, website, name: meta('meta[property="og:site_name"]') || (document.querySelector("title")?.textContent ?? "").split(/[|–—]/)[0]?.trim() || "", description: meta('meta[name="description"]') || meta('meta[property="og:description"]'), color: meta('meta[name="theme-color"]') };
  if (!/^#[0-9a-f]{6}$/i.test(brand.color)) brand.color = "";
  const organizations: Record<string, unknown>[] = [];
  const visit = (v: unknown) => { if (Array.isArray(v)) { v.forEach(visit); return; } if (!v || typeof v !== "object") return; const o = v as Record<string, unknown>; if (o['@graph']) visit(o['@graph']); const type = JSON.stringify(o['@type'] ?? ""); if (/Organization|LocalBusiness|Corporation|Store|ProfessionalService/.test(type)) organizations.push(o); };
  for (const el of document.querySelectorAll('script[type="application/ld+json"]')) { try { visit(JSON.parse(el.textContent ?? "")); } catch { /* invalid structured data is not evidence */ } }
  const org = organizations[0];
  const text = (v: unknown) => typeof v === "string" ? v : "";
  if (org) {
    brand.name = text(org['name']) || brand.name; brand.description = text(org['description']) || brand.description;
    brand.phone = text(org['telephone']); brand.email = text(org['email']).replace(/^mailto:/, "");
    const address = org['address']; if (typeof address === "string") brand.address = address; else if (address && typeof address === "object") brand.address = Object.values(address).filter(v => typeof v === "string" && v !== "PostalAddress").join(", ");
    const logo = org['logo']; brand.logo = text(logo) || (logo && typeof logo === "object" ? text((logo as Record<string, unknown>)['url']) : "");
    brand.segment = text(org['industry']);
  }
  const links = Array.from(document.querySelectorAll("a[href]"));
  brand.email ||= (links.find(a => a.getAttribute("href")?.startsWith("mailto:"))?.getAttribute("href") ?? "").replace(/^mailto:/, "").split("?")[0] ?? "";
  brand.phone ||= (links.find(a => a.getAttribute("href")?.startsWith("tel:"))?.getAttribute("href") ?? "").replace(/^tel:/, "");
  const absolute = (src: string) => { if (!src.trim()) return ""; try { return publicWebsiteUrl(new URL(src, website).href).href; } catch { return ""; } };
  for (const key of ["linkedin", "instagram"] as const) brand[key] = absolute(links.find(a => { try { const h = new URL(a.getAttribute("href") ?? "", website).hostname; return h === `${key}.com` || h.endsWith(`.${key}.com`); } catch { return false; } })?.getAttribute("href") ?? "");
  if (!brand.logo) brand.logo = document.querySelector('img[alt*="logo" i],img[src*="logo" i],img[class*="logo" i]')?.getAttribute("src") ?? "";
  brand.logo = brand.logo ? absolute(brand.logo) : "";
  for (const key of Object.keys(brand) as (keyof CompanyBrand)[]) brand[key] = brand[key].slice(0, key === "description" ? 2000 : key === "address" ? 500 : 300);
  brand.name = brand.name.slice(0,120); brand.segment = brand.segment.slice(0,200); if (brand.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.email)) brand.email = "";
  return brand;
}
export async function readWebsiteBrand(raw: string) {
  try {
    const page = await checkedFetch(raw, 600000);
    const company = extractWebsiteBrand(new TextDecoder().decode(page.bytes), page.url);
    if (company.logo) {
      try { const image = await checkedFetch(company.logo, 2000000, true); let binary = ""; for (let i = 0; i < image.bytes.length; i += 8192) binary += String.fromCharCode(...image.bytes.subarray(i,i+8192)); company.logo = `data:${image.type};base64,${btoa(binary)}`; } catch { company.logo = ""; }
    }
    return { ok: true as const, company };
  } catch { return { ok: false as const }; }
}