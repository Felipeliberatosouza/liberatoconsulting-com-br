/** Parágrafo curto com notícia recente do setor do lead (ou macroeconomia do país). */
import { askJsonGrounded } from "./ai.server";

export type Insight = { paragraph: string; kind: "setor" | "macro"; date: string };

const MAX_AGE_DAYS = 92;

export function isRecent(date: string, now = new Date()) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const age = (now.getTime() - d.getTime()) / 86_400_000;
  return age >= -2 && age <= MAX_AGE_DAYS;
}

export async function sectorInsight(company: string, segment: string, location: string): Promise<Insight | null> {
  const sys =
    "Você é analista de mercado da Liberato Consulting (consultoria de gestão estratégica com IA). " +
    "Escreva em português do Brasil, tom profissional e direto. Nunca invente notícias, números ou fontes.";
  const prompt =
    `Empresa: ${company || "não informada"}\nSegmento: ${segment || "identifique pelo nome da empresa"}\nLocalização: ${location || "Brasil"}\n\n` +
    `1) Pesquise uma notícia REAL publicada nos últimos 3 meses que impacte o negócio de empresas desse segmento (custos, regulação, demanda, tecnologia, concorrência).\n` +
    `2) Se não houver notícia setorial recente confiável, use uma notícia macroeconômica recente (últimos 3 meses) do país da empresa (juros, inflação, câmbio, reforma tributária, crédito, emprego) que crie necessidade de consultoria.\n` +
    `Escreva UM parágrafo de 2 a 3 frases (máx. 380 caracteres) que cite o fato, mostre o impacto provável para a empresa e termine abrindo espaço para uma conversa — sem exageros e sem citar a Liberato.\n` +
    `JSON: {"paragraph": string, "kind": "setor"|"macro", "date": "AAAA-MM-DD (data de publicação da notícia)"}`;
  try {
    const r = await askJsonGrounded<Insight>(sys, prompt);
    const paragraph = String(r?.paragraph ?? "").trim().slice(0, 500);
    if (!paragraph || !isRecent(String(r?.date ?? ""))) return null;
    return { paragraph, kind: r.kind === "setor" ? "setor" : "macro", date: String(r.date) };
  } catch {
    return null;
  }
}
