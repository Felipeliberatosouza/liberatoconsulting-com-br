/**
 * Checagem automática de JSON-LD (dados estruturados) das páginas públicas.
 *
 * Uso:
 *   bun run scripts/check-jsonld.ts                  # usa http://localhost:8080
 *   CHECK_BASE_URL=https://liberatoconsulting.com.br bun run scripts/check-jsonld.ts
 *
 * Garante que image, datePublished, author/publisher e os tipos
 * (Article / WebPage / Service / BreadcrumbList ...) nunca fiquem incompletos.
 */

const BASE = (process.env["CHECK_BASE_URL"] ?? "http://localhost:8080").replace(/\/$/, "");
const MAX_URLS = Number(process.env["CHECK_MAX_URLS"] ?? 40);

type Json = Record<string, unknown>;

const errors: string[] = [];
const warnings: string[] = [];

function fail(page: string, message: string) {
  errors.push(`${page}: ${message}`);
}

function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

function hasImage(node: Json) {
  const img = node["image"] ?? node["thumbnailUrl"];
  if (isNonEmptyString(img)) return true;
  if (Array.isArray(img)) return img.some((i) => isNonEmptyString(i) || (i && typeof i === "object"));
  if (img && typeof img === "object") return isNonEmptyString((img as Json)["url"]);
  return false;
}

function isIsoDate(v: unknown) {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

function typesOf(node: Json): string[] {
  const t = node["@type"];
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

/** Achata @graph e arrays para validar cada nó. */
function flatten(value: unknown, out: Json[] = []): Json[] {
  if (Array.isArray(value)) {
    for (const v of value) flatten(v, out);
    return out;
  }
  if (value && typeof value === "object") {
    const node = value as Json;
    if (Array.isArray(node["@graph"])) flatten(node["@graph"], out);
    if (typesOf(node).length > 0) out.push(node);
  }
  return out;
}

const ARTICLE_TYPES = new Set(["Article", "NewsArticle", "BlogPosting", "TechArticle"]);
const PAGE_TYPES = new Set(["WebPage", "AboutPage", "CollectionPage", "ContactPage", "ItemPage"]);
const ORG_TYPES = new Set(["Organization", "ProfessionalService", "LocalBusiness", "Corporation"]);

function validateNode(page: string, node: Json) {
  const types = typesOf(node);
  const label = types.join("/") || "sem @type";

  if (types.length === 0) fail(page, "bloco JSON-LD sem @type");

  if (types.some((t) => ARTICLE_TYPES.has(t))) {
    if (!isNonEmptyString(node["headline"]) && !isNonEmptyString(node["name"]))
      fail(page, `${label}: headline ausente`);
    if (!hasImage(node)) fail(page, `${label}: image ausente`);
    if (!isIsoDate(node["datePublished"])) fail(page, `${label}: datePublished ausente ou inválido`);
    if (node["dateModified"] !== undefined && !isIsoDate(node["dateModified"]))
      fail(page, `${label}: dateModified inválido`);
    if (!node["author"]) fail(page, `${label}: author ausente`);
    const publisher = node["publisher"] as Json | undefined;
    if (!publisher || typeof publisher !== "object") fail(page, `${label}: publisher ausente`);
    else {
      if (!isNonEmptyString(publisher["name"])) fail(page, `${label}: publisher.name ausente`);
      const logo = publisher["logo"];
      const logoOk =
        isNonEmptyString(logo) || (logo && typeof logo === "object" && isNonEmptyString((logo as Json)["url"]));
      if (!logoOk) fail(page, `${label}: publisher.logo ausente`);
    }
    if (!isNonEmptyString(node["mainEntityOfPage"]) && !node["mainEntityOfPage"])
      warnings.push(`${page}: ${label}: mainEntityOfPage ausente`);
  }

  if (types.some((t) => PAGE_TYPES.has(t))) {
    if (!isNonEmptyString(node["name"]) && !isNonEmptyString(node["headline"]))
      fail(page, `${label}: name ausente`);
    if (!isNonEmptyString(node["url"]) && !isNonEmptyString(node["@id"]))
      fail(page, `${label}: url ausente`);
    // Um tipo de página não pode carregar datas de artigo sem ser Article.
    if (node["datePublished"] !== undefined && !isIsoDate(node["datePublished"]))
      fail(page, `${label}: datePublished inválido`);
  }

  if (types.includes("BreadcrumbList")) {
    const items = node["itemListElement"];
    if (!Array.isArray(items) || items.length === 0) fail(page, "BreadcrumbList: itemListElement vazio");
    else
      items.forEach((raw, i) => {
        const it = raw as Json;
        if (typeof it["position"] !== "number") fail(page, `BreadcrumbList[${i}]: position ausente`);
        const name = isNonEmptyString(it["name"]) || isNonEmptyString((it["item"] as Json)?.["name"]);
        if (!name) fail(page, `BreadcrumbList[${i}]: name ausente`);
        const item = it["item"];
        const itemOk = isNonEmptyString(item) || (item && typeof item === "object" && isNonEmptyString((item as Json)["@id"]));
        if (!itemOk && i < items.length - 1) fail(page, `BreadcrumbList[${i}]: item/url ausente`);
      });
  }

  if (types.includes("Service")) {
    if (!isNonEmptyString(node["name"])) fail(page, "Service: name ausente");
    const provider = node["provider"];
    if (!provider || typeof provider !== "object") fail(page, "Service: provider ausente");
  }

  if (types.some((t) => ORG_TYPES.has(t))) {
    if (!isNonEmptyString(node["name"])) fail(page, `${label}: name ausente`);
    if (!isNonEmptyString(node["url"])) fail(page, `${label}: url ausente`);
    if (!hasImage(node) && !node["logo"]) fail(page, `${label}: logo/image ausente`);
    const address = node["address"] as Json | undefined;
    if (address && typeof address === "object" && address["@type"] !== "PostalAddress")
      fail(page, `${label}: address deve ser PostalAddress`);
  }

  if (types.includes("ItemList")) {
    const items = node["itemListElement"];
    if (!Array.isArray(items) || items.length === 0) fail(page, "ItemList: itemListElement vazio");
  }
}

function extractJsonLd(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) blocks.push(m[1]!);
  return blocks;
}

async function checkPage(path: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
  if (!res.ok) {
    fail(path, `HTTP ${res.status}`);
    return;
  }
  const html = await res.text();
  const blocks = extractJsonLd(html);
  if (blocks.length === 0) {
    fail(path, "nenhum bloco JSON-LD encontrado");
    return;
  }
  for (const raw of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      fail(path, `JSON-LD inválido: ${(e as Error).message}`);
      continue;
    }
    for (const node of flatten(parsed)) validateNode(path, node);
  }
}

async function sitemapPaths(): Promise<string[]> {
  try {
    const res = await fetch(`${BASE}/sitemap.xml`);
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => {
        try {
          return new URL(m[1]!).pathname;
        } catch {
          return "";
        }
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

const IF_AVAILABLE = process.argv.includes("--if-available");

async function serverIsUp() {
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await serverIsUp())) {
    const msg = `Servidor indisponível em ${BASE} — checagem de JSON-LD não executada.`;
    if (IF_AVAILABLE) {
      console.log(`aviso  ${msg}`);
      return;
    }
    console.error(msg);
    process.exit(1);
  }

  const base = ["/", "/services", "/about", "/brasil", "/content", "/contact", "/careers"];
  const fromSitemap = await sitemapPaths();
  const all = [...new Set([...base, ...fromSitemap])].slice(0, MAX_URLS);

  console.log(`Verificando JSON-LD em ${all.length} páginas (${BASE})...`);
  for (const path of all) {
    await checkPage(path);
  }

  for (const w of warnings) console.log(`aviso  ${w}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} problema(s) de dados estruturados:`);
    for (const e of errors) console.error(`  erro  ${e}`);
    process.exit(1);
  }
  console.log(`OK — dados estruturados válidos em ${all.length} páginas.`);
}

await main();
