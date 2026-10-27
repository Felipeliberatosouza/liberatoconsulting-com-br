import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** The six Projects stages, in order. Each stage feeds the next one. */
export const PROJECT_STAGES = [
  { n: 1, short: "Escopo inicial", to: "/admin/projetos/escopos", search: undefined, help: "O cliente responde um formulário curto. As respostas abrem a conversa e alimentam o diagnóstico." },
  { n: 2, short: "Diagnóstico", to: "/admin/projetos/diagnostico", search: undefined, help: "Perguntas por serviço, score de esforço e escopo. O planejamento salvo aqui vira o orçamento da etapa 3." },
  { n: 3, short: "Precificação e orçamento", to: "/admin/precificacao", search: { aba: "quote" }, help: "Premissas de preço, etapas, cenários e o orçamento final. O orçamento gerado alimenta preço e prazos da apresentação." },
  { n: 4, short: "Apresentação", to: "/admin/projetos/apresentacao", search: undefined, help: "Apresentação comercial personalizada. Marque “Usar orçamento gerado” para trazer preço e prazos." },
  { n: 5, short: "Contrato e NDA", to: "/admin/projetos/contratos", search: undefined, help: "NDA antes de trocar informações e contrato com o orçamento aprovado como Anexo I." },
  { n: 6, short: "Satisfação", to: "/admin/projetos/satisfacao", search: undefined, help: "Pesquisas de serviço executado e não executado, com dashboard de resultados." },
] as const;

export function HelpTip({ text, label = "Ajuda" }: { text: string; label?: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} className="inline-flex align-middle text-muted-foreground hover:text-accent">
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm leading-6">{text}</PopoverContent>
    </Popover>
  );
}

/**
 * Guide shown at the top of every Projects stage: progress bar, "what to do here"
 * help and previous/next buttons. Filling a stage is never required to advance.
 * `onNext` lets a stage save and carry its data before moving on.
 */
export function ProjectFlowGuide({
  current,
  onNext,
  nextLabel,
  nextPending,
}: {
  current: 1 | 2 | 3 | 4 | 5 | 6;
  onNext?: () => void;
  nextLabel?: string;
  nextPending?: boolean;
}) {
  const stages: ReadonlyArray<(typeof PROJECT_STAGES)[number]> = PROJECT_STAGES;
  const stage = stages[current - 1]!;
  const prev = current > 1 ? stages[current - 2] : null;
  const next = current < 6 ? stages[current] : null;
  const btn = "inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium";
  return (
    <nav aria-label="Etapas do projeto" className="mb-8 rounded-2xl border border-border bg-background p-4">
      <ol className="flex flex-wrap items-center gap-2">
        {PROJECT_STAGES.map((s) => {
          const done = s.n < current;
          const active = s.n === current;
          return (
            <li key={s.n} className="flex items-center gap-2">
              <Link
                to={s.to as never}
                search={s.search as never}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                  active ? "border-accent bg-accent text-accent-foreground" : done ? "border-accent/40 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-secondary text-[10px] text-foreground">
                  {done ? <Check className="size-3" /> : s.n}
                </span>
                {s.short}
              </Link>
              {s.n < 6 ? <ArrowRight className="size-3 text-muted-foreground" /> : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm">
          <strong>Etapa {stage.n} de 6 — {stage.short}</strong>
          <HelpTip text={`${stage.help} Nenhum campo é obrigatório para avançar.`} label="O que fazer nesta etapa" />
        </p>
        <div className="flex gap-2">
          {prev ? (
            <Link to={prev.to as never} search={prev.search as never} className={`${btn} border border-border hover:bg-secondary`}>
              <ArrowLeft className="size-4" /> {prev.short}
            </Link>
          ) : null}
          {next ? (
            onNext ? (
              <button type="button" disabled={nextPending} onClick={onNext} className={`${btn} bg-ink text-ink-foreground hover:bg-accent hover:text-accent-foreground`}>
                {nextPending ? "Salvando…" : nextLabel ?? `Avançar: ${next.short}`} <ArrowRight className="size-4" />
              </button>
            ) : (
              <Link to={next.to as never} search={next.search as never} className={`${btn} bg-ink text-ink-foreground hover:bg-accent hover:text-accent-foreground`}>
                Avançar: {next.short} <ArrowRight className="size-4" />
              </Link>
            )
          ) : null}
        </div>
      </div>
    </nav>
  );
}
