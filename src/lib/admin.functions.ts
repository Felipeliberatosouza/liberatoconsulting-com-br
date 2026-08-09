import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ArticleRecord, SiteConfig, TextOverrides, Theme } from "./site-config";

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
    };
  },
);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

/** Sessão atual: informa se o usuário logado é administrador. */
export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { userId: context.userId, isAdmin: Boolean(data) };
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
      link_url: data.link_url || null,
      translations: { en: t.en, es: t.es, zh: t.zh },
    };

    const { error } = id
      ? await context.supabase.from("content_articles").update(row).eq("id", id)
      : await context.supabase.from("content_articles").insert(row);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
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
