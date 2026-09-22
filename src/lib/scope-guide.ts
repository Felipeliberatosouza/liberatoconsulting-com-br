/**
 * Guia do consultor — leitura rápida das respostas do Escopo Inicial.
 * Cada regra observa uma resposta e sugere uma ação antes da proposta.
 */

export type ScopeSignal = {
  id: string;
  signal: string;
  meaning: string;
  action: string;
  /** Pergunta observada e respostas que acionam o sinal. */
  question: string;
  matches: string[];
};

export const SCOPE_SIGNALS: ScopeSignal[] = [
  {
    id: "obj-indef",
    question: "q1",
    matches: ["Ainda não definido / outro"],
    signal: "Objetivo “ainda não definido”",
    meaning: "O cliente ainda não formulou a decisão ou a pergunta de negócio.",
    action: "Propor uma fase curta de definição de escopo e hipóteses antes da pesquisa completa.",
  },
  {
    id: "alvo-indef",
    question: "q4",
    matches: ["Ainda não definido"],
    signal: "Cliente-alvo “ainda não definido”",
    meaning: "O universo de empresas e respondentes ainda não está delimitado.",
    action: "Incluir definição de mercado e segmentação como primeiro módulo.",
  },
  {
    id: "pesquisa-publica",
    question: "q6",
    matches: ["Somente pesquisa em fontes públicas"],
    signal: "Pesquisa somente pública",
    meaning: "O projeto pode começar com desk research e fontes secundárias.",
    action: "Orçar pesquisa secundária; tratar entrevistas como opcional.",
  },
  {
    id: "pesquisa-primaria",
    question: "q6",
    matches: [
      "Entrevistas com até 10 pessoas",
      "Entrevistas com mais de 10 pessoas",
      "Pesquisa quantitativa / survey",
      "Pesquisa pública mais entrevistas ou survey",
    ],
    signal: "Entrevistas ou survey",
    meaning: "Há necessidade de pesquisa primária e maior dependência de acesso.",
    action:
      "Perguntar quantidade, perfis, recrutamento, incentivos e transcrição antes do preço final.",
  },
  {
    id: "bottom-up",
    question: "q7",
    matches: ["Sim, com levantamento empresa a empresa"],
    signal: "Dimensionamento por levantamento empresa a empresa",
    meaning: "Será necessário construir um universo bottom-up.",
    action: "Incluir módulo de base de empresas, critérios de inclusão, ticket e penetração.",
  },
  {
    id: "metodo-indef",
    question: "q7",
    matches: ["Sim, mas ainda não sei qual método"],
    signal: "TAM / SAM / SOM com método indefinido",
    meaning: "A decisão exige dimensionamento, mas a abordagem ainda precisa ser escolhida.",
    action: "Orçar definição de mercado e desenho metodológico antes do modelo final.",
  },
  {
    id: "dois-formatos",
    question: "q8",
    matches: ["Relatório mais apresentação"],
    signal: "Relatório mais apresentação",
    meaning: "Existem dois formatos de entrega e possivelmente públicos diferentes.",
    action: "Separar esforço de relatório, apresentação, revisão e reunião de apresentação.",
  },
  {
    id: "prazo-critico",
    question: "q9",
    matches: ["Em até 2 semanas", "Tenho uma data fixa"],
    signal: "Prazo até 2 semanas ou data fixa",
    meaning: "Há risco de paralelismo, priorização e retrabalho por urgência.",
    action: "Revisar capacidade, dependências e contingência; considerar cobrança por fase.",
  },
  {
    id: "sem-orcamento",
    question: "q10",
    matches: ["Ainda não há orçamento definido"],
    signal: "Faixa de investimento não definida",
    meaning: "O preço precisa ser construído por escopo e não por ancoragem no orçamento.",
    action: "Apresentar opções por fase com entregáveis e premissas explícitas.",
  },
];

export const SCOPE_CHECKLIST = [
  "O objetivo escolhido está ligado a uma decisão concreta do cliente.",
  "O cliente-alvo e a abrangência geográfica não estão completamente indefinidos.",
  "Está claro se haverá somente pesquisa secundária ou também entrevistas/survey.",
  "O método de dimensionamento foi confirmado ou será tratado como etapa metodológica.",
  "O formato e o nível de detalhe dos entregáveis estão claros.",
  "O prazo e as dependências do cliente foram registrados.",
  "A proposta separará escopo base, opcionais, custos de terceiros e premissas.",
];

export const SCOPE_MIGRATE_NOTE =
  "Use o Diagnóstico Detalhado quando o cliente confirmar que precisa de pesquisa primária, dimensionamento detalhado, modelo financeiro, múltiplos segmentos, mais de um decisor, vários formatos de entrega, bases de dados, entrevistas ou um cronograma crítico. O formulário inicial serve para abrir a conversa e permitir um primeiro orçamento.";

/** Sinais acionados pelas respostas de um escopo recebido. */
export function activeSignals(answers: Record<string, string>): ScopeSignal[] {
  return SCOPE_SIGNALS.filter((s) => s.matches.includes(answers[s.question] ?? ""));
}
