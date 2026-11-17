import { SERVICES_DEPARA, deParaPath } from "@/lib/services-depara";
import { SOLUTIONS, TRAININGS } from "@/lib/solutions";

type Row = { slug: string; title: string; published: boolean };

/** Painel DE-PARA: mostra para onde foi cada serviço antigo no novo portfólio. */
export function DeParaPanel({ services }: { services: Row[] }) {
  const targets = [
    ...SOLUTIONS.map((s) => ({ kind: "solucao" as const, slug: s.slug, title: s.title.pt, label: "Consultoria" })),
    ...TRAININGS.map((t) => ({ kind: "treinamento" as const, slug: t.slug, title: t.title.pt, label: "Treinamento" })),
  ];
  const unmapped = services.filter((s) => !SERVICES_DEPARA[s.slug] && !targets.some((t) => t.slug === s.slug));
  return (
    <details className="mb-8 rounded-md border border-border bg-card p-4">
      <summary className="cursor-pointer text-lg font-semibold">
        DE-PARA: serviços antigos → novo portfólio ({targets.length} itens novos)
      </summary>
      <p className="mt-2 text-sm text-muted-foreground">
        Orçamentos, diagnósticos e ferramentas já feitos continuam com o nome antigo. Os links antigos do site levam
        automaticamente ao item novo.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {targets.map((t) => {
          const olds = services.filter((s) => {
            const d = SERVICES_DEPARA[s.slug];
            return d && d.kind === t.kind && d.slug === t.slug;
          });
          return (
            <div key={t.kind + t.slug} className="rounded border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.label}</p>
              <a href={deParaPath(t)} target="_blank" rel="noreferrer" className="font-semibold hover:text-accent">
                {t.title}
              </a>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {olds.length === 0 && <li>Nenhum serviço antigo.</li>}
                {olds.map((o) => (
                  <li key={o.slug}>
                    ← {o.title} {!o.published && <span className="text-xs">(arquivado)</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {unmapped.length > 0 && (
        <p className="mt-4 text-sm text-destructive">Sem correspondência: {unmapped.map((u) => u.title).join(", ")}</p>
      )}
    </details>
  );
}
