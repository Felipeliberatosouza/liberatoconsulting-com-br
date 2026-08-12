import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  BULLETIN_JOB,
  NEWSLETTER_JOB,
  getWeeklySchedules,
  saveWeeklySchedule,
} from "@/lib/schedule.functions";

const DAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const field =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

type Slot = { dow: number; hour: number; minute: number };

/**
 * Bloco do painel (somente administrador) para definir o dia da semana e o
 * horário de Brasília em que o Boletim Semanal e a Newsletter são enviados.
 */
export function ScheduleSettings() {
  const q = useQuery({ queryKey: ["weekly-schedules"], queryFn: () => getWeeklySchedules() });

  return (
    <div className="mt-10 rounded-lg border border-border bg-background p-6">
      <h2 className="font-display text-lg font-bold">Envios automáticos</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Defina o dia da semana e o horário (horário de Brasília) em que cada envio é disparado
        automaticamente para os inscritos ativos.
      </p>

      {q.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">Carregando agendamentos…</p>
      ) : q.error ? (
        <p className="mt-4 text-sm text-destructive">Não foi possível carregar os agendamentos.</p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ScheduleForm
            title="Boletim Semanal"
            job={BULLETIN_JOB}
            initial={q.data!.bulletin}
            onSaved={() => q.refetch()}
          />
          <ScheduleForm
            title="Newsletter"
            job={NEWSLETTER_JOB}
            initial={q.data!.newsletter}
            onSaved={() => q.refetch()}
          />
        </div>
      )}
    </div>
  );
}

function ScheduleForm({
  title,
  job,
  initial,
  onSaved,
}: {
  title: string;
  job: typeof BULLETIN_JOB | typeof NEWSLETTER_JOB;
  initial: Slot;
  onSaved: () => void;
}) {
  const [dow, setDow] = useState(initial.dow);
  const [time, setTime] = useState(
    `${String(initial.hour).padStart(2, "0")}:${String(initial.minute).padStart(2, "0")}`,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDow(initial.dow);
    setTime(`${String(initial.hour).padStart(2, "0")}:${String(initial.minute).padStart(2, "0")}`);
  }, [initial.dow, initial.hour, initial.minute]);

  async function save() {
    const [h, m] = time.split(":");
    setSaving(true);
    try {
      const res = await saveWeeklySchedule({
        data: { job, dow, hour: Number(h), minute: Number(m) },
      });
      if (res.ok) {
        toast.success(`${title}: agendamento atualizado.`);
        onSaved();
      } else {
        toast.error(res.error || "Não foi possível salvar.");
      }
    } catch {
      toast.error("Não foi possível salvar o agendamento.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-border p-4">
      <h3 className="font-display text-base font-bold">{title}</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="text-muted-foreground">Dia da semana</span>
          <select className={`${field} mt-1`} value={dow} onChange={(e) => setDow(Number(e.target.value))}>
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Horário (Brasília)</span>
          <input
            type="time"
            className={`${field} mt-1`}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
      >
        {saving ? "Salvando…" : "Salvar agendamento"}
      </button>
    </div>
  );
}
