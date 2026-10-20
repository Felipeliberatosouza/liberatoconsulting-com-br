import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AdminShell } from "@/components/AdminShell";
import { getClientTimeline, listClientUsage } from "@/lib/activity.functions";

export const Route = createFileRoute("/admin/uso")({
  head: () => ({
    meta: [
      { title: "Uso por cliente — Liberato Consulting" },
      { name: "description", content: "Ferramentas, downloads e leituras de cada cliente." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Uso por cliente — Liberato Consulting" },
      { property: "og:description", content: "Ferramentas, downloads e leituras de cada cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UsagePage,
});

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "—");
const show = (v: unknown) => String(v ?? "");

function KeyValues({ title, data }: { title: string; data: Record<string, string | number | boolean | null> }) {
  const entries = Object.entries(data).map(([k, v]) => [k.replace(/^_context › /, ""), v] as const);
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="break-all">{show(v)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function UsagePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["client-usage"], queryFn: () => listClientUsage(), retry: false });
  const timeline = useQuery({
    queryKey: ["client-timeline", selected],
    queryFn: () => getClientTimeline({ data: { userId: selected! } }),
    enabled: !!selected,
  });
  const rows = useMemo(() => {
    const n = search.trim().toLowerCase();
    return (list.data ?? []).filter((r) => !n || `${r.name} ${r.email} ${r.company}`.toLowerCase().includes(n));
  }, [list.data, search]);
  const current = rows.find((r) => r.userId === selected) ?? list.data?.find((r) => r.userId === selected);

  return (
    <AdminShell title="Uso por cliente" description="Veja o que cada cliente usou: ferramentas calculadas (com dados e resultados), downloads, newsletters, boletins e artigos lidos.">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, e-mail ou empresa"
        className="mb-6 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Ferramentas</th>
                <th className="p-3">Downloads</th>
                <th className="p-3">Leituras</th>
                <th className="p-3">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && <tr><td className="p-3" colSpan={5}>Carregando…</td></tr>}
              {rows.map((r) => (
                <tr
                  key={r.userId}
                  onClick={() => setSelected(r.userId)}
                  className={`cursor-pointer border-t border-border hover:bg-secondary/60 ${selected === r.userId ? "bg-secondary" : ""}`}
                >
                  <td className="p-3"><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.email} {r.company && `· ${r.company}`}</div></td>
                  <td className="p-3">{r.toolRuns}</td>
                  <td className="p-3">{r.downloads}</td>
                  <td className="p-3">{r.views}</td>
                  <td className="p-3 text-xs">{fmt(r.lastActivity)}</td>
                </tr>
              ))}
              {!list.isLoading && !rows.length && <tr><td className="p-3 text-muted-foreground" colSpan={5}>Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="rounded-lg border border-border bg-background p-5">
          {!selected && <p className="text-muted-foreground">Clique em um cliente para ver a linha do tempo.</p>}
          {selected && (
            <>
              <h2 className="font-display text-xl font-bold">{current?.name}</h2>
              <p className="text-sm text-muted-foreground">{current?.email}</p>
              {timeline.isLoading && <p className="mt-4">Carregando…</p>}
              <ol className="mt-5 space-y-4">
                {(timeline.data ?? []).map((it) => (
                  <li key={`${it.kind}-${it.id}`} className="border-l-2 border-accent pl-4">
                    <p className="text-xs text-muted-foreground">{fmt(it.at)}</p>
                    <p className="font-medium">{it.title}: <span className="font-normal">{it.detail}</span></p>
                    {it.kind === "tool_run" && (
                      <details className="mt-2 rounded-md bg-secondary/50 p-3">
                        <summary className="cursor-pointer text-sm font-medium">Ver dados e resultados</summary>
                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                          <KeyValues title="Dados informados" data={it.inputs ?? {}} />
                          <KeyValues title="Resultados" data={it.results ?? {}} />
                        </div>
                      </details>
                    )}
                  </li>
                ))}
                {timeline.data && !timeline.data.length && <p className="text-muted-foreground">Sem atividades registradas.</p>}
              </ol>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
