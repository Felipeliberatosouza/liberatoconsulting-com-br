import type { Database } from "@/integrations/supabase/types";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Stage = Row<"fechou_stages">;
export type Deal = Row<"fechou_deals">;
export type Member = Row<"fechou_members">;
export type Goal = Row<"fechou_goals">;
export type DealInput = Pick<
  Deal,
  | "company"
  | "contact"
  | "email"
  | "phone"
  | "segment"
  | "linkedin"
  | "instagram"
  | "founded_on"
  | "birth_date"
  | "notes"
  | "amount"
  | "owner_id"
  | "stage_id"
>;
export const demoWorkspace = "demo";
export const demoMember: Member = {
  workspace_id: demoWorkspace,
  user_id: "ana",
  name: "Ana Ribeiro",
  role: "admin",
  active: true,
};
export const demoStages: Stage[] = [
  "Prospecção",
  "Qualificação",
  "Proposta",
  "Negociação",
  "Ganho",
  "Perdido",
].map((name, i) => ({
  id: String(i),
  workspace_id: demoWorkspace,
  name,
  position: i + 1,
  kind: i < 4 ? "open" : i === 4 ? "won" : "lost",
  target_days: [3, 5, 7, 5, 3, 3][i] ?? 3,
}));
export const emptyDeal = (stage_id = "", owner_id = ""): DealInput => ({
  stage_id,
  owner_id,
  company: "",
  contact: "",
  email: "",
  phone: "",
  segment: "",
  linkedin: "",
  instagram: "",
  founded_on: null,
  birth_date: null,
  notes: "",
  amount: 0,
});
export function demoDeals(now = Date.now()): Deal[] {
  return [
    "Aurora Comércio",
    "Estúdio Horizonte",
    "Vértice Logística",
    "Ponto Norte",
    "Nexo Alimentos",
    "Rede Prisma",
    "Casa Ipê",
    "Rota Viva",
  ].map((company, i) => ({
    ...emptyDeal(String([0, 0, 1, 2, 3, 4, 4, 5][i]), demoMember.user_id),
    workspace_id: demoWorkspace,
    id: `example-${i}`,
    company,
    contact: ["Júlia Prado", "Pedro Lima", "Marina Costa", "Lucas Dias"][i % 4] ?? "",
    amount: [4900, 8200, 9200, 14800, 18500, 22000, 7500, 3500][i] ?? 0,
    entered_at: new Date(now - ([1, 4, 1, 6, 2, 1, 0, 1][i] ?? 0) * 86400000).toISOString(),
    created_at: new Date(now - 10 * 86400000).toISOString(),
  }));
}
export function urgency(stage: Stage | undefined, entered: string, now = Date.now()) {
  if (!stage || stage.kind !== "open") return "closed";
  const elapsed = (now - Date.parse(entered)) / 86400000;
  return elapsed >= stage.target_days
    ? "late"
    : elapsed >= stage.target_days * 0.75
      ? "soon"
      : "ok";
}
export function metrics(deals: Deal[], stages: Stage[]) {
  const kinds = new Map(stages.map((s) => [s.id, s.kind]));
  const won = deals.filter((d) => kinds.get(d.stage_id) === "won");
  const lost = deals.filter((d) => kinds.get(d.stage_id) === "lost");
  const sum = (rows: Deal[]) => rows.reduce((n, d) => n + Number(d.amount), 0);
  const revenue = sum(won);
  return {
    revenue,
    pipeline: sum(deals.filter((d) => kinds.get(d.stage_id) === "open")),
    ticket: won.length ? revenue / won.length : 0,
    conversion: won.length + lost.length ? (100 * won.length) / (won.length + lost.length) : 0,
    days: won.length
      ? won.reduce(
          (n, d) => n + Math.max(0, Date.parse(d.entered_at) - Date.parse(d.created_at)) / 86400000,
          0,
        ) / won.length
      : 0,
  };
}
export type DealImport = DealInput & { id?: string };

export const managed = (role?: string) => role === "admin" || role === "manager";
export function importDeal(
  row: Record<string, unknown>,
  stages: Stage[],
  owner: string,
  existing: Deal[] = [],
): DealImport {
  const get = (key: string) => String(row[key] ?? "").trim();
  const id = get("id");
  const previous = id ? existing.find((d) => d.id === id) : undefined;
  if (id && !previous) throw new Error("Oportunidade não encontrada pelo ID informado.");
  const cell = (key: string, fallback = "") => (Object.hasOwn(row, key) ? get(key) : fallback);
  const date = (key: string, fallback: string | null) => {
    const value = cell(key, fallback ?? "");
    if (!value) return null;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value
    )
      throw new Error("Use AAAA-MM-DD para as datas.");
    return value;
  };
  const stage =
    stages.find((s) => s.name.toLowerCase() === get("etapa").toLowerCase()) ??
    (get("etapa")
      ? undefined
      : previous
        ? stages.find((s) => s.id === previous.stage_id)
        : stages[0]);
  const value = cell("valor", String(previous?.amount ?? 0));
  const amount = Number(value.includes(",") ? value.replaceAll(".", "").replace(",", ".") : value);
  const company = cell("empresa", previous?.company);
  if (
    !stage ||
    !company ||
    company.length > 160 ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount >= 1e12
  )
    throw new Error("Confira empresa, etapa e valor na planilha.");
  return {
    ...emptyDeal(stage.id, previous?.owner_id ?? owner),
    ...(id ? { id } : {}),
    founded_on: date("fundacao", previous?.founded_on ?? null),
    birth_date: date("aniversario", previous?.birth_date ?? null),
    company,
    contact: cell("contato", previous?.contact),
    email: cell("email", previous?.email),
    phone: cell("telefone", previous?.phone),
    segment: cell("segmento", previous?.segment),
    linkedin: cell("linkedin", previous?.linkedin),
    instagram: cell("instagram", previous?.instagram),
    notes: cell("observacoes", previous?.notes),
    amount,
  };
}
export const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Upcoming anniversaries (company founding or contact birthday) within `days`, soonest first. */
export function upcomingDates(deals: Deal[], today: Date, days = 30) {
  const base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const out: { deal: Deal; kind: "empresa" | "contato"; inDays: number }[] = [];
  for (const deal of deals)
    for (const [kind, value] of [["empresa", deal.founded_on], ["contato", deal.birth_date]] as const) {
      if (!value) continue;
      const [, m = 1, d = 1] = value.split("-").map(Number);
      let next = Date.UTC(today.getUTCFullYear(), m - 1, d);
      if (next < base) next = Date.UTC(today.getUTCFullYear() + 1, m - 1, d);
      const inDays = Math.round((next - base) / 86400000);
      if (inDays <= days) out.push({ deal, kind, inDays });
    }
  return out.sort((a, b) => a.inDays - b.inDays);
}
