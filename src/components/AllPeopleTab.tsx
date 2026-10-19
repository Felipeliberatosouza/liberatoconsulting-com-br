import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { listTeam } from "@/lib/users.functions";
import { listApplications, listLeads } from "@/lib/admin.functions";
import { listSubscribers } from "@/lib/newsletter.functions";
import { listBulletinSubscribers } from "@/lib/bulletin.functions";
import { listToolClients } from "@/lib/tools.functions";
import { listScopeSubmissions } from "@/lib/projects.functions";
import { PersonPanel } from "@/components/PersonPanel";

type Person = {
  key: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: Set<string>;
};

const TAG_TAB: Record<string, string> = {
  Administrador: "team",
  Consultor: "team",
  "Autor de artigos": "team",
  Newsletter: "subscribers",
  "Boletim Semanal": "bulletin",
  Ferramentas: "tools",
  "Escopo inicial": "scopes",
  Lead: "leads",
  Candidato: "applicants",
};

const ROLE_TAG: Record<string, string> = { admin: "Administrador", consultor: "Consultor", autor: "Autor de artigos" };

function safe<T>(fn: () => Promise<T>) {
  return async () => {
    try {
      return await fn();
    } catch {
      return [] as unknown as T;
    }
  };
}

function arr(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    for (const k of ["rows", "items", "data", "subscribers", "list"]) {
      if (Array.isArray((v as any)[k])) return (v as any)[k];
    }
  }
  return [];
}

export function AllPeopleTab({ onOpenTab }: { onOpenTab: (tab: string) => void }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [open, setOpen] = useState<Person | null>(null);
  const team = useQuery({ queryKey: ["all-team"], queryFn: safe(() => listTeam()) });
  const subs = useQuery({ queryKey: ["all-subs"], queryFn: safe(() => listSubscribers()) });
  const bull = useQuery({ queryKey: ["all-bull"], queryFn: safe(() => listBulletinSubscribers()) });
  const tools = useQuery({ queryKey: ["all-tools"], queryFn: safe(() => listToolClients()) });
  const scopes = useQuery({ queryKey: ["all-scopes"], queryFn: safe(() => listScopeSubmissions()) });
  const leads = useQuery({ queryKey: ["all-leads"], queryFn: safe(() => listLeads()) });
  const apps = useQuery({ queryKey: ["all-apps"], queryFn: safe(() => listApplications()) });

  const loading = [team, subs, bull, tools, scopes, leads, apps].some((x) => x.isLoading);

  const people = useMemo(() => {
    const map = new Map<string, Person>();
    const add = (r: any, t: string) => {
      const email = String(r.email ?? "").trim().toLowerCase();
      const name =
        r.full_name || r.name || r.respondent_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "";
      const phone = String(r.phone ?? r.whatsapp ?? "");
      const key = email || `${name}|${phone}`;
      if (!key.replace("|", "")) return;
      const p = map.get(key) ?? { key, name: "", email, phone: "", company: "", tags: new Set<string>() };
      p.name ||= name;
      p.phone ||= phone;
      p.company ||= String(r.company ?? "");
      p.tags.add(t);
      map.set(key, p);
    };
    for (const r of arr(team.data)) {
      const roles: string[] = r.roles ?? (r.role ? [r.role] : []);
      if (roles.length === 0) add(r, "Consultor");
      roles.forEach((role) => add(r, ROLE_TAG[role] ?? role));
    }
    arr(subs.data).forEach((r) => add(r, "Newsletter"));
    arr(bull.data).forEach((r) => add(r, "Boletim Semanal"));
    arr(tools.data).forEach((r) => add(r, "Ferramentas"));
    arr(scopes.data).forEach((r) => add(r, "Escopo inicial"));
    arr(leads.data).forEach((r) => add(r, "Lead"));
    arr(apps.data).forEach((r) => add(r, "Candidato"));
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [team.data, subs.data, bull.data, tools.data, scopes.data, leads.data, apps.data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    people.forEach((p) => p.tags.forEach((t) => (c[t] = (c[t] ?? 0) + 1)));
    return c;
  }, [people]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return people.filter(
      (p) =>
        (!tag || p.tags.has(tag)) &&
        (!term || [p.name, p.email, p.phone, p.company].some((v) => v.toLowerCase().includes(term))),
    );
  }, [people, q, tag]);

  return (
    <div className="space-y-4">
      {open && <PersonPanel person={open} onClose={() => setOpen(null)} />}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTag("")}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${!tag ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
        >
          Todos ({people.length})
        </button>
        {Object.keys(TAG_TAB).map((t) => (
          <button
            key={t}
            onClick={() => setTag(tag === t ? "" : t)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${tag === t ? "border-accent text-accent" : "border-border text-muted-foreground"}`}
          >
            {t} ({counts[t] ?? 0})
          </button>
        ))}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, e-mail, telefone ou empresa"
        className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {loading && <p className="text-sm text-muted-foreground">Carregando cadastros…</p>}
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Telefone</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">Vínculos (clique para gerenciar)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.key} className="border-t border-border align-top">
                <td className="px-3 py-2 font-medium">
                  <button className="text-left hover:text-accent hover:underline" onClick={() => setOpen(p)}>
                    {p.name || "—"}
                  </button>
                  <button
                    className="mt-1 block text-xs font-medium text-accent hover:underline"
                    onClick={() => setOpen(p)}
                  >
                    Gerenciar / excluir
                  </button>
                </td>
                <td className="px-3 py-2">{p.email || "—"}</td>
                <td className="px-3 py-2">{p.phone || "—"}</td>
                <td className="px-3 py-2">{p.company || "—"}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {[...p.tags].map((t) => (
                      <button
                        key={t}
                        onClick={() => onOpenTab(TAG_TAB[t] ?? "team")}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Nenhum cadastro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SimpleListTab({ kind }: { kind: "tools" | "scopes" }) {
  const query = useQuery({
    queryKey: ["simple-list", kind],
    queryFn: safe(() => (kind === "tools" ? listToolClients() : listScopeSubmissions()) as Promise<any>),
  });
  const rows = arr(query.data);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{rows.length} cadastro(s)</p>
      <div className="overflow-x-auto rounded-lg border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Telefone</th>
              <th className="px-3 py-2">Empresa</th>
              <th className="px-3 py-2">{kind === "tools" ? "Cargo / segmento" : "Cargo"}</th>
              <th className="px-3 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id ?? r.user_id ?? r.email} className="border-t border-border">
                <td className="px-3 py-2 font-medium">
                  {r.respondent_name || [r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-3 py-2">{r.email || "—"}</td>
                <td className="px-3 py-2">{r.phone || "—"}</td>
                <td className="px-3 py-2">{r.company || "—"}</td>
                <td className="px-3 py-2">
                  {kind === "tools" ? [r.job_title, r.segment].filter(Boolean).join(" · ") : r.respondent_role || "—"}
                </td>
                <td className="px-3 py-2">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
