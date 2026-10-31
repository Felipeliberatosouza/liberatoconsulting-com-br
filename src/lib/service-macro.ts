/**
 * Os dois macro serviços da Liberato Consulting. Todo serviço pertence a um
 * deles: Treinamento in Company quando está na frente "treinamento";
 * Consultoria em qualquer outra frente.
 */
export type ServiceMacro = "consultoria" | "treinamento";

export const SERVICE_MACROS: ReadonlyArray<{ id: ServiceMacro; label: string }> = [
  { id: "consultoria", label: "Consultoria" },
  { id: "treinamento", label: "Treinamento in Company" },
];

export function serviceMacro(item: { groups?: readonly string[]; group_id?: string; group?: string }): ServiceMacro {
  const groups = [...(item.groups ?? []), item.group_id, item.group].filter(Boolean);
  return groups.includes("treinamento") ? "treinamento" : "consultoria";
}
