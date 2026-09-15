import { createHash } from "node:crypto";
import { z } from "zod";
import { isValidPhone, PHONE_ERROR } from "./validation";

const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB

export const applicationSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  phone: z.string().trim().refine(isValidPhone, PHONE_ERROR),
  email: z.string().trim().email().max(255),
  area: z.string().trim().min(2).max(120),
  linkedin: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(v), {
      message: "invalidLinkedin",
    })
    .optional()
    .or(z.literal("")),
  resumeName: z.string().trim().min(1).max(200),
  resumeType: z.string().trim().max(120).optional().or(z.literal("")),
  resumeBase64: z.string().min(1).max(Math.ceil((MAX_FILE_BYTES * 4) / 3) + 1024),
  language: z.string().trim().max(8).optional().or(z.literal("")),
  sourcePath: z.string().trim().max(300).optional().or(z.literal("")),
  // Anti-spam
  website: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative().max(1000 * 60 * 60 * 6),
  captchaAnswer: z.string().trim().max(10),
  captchaA: z.number().int().min(1).max(9),
  captchaB: z.number().int().min(1).max(9),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const MIN_FILL_MS = 2500;
export const MAX_PER_HOUR = 3;

export function hashIp(ip: string): string {
  return createHash("sha256").update(`liberato:${ip}`).digest("hex").slice(0, 32);
}

export type SpamCheck =
  | { ok: true }
  | { ok: false; reason: "spam" | "tooFast" | "captcha" };

export function checkAntiSpam(data: ApplicationInput): SpamCheck {
  if (data.website && data.website.trim() !== "") return { ok: false, reason: "spam" };
  if (data.elapsedMs < MIN_FILL_MS) return { ok: false, reason: "tooFast" };
  const expected = data.captchaA + data.captchaB;
  const given = Number.parseInt(data.captchaAnswer.replace(/\D/g, ""), 10);
  if (!Number.isFinite(given) || given !== expected) return { ok: false, reason: "captcha" };
  return { ok: true };
}

const ALLOWED_EXT = ["pdf", "doc", "docx", "rtf", "odt"];

// O tipo do arquivo é definido pelo servidor a partir da extensão — nunca pelo
// valor enviado pelo visitante, que poderia servir HTML/SVG malicioso.
const RESUME_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  odt: "application/vnd.oasis.opendocument.text",
};

export async function saveApplication(data: ApplicationInput, ipHash: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const ext = (data.resumeName.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) return { ok: false as const, reason: "fileType" as const };

  const bytes = Buffer.from(data.resumeBase64, "base64");
  if (bytes.byteLength === 0) return { ok: false as const, reason: "fileType" as const };
  if (bytes.byteLength > MAX_FILE_BYTES) return { ok: false as const, reason: "fileSize" as const };

  if (ipHash) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_HOUR) return { ok: false as const, reason: "rateLimited" as const };
  }

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const upload = await supabaseAdmin.storage.from("resumes").upload(path, bytes, {
    contentType: RESUME_MIME[ext] ?? "application/octet-stream",
    upsert: false,
  });
  if (upload.error) {
    console.error("resume upload failed", upload.error.message);
    return { ok: false as const, reason: "error" as const };
  }

  const { data: inserted, error } = await supabaseAdmin.from("job_applications").insert({
    full_name: data.fullName,
    phone: data.phone,
    email: data.email,
    interest_area: data.area,
    linkedin_url: data.linkedin || null,
    resume_path: path,
    resume_filename: data.resumeName,
    language: data.language || null,
    source_path: data.sourcePath || null,
    ip_hash: ipHash,
  }).select("id").single();

  if (error) {
    console.error("application insert failed", error.message);
    return { ok: false as const, reason: "error" as const };
  }

  await notifyNewApplication(data, inserted?.id ?? null);

  return { ok: true as const };
}

async function notifyNewApplication(data: ApplicationInput, applicationId: string | null) {
  try {
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    await sendTemplateEmail("application-notification", "contato@liberatoconsulting.com.br", {
      templateData: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        area: data.area,
        linkedin: data.linkedin || "",
        resumeName: data.resumeName,
        language: data.language || "",
        sourcePath: data.sourcePath || "",
      },
      ...(applicationId ? { idempotencyKey: `application-notification-${applicationId}-${crypto.randomUUID().slice(0, 8)}` } : {}),
      replyTo: data.email,
    });
  } catch (err) {
    console.error("application notification email failed", err);
  }
}

/** Confirma o recebimento do currículo pelo WhatsApp. */
async function confirmApplicationByWhatsApp(data: ApplicationInput) {
  if (!data.phone) return;
  try {
    const { sendWhatsAppMessage } = await import("./bulletin.server");
    const first = (data.fullName || "").split(" ")[0] || "";
    const text = `Olá ${first}! Recebemos o seu currículo na Liberato Consulting. Vamos avaliar o seu perfil e entramos em contato.`;
    await sendWhatsAppMessage({
      to: data.phone,
      caption: text,
      templateName: "curriculo_confirmacao",
      templateParams: [first || "candidato"],
    });
  } catch (err) {
    console.error("application whatsapp confirmation failed", err);
  }
}
