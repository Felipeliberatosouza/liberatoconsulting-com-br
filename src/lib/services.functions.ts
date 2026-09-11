import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ServiceProduct } from "./services-catalog";

const PUBLIC_COLUMNS =
  "id, slug, group_id, groups, family_id, family_title, code, title, lead, problem, body, audience, duration, duration_corporate, level, bullets, results, modules, limits, ai, position, published, translations";

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens."),
  group_id: z.string().trim().max(60),
  groups: z.array(z.string().trim().max(60)).max(10),
  family_id: z.string().trim().max(80),
  family_title: z.string().trim().max(160),
  code: z.string().trim().max(20),
  title: z.string().trim().min(2).max(160),
  lead: z.string().trim().max(500),
  problem: z.string().trim().max(800),
  body: z.string().trim().max(3000),
  audience: z.string().trim().max(500),
  duration: z.string().trim().max(200),
  duration_corporate: z.string().trim().max(200),
  level: z.string().trim().max(120),
  price_sme: z.string().trim().max(120),
  price_corporate: z.string().trim().max(120),
  bullets: z.array(z.string().trim().max(400)).max(20),
  results: z.array(z.string().trim().max(400)).max(20),
  modules: z.array(z.string().trim().max(400)).max(20),
  limits: z.string().trim().max(1500),
  ai: z.string().trim().max(1500),
  position: z.number().int().min(0).max(999),
  published: z.boolean(),
});

export type ServiceProductInput = z.infer<typeof productSchema>;

/** Serviços publicados, sem preços — usados pelo site público. */
export const listPublicServiceProducts = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServiceProduct[]> => {
    const { publicClient } = await import("./admin.server");
    const { data } = await publicClient()
      .from("service_products")
      .select(PUBLIC_COLUMNS)
      .eq("published", true)
      .order("position", { ascending: true });
    return (data ?? []) as unknown as ServiceProduct[];
  },
);

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

/** Todos os serviços com preços — apenas para o painel administrativo. */
export const listServiceProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServiceProduct[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("service_products")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ServiceProduct[];
  });

/** Cria ou atualiza um serviço e gera as traduções EN/ES/ZH. */
export const saveServiceProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => productSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { translateRecord } = await import("./admin.server");

    const source: Record<string, string> = {
      title: data.title,
      lead: data.lead,
      problem: data.problem,
      body: data.body,
      audience: data.audience,
      duration: data.duration,
      level: data.level,
      limits: data.limits,
      ai: data.ai,
      family: data.family_title,
    };
    data.bullets.forEach((v, i) => (source[`b${i}`] = v));
    data.results.forEach((v, i) => (source[`r${i}`] = v));
    data.modules.forEach((v, i) => (source[`m${i}`] = v));

    let translations: Record<string, unknown> = {};
    try {
      const out = await translateRecord(source);
      translations = Object.fromEntries(
        (["en", "es", "zh"] as const).map((lang) => {
          const t = out[lang] ?? {};
          return [
            lang,
            {
              title: t["title"] ?? data.title,
              lead: t["lead"] ?? data.lead,
              problem: t["problem"] ?? data.problem,
              body: t["body"] ?? data.body,
              audience: t["audience"] ?? data.audience,
              duration: t["duration"] ?? data.duration,
              level: t["level"] ?? data.level,
              limits: t["limits"] ?? data.limits,
              ai: t["ai"] ?? data.ai,
              family: t["family"] ?? data.family_title,
              bullets: data.bullets.map((v, i) => t[`b${i}`] ?? v),
              results: data.results.map((v, i) => t[`r${i}`] ?? v),
              modules: data.modules.map((v, i) => t[`m${i}`] ?? v),
            },
          ];
        }),
      );
    } catch {
      translations = {};
    }

    const row = {
      ...data,
      ...(Object.keys(translations).length > 0 ? { translations } : {}),
    };

    const { error } = await context.supabase
      .from("service_products")
      .upsert(row, { onConflict: "slug" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Remove um serviço do cadastro. */
export const deleteServiceProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("service_products")
      .delete()
      .eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
