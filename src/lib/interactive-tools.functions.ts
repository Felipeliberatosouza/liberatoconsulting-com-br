import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { priceFromCost, runTool, type ToolSpec } from "./tool-engine";

type Ctx = { supabase: any; userId: string; claims?: any };

async function admin(context: Ctx) {
  const { assertAdmin } = await import("./access.server");
  await assertAdmin(context);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}
function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "ferramenta";
}

export type InteractiveToolRow = {
  id: string; slug: string; title: string; summary: string; category: string; status: string;
  pricing_mode: "free" | "paid"; ai_cost_brl: number; markup_pct: number; price_brl: number;
  spec: ToolSpec; verification: { issues?: string[]; reviewIssues?: string[]; attempts?: number; usage?: Array<{ step: string; cost_brl: number }> };
  created_at: string; updated_at: string;
};

// ─────────────── Administrador ───────────────

export const listInteractiveToolsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin(context);
    const [{ data: tools }, { data: orders }] = await Promise.all([
      sb.from("interactive_tools").select("*").order("created_at", { ascending: false }),
      sb.from("interactive_tool_orders").select("id, tool_id, amount_brl, status, billing_type, created_at, paid_at, user_id").order("created_at", { ascending: false }).limit(200),
    ]);
    return { tools: (tools ?? []) as InteractiveToolRow[], orders: (orders ?? []) as Array<{ id: string; tool_id: string; amount_brl: number; status: string; billing_type: string; created_at: string; paid_at: string | null }> };
  });

export const generateInteractiveTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ prompt: z.string().trim().min(10).max(4000), spreadsheet: z.string().max(60000).optional(), toolId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { generateToolSpec } = await import("./interactive-tools.server");
    try {
      const result = await generateToolSpec(data.spreadsheet ? { prompt: data.prompt, spreadsheet: data.spreadsheet } : { prompt: data.prompt });
      const cost = result.usage.reduce((s, u) => s + u.cost_brl, 0);
      let previousCost = 0, markup = 200;
      if (data.toolId) {
        const { data: prev } = await sb.from("interactive_tools").select("ai_cost_brl, markup_pct").eq("id", data.toolId).maybeSingle();
        previousCost = Number(prev?.ai_cost_brl ?? 0); markup = Number(prev?.markup_pct ?? 200);
      }
      const totalCost = previousCost + cost;
      const row = {
        title: result.spec.title, summary: result.spec.summary, category: result.spec.category || "Gestão",
        spec: result.spec, ai_cost_brl: totalCost, price_brl: priceFromCost(totalCost, markup),
        verification: { issues: result.issues, reviewIssues: result.reviewIssues, attempts: result.attempts, usage: result.usage },
        updated_at: new Date().toISOString(),
      };
      let id = data.toolId;
      if (id) await sb.from("interactive_tools").update(row).eq("id", id);
      else {
        const slug = `${slugify(result.spec.title)}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: ins, error } = await sb.from("interactive_tools").insert({ ...row, slug, markup_pct: markup, created_by: context.userId }).select("id").single();
        if (error) throw error;
        id = ins.id;
      }
      await sb.from("interactive_tool_ai_usage").insert(result.usage.map((u) => ({ ...u, tool_id: id })));
      return { ok: true as const, id: id!, cost, issues: result.issues, reviewIssues: result.reviewIssues };
    } catch (err) {
      console.error("[interactive-tools]", err);
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha ao gerar a ferramenta." };
    }
  });

export const updateInteractiveTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().uuid(), title: z.string().trim().min(3).max(160), summary: z.string().trim().max(600), category: z.string().trim().max(80),
    status: z.enum(["draft", "published"]), pricing_mode: z.enum(["free", "paid"]), markup_pct: z.number().min(0).max(100000), price_brl: z.number().min(0).max(100000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    const { data: cur } = await sb.from("interactive_tools").select("verification").eq("id", data.id).maybeSingle();
    const v = (cur?.verification ?? {}) as { issues?: string[] };
    if (data.status === "published" && v.issues?.length) return { ok: false as const, error: "A ferramenta não passou nos testes de cálculo. Gere novamente antes de publicar." };
    if (data.pricing_mode === "paid" && data.price_brl < 5) return { ok: false as const, error: "O preço mínimo para cobrança é R$ 5,00." };
    const { id, ...rest } = data;
    await sb.from("interactive_tools").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
    return { ok: true as const };
  });

export const deleteInteractiveTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context);
    await sb.from("interactive_tools").delete().eq("id", data.id);
    return { ok: true };
  });

// ─────────────── Cliente ───────────────

export const listPublishedInteractiveTools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("interactive_tools").select("id, slug, title, summary, category, pricing_mode, price_brl").eq("status", "published").order("created_at", { ascending: false });
    return (data ?? []) as Array<{ id: string; slug: string; title: string; summary: string; category: string; pricing_mode: string; price_brl: number }>;
  });

async function hasAccess(context: Ctx, tool: { id: string; pricing_mode: string }) {
  if (tool.pricing_mode !== "paid") return true;
  const { isAdmin } = await import("./access.server");
  if (await isAdmin(context)) return true;
  const { data } = await context.supabase.from("interactive_tool_orders").select("id").eq("tool_id", tool.id).eq("user_id", context.userId).eq("status", "paid").limit(1);
  return Boolean(data?.length);
}

export const getInteractiveTool = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: tool } = await context.supabase.from("interactive_tools").select("id, slug, title, summary, category, pricing_mode, price_brl, spec, status").eq("slug", data.slug).maybeSingle();
    if (!tool) return { found: false as const };
    const access = await hasAccess(context, tool);
    const sb = await db();
    const [{ data: billing }, { data: order }] = await Promise.all([
      sb.from("billing_profiles").select("full_name, cpf_cnpj, phone, postal_code, address_number, phone_verified_at").eq("user_id", context.userId).maybeSingle(),
      sb.from("interactive_tool_orders").select("id, status, billing_type, amount_brl, invoice_url, bank_slip_url, pix_payload, pix_image").eq("tool_id", tool.id).eq("user_id", context.userId).eq("status", "pending").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const spec = tool.spec as ToolSpec;
    return {
      found: true as const,
      tool: { id: tool.id, slug: tool.slug, title: tool.title, summary: tool.summary, category: tool.category, pricing_mode: tool.pricing_mode as string, price_brl: Number(tool.price_brl), methodology: spec.methodology },
      access,
      spec: access ? spec : null,
      billing: billing ? { ...billing, phone_verified: Boolean(billing.phone_verified_at) } : null,
      pendingOrder: order ?? null,
      email: String(context.claims?.email ?? ""),
    };
  });

export const saveToolRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ toolId: z.string().uuid(), inputs: z.record(z.string(), z.number()), context: z.record(z.string(), z.string().max(200)) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: tool } = await context.supabase.from("interactive_tools").select("id, pricing_mode, spec").eq("id", data.toolId).maybeSingle();
    if (!tool || !(await hasAccess(context, tool))) return { ok: false as const, error: "Acesso não liberado." };
    const r = runTool(tool.spec as ToolSpec, data.inputs);
    if (!r.ok) return { ok: false as const, error: r.error };
    const sb = await db();
    await sb.from("interactive_tool_runs").insert({ tool_id: tool.id, user_id: context.userId, inputs: { ...data.inputs, _context: data.context }, results: r.values });
    return { ok: true as const };
  });

/** Logomarca e dados oficiais da consultoria, sempre lidos do cadastro em /admin/empresa. */
export const getToolBranding = createServerFn({ method: "GET" }).handler(async () => {
  const fallback = { logoUrl: "/logo.png", name: "Liberato Consulting", cnpj: "", phone: "", email: "", website: "liberatoconsulting.com.br", address: "" };
  try {
    const sb = await db();
    const { data } = await sb.from("company_profile").select("*").limit(1).maybeSingle();
    if (!data) return fallback;
    const address = [data.address_street, data.address_number, data.address_district, data.address_city, data.address_state].filter(Boolean).join(", ");
    return { logoUrl: data.logo_url || "/logo.png", name: data.trade_name || data.legal_name || fallback.name, cnpj: data.cnpj ?? "", phone: data.phone ?? "", email: data.email ?? "", website: data.website || fallback.website, address };
  } catch { return fallback; }
});

// ─────────────── Cobrança (Asaas) ───────────────

function validDoc(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(d)) return false;
  const calc = (base: string, weights: number[]) => { const s = weights.reduce((acc, w, i) => acc + Number(base[i]) * w, 0); const r = s % 11; return r < 2 ? 0 : 11 - r; };
  if (d.length === 11) {
    const v = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return v(9) === Number(d[9]) && v(10) === Number(d[10]);
  }
  if (d.length === 14) {
    const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], w2 = [6, ...w1];
    return calc(d, w1) === Number(d[12]) && calc(d, w2) === Number(d[13]);
  }
  return false;
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const saveBillingProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    full_name: z.string().trim().min(3).max(140), cpf_cnpj: z.string().trim().refine(validDoc, "CPF ou CNPJ inválido."),
    phone: z.string().trim().min(10).max(20), postal_code: z.string().trim().regex(/^\d{5}-?\d{3}$/, "CEP inválido."), address_number: z.string().trim().min(1).max(20),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const email = String(context.claims?.email ?? "");
    if (!email) return { ok: false as const, error: "Confirme seu e-mail antes de comprar." };
    const sb = await db();
    const { data: cur } = await sb.from("billing_profiles").select("phone, phone_verified_at").eq("user_id", context.userId).maybeSingle();
    const phoneChanged = !cur || cur.phone.replace(/\D/g, "") !== data.phone.replace(/\D/g, "");
    await sb.from("billing_profiles").upsert({
      user_id: context.userId, ...data, cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ""), email,
      phone_verified_at: phoneChanged ? null : cur?.phone_verified_at, updated_at: new Date().toISOString(),
    });
    return { ok: true as const };
  });

export const sendPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await db();
    const { data: bp } = await sb.from("billing_profiles").select("phone, phone_code_expires_at").eq("user_id", context.userId).maybeSingle();
    if (!bp) return { ok: false as const, error: "Preencha o cadastro de compra primeiro." };
    if (bp.phone_code_expires_at && new Date(bp.phone_code_expires_at).getTime() - 9 * 60_000 > Date.now()) return { ok: false as const, error: "Aguarde um minuto para pedir outro código." };
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await sb.from("billing_profiles").update({ phone_code_hash: await sha256(`${context.userId}:${code}`), phone_code_expires_at: new Date(Date.now() + 10 * 60_000).toISOString() }).eq("user_id", context.userId);
    try {
      const { sendWhatsAppMessage } = await import("./bulletin.server");
      await sendWhatsAppMessage({ to: bp.phone, caption: `Liberato Consulting: seu código de confirmação é ${code}. Ele vale por 10 minutos.` });
      return { ok: true as const };
    } catch (err) {
      console.error("[phone-code]", err);
      return { ok: false as const, error: "Não foi possível enviar o código pelo WhatsApp. Confira o número." };
    }
  });

export const verifyPhoneCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ code: z.string().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await db();
    const { data: bp } = await sb.from("billing_profiles").select("phone_code_hash, phone_code_expires_at").eq("user_id", context.userId).maybeSingle();
    if (!bp?.phone_code_hash || !bp.phone_code_expires_at || new Date(bp.phone_code_expires_at).getTime() < Date.now()) return { ok: false as const, error: "Código expirado. Peça um novo." };
    if (bp.phone_code_hash !== (await sha256(`${context.userId}:${data.code}`))) return { ok: false as const, error: "Código incorreto." };
    await sb.from("billing_profiles").update({ phone_verified_at: new Date().toISOString(), phone_code_hash: null, phone_code_expires_at: null }).eq("user_id", context.userId);
    return { ok: true as const };
  });

export const createToolOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ toolId: z.string().uuid(), billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]) }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      const sb = await db();
      const { asaas } = await import("./interactive-tools.server");
      const { data: tool } = await sb.from("interactive_tools").select("id, title, price_brl, pricing_mode, status").eq("id", data.toolId).maybeSingle();
      if (!tool || tool.status !== "published" || tool.pricing_mode !== "paid") return { ok: false as const, error: "Ferramenta indisponível para compra." };
      const { data: bp } = await sb.from("billing_profiles").select("*").eq("user_id", context.userId).maybeSingle();
      if (!bp) return { ok: false as const, error: "Preencha o cadastro de compra." };
      if (!bp.phone_verified_at) return { ok: false as const, error: "Confirme seu celular antes de pagar." };
      let customer = bp.asaas_customer_id as string | null;
      if (!customer) {
        const c = await asaas<{ id: string }>("/customers", { method: "POST", body: { name: bp.full_name, cpfCnpj: bp.cpf_cnpj, email: bp.email, mobilePhone: bp.phone.replace(/\D/g, "").replace(/^55/, ""), postalCode: bp.postal_code.replace(/\D/g, ""), addressNumber: bp.address_number, externalReference: context.userId } });
        customer = c.id;
        await sb.from("billing_profiles").update({ asaas_customer_id: customer }).eq("user_id", context.userId);
      }
      const { data: order } = await sb.from("interactive_tool_orders").insert({ tool_id: tool.id, user_id: context.userId, amount_brl: tool.price_brl, billing_type: data.billingType }).select("id").single();
      const due = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
      const pay = await asaas<{ id: string; invoiceUrl: string; bankSlipUrl?: string }>("/payments", { method: "POST", body: { customer, billingType: data.billingType, value: Number(tool.price_brl), dueDate: due, description: `Ferramenta de gestão: ${tool.title}`, externalReference: order.id } });
      let pix: { payload?: string; encodedImage?: string } = {};
      if (data.billingType === "PIX") pix = await asaas(`/payments/${pay.id}/pixQrCode`);
      await sb.from("interactive_tool_orders").update({ asaas_payment_id: pay.id, invoice_url: pay.invoiceUrl, bank_slip_url: pay.bankSlipUrl ?? null, pix_payload: pix.payload ?? null, pix_image: pix.encodedImage ?? null }).eq("id", order.id);
      return { ok: true as const, orderId: order.id as string, invoiceUrl: pay.invoiceUrl, bankSlipUrl: pay.bankSlipUrl ?? null, pixPayload: pix.payload ?? null, pixImage: pix.encodedImage ?? null };
    } catch (err) {
      console.error("[order]", err);
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha ao criar a cobrança." };
    }
  });

/** Confirma o pagamento consultando o Asaas (o webhook também atualiza automaticamente). */
export const refreshToolOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await db();
    const { data: order } = await sb.from("interactive_tool_orders").select("id, status, asaas_payment_id, user_id").eq("id", data.orderId).maybeSingle();
    if (!order || order.user_id !== context.userId) return { status: "not_found" };
    if (order.status === "paid" || !order.asaas_payment_id) return { status: order.status as string };
    const { asaas } = await import("./interactive-tools.server");
    const p = await asaas<{ status: string }>(`/payments/${order.asaas_payment_id}`);
    const paid = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(p.status);
    if (paid) await sb.from("interactive_tool_orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id);
    return { status: paid ? "paid" : "pending" };
  });
