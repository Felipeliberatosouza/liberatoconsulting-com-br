/** Perguntas editáveis do Diagnóstico enviadas ao cliente por link. Browser-safe. */
import type { DiagnosticQuestion } from "./diagnostic-catalog";

export type EditableQuestion = {
  id: string;
  block: string;
  question: string;
  purpose: string;
  options: string[];
  multi: boolean;
  required: boolean;
};

export type ClientAnswer = { choices: string[]; detail: string };

const BLOCK_PURPOSE: Record<string, string> = {
  "Objetivo e decisão": "Entender a decisão que o trabalho precisa apoiar evita escopo maior ou menor que o necessário.",
  "Empresa e contexto": "O contexto da empresa ajusta a profundidade da análise e as referências usadas.",
  "Entregáveis": "Define o formato e o nível de detalhe do que será entregue, impactando prazo e esforço.",
  "Governança e dados": "Mostra quem participa, quais dados existem e quais cuidados de confidencialidade são exigidos.",
  "Contratação e orçamento": "Ajuda a montar uma proposta compatível com o orçamento e o processo de compras da empresa.",
};

function optionsFor(q: DiagnosticQuestion): { options: string[]; multi: boolean } {
  const f = q.format.toLowerCase();
  const text = q.question.toLowerCase();
  if (f.includes("sim/não")) return { options: ["Sim", "Não", "Ainda não sabemos"], multi: false };
  if (q.id === "OBJ-03" || f.includes("data")) return { options: ["Até 30 dias", "30 a 60 dias", "60 a 90 dias", "Mais de 90 dias", "Há data fixa"], multi: false };
  if (q.id === "ENT-01") return { options: ["Relatório", "Apresentação", "Planilha", "Plano de ação", "Painel", "Workshop", "Treinamento"], multi: true };
  if (q.id === "COM-03") return { options: ["Preço fechado", "Por fase", "Diária", "Mensalidade", "Êxito"], multi: true };
  if (q.id === "COM-01") return { options: ["Há orçamento aprovado", "Há faixa estimada", "Ainda não definido"], multi: false };
  if (q.id === "MKT-04") return { options: ["Fotografia atual", "Histórico", "Projeção"], multi: true };
  if (q.id === "MKT-01") return { options: ["Brasil inteiro", "Regiões específicas", "Mercados internacionais"], multi: true };
  if (f.includes("escala")) return { options: ["Baixa", "Média", "Alta"], multi: false };
  if (text.startsWith("há ") || text.startsWith("existe") || text.startsWith("houve") || text.startsWith("é necessário") || text.startsWith("o cliente quer"))
    return { options: ["Sim", "Não", "Ainda não sabemos"], multi: false };
  return { options: [], multi: false };
}

export function toEditable(questions: DiagnosticQuestion[]): EditableQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    block: q.block,
    question: q.question,
    purpose: BLOCK_PURPOSE[q.block] ?? `Esta resposta orienta o bloco "${q.block}" e o esforço estimado do projeto.`,
    required: q.required,
    ...optionsFor(q),
  }));
}

/** Toda resposta exige explicação; se houver alternativas, ao menos uma precisa ser escolhida. */
export function answerMissing(q: EditableQuestion, a: ClientAnswer | undefined): boolean {
  if (!a || a.detail.trim().length < 2) return true;
  return q.options.length > 0 && a.choices.length === 0;
}

export function answerText(a: ClientAnswer): string {
  return [a.choices.join(", "), a.detail.trim()].filter(Boolean).join(" — ");
}

export const diagnosticLink = (token: string) => `https://liberatoconsulting.com.br/diagnostico/${token}`;
