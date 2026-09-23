import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = Parameters<typeof import("./access.server").assertAdmin>[0];

async function guard(context: Ctx) {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
}

/** Baixa uma imagem e devolve data URL (limite de 3 MB). */
async function toDataUrl(url: string): Promise<string> {
  try {
    if (!/^https?:\/\//i.test(url)) return "";
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 LiberatoBot" } });
    if (!res.ok) return "";
    const type = res.headers.get("content-type") ?? "image/png";
    if (!type.startsWith("image/")) return "";
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > 3_000_000) return "";
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) {
      bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    }
    return `data:${type.split(";")[0]};base64,${btoa(bin)}`;
  } catch {
    return "";
  }
}

/** Dados da plataforma usados para montar a apresentação. */
export const getPresentationContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await guard(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getPublicCompanyIdentity } = await import("./company-public.functions");
    const [services, settings, tools, quotes, identity] = await Promise.all([
      supabaseAdmin
        .from("service_products")
        .select("slug, title, family_title, lead, problem, body, audience, duration, bullets, results, modules, ai, published, position")
        .order("position"),
      supabaseAdmin.from("site_settings").select("key, value").in("key", ["branding", "institutional"]),
      supabaseAdmin.from("management_tools").select("title, summary, category").eq("published", true).order("position").limit(12),
      supabaseAdmin
        .from("quotes")
        .select("id, slug, service_title, client_name, currency, total_currency, total_brl, start_date, end_date, discount_pct, created_at, payload")
        .order("created_at", { ascending: false })
        .limit(40),
      getPublicCompanyIdentity(),
    ]);
    const map = new Map((settings.data ?? []).map((r: any) => [r.key, r.value]));
    const branding = (map.get("branding") ?? {}) as { logoUrl?: string };
    const inst = (map.get("institutional") ?? {}) as Record<string, any>;
    const { DEFAULT_INSTITUTIONAL } = await import("./site-config");
    const institutional = { ...DEFAULT_INSTITUTIONAL, ...inst };
    const logos = (institutional.logos ?? []).slice(0, 8) as Array<{ name: string; imageUrl: string }>;
    const [liberatoLogo, ...clientLogos] = await Promise.all([
      toDataUrl(branding.logoUrl || "https://liberatoconsulting.com.br/logo.png"),
      ...logos.map((l) => (l.imageUrl ? toDataUrl(l.imageUrl) : Promise.resolve(""))),
    ]);
    return {
      services: (services.data ?? []) as any[],
      tools: (tools.data ?? []) as Array<{ title: string; summary: string | null; category: string | null }>,
      quotes: (quotes.data ?? []) as any[],
      identity,
      liberatoLogo,
      institutional: {
        introduction: institutional.introduction,
        metrics: institutional.metrics ?? [],
        impact: (institutional.impact ?? []).map((i: any) => ({ title: i.title, body: i.body })),
        mission: institutional.mission,
        values: institutional.values,
        purpose: institutional.purpose,
        clients: logos.map((l, i) => ({ name: l.name, logo: clientLogos[i] ?? "" })),
      },
    };
  });

function pickAttr(tag: string, attr: string) {
  const m = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m?.[1] ?? "";
}

/** Lê o site do cliente e sugere nome, setor, localização, descrição e logomarca. */
export const analyzeClientSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ url: z.string().trim().min(4).max(300) }).parse(d))
  .handler(async ({ data, context }) => {
    await guard(context);
    const url = /^https?:\/\//i.test(data.url) ? data.url : `https://${data.url}`;
    let html = "";
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LiberatoBot/1.0)", Accept: "text/html" },
        redirect: "follow",
      });
      if (!res.ok) return { ok: false as const, error: `O site respondeu com erro (${res.status}).` };
      html = (await res.text()).slice(0, 600_000);
    } catch {
      return { ok: false as const, error: "Não foi possível acessar o site informado." };
    }
    const abs = (src: string) => {
      try {
        return new URL(src, url).toString();
      } catch {
        return "";
      }
    };
    const candidates: string[] = [];
    for (const tag of html.match(/<img[^>]+>/gi) ?? []) {
      if (/logo|brand|marca/i.test(tag)) {
        const src = pickAttr(tag, "src") || pickAttr(tag, "data-src");
        if (src && !src.startsWith("data:")) candidates.push(abs(src));
      }
    }
    for (const tag of html.match(/<link[^>]+>/gi) ?? []) {
      if (/apple-touch-icon|icon/i.test(pickAttr(tag, "rel"))) {
        const href = pickAttr(tag, "href");
        if (href) candidates.push(abs(href));
      }
    }
    const og = (html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i) ?? [])[0];
    if (og) candidates.push(abs(pickAttr(og, "content")));
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 9000);
    const title = (html.match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? "";
    const descTag = (html.match(/<meta[^>]+name=["']description["'][^>]*>/i) ?? [])[0];
    const desc = descTag ? pickAttr(descTag, "content") : "";

    const { askJson } = await import("./ai.server");
    const info = await askJson<{
      name: string;
      sector: string;
      location: string;
      description: string;
      offerings: string[];
      highlights: string[];
      audience: string;
    }>(
      "Você é analista de negócios da Liberato Consulting. Extraia dados objetivos do site de uma empresa, em português do Brasil. Não invente: deixe vazio o que não estiver no texto.",
      `Site: ${url}\nTítulo: ${title}\nDescrição: ${desc}\nTexto:\n${text}\n\nDevolva JSON com: name (nome comercial da empresa), sector (segmento de mercado), location (cidade/estado/país da sede ou atuação), description (2-3 frases sobre a empresa), offerings (até 6 produtos/serviços), highlights (até 5 diferenciais, números ou fatos citados no site), audience (público-alvo).`,
    ).catch(() => null);
    if (!info) return { ok: false as const, error: "A IA não conseguiu ler o site. Preencha manualmente." };

    let logo = "";
    for (const c of candidates.slice(0, 6)) {
      logo = await toDataUrl(c);
      if (logo) break;
    }
    return {
      ok: true as const,
      website: url,
      name: info.name ?? "",
      sector: info.sector ?? "",
      location: info.location ?? "",
      description: info.description ?? "",
      offerings: (info.offerings ?? []).slice(0, 6),
      highlights: (info.highlights ?? []).slice(0, 5),
      audience: info.audience ?? "",
      logo,
    };
  });

const draftSchema = z.object({
  clientName: z.string().trim().min(1).max(200),
  sector: z.string().trim().max(200),
  location: z.string().trim().max(200),
  description: z.string().trim().max(3000),
  offerings: z.array(z.string().max(300)).max(10),
  highlights: z.array(z.string().max(400)).max(10),
  audience: z.string().trim().max(500),
  service: z.object({
    title: z.string().max(300),
    lead: z.string().max(2000),
    problem: z.string().max(3000),
    body: z.string().max(5000),
    results: z.array(z.string().max(300)).max(20),
    modules: z.array(z.string().max(300)).max(20),
  }),
});

export type PresentationDraft = {
  headline: string;
  aboutClient: string;
  sectorContext: string;
  sectorTrends: string[];
  challenges: string[];
  approach: string;
  impacts: Array<{ title: string; body: string }>;
  whyLiberato: string[];
  nextSteps: string[];
};

/** Textos personalizados (setor, região, desafios e impactos) escritos pela IA. */
export const draftPresentationContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => draftSchema.parse(d))
  .handler(async ({ data, context }) => {
    await guard(context);
    const { askJson } = await import("./ai.server");
    try {
      const draft = await askJson<PresentationDraft>(
        `Você é sócio da Liberato Consulting e escreve apresentações comerciais de consultoria no padrão das grandes consultorias (Princípio da Pirâmide de Minto, estrutura Situação–Complicação–Resolução, títulos de ação, foco no valor para o cliente). Escreva em português do Brasil, com tom confiante, comercial e positivo. Use SEMPRE o nome "${data.clientName}" em vez de "cliente" ou "empresa". Nunca invente números, percentuais ou fatos sobre ${data.clientName}; use apenas o que foi informado. Frases curtas, próprias para slides.`,
        `Cliente: ${data.clientName}\nSetor: ${data.sector}\nLocalização: ${data.location}\nPúblico: ${data.audience}\nSobre: ${data.description}\nOfertas: ${data.offerings.join("; ")}\nDestaques do site: ${data.highlights.join("; ")}\n\nServiço proposto: ${data.service.title}\nResumo: ${data.service.lead}\nProblema que resolve: ${data.service.problem}\nDescrição: ${data.service.body}\nResultados típicos: ${data.service.results.join("; ")}\nMódulos: ${data.service.modules.join("; ")}\n\nDevolva JSON com:\nheadline (título de capa impactante, até 90 caracteres, citando ${data.clientName}),\naboutClient (2 frases mostrando que entendemos o negócio de ${data.clientName}),\nsectorContext (2 frases sobre o momento do setor na localização informada),\nsectorTrends (4 tendências/oportunidades do setor na região, até 90 caracteres cada),\nchallenges (4 desafios prováveis de ${data.clientName} que o serviço resolve, até 90 caracteres cada),\napproach (2 frases sobre como o serviço será adaptado a ${data.clientName}),\nimpacts (4 itens {title até 40 caracteres, body até 140 caracteres} com impactos no negócio de ${data.clientName}),\nwhyLiberato (4 razões para ${data.clientName} escolher a Liberato, até 90 caracteres),\nnextSteps (4 próximos passos curtos).`,
      );
      return { ok: true as const, draft };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message || "Falha ao gerar os textos." };
    }
  });
