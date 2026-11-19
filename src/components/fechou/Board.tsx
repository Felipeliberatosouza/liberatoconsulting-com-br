import { Prospecting } from "./Prospecting";
import { Assistant } from "./Assistant";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Funnel,
  List,
  Plus,
  Settings2,
  Search,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyDeal,
  importDeal,
  managed,
  metrics,
  money,
  urgency,
  type Deal,
  type DealInput,
  type DealImport,
  type Goal,
  type Member,
  type Stage,
} from "@/lib/fechou";

export const selectStyle = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const labelStyle = "grid gap-1.5 text-sm font-medium";
const statuses = { late: "Vencido", soon: "A vencer", ok: "No prazo", closed: "Encerrado" };
const statusClasses = {
  late: "text-destructive bg-destructive/10",
  soon: "text-foreground bg-accent/25",
  ok: "text-foreground bg-fechou-mint/20",
  closed: "text-muted-foreground bg-secondary",
};
const fields = [
  ["company", "Empresa"],
  ["contact", "Contato"],
  ["email", "E-mail"],
  ["phone", "Telefone"],
  ["segment", "Segmento"],
  ["linkedin", "LinkedIn"],
  ["instagram", "Instagram"],
  ["founded_on", "Fundação da empresa"],
  ["birth_date", "Aniversário do contato"],
] as const;
export function FechouLogo() {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-extrabold">
      <span className="grid size-9 place-items-center rounded-lg bg-fechou-mint text-ink">
        <Check className="size-5" strokeWidth={3} />
      </span>{" "}
      Fechou! <span className="text-fechou-coral">CRM</span>
    </span>
  );
}

type Props = {
  name: string;
  user: Member;
  stages: Stage[];
  deals: Deal[];
  members: Member[];
  goals: Goal[];
  demo?: boolean;
  branding?: React.ReactNode;
  header?: React.ReactNode;
  save: (input: DealInput, id?: string) => Promise<void>;
  saveStage: (id: string, name: string, days: number) => Promise<void>;
  saveGoal: (owner: string, month: string, amount: number) => Promise<void>;
  addMember?:
    ((email: string, name: string, role: "manager" | "seller") => Promise<void>) | undefined;
  updateMember?:
    ((id: string, role: "manager" | "seller", active: boolean) => Promise<void>) | undefined;
  importRows: (rows: DealImport[]) => Promise<void>;
};
export function Board(p: Props) {
  const [tab, setTab] = useState("Funil");
  const [stage, setStage] = useState("");
  const [owner, setOwner] = useState("");
  const [editor, setEditor] = useState<{ data: DealInput; id?: string }>();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [imported, setImported] = useState<DealImport[]>([]);
  const createdCount = imported.filter((d) => !d.id).length;
  const updatedCount = imported.length - createdCount;
  const canManage = managed(p.user.role);
  const stageById = new Map(p.stages.map((s) => [s.id, s]));
  const sellerRows = p.deals.filter((d) => !owner || owner === d.owner_id);
  const current = metrics(p.deals, p.stages);
  const periodRows = sellerRows.filter((d) => d.entered_at.startsWith(month));
  const upcoming = sellerRows.filter((d) =>
    ["late", "soon"].includes(urgency(stageById.get(d.stage_id), d.entered_at)),
  );
  const visible = (tab === "Alertas" ? upcoming : sellerRows).filter(
    (d) => tab !== "Funil" || !stage || stage === d.stage_id,
  );
  const tabs = [
    { name: "Funil", Icon: Funnel },
    { name: "Alertas", Icon: Bell },
    { name: "Resultados", Icon: TrendingUp },
    { name: "Planilhas", Icon: List },
    ...(!p.demo ? [{ name: "Prospecção", Icon: Search }] : []),
    ...(canManage ? [{ name: "Configuração", Icon: Settings2 }] : []),
  ];
  async function run(action: () => Promise<void>, ok: string) {
    setBusy(true);
    setFeedback("");
    try {
      await action();
      setFeedback(ok);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  function edit(d?: Deal) {
    setEditor(
      d
        ? {
            id: d.id,
            data: {
              ...emptyDeal(d.stage_id, d.owner_id),
              ...Object.fromEntries(
                Object.keys(emptyDeal()).map((key) => [key, d[key as keyof DealInput]]),
              ),
            },
          }
        : { data: emptyDeal(stage || p.stages[0]?.id, p.user.user_id) },
    );
  }
  async function read(file?: File) {
    if (!file) return;
    setImported([]);
    await run(async () => {
      if (!/\.(csv|xlsx)$/i.test(file.name) || file.size > 5_000_000)
        throw new Error("Selecione um arquivo CSV ou XLSX de até 5 MB.");
      const x = await import("xlsx");
      const workbook = /\.csv$/i.test(file.name)
        ? x.read(await file.text(), { type: "string", raw: true })
        : x.read(await file.arrayBuffer());
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
      if (!sheet) throw new Error("Nenhuma aba encontrada.");
      const rows = x.utils.sheet_to_json<Record<string, unknown>>(sheet);
      if (!rows.length || rows.length > 500)
        throw new Error("Inclua de 1 a 500 registros na planilha.");
      setImported(
        rows.map((row, i) => {
          try {
            return importDeal(
              Object.fromEntries(Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])),
              p.stages,
              p.user.user_id,
              p.deals,
            );
          } catch (e) {
            throw new Error(`Linha ${i + 2}: ${e instanceof Error ? e.message : "dado inválido"}`);
          }
        }),
      );
    }, "Planilha pronta para conferência.");
  }
  async function download(template: boolean, all = false) {
    const x = await import("xlsx");
    const rows = template
      ? [
          {
            id: "",
            empresa: "Empresa Exemplo",
            contato: "",
            email: "",
            telefone: "",
            segmento: "",
            linkedin: "",
            instagram: "",
            fundacao: "",
            aniversario: "",
            observacoes: "",
            etapa: p.stages[0]?.name ?? "",
            valor: 0,
          },
        ]
      : (all ? p.deals : periodRows).map((d) => ({
          id: d.id,
          empresa: d.company,
          contato: d.contact,
          email: d.email,
          telefone: d.phone,
          segmento: d.segment,
          linkedin: d.linkedin,
          instagram: d.instagram,
          fundacao: d.founded_on ?? "",
          aniversario: d.birth_date ?? "",
          observacoes: d.notes,
          etapa: stageById.get(d.stage_id)?.name,
          vendedor: p.members.find((m) => m.user_id === d.owner_id)?.name,
          valor: Number(d.amount),
        }));
    const workbook = x.utils.book_new();
    x.utils.book_append_sheet(workbook, x.utils.json_to_sheet(rows), "Oportunidades");
    x.writeFile(
      workbook,
      template ? "modelo-fechou.xlsx" : all ? "carteira-fechou.xlsx" : `resultados-${month}.xlsx`,
    );
  }
  return (
    <div className="bg-secondary/40 text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <FechouLogo />
          <div className="flex flex-wrap items-center gap-2">
            {p.demo && (
              <span className="rounded-md bg-fechou-mint/20 px-3 py-1 text-xs font-semibold">
                Demonstração · dados fictícios
              </span>
            )}
            {!p.demo && (
              <Assistant
                workspace={p.user.workspace_id}
                canManage={canManage}
                deals={p.deals}
                stages={p.stages}
                members={p.members}
                fill={(draft) =>
                  setEditor({
                    data: { ...emptyDeal(stage || p.stages[0]?.id, p.user.user_id), ...draft },
                  })
                }
              />
            )}{" "}
            {p.header}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 pt-8">
          <div className="min-w-0">
            {p.branding}
            <p className="mb-2 break-words text-xs font-semibold uppercase text-muted-foreground">
              {p.name}
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">Gestão comercial</h1>
          </div>
          <Button
            onClick={() => edit()}
            disabled={!p.stages.length}
            className="bg-fechou-coral text-ink hover:bg-fechou-coral/80"
          >
            <Plus /> Nova oportunidade
          </Button>
        </div>
        <nav aria-label="Áreas do CRM" className="flex flex-wrap gap-1 border-b border-border pb-2">
          {tabs.map(({ name, Icon }) => (
            <Button
              variant={tab === name ? "secondary" : "ghost"}
              key={name}
              onClick={() => {
                setTab(name);
                setFeedback("");
              }}
              aria-current={tab === name ? "page" : undefined}
            >
              <Icon />
              {name}
              {name === "Alertas" && upcoming.length > 0 ? ` (${upcoming.length})` : ""}
            </Button>
          ))}
        </nav>
        {feedback && (
          <p
            role="status"
            className="my-3 rounded-md border border-border bg-background p-3 text-sm"
          >
            {feedback}
          </p>
        )}
        {canManage && (tab === "Resultados" || tab === "Alertas") && (
          <label className={`${labelStyle} mt-5 max-w-xs`}>
            Vendedor
            <select
              className={selectStyle}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            >
              <option value="">Todos</option>
              {p.members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {tab === "Funil" && (
          <>
            <Scorecards
              values={[
                [CircleDollarSign, "Em negociação", money.format(current.pipeline)],
                [Target, "Vendas ganhas", money.format(current.revenue)],
                [TrendingUp, "Conversão", `${current.conversion.toFixed(1)}%`],
                [
                  Bell,
                  "Alertas",
                  String(
                    p.deals.filter((d) =>
                      ["late", "soon"].includes(urgency(stageById.get(d.stage_id), d.entered_at)),
                    ).length,
                  ),
                ],
              ]}
            />
            <section className="mt-7 grid gap-7 lg:grid-cols-[2fr_3fr]">
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-xl font-bold">Funil de vendas</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-pressed={!stage}
                    onClick={() => setStage("")}
                  >
                    Todas
                  </Button>
                </div>
                <div className="grid justify-items-center gap-1.5">
                  {p.stages.map((s, i) => (
                    <Button
                      key={s.id}
                      aria-label={`${s.name} ${p.deals.filter((d) => d.stage_id === s.id).length}`}
                      aria-pressed={stage === s.id}
                      onClick={() => setStage(stage === s.id ? "" : s.id)}
                      className={`fechou-stage fechou-stage-${Math.min(i, 5)} justify-between px-6 ${stage === s.id ? "bg-ink text-ink-foreground hover:bg-ink" : "bg-fechou-mint/20 text-foreground hover:bg-fechou-mint/40"}`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="flex items-center gap-1 tabular-nums">
                        {p.deals.filter((d) => d.stage_id === s.id).length}
                        <ChevronRight className="size-3" />
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              <DealList
                title={stageById.get(stage)?.name ?? "Oportunidades"}
                deals={p.deals.filter((d) => !stage || d.stage_id === stage)}
                stages={stageById}
                edit={edit}
              />
            </section>
          </>
        )}
        {tab === "Alertas" && (
          <>
            <div className="my-5 flex flex-wrap gap-2 text-xs">
              {(["late", "soon", "ok"] as const).map((s) => (
                <span key={s} className={`rounded-md px-2 py-1 ${statusClasses[s]}`}>
                  {statuses[s]}
                </span>
              ))}
            </div>
            {canManage && (
              <div className="mb-5 grid gap-2 sm:grid-cols-2">
                {p.members
                  .filter((m) => !owner || m.user_id === owner)
                  .map((m) => (
                    <div
                      className="rounded-lg border border-border bg-background p-3 text-sm"
                      key={m.user_id}
                    >
                      <strong>{m.name}</strong> ·{" "}
                      {upcoming.filter((d) => d.owner_id === m.user_id).length} pendentes
                      {p.goals.find((g) => g.owner_id === m.user_id && g.period.startsWith(month))
                        ?.amount
                        ? ` · Meta: ${money.format(p.goals.find((g) => g.owner_id === m.user_id && g.period.startsWith(month))?.amount ?? 0)}`
                        : ""}
                    </div>
                  ))}
              </div>
            )}
            <DealList
              title="Oportunidades que precisam de atenção"
              deals={visible}
              stages={stageById}
              edit={edit}
            />
          </>
        )}
        {tab === "Resultados" && (
          <>
            <div className="mt-5 flex flex-wrap items-end gap-2">
              <label className={labelStyle}>
                Mês
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </label>
              <Button
                variant="outline"
                onClick={() => void run(() => download(false), "Relatório exportado.")}
              >
                <ArrowDownToLine /> Exportar Excel
              </Button>
            </div>
            <Report deals={periodRows} stages={p.stages} />
            <section className="mt-7">
              <h2 className="mb-3 text-xl font-bold">Metas do mês</h2>
              <div className="grid gap-2">
                {p.goals
                  .filter((g) => g.period.startsWith(month) && (!owner || g.owner_id === owner))
                  .map((g) => {
                    const realized = metrics(
                      periodRows.filter((d) => d.owner_id === g.owner_id),
                      p.stages,
                    ).revenue;
                    return (
                      <div
                        key={g.owner_id}
                        className="rounded-lg border border-border bg-background p-4"
                      >
                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                          <strong>{p.members.find((m) => m.user_id === g.owner_id)?.name}</strong>
                          <span>
                            {money.format(realized)} / {money.format(g.amount)}
                          </span>
                        </div>
                        <progress
                          className="mt-2 w-full accent-fechou-mint"
                          value={realized}
                          max={g.amount}
                        />
                      </div>
                    );
                  })}
                {!p.goals.some(
                  (g) => g.period.startsWith(month) && (!owner || g.owner_id === owner),
                ) && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma meta cadastrada para o mês.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
        {tab === "Prospecção" && !p.demo && (
          <Prospecting
            workspace={p.user.workspace_id}
            fill={(draft) =>
              setEditor({ data: { ...emptyDeal(p.stages[0]?.id, p.user.user_id), ...draft } })
            }
          />
        )}
        {tab === "Planilhas" && (
          <section className="mt-5 space-y-4">
            <Button
              variant="outline"
              onClick={() => void run(() => download(true), "Modelo exportado.")}
            >
              <ArrowDownToLine /> Baixar modelo Excel
            </Button>
            <Button
              variant="outline"
              className="ml-2"
              onClick={() => void run(() => download(false, true), "Carteira exportada.")}
            >
              <ArrowDownToLine /> Exportar carteira
            </Button>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) void read(e.dataTransfer.files[0]);
              }}
              className="grid cursor-pointer justify-items-center gap-3 rounded-lg border-2 border-dashed border-border bg-background p-10 text-center"
            >
              <ArrowUpFromLine />
              <span className="font-semibold">Selecionar ou soltar planilha</span>
              <span className="text-sm text-muted-foreground">CSV ou Excel (.xlsx)</span>
              <input
                type="file"
                className="sr-only"
                accept=".csv,.xlsx"
                disabled={busy}
                onChange={(e) => {
                  void read(e.currentTarget.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {imported.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bold">
                  {createdCount} {createdCount === 1 ? "novo cadastro" : "novos cadastros"} ·{" "}
                  {updatedCount} {updatedCount === 1 ? "atualização" : "atualizações"}
                </h2>
                <ul className="max-h-64 overflow-auto divide-y divide-border">
                  {imported.map((d, i) => (
                    <li className="flex justify-between gap-2 py-2 text-sm" key={i}>
                      <span>{d.company}</span>
                      <span>{money.format(d.amount)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await p.importRows(imported);
                      setImported([]);
                    }, "Oportunidades importadas.")
                  }
                >
                  Confirmar importação
                </Button>
              </div>
            )}
          </section>
        )}
        {tab === "Configuração" && canManage && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-3 text-xl font-bold">Prazos por etapa</h2>
              {p.stages
                .filter((s) => s.kind === "open")
                .map((s) => (
                  <form
                    key={s.id}
                    className="mb-2 grid grid-cols-[minmax(0,1fr)_5rem_auto] items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      void run(
                        () => p.saveStage(s.id, String(f.get("name")), Number(f.get("days"))),
                        "Prazo atualizado.",
                      );
                    }}
                  >
                    <label className={labelStyle}>
                      Etapa
                      <Input name="name" defaultValue={s.name} required maxLength={60} />
                    </label>
                    <label className={labelStyle}>
                      Dias
                      <Input
                        name="days"
                        type="number"
                        min={1}
                        max={365}
                        defaultValue={s.target_days}
                        required
                      />
                    </label>
                    <Button variant="outline" disabled={busy}>
                      Salvar
                    </Button>
                  </form>
                ))}
            </div>
            <div className="space-y-6">
              <form
                className="grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(
                    () =>
                      p.saveGoal(
                        String(f.get("owner")),
                        String(f.get("month")),
                        Number(f.get("amount")),
                      ),
                    "Meta registrada.",
                  );
                }}
              >
                <h2 className="text-xl font-bold">Nova meta mensal</h2>
                <label className={labelStyle}>
                  Vendedor
                  <select className={selectStyle} name="owner" required>
                    {p.members.map((m) => (
                      <option value={m.user_id} key={m.user_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={labelStyle}>
                  Mês
                  <Input name="month" type="month" defaultValue={month} required />
                </label>
                <label className={labelStyle}>
                  Meta em R$
                  <Input name="amount" type="number" min="0.01" step="0.01" required />
                </label>
                <Button disabled={busy}>Salvar meta</Button>
              </form>
              {p.addMember && (
                <form
                  className="grid gap-3 border-t border-border pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    const add = p.addMember;
                    if (add)
                      void run(async () => {
                        await add(
                          String(f.get("email")),
                          String(f.get("name")),
                          f.get("role") === "manager" ? "manager" : "seller",
                        );
                        form.reset();
                      }, "Acesso cadastrado.");
                  }}
                >
                  <h2 className="text-xl font-bold">Cadastrar acesso</h2>
                  <label className={labelStyle}>
                    Nome
                    <Input name="name" required maxLength={120} />
                  </label>
                  <label className={labelStyle}>
                    E-mail da conta confirmada
                    <Input name="email" type="email" required />
                  </label>
                  <label className={labelStyle}>
                    Cargo
                    <select className={selectStyle} name="role">
                      <option value="seller">Vendedor</option>
                      <option value="manager">Gestor comercial</option>
                    </select>
                  </label>
                  <Button disabled={busy}>
                    <Users /> Cadastrar acesso
                  </Button>
                </form>
              )}
              {p.updateMember && (
                <div className="grid gap-3 border-t border-border pt-5">
                  <h2 className="text-xl font-bold">Acessos da equipe</h2>
                  {p.members
                    .filter((m) => m.role !== "admin")
                    .map((m) => (
                      <form
                        key={`${m.user_id}-${m.active}-${m.role}`}
                        className="grid gap-2 rounded-lg border border-border bg-background p-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const f = new FormData(e.currentTarget);
                          const update = p.updateMember;
                          if (update)
                            void run(
                              () =>
                                update(
                                  m.user_id,
                                  f.get("role") === "manager" ? "manager" : "seller",
                                  f.get("active") === "on",
                                ),
                              "Acesso atualizado.",
                            );
                        }}
                      >
                        <strong>{m.name}</strong>
                        <label className={labelStyle}>
                          Cargo
                          <select className={selectStyle} name="role" defaultValue={m.role}>
                            <option value="seller">Vendedor</option>
                            <option value="manager">Gestor comercial</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input name="active" type="checkbox" defaultChecked={m.active} /> Acesso
                          ativo
                        </label>
                        <Button variant="outline" disabled={busy}>
                          Salvar acesso
                        </Button>
                      </form>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(next) => {
          if (!next && !busy) setEditor(undefined);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editor?.id ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
          </DialogHeader>
          {editor && (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  await p.save(editor.data, editor.id);
                  setEditor(undefined);
                }, "Oportunidade salva.");
              }}
            >
              {fields.map(([key, title]) => (
                <label key={key} className={labelStyle}>
                  {title}
                  <Input
                    value={editor.data[key] ?? ""}
                    type={
                      key === "email"
                        ? "email"
                        : key === "founded_on" || key === "birth_date"
                          ? "date"
                          : key === "phone"
                            ? "tel"
                            : "text"
                    }
                    required={key === "company"}
                    maxLength={key === "company" ? 160 : 255}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        data: {
                          ...editor.data,
                          [key]:
                            e.target.value ||
                            (key === "founded_on" || key === "birth_date" ? null : ""),
                        },
                      })
                    }
                  />
                </label>
              ))}
              <label className={labelStyle}>
                Valor em R$
                <Input
                  type="number"
                  min={0}
                  max={999999999999.99}
                  step="0.01"
                  value={editor.data.amount || ""}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      data: { ...editor.data, amount: Number(e.target.value) },
                    })
                  }
                />
              </label>
              <label className={labelStyle}>
                Etapa
                <select
                  className={selectStyle}
                  value={editor.data.stage_id}
                  onChange={(e) =>
                    setEditor({ ...editor, data: { ...editor.data, stage_id: e.target.value } })
                  }
                >
                  {p.stages.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {canManage && (
                <label className={labelStyle}>
                  Responsável
                  <select
                    className={selectStyle}
                    value={editor.data.owner_id}
                    onChange={(e) =>
                      setEditor({ ...editor, data: { ...editor.data, owner_id: e.target.value } })
                    }
                  >
                    {p.members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className={`${labelStyle} sm:col-span-2`}>
                Observações
                <Textarea
                  value={editor.data.notes}
                  maxLength={4000}
                  onChange={(e) =>
                    setEditor({ ...editor, data: { ...editor.data, notes: e.target.value } })
                  }
                />
              </label>
              {feedback && (
                <p role="status" className="text-sm sm:col-span-2">
                  {feedback}
                </p>
              )}
              <Button className="sm:col-span-2" disabled={busy}>
                {busy ? "Salvando…" : "Salvar oportunidade"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function DealList({
  title,
  deals,
  stages,
  edit,
}: {
  title: string;
  deals: Deal[];
  stages: Map<string, Stage>;
  edit: (d: Deal) => void;
}) {
  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-xl font-bold">
        {title} <span className="text-sm font-normal text-muted-foreground">({deals.length})</span>
      </h2>
      {deals.length ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-background">
          {deals.map((d) => {
            const s = urgency(stages.get(d.stage_id), d.entered_at);
            return (
              <li key={d.id}>
                <Button
                  variant="ghost"
                  onClick={() => edit(d)}
                  className="flex h-auto min-h-16 w-full justify-between gap-3 whitespace-normal px-3 py-3 text-left"
                >
                  <span className="min-w-0 break-words">
                    <strong>{d.company}</strong>
                    <span className="block text-xs text-muted-foreground">
                      {d.contact || d.segment || stages.get(d.stage_id)?.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    <strong>{money.format(d.amount)}</strong>
                    <span className={`rounded px-1.5 py-0.5 ${statusClasses[s]}`}>
                      {statuses[s]}
                    </span>
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
          Nenhuma oportunidade nesta lista.
        </p>
      )}
    </section>
  );
}
function Scorecards({ values }: { values: [typeof Funnel, string, string][] }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {values.map(([Icon, label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-lg border border-border bg-background p-3 sm:p-4"
        >
          <dt className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <Icon className="size-4 shrink-0 text-fechou-coral" />
            {label}
          </dt>
          <dd className="mt-2 break-words text-lg font-extrabold tabular-nums sm:text-2xl">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Report({ deals, stages }: { deals: Deal[]; stages: Stage[] }) {
  const r = metrics(deals, stages);
  return (
    <Scorecards
      values={[
        [CircleDollarSign, "Vendas ganhas", money.format(r.revenue)],
        [Target, "Ticket médio", money.format(r.ticket)],
        [TrendingUp, "Conversão", `${r.conversion.toFixed(1)}%`],
        [Funnel, "Ciclo médio", `${r.days.toFixed(1)} dias`],
      ]}
    />
  );
}
