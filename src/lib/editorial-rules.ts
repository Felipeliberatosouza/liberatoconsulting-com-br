/**
 * Regras editoriais da Newsletter (Insights) e do Boletim Semanal:
 * qual ferramenta/guia destacar sem repetir o destaque da edição anterior.
 */
export type ToolRef = { slug: string; title: string; summary: string };
export type Feature = { kind: "tool" | "guide"; slug: string };

/**
 * Link de destaque no rodapé: a última ferramenta, a menos que ela já tenha
 * sido o destaque da edição anterior — então alterna para o Guia de Gestão.
 */
export function pickFeature(latestTool: ToolRef | null, hasGuide: boolean, previous: Feature | null): Feature {
  if (!latestTool) return { kind: "guide", slug: "guia" };
  const repeated = previous?.kind === "tool" && previous.slug === latestTool.slug;
  if (repeated && hasGuide) return { kind: "guide", slug: "guia" };
  return { kind: "tool", slug: latestTool.slug };
}

/**
 * Seção 2 da Newsletter: ferramenta nova sozinha; sem ferramenta nova desde a
 * última edição, vai o Guia de Gestão mais uma ferramenta diferente da anterior.
 */
export function newsletterToolSection(tools: ToolRef[], previousToolSlug: string | null) {
  const latest = tools[0] ?? null;
  if (latest && latest.slug !== previousToolSlug) return { guide: false, tool: latest };
  const other = tools.find((t) => t.slug !== previousToolSlug) ?? latest;
  return { guide: true, tool: other };
}
