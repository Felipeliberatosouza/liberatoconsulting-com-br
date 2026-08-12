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

/** Agendamentos atuais dos envios automáticos (somente administrador). */
export const getWeeklySchedules = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_weekly_schedules");
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Array<{ job_name: string; schedule: string }>;
    const pick = (job: string) =>
      fromCron(rows.find((r) => r.job_name === job)?.schedule ?? "0 13 * * 1");
    return {
      bulletin: pick(BULLETIN_JOB),
      newsletter: pick(NEWSLETTER_JOB),
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
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("set_weekly_schedule", {
      _job: data.job,
      _schedule: toCron(data.dow, data.hour, data.minute),
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
