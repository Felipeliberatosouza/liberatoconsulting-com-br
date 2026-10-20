import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Registra uma atividade do cliente logado (login, leitura, seção visitada). */
export const logMemberActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        kind: z.enum(["login", "section", "newsletter", "bulletin", "article", "tool_open"]),
        refId: z.string().trim().max(120).default(""),
        label: z.string().trim().max(200).default(""),
        path: z.string().trim().max(300).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      await context.supabase.from("member_activity_events").insert({
        user_id: context.userId,
        kind: data.kind,
        ref_id: data.refId,
        label: data.label,
        path: data.path,
      });
    } catch {
      // registro nunca pode atrapalhar o cliente
    }
    return { ok: true as const };
  });

async function assertAdmin(context: { supabase: any; userId: string; claims?: any }) {
  const access = await import("./access.server");
  await access.assertAdmin(context);
}

export type ClientUsageSummary = {
  userId: string;
  name: string;
  email: string;
  company: string;
  toolRuns: number;
  downloads: number;
  views: number;
  lastActivity: string | null;
};

/** Lista de clientes com totais de uso. */
export const listClientUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const [profiles, runs, downloads, events] = await Promise.all([
      sb.from("tool_user_profiles").select("user_id, first_name, last_name, email, company"),
      sb.from("interactive_tool_runs").select("user_id, created_at").limit(5000),
      sb.from("tool_downloads").select("user_id, created_at").limit(5000),
      sb.from("member_activity_events").select("user_id, created_at").limit(10000),
    ]);
    const map = new Map<string, ClientUsageSummary>();
    for (const p of profiles.data ?? []) {
      map.set(p.user_id, {
        userId: p.user_id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        email: p.email,
        company: p.company,
        toolRuns: 0,
        downloads: 0,
        views: 0,
        lastActivity: null,
      });
    }
    const bump = (rows: { user_id: string; created_at: string }[] | null, key: "toolRuns" | "downloads" | "views") => {
      for (const r of rows ?? []) {
        let item = map.get(r.user_id);
        if (!item) {
          item = { userId: r.user_id, name: "(sem cadastro)", email: "", company: "", toolRuns: 0, downloads: 0, views: 0, lastActivity: null };
          map.set(r.user_id, item);
        }
        item[key] += 1;
        if (!item.lastActivity || r.created_at > item.lastActivity) item.lastActivity = r.created_at;
      }
    };
    bump(runs.data, "toolRuns");
    bump(downloads.data, "downloads");
    bump(events.data, "views");
    return [...map.values()].sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
  });

export type ClientTimelineItem = {
  id: string;
  at: string;
  kind: string;
  title: string;
  detail: string;
  inputs?: Record<string, unknown>;
  results?: Record<string, unknown>;
};

/** Linha do tempo completa de um cliente, incluindo entradas e resultados das ferramentas. */
export const getClientTimeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const [runs, downloads, events, orders] = await Promise.all([
      sb.from("interactive_tool_runs").select("id, tool_id, inputs, results, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(200),
      sb.from("tool_downloads").select("id, tool_id, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(200),
      sb.from("member_activity_events").select("id, kind, label, path, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(500),
      sb.from("interactive_tool_orders").select("id, tool_id, amount_brl, status, created_at").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(100),
    ]);
    const toolIds = [...new Set([...(runs.data ?? []), ...(orders.data ?? [])].map((r) => r.tool_id))];
    const matIds = [...new Set((downloads.data ?? []).map((r) => r.tool_id))];
    const [tools, mats] = await Promise.all([
      toolIds.length ? sb.from("interactive_tools").select("id, title").in("id", toolIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      matIds.length ? sb.from("management_tools").select("id, title").in("id", matIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);
    const toolName = new Map((tools.data ?? []).map((t) => [t.id, t.title]));
    const matName = new Map((mats.data ?? []).map((t) => [t.id, t.title]));
    const KIND: Record<string, string> = {
      login: "Entrou na área do cliente",
      section: "Abriu seção",
      newsletter: "Leu newsletter",
      bulletin: "Viu boletim semanal",
      article: "Leu artigo",
      tool_open: "Abriu ferramenta",
    };
    const items: ClientTimelineItem[] = [
      ...(runs.data ?? []).map((r) => ({
        id: r.id,
        at: r.created_at,
        kind: "tool_run",
        title: "Calculou ferramenta",
        detail: toolName.get(r.tool_id) ?? "Ferramenta",
        inputs: (r.inputs ?? {}) as Record<string, unknown>,
        results: (r.results ?? {}) as Record<string, unknown>,
      })),
      ...(downloads.data ?? []).map((r) => ({ id: r.id, at: r.created_at, kind: "download", title: "Baixou material", detail: matName.get(r.tool_id) ?? "Material" })),
      ...(orders.data ?? []).map((r) => ({ id: r.id, at: r.created_at, kind: "order", title: "Compra de ferramenta", detail: `${toolName.get(r.tool_id) ?? "Ferramenta"} — R$ ${Number(r.amount_brl).toFixed(2).replace(".", ",")} (${r.status})` })),
      ...(events.data ?? []).map((r) => ({ id: r.id, at: r.created_at, kind: r.kind, title: KIND[r.kind] ?? r.kind, detail: r.label || r.path })),
    ];
    items.sort((a, b) => b.at.localeCompare(a.at));
    return items;
  });
