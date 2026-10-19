import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { FormLinkBar } from "@/components/SendFormLinkDialog";
import { deleteSatisfaction, listSatisfaction } from "@/lib/satisfaction.functions";
import { summarize, type SurveyRow } from "@/lib/satisfaction";

export const Route = createFileRoute("/admin/projetos_/satisfacao")({
  head: () => ({ meta: [{ title: "Satisfação do cliente — Painel Liberato Consulting" }, { name: "robots", content: "noindex" }] }),
  component: SatisfactionPage,
});

const PERIODS = [
  { v: "all", label: "Todo o período" },
  { v: "30", label: "Últimos 30 dias" },
  { v: "90", label: "Últimos 90 dias" },
  { v: "365", label: "Últimos 12 meses" },
];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SatisfactionPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["satisfaction"], queryFn: () => listSatisfaction(), retry: false });
  const [period, setPeriod] = useState("all");
  const [kindFilter, setKindFilter] = useState<"all" | "executado" | "nao_executado">("all");
  const rows = useMemo(() => {
    const all = q.data ?? [];
    if (period === "all") return all;
    const since = Date.now() - Number(period) * 86400_000;
    return all.filter((r) => new Date(r.created_at).getTime() >= since);
  }, [q.data, period]);
  const s = summarize(rows);
  const del = useMutation({
    mutationFn: (id: string) => deleteSatisfaction({ data: { id } }),
    onSuccess: () => {
      toast.success("Resposta excluída.");
      void qc.invalidateQueries({ queryKey: ["satisfaction"] });
    },
  });

  const monthly = useMemo(() => {
    const map = new Map<string, { mes: string; Executado: number; "Não executado": number }>();
    for (const r of [...rows].reverse()) {
      const mes = r.created_at.slice(0, 7);
      const cur = map.get(mes) ?? { mes, Executado: 0, "Não executado": 0 };
      if (r.kind === "executado") cur.Executado += 1;
      else cur["Não executado"] += 1;
      map.set(mes, cur);
    }
    return [...map.values()];
  }, [rows]);

  const npsData = [
    { name: "Promotores (9–10)", value: s.exec.promoters, color: "hsl(142 60% 40%)" },
    { name: "Neutros (7–8)", value: s.exec.passives, color: "hsl(45 90% 50%)" },
    { name: "Detratores (0–6)", value: s.exec.detractors, color: "hsl(0 70% 50%)" },
  ];
  const avgData = [
    { name: "Qualidade/resultados", nota: s.exec.quality ?? 0 },
    { name: "Atendimento consultor", nota: s.exec.service ?? 0 },
    { name: "Proposta (não exec.)", nota: s.non.proposal ?? 0 },
    { name: "Atendimento (não exec.)", nota: s.non.service ?? 0 },
  ];
  const listed = rows.filter((r) => kindFilter === "all" || r.kind === kindFilter);
  const fmt = (v: number | null, suf = "") => (v == null ? "—" : `${v}${suf}`);

  return (
    <AdminShell title="5. Satisfação do cliente" description="Dashboard das pesquisas de satisfação de serviços executados e não executados." requireAdmin>
      <div className="grid gap-3">
        <FormLinkBar form="executado" />
        <FormLinkBar form="nao_executado" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.v}
            onClick={() => setPeriod(p.v)}
            className={`rounded-full border px-3 py-1 text-sm ${period === p.v ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Respostas" value={String(s.total)} hint={`${s.exec.count} executados · ${s.non.count} não executados`} />
        <Kpi label="NPS" value={fmt(s.exec.nps)} hint="De −100 a +100 (serviços executados)" />
        <Kpi label="Satisfação (CSAT)" value={fmt(s.exec.csat, "%")} hint="Notas 4 e 5 de 5" />
        <Kpi label="Nota média" value={fmt(s.exec.quality, " / 5")} hint="Qualidade e resultados" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h2 className="font-display font-semibold">Recomendação (NPS)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={npsData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                  {npsData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {npsData.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1">
                <span className="size-3 rounded-full" style={{ background: d.color }} /> {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h2 className="font-display font-semibold">Notas médias (1 a 5)</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={avgData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="nota" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h2 className="font-display font-semibold">Motivos de não contratação</h2>
          {s.non.reasons.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Sem respostas no período.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={s.non.reasons}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Respostas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h2 className="font-display font-semibold">Respostas por mês</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Executado" stackId="a" fill="hsl(var(--accent))" />
                <Bar dataKey="Não executado" stackId="a" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display font-semibold">Respostas recebidas</h2>
          <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={kindFilter} onChange={(e) => setKindFilter(e.target.value as never)}>
            <option value="all">Todas</option>
            <option value="executado">Serviço executado</option>
            <option value="nao_executado">Serviço não executado</option>
          </select>
        </div>
        {q.isLoading ? <p className="mt-4 text-sm text-muted-foreground">Carregando…</p> : null}
        {!q.isLoading && listed.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Nenhuma resposta ainda.</p> : null}
        <div className="mt-4 divide-y divide-border">
          {listed.map((r: SurveyRow) => (
            <div key={r.id} className="flex flex-wrap items-start gap-3 py-3 text-sm">
              <div className="min-w-[200px] flex-1">
                <p className="font-medium">
                  {r.company} · {r.respondent_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")} · {r.email}
                  {r.service ? ` · ${r.service}` : ""}
                </p>
                {r.comment ? <p className="mt-1 italic text-muted-foreground">“{r.comment}”</p> : null}
              </div>
              <div className="text-xs">
                <span className="rounded-full bg-secondary px-2 py-0.5">{r.kind === "executado" ? "Executado" : "Não executado"}</span>
                {r.kind === "executado" ? (
                  <p className="mt-1">Qualidade {r.score1}/5 · Atendimento {r.score2}/5 · NPS {r.score3}</p>
                ) : (
                  <p className="mt-1">Proposta {r.score1}/5 · Atendimento {r.score3}/5 · {r.reason}</p>
                )}
              </div>
              <button
                aria-label="Excluir resposta"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => confirm("Excluir esta resposta?") && del.mutate(r.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
