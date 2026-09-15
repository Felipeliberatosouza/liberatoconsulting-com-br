import { createHash } from "node:crypto";
import { z } from "zod";
import { isValidPhone, PHONE_ERROR } from "./validation";

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().refine(isValidPhone, PHONE_ERROR),
  serviceSlug: z.string().trim().min(1).max(120),
  serviceTitle: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
  language: z.string().trim().max(8).optional().or(z.literal("")),
  sourcePath: z.string().trim().max(300).optional().or(z.literal("")),
  // Anti-spam
  website: z.string().max(200).optional(), // honeypot: bots preenchem
  elapsedMs: z.number().int().nonnegative().max(1000 * 60 * 60 * 6),
  captchaAnswer: z.string().trim().max(10),
  captchaA: z.number().int().min(1).max(9),
  captchaB: z.number().int().min(1).max(9),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Tempo mínimo de preenchimento (bots enviam quase instantaneamente). */
export const MIN_FILL_MS = 2500;
/** Máximo de envios por visitante por hora. */
export const MAX_PER_HOUR = 3;

export function hashIp(ip: string): string {
  return createHash("sha256").update(`liberato:${ip}`).digest("hex").slice(0, 32);
}

export type SpamCheck = { ok: true } | { ok: false; reason: "spam" | "tooFast" | "captcha" };

export function checkAntiSpam(data: LeadInput): SpamCheck {
  if (data.website && data.website.trim() !== "") return { ok: false, reason: "spam" };
  if (data.elapsedMs < MIN_FILL_MS) return { ok: false, reason: "tooFast" };
  const expected = data.captchaA + data.captchaB;
  const given = Number.parseInt(data.captchaAnswer.replace(/\D/g, ""), 10);
  if (!Number.isFinite(given) || given !== expected) return { ok: false, reason: "captcha" };
  return { ok: true };
}

export async function insertLead(data: LeadInput, ipHash: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_HOUR) return { ok: false as const, reason: "rateLimited" as const };
  }

  const { data: inserted, error } = await supabaseAdmin.from("leads").insert({
    name: data.name,
    company: data.company,
    country: data.country,
    email: data.email || null,
    phone: data.phone,
    service_slug: data.serviceSlug,
    service_title: data.serviceTitle || null,
    message: data.message || null,
    language: data.language || null,
    source_path: data.sourcePath || null,
    ip_hash: ipHash,
  }).select("id").single();

  if (error) {
    console.error("lead insert failed", error.message);
    return { ok: false as const, reason: "error" as const };
  }

  await notifyNewLead(data, inserted?.id ?? null);
  await confirmByWhatsApp(data);

  return { ok: true as const };
}

async function notifyNewLead(data: LeadInput, leadId: string | null) {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("lead-notification", "contato@liberatoconsulting.com.br", {
      templateData: {
        name: data.name,
        company: data.company,
        country: data.country,
        email: data.email || "",
        phone: data.phone,
        serviceTitle: data.serviceTitle || "",
        serviceSlug: data.serviceSlug,
        message: data.message || "",
        language: data.language || "",
        sourcePath: data.sourcePath || "",
      },
      ...(leadId ? { idempotencyKey: `lead-notification-${leadId}-${crypto.randomUUID().slice(0, 8)}` } : {}),
      ...(data.email ? { replyTo: data.email } : {}),
    });
  } catch (err) {
    console.error("lead notification email failed", err);
  }
}

/** Confirma o contato pelo WhatsApp quando o telefone informado permite. */
async function confirmByWhatsApp(data: LeadInput) {
  if (!data.phone) return;
  try {
    const { sendWhatsAppMessage } = await import("./bulletin.server");
    const first = (data.name || "").split(" ")[0] || "";
    const text =
      `Olá ${first}! Recebemos o seu contato na Liberato Consulting` +
      `${data.serviceTitle ? ` sobre ${data.serviceTitle}` : ""}. ` +
      `Nossa equipe responde em breve.`;
    await sendWhatsAppMessage({
      to: data.phone,
      caption: text,
      templateName: "contato_confirmacao",
      templateParams: [first || "cliente", data.serviceTitle || "sua solicitação"],
    });
  } catch (err) {
    console.error("lead whatsapp confirmation failed", err);
  }
}
