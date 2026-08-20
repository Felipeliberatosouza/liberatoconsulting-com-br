import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const BULLETIN_JOB = "bulletin-weekly-mon-10";
export const NEWSLETTER_JOB = "newsletter-weekly-wed-10";

/** Offset fixo de Brasília em relação ao UTC (UTC-3). */
const BRT_OFFSET = 3;

/** Converte dia/hora de Brasília para a expressão cron em UTC. */
export function toCron(dow: number, hour: number, minute: number) {
  const utcHour = hour + BRT_OFFSET;
  const dayShift = Math.floor(utcHour / 24);
  return `${minute} ${utcHour % 24} * * ${(dow + dayShift + 7) % 7}`;
}

/** Converte a expressão cron (UTC) de volta para dia/hora de Brasília. */
export function fromCron(schedule: string) {
  const [min, hr, , , dw] = schedule.trim().split(/\s+/);
  const minute = Number(min) || 0;
  const utcHour = Number(hr) || 0;
  const utcDow = Number(dw) || 0;
  const local = utcHour - BRT_OFFSET;
  const dayShift = local < 0 ? -1 : 0;
  return {
    dow: (utcDow + dayShift + 7) % 7,
    hour: (local + 24) % 24,
    minute,
  };
}

export const FREQUENCIES = ["weekly", "biweekly", "monthly"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/** Agendamentos atuais dos envios automáticos (somente administrador). */
export const getWeeklySchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_weekly_schedules");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{ job_name: string; schedule: string }>;
    const pick = (job: string) =>
      fromCron(rows.find((r) => r.job_name === job)?.schedule ?? "0 13 * * 1");
    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", "newsletter_schedule")
      .maybeSingle();
    const stored = (settings?.value ?? {}) as {
      frequency?: string;
      autoGenerate?: boolean;
      paused?: boolean;
      lastRun?: { at?: string; result?: string };
    };
    const frequency = (FREQUENCIES as readonly string[]).includes(stored.frequency ?? "")
      ? (stored.frequency as Frequency)
      : ("weekly" as Frequency);
    return {
      bulletin: pick(BULLETIN_JOB),
      newsletter: {
        ...pick(NEWSLETTER_JOB),
        frequency,
        autoGenerate: stored.autoGenerate !== false,
        paused: stored.paused === true,
        lastRun: stored.lastRun ?? null,
      },
    };
  });


/** Atualiza dia e horário (horário de Brasília) de um dos envios automáticos. */
export const saveWeeklySchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        job: z.enum([BULLETIN_JOB, NEWSLETTER_JOB]),
        dow: z.number().int().min(0).max(6),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
        frequency: z.enum(FREQUENCIES).optional(),
        autoGenerate: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("set_weekly_schedule", {
      _job: data.job,
      _schedule: toCron(data.dow, data.hour, data.minute),
    });
    if (error) return { ok: false as const, error: error.message };
    if (data.job === NEWSLETTER_JOB && (data.frequency || data.autoGenerate !== undefined)) {
      const { data: row } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "newsletter_schedule")
        .maybeSingle();
      const current = (row?.value ?? {}) as Record<string, unknown>;
      const next: Record<string, unknown> = { ...current };
      if (data.frequency) next["frequency"] = data.frequency;
      if (data.autoGenerate !== undefined) {
        next["autoGenerate"] = data.autoGenerate;
        // Reativar a geração automática também retira a pausa por erro de IA.
        if (data.autoGenerate) next["paused"] = false;
      }
      const { error: settingsError } = await supabaseAdmin
        .from("site_settings")
        .upsert(
          { key: "newsletter_schedule", value: next as never },
          { onConflict: "key" },
        );
      if (settingsError) return { ok: false as const, error: settingsError.message };
    }

    return { ok: true as const };
  });
