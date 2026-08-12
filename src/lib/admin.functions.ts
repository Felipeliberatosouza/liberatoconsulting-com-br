import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type {
  ArticleRecord,
  BrazilOverrides,
  Branding,
  HeroSettings,
  SiteConfig,
  TextOverrides,
  Theme,
} from "./site-config";

/** Configuração pública do site (cores, textos personalizados e conteúdos). */
export const getSiteConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteConfig> => {
    const { publicClient } = await import("./admin.server");
    const supabase = publicClient();
    const [settings, articles] = await Promise.all([
      supabase.from("site_settings").select("key, value"),
      supabase
        .from("content_articles")
        .select("*")
        .eq("published", true)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

    const map = new Map((settings.data ?? []).map((r) => [r.key, r.value]));
    return {
      theme: (map.get("theme") ?? {}) as Theme,
      texts: (map.get("texts") ?? {}) as TextOverrides,
      articles: (articles.data ?? []) as unknown as ArticleRecord[],
      branding: (map.get("branding") ?? {}) as Branding,
      hero: (map.get("hero") ?? {}) as HeroSettings,
      brazil: (map.get("brazil") ?? {}) as BrazilOverrides,
    };
  },
);

async function isAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!error && data) return true;
  // Fallback: leitura direta (RLS permite ler as próprias funções)
  const { data: row } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(row);
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (!(await isAdmin(context))) throw new Error("Forbidden");
}

/** Sessão atual: informa se o usuário logado é administrador. */
export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { userId: context.userId, isAdmin: await isAdmin(context) };
  });

/** Existe algum administrador cadastrado? Usado para o cadastro inicial. */
export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

const credentials = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(200),
});

/** Cria o primeiro administrador. Só funciona enquanto não existir nenhum. */
export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => credentials.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false as const, error: "Já existe um administrador." };

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      return { ok: false as const, error: created.error?.message ?? "Falha ao criar usuário." };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.data.user.id, role: "admin" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Convida um novo administrador (somente admins). */
export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => credentials.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      return { ok: false as const, error: created.error?.message ?? "Falha ao criar usuário." };
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.data.user.id, role: "admin" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const themeSchema = z.record(z.string(), z.string().max(64));

export const saveTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => themeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "theme", value: data }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const textsSchema = z.object({
  changes: z.array(z.object({ path: z.string().min(1).max(300), pt: z.string().max(8000) })).max(80),
});

/**
 * Salva textos em português e gera automaticamente as versões EN/ES/ZH.
 * Um texto vazio remove a personalização (volta ao texto original do site).
 */
export const saveTexts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => textsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateRecord } = await import("./admin.server");

    const current = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "texts")
      .maybeSingle();
    const overrides: TextOverrides = (current.data?.value ?? {}) as TextOverrides;

    const toTranslate: Record<string, string> = {};
    data.changes.forEach((c, i) => {
      const text = c.pt.trim();
      if (!text) {
        delete overrides[c.path];
        return;
      }
      toTranslate[String(i)] = text;
    });

    const translated = await translateRecord(toTranslate);
    data.changes.forEach((c, i) => {
      const text = c.pt.trim();
      if (!text) return;
      overrides[c.path] = {
        pt: text,
        en: translated.en[String(i)] ?? text,
        es: translated.es[String(i)] ?? text,
        zh: translated.zh[String(i)] ?? text,
      };
    });

    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "texts", value: overrides }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const listArticles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("content_articles")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ArticleRecord[];
  });

const articleSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  group_id: z.string().trim().min(1).max(60),
  kind: z.string().trim().min(1).max(60),
  title: z.string().trim().min(3).max(300),
  summary: z.string().trim().max(2000),
  body: z.string().max(20000),
  service: z.string().trim().max(120),
  link_url: z.string().trim().max(500).nullable().optional(),
  position: z.number().int().min(0).max(9999),
  published: z.boolean(),
  cover_url: z.string().max(2_000_000).nullable().optional(),
  authors: z.string().trim().max(300).optional(),
  author_contact: z.string().trim().max(300).optional(),
  file_path: z.string().trim().max(500).nullable().optional(),
  file_name: z.string().trim().max(200).nullable().optional(),
});

export const saveArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => articleSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateRecord } = await import("./admin.server");

    const t = await translateRecord({
      kind: data.kind,
      title: data.title,
      summary: data.summary,
      body: data.body,
    });

    const { id, ...rest } = data;
    const row = {
      ...rest,
      authors: data.authors ?? "",
      author_contact: data.author_contact ?? "",
      cover_url: data.cover_url || null,
      file_path: data.file_path || null,
      file_name: data.file_name || null,
      link_url: data.link_url || null,
      translations: { en: t.en, es: t.es, zh: t.zh },
    };

    const { error } = id
      ? await context.supabase.from("content_articles").update(row).eq("id", id)
      : await context.supabase.from("content_articles").insert(row);
    if (error) return { ok: false as const, error: error.message };

    // Novo conteúdo publicado: dispara a newsletter se o envio automático estiver ligado.
    if (!id && data.published) {
      try {
        const { announceArticle } = await import("./newsletter.server");
        await announceArticle({ title: data.title, summary: data.summary, slug: data.slug });
      } catch (err) {
        console.error("[newsletter] auto-send failed", err);
      }
    }
    return { ok: true as const };
  });

/** Envia o arquivo do artigo completo (PDF/DOC) para o armazenamento privado. */
export const uploadArticleFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(200),
        dataUrl: z.string().max(14_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const match = /^data:([^;]+);base64,(.+)$/.exec(data.dataUrl);
    if (!match) return { ok: false as const, error: "Arquivo inválido." };
    const bytes = Buffer.from(match[2]!, "base64");
    if (bytes.byteLength > 10_000_000) return { ok: false as const, error: "Arquivo acima de 10 MB." };
    const safe = data.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `articles/${crypto.randomUUID()}-${safe}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from("content")
      .upload(path, bytes, { contentType: match[1]!, upsert: false });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, path, name: data.name };
  });

/** Artigos enviados pelo público em "Publique você também". */
export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("article_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Link temporário para baixar um arquivo do armazenamento de conteúdo. */
export const getContentFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("content")
      .createSignedUrl(data.path, 300);
    if (error || !signed) return { ok: false as const, error: "Falha ao gerar link." };
    return { ok: true as const, url: signed.signedUrl };
  });

export const deleteArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("content_articles").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });


/** Leads capturados nos formulários das páginas de serviço. */
export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("id, name, company, country, email, service_slug, service_title, message, language, source_path, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Candidaturas recebidas pelo formulário de currículo. */
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("job_applications")
      .select("id, full_name, phone, email, interest_area, linkedin_url, resume_path, resume_filename, language, source_path, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Link temporário para baixar o currículo anexado a uma candidatura. */
export const getResumeUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("resumes")
      .createSignedUrl(data.path, 300);
    if (error || !signed) return { ok: false as const, error: error?.message ?? "Falha ao gerar link." };
    return { ok: true as const, url: signed.signedUrl };
  });


const DEFAULT_ALERT_EMAIL = "felipesza@yahoo.com.br";

/** E-mail que recebe os alertas de novos leads e candidaturas. */
export const getAlertEmail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "alerts")
      .maybeSingle();
    const value = (data?.value ?? {}) as { email?: string };
    return { email: value.email || DEFAULT_ALERT_EMAIL };
  });

export const saveAlertEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "alerts", value: { email: data.email } }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Logomarca atual (somente admins veem pelo painel; o site lê via getSiteConfig). */
export const saveLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        dataUrl: z
          .string()
          .regex(/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/)
          .max(1_400_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "branding", value: { logoUrl: data.dataUrl } }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Volta para a logomarca padrão do projeto. */
export const resetLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "branding", value: {} }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const whatsappSchema = z.object({
  number: z
    .string()
    .trim()
    .max(40)
    .regex(/^[\d\s\-+()]*$/, "Use apenas números, espaços, hífen, + e parênteses")
    .optional(),
});

/** Número de WhatsApp exibido no botão flutuante do site. */
export const getWhatsApp = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "branding")
      .maybeSingle();
    const value = (data?.value ?? {}) as { whatsapp?: string };
    return { number: value.whatsapp ?? "" };
  });

export const saveWhatsApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => whatsappSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const current = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "branding")
      .maybeSingle();
    const value = (current.data?.value ?? {}) as { logoUrl?: string; whatsapp?: string };
    const number = data.number?.trim() || undefined;
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "branding", value: { ...value, whatsapp: number } }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });


const heroSchema = z.object({
  autoplayMs: z.number().int().min(0).max(30000),
  slides: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(40),
        enabled: z.boolean(),
        imageUrl: z.string().trim().max(3_000_000).optional(),
      }),
    )
    .max(12),
});

/** Configuração do carrossel da página inicial (ordem, exibição, imagem e tempo). */
export const saveHeroSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => heroSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "hero", value: data }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });


const brazilSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().max(200),
  body: z.string().trim().max(4000),
  bullets: z.array(z.string().trim().max(400)).max(20),
});

/**
 * Salva o conteúdo de um tema de "Dados do Brasil" em português e gera
 * automaticamente as versões EN/ES/ZH. Campos vazios voltam ao texto original.
 */
export const saveBrazilSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => brazilSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateRecord } = await import("./admin.server");

    const current = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "brazil")
      .maybeSingle();
    const overrides: BrazilOverrides = (current.data?.value ?? {}) as BrazilOverrides;

    const bullets = data.bullets.filter((b) => b.length > 0);
    if (!data.title && !data.body && bullets.length === 0) {
      delete overrides[data.id];
    } else {
      const source: Record<string, string> = { title: data.title, body: data.body };
      bullets.forEach((b, i) => (source[`b${i}`] = b));
      const translated = await translateRecord(source);
      const pick = (lang: "en" | "es" | "zh") => ({
        title: translated[lang]["title"] ?? data.title,
        body: translated[lang]["body"] ?? data.body,
        bullets: bullets.map((b, i) => translated[lang][`b${i}`] ?? b),
      });
      overrides[data.id] = {
        pt: { title: data.title, body: data.body, bullets },
        en: pick("en"),
        es: pick("es"),
        zh: pick("zh"),
      };
    }

    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "brazil", value: overrides }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
