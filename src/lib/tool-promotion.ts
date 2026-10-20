export type PromotionTool = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  kind: "interactive" | "download";
  coverUrl?: string | null;
  priceLabel: string;
};

export function toolPromotionLink(tool: PromotionTool, origin = "https://liberatoconsulting.com.br") {
  return tool.kind === "interactive"
    ? `${origin.replace(/\/$/, "")}/ferramentas/${encodeURIComponent(tool.slug)}`
    : `${origin.replace(/\/$/, "")}/ferramentas`;
}

export function toolAccessSteps(tool: PromotionTool, enabled: boolean): string[] {
  if (!enabled) return [];
  return [
    "Acesse liberatoconsulting.com.br/ferramentas",
    "Entre ou crie sua conta e complete seu cadastro",
    tool.kind === "interactive"
      ? `Selecione ${tool.title}${tool.priceLabel !== "Gratuita" ? " e conclua a compra" : ""}`
      : `Selecione ${tool.title} e baixe o arquivo`,
    ...(tool.kind === "interactive" ? ["Informe os dados da empresa e veja os resultados"] : []),
  ];
}

export function toolPromotionCaption(tool: PromotionTool, details: string[], steps: string[], format: string) {
  return ["Nova ferramenta de gestão", ...details, tool.priceLabel, toolPromotionLink(tool),
    ...(steps.length ? ["", "Como acessar", ...steps.map((s, i) => `${i + 1}. ${s}`)] : []),
    ...(format === "instagram" ? ["", "#gestaoempresarial #ferramentasdegestao #LiberatoConsulting"] : []),
  ].join("\n\n");
}