import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isValidPhone } from "./validation";

export type PublicConsultant = {
  id: string;
  full_name: string;
  photo_url: string;
  headline: string;
  education: string;
  experience: string;
  clients: string;
  works: string;
  specialties: string[];
  segments: string[];
  orcid_url: string;
  lattes_url: string;
  website_url: string;
  sort_order: number;
};

export type ConsultantRecord = Omit<PublicConsultant, "sort_order"> & {
  contact_email: string;
  position: number;
  published: boolean;
};

/** Consultores publicados (sem expor e-mail de contato). */
export const listPublicConsultants = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicConsultant[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("list_public_consultants" as never);
    if (error) return [];
    return ((data ?? []) as PublicConsultant[]).map((c) => ({
      ...c,
      specialties: Array.isArray(c.specialties) ? c.specialties : [],
      segments: Array.isArray(c.segments) ? c.segments : [],
      orcid_url: c.orcid_url ?? "",
      lattes_url: c.lattes_url ?? "",
      website_url: c.website_url ?? "",
    }));
  },
);

/** Lista completa para o painel (somente administradores). */
export const listConsultants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConsultantRecord[]> => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("consultants")
      .select("*")
      .order("position", { ascending: true })
      .order("full_name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as ConsultantRecord[];
  });

const consultantSchema = z.object({
  id: z.string().uuid().optional(),
  full_name: z.string().trim().min(2).max(160),
  photo_url: z.string().max(3_000_000).default(""),
  headline: z.string().trim().max(300).default(""),
  education: z.string().trim().max(4000).default(""),
  experience: z.string().trim().max(6000).default(""),
  clients: z.string().trim().max(4000).default(""),
  works: z.string().trim().max(6000).default(""),
  specialties: z.array(z.string().trim().max(160)).max(60).default([]),
  segments: z.array(z.string().trim().max(120)).max(40).default([]),
  orcid_url: z.string().trim().max(300).default(""),
  lattes_url: z.string().trim().max(300).default(""),
  website_url: z.string().trim().max(300).default(""),
  contact_email: z.string().trim().email().max(255).or(z.literal("")).default(""),
  position: z.number().int().min(0).max(9999).default(0),
  published: z.boolean().default(true),
});

export const saveConsultant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => consultantSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { id, ...row } = data;
    const { error } = id
      ? await context.supabase.from("consultants").update(row).eq("id", id)
      : await context.supabase.from("consultants").insert(row);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const deleteConsultant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase.from("consultants").delete().eq("id", data.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

const contactSchema = z.object({
  consultantId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().refine(isValidPhone, "Use o formato +55 (11) 9999-9999."),
  company: z.string().trim().max(160).default(""),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative().max(1000 * 60 * 60 * 6),
});

/** Envia uma mensagem ao consultor sem revelar o contato dele. */
export const contactConsultant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    if (data.website && data.website.trim() !== "") return { ok: true as const };
    if (data.elapsedMs < 2500) {
      return { ok: false as const, error: "Envio muito rápido. Tente novamente." };
    }
    const { sendConsultantMessage } = await import("./consultants.server");
    try {
      return await sendConsultantMessage({
        consultantId: data.consultantId,
        fromName: data.name,
        fromEmail: data.email,
        phone: data.phone,
        company: data.company,
        message: data.message,
      });
    } catch (err) {
      console.error("[consultants] contact failed", err);
      return { ok: false as const, error: "Não foi possível enviar agora. Tente mais tarde." };
    }
  });
