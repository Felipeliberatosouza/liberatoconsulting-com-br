import type { Lang } from "@/i18n/config";

export const PROJECT_KINDS = ["consultoria", "treinamento", "pacote"] as const;
export type ProjectKind = (typeof PROJECT_KINDS)[number];
export const PROJECT_KIND_KEY = "project_kind";
const LABELS: Record<Lang, { title: string; options: Record<ProjectKind, string> }> = {
  pt: { title: "Tipo de projeto", options: { consultoria: "Consultoria", treinamento: "Treinamento in Company", pacote: "Pacote: Consultoria + Treinamento" } },
  en: { title: "Project type", options: { consultoria: "Consulting", treinamento: "In-company training", pacote: "Package: Consulting + Training" } },
  es: { title: "Tipo de proyecto", options: { consultoria: "Consultoría", treinamento: "Capacitación in company", pacote: "Paquete: Consultoría + Capacitación" } },
  zh: { title: "项目类型", options: { consultoria: "企业咨询", treinamento: "企业内训", pacote: "组合方案：咨询＋培训" } },
};
export function projectKindText(lang: Lang) { return LABELS[lang]; }
export function isProjectKind(value: unknown): value is ProjectKind {
  return PROJECT_KINDS.some((kind) => kind === value);
}
export function projectKindFromAnswers(answers: Record<string, string> = {}): ProjectKind | "" {
  const value = answers[PROJECT_KIND_KEY];
  return isProjectKind(value) ? value : "";
}