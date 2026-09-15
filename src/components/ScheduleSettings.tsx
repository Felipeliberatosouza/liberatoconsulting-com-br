import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  BULLETIN_JOB,
  NEWSLETTER_JOB,
  getWeeklySchedules,
  saveWeeklySchedule,
  type Frequency,
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

const FREQUENCY_LABELS: Array<{ value: Frequency; label: string }> = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
];

const field =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

type Slot = {
  dow: number;
  hour: number;
  minute: number;
  frequency?: Frequency;
  autoGenerate?: boolean;
  paused?: boolean;
  lastRun?: { at?: string; result?: string } | null;
};

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
      <p className="mt-2 text-sm text-muted-foreground">
        Os indicadores econômicos (página Dados do Brasil e Boletim Semanal) são atualizados
        automaticamente toda segunda-feira às 10h, independentemente do dia de envio escolhido.
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
            showFrequency
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
  showFrequency = false,
  onSaved,
}: {
  title: string;
  job: typeof BULLETIN_JOB | typeof NEWSLETTER_JOB;
  initial: Slot;
  showFrequency?: boolean;
  onSaved: () => void;
}) {
  const [dow, setDow] = useState(initial.dow);
  const [frequency, setFrequency] = useState<Frequency>(initial.frequency ?? "weekly");
  const [autoGenerate, setAutoGenerate] = useState(initial.autoGenerate !== false);
  const [time, setTime] = useState(
    `${String(initial.hour).padStart(2, "0")}:${String(initial.minute).padStart(2, "0")}`,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDow(initial.dow);
    setFrequency(initial.frequency ?? "weekly");
    setAutoGenerate(initial.autoGenerate !== false);
    setTime(`${String(initial.hour).padStart(2, "0")}:${String(initial.minute).padStart(2, "0")}`);
  }, [initial.dow, initial.hour, initial.minute, initial.frequency, initial.autoGenerate]);

  async function save() {
    const [h, m] = time.split(":");
    setSaving(true);
    try {
      const res = await saveWeeklySchedule({
        data: {
          job,
          dow,
          hour: Number(h),
          minute: Number(m),
          ...(showFrequency ? { frequency, autoGenerate } : {}),
        },
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
        {showFrequency && (
          <label className="text-sm sm:col-span-2">
            <span className="text-muted-foreground">Frequência</span>
            <select
              className={`${field} mt-1`}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              {FREQUENCY_LABELS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        )}
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
      {showFrequency && (
        <>
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={autoGenerate}
              onChange={(e) => setAutoGenerate(e.target.checked)}
            />
            <span>
              Gerar a edição automaticamente com IA quando não houver rascunho
              <span className="block text-xs text-muted-foreground">
                Reúne os conteúdos publicados desde o último envio. Sem conteúdo novo, o envio é
                pulado.
              </span>
            </span>
          </label>
          <p className="mt-3 text-xs text-muted-foreground">
            No modo quinzenal ou mensal, o envio ocorre no dia e horário escolhidos, respeitando o
            intervalo desde a última newsletter enviada.
          </p>
          {initial.paused && (
            <p className="mt-3 text-xs text-destructive">
              Geração automática pausada após falha de IA. Salve com a opção marcada para reativar.
            </p>
          )}
          {initial.lastRun?.at && (
            <p className="mt-3 text-xs text-muted-foreground">
              Último disparo automático: {new Date(initial.lastRun.at).toLocaleString("pt-BR")} —{" "}
              {initial.lastRun.result}
            </p>
          )}
        </>
      )}
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

