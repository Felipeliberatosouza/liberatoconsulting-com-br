import { useQuery } from "@tanstack/react-query";
import { listDocumentRevisions } from "@/lib/document-revisions.functions";
export function DocumentRevisions({ id, kind }: { id: string; kind: "Orçamento" | "Apresentação" }) {
  const revisions = useQuery({ queryKey: ["document-revisions",id], queryFn: () => listDocumentRevisions({ data: { id } }), staleTime: 0 });
  return <div className="mt-2 space-y-1 text-xs text-muted-foreground">{revisions.data?.map(r => <p key={r.id}>{kind} alterado em {new Date(r.changed_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília).</p>)}{revisions.isError && <p role="alert">Histórico de alterações indisponível.</p>}</div>;
}