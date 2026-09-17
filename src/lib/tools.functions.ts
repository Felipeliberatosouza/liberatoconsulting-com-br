import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidPhone, PHONE_ERROR } from "@/lib/validation";

const profileSchema = z.object({
  first_name: z.string().trim().min(2).max(80),
  last_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().refine(isValidPhone, PHONE_ERROR),
  company: z.string().trim().min(2).max(140),
  job_title: z.string().trim().min(2).max(120),
  revenue_range: z.string().trim().min(1).max(100),
  segment: z.string().trim().min(1).max(140),
  email: z.string().trim().email().max(160),
  receive_newsletter: z.boolean().optional().default(true),
  receive_bulletin: z.boolean().optional().default(true),
  receive_insights: z.boolean().optional().default(true),
});

export const getToolsAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, tools] = await Promise.all([
      context.supabase.from("tool_user_profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      context.supabase.from("management_tools").select("id, slug, title, summary, category, cover_url, file_name, position, translations").eq("published", true).order("position"),
    ]);
    if (profile.error) throw new Error(profile.error.message);
    if (tools.error) throw new Error(tools.error.message);
    return { profile: profile.data, tools: tools.data ?? [] };
  });

export const saveToolsProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const email = (data.email || String((context.claims as any)?.email ?? "")).toLowerCase();
    const { error } = await context.supabase.from("tool_user_profiles").upsert(
      { ...data, email, user_id: context.userId },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    // Boas-vindas, newsletter, boletim e registro como lead — falhas não bloqueiam o acesso.
    try {
      const { runToolsOnboarding } = await import("./tools-onboarding.server");
      await runToolsOnboarding(context.userId, email, data);
    } catch (onboardingError) {
      console.error("tools onboarding failed", onboardingError);
    }
    return { ok: true as const };
  });

export const getMemberContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setMonth(since.getMonth() - 3);
    const iso = since.toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [articles, newsletters, bulletins] = await Promise.all([
      context.supabase
        .rpc("list_site_articles")
        .then(({ data, error }) => {
          if (error) throw error;
          return data ?? [];
        }),
      supabaseAdmin
        .from("newsletter_campaigns")
        .select("id, slug, subject, preheader, reference_date, published_at")
        .not("published_at", "is", null)
        .gte("published_at", iso)
        .order("published_at", { ascending: false }),
      supabaseAdmin
        .from("bulletin_dispatches")
        .select("id, subject, date_label, created_at")
        .eq("status", "sent")
        .eq("is_test", false)
        .gte("created_at", iso)
        .order("created_at", { ascending: false }),
    ]);
    if (newsletters.error) throw new Error(newsletters.error.message);
    if (bulletins.error) throw new Error(bulletins.error.message);
    return {
      articles,
      newsletters: newsletters.data ?? [],
      bulletins: bulletins.data ?? [],
    };
  });

/** Clientes cadastrados para receber os materiais gratuitos. */
export const listToolClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profiles, error }, { data: downloads }] = await Promise.all([
      supabaseAdmin
        .from("tool_user_profiles")
        .select(
          "id, user_id, email, first_name, last_name, phone, company, job_title, revenue_range, segment, state, welcome_sent_at, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(1000),
      supabaseAdmin.from("tool_downloads").select("user_id"),
    ]);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const row of (downloads ?? []) as Array<{ user_id: string }>) {
      counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);
    }
    return (profiles ?? []).map((p: any) => ({ ...p, downloads: counts.get(p.user_id) ?? 0 }));
  });

/** Marca (ou desmarca) o material enviado no e-mail de boas-vindas. */
export const setToolWelcomeAttachment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), welcome_attachment: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Apenas um material acompanha o e-mail de boas-vindas.
    if (data.welcome_attachment) {
      await supabaseAdmin
        .from("management_tools")
        .update({ welcome_attachment: false })
        .eq("welcome_attachment", true);
    }
    const { error } = await supabaseAdmin
      .from("management_tools")
      .update({ welcome_attachment: data.welcome_attachment })
      .eq("id", data.id);
    return error ? { ok: false as const, error: error.message } : { ok: true as const };
  });

export const getToolDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: tool, error } = await context.supabase.from("management_tools").select("id, file_path, file_name").eq("id", data.id).eq("published", true).maybeSingle();
    if (error || !tool) return { ok: false as const, error: "Material não encontrado." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await context.supabase.from("tool_downloads").insert({ user_id: context.userId, tool_id: tool.id });
    const signed = await supabaseAdmin.storage.from("management-tools").createSignedUrl(tool.file_path, 300, { download: tool.file_name });
    if (signed.error || !signed.data) return { ok: false as const, error: "Não foi possível preparar o download." };
    return { ok: true as const, url: signed.data.signedUrl };
  });

const adminToolSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(180),
  summary: z.string().trim().max(1000),
  category: z.string().trim().min(2).max(80),
  position: z.number().int().min(0).max(9999),
  published: z.boolean(),
  file_name: z.string().trim().min(1).max(240),
  content_type: z.enum(["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]),
  base64: z.string().min(1).max(28_000_000),
  welcome_attachment: z.boolean().optional().default(false),
});

export const listAdminTools = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
  const { data, error } = await context.supabase.from("management_tools").select("*").order("position");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const saveAdminTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => adminToolSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Uint8Array.from(atob(data.base64), (char) => char.charCodeAt(0));
    if (bytes.byteLength > 20 * 1024 * 1024) return { ok: false as const, error: "O arquivo deve ter no máximo 20 MB." };
    const extension = data.file_name.toLowerCase().split(".").pop() ?? "";
    const allowedExtension = data.content_type === "application/pdf" ? extension === "pdf" : data.content_type === "application/vnd.ms-excel" ? extension === "xls" : extension === "xlsx";
    if (!allowedExtension) return { ok: false as const, error: "O tipo do arquivo não corresponde à extensão." };
    const safe = data.file_name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const filePath = `${crypto.randomUUID()}/${safe}`;
    const uploaded = await supabaseAdmin.storage.from("management-tools").upload(filePath, bytes, { contentType: data.content_type, upsert: false });
    if (uploaded.error) return { ok: false as const, error: uploaded.error.message };
    const slug = data.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);
    if (data.welcome_attachment) {
      await supabaseAdmin.from("management_tools").update({ welcome_attachment: false }).eq("welcome_attachment", true);
    }
    const row = { slug: `${slug}-${Date.now().toString(36)}`, title: data.title, summary: data.summary, category: data.category, position: data.position, published: data.published, file_name: data.file_name, file_path: filePath, welcome_attachment: data.welcome_attachment };
    const saved = await supabaseAdmin.from("management_tools").insert(row);
    if (saved.error) {
      await supabaseAdmin.storage.from("management-tools").remove([filePath]);
      return { ok: false as const, error: saved.error.message };
    }
    return { ok: true as const };
  });

export const deleteAdminTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const found = await supabaseAdmin.from("management_tools").select("file_path").eq("id", data.id).maybeSingle();
    if (found.data?.file_path) await supabaseAdmin.storage.from("management-tools").remove([found.data.file_path]);
    const deleted = await supabaseAdmin.from("management_tools").delete().eq("id", data.id);
    return deleted.error ? { ok: false as const, error: deleted.error.message } : { ok: true as const };
  });