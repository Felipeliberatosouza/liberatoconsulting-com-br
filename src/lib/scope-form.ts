/**
 * Etapa 1 do processo de Projetos — Escopo Inicial de Necessidade do Cliente.
 * Perguntas e alternativas do formulário público em /escopoinicial.
 */

export type ScopeQuestion = {
  id: string;
  index: number;
  theme: string;
  question: string;
  /** Texto do ícone de ajuda (aparece ao passar o mouse). */
  purpose: string;
  /** Orientação curta exibida abaixo da pergunta. */
  hint?: string;
  /** Abre campo de data quando a opção escolhida for esta. */
  dateWhen?: string;
  options: string[];
};

export const MULTI_HINT =
  "Assinale a principal opção de acordo com sua necessidade e, se achar importante, descreva em Comentários outras opções.";

export const SCOPE_INTRO =
  "Objetivo: entender rapidamente a sua necessidade para preparar uma proposta adequada. O preenchimento leva de 3 a 5 minutos.";

export const SCOPE_HELP =
  "Selecione uma alternativa por pergunta. O campo de comentários é opcional e pode ser usado para acrescentar contexto, datas, setores, números ou links.";

export const SCOPE_NOTE =
  "Se alguma definição ainda estiver em aberto, isso é normal. A resposta “Ainda não definido” ajuda a indicar se o primeiro passo deverá ser uma fase curta de definição e pesquisa exploratória.";

export const SCOPE_QUESTIONS: ScopeQuestion[] = [
  {
    id: "q1",
    purpose: "Entender o foco central do trabalho para orientar a abordagem da consultoria.",
    hint: MULTI_HINT,
    index: 1,
    theme: "Objetivo",
    question: "Qual é o principal objetivo da consultoria?",
    options: [
      "Avaliar a viabilidade do negócio",
      "Definir posicionamento e público-alvo",
      "Validar o modelo de negócio",
      "Dimensionar mercado e concorrência",
      "Preparar lançamento ou captação",
      "Ainda não definido / outro",
    ],
  },
  {
    id: "q2",
    purpose: "Definir o entregável principal que será usado para tomar decisão.",
    hint: MULTI_HINT,
    index: 2,
    theme: "Resultado esperado",
    question: "Qual resultado principal você espera receber ao final?",
    options: [
      "Recomendações executivas",
      "Relatório de pesquisa de mercado",
      "Validação com potenciais clientes ou parceiros",
      "TAM / SAM / SOM e cenários",
      "Modelo de negócio e modelo financeiro",
      "Combinação dos itens acima",
    ],
  },
  {
    id: "q3",
    purpose: "Situar o momento da empresa ou da oferta e o ponto de partida do projeto.",
    hint: MULTI_HINT,
    index: 3,
    theme: "Empresa e oferta",
    question: "Qual descrição melhor representa a empresa ou serviço neste momento?",
    options: [
      "Empresa em operação buscando crescimento",
      "Empresa em operação com problema específico a resolver",
      "Novo negócio ou nova linha de serviço em desenho",
      "Serviços combinados / mais de uma frente",
      "A proposta ainda está sendo definida",
      "Outro",
    ],
  },
  {
    id: "q4",
    purpose: "Delimitar o público-alvo que será estudado ou abordado.",
    hint: MULTI_HINT,
    index: 4,
    theme: "Cliente-alvo",
    question: "Quem é o principal público ou perfil de empresa que se pretende atender?",
    options: [
      "Pequenas empresas",
      "Empresas médias",
      "Pequenas e médias empresas em geral",
      "Empresas familiares",
      "Setores específicos",
      "Ainda não definido",
    ],
  },
  {
    id: "q5",
    purpose: "Dimensionar a abrangência geográfica e o esforço de coleta de dados.",
    index: 5,
    theme: "Abrangência",
    question: "Qual será a abrangência geográfica inicial?",
    options: [
      "Brasil inteiro",
      "Uma ou mais regiões do Brasil",
      "Um estado ou mercado local",
      "Brasil e operações internacionais",
      "Ainda não definido",
    ],
  },
  {
    id: "q6",
    purpose: "Avaliar a necessidade de pesquisa primária (entrevistas ou survey) e seu custo.",
    hint: "Se tiver uma amostra que deseja (número de respondentes), sinalize em Comentários.",
    index: 6,
    theme: "Pesquisa com o mercado",
    question: "Qual nível de contato direto com o mercado é esperado?",
    options: [
      "Somente pesquisa em fontes públicas",
      "Entrevistas com até 10 pessoas",
      "Entrevistas com mais de 10 pessoas",
      "Pesquisa quantitativa / survey",
      "Pesquisa pública mais entrevistas ou survey",
      "Ainda não definido",
    ],
  },
  {
    id: "q7",
    purpose: "Verificar se o projeto exige estimativa de mercado (TAM/SAM/SOM) e por qual método.",
    index: 7,
    theme: "Dimensionamento",
    question: "É necessário estimar o tamanho do mercado?",
    options: [
      "Não é necessário neste momento",
      "Sim, com fontes públicas",
      "Sim, com levantamento empresa a empresa",
      "Sim, mas ainda não sei qual método",
      "Ainda não definido",
    ],
  },
  {
    id: "q8",
    purpose: "Ajustar o formato dos entregáveis ao uso que será dado ao resultado.",
    hint: MULTI_HINT,
    index: 8,
    theme: "Entregáveis",
    question: "Qual formato é mais importante para apresentar o resultado?",
    options: [
      "Relatório em documento",
      "Apresentação executiva",
      "Planilha ou modelo editável",
      "Relatório mais apresentação",
      "Workshop de decisão",
      "Ainda não definido",
    ],
  },
  {
    id: "q9",
    purpose: "Planejar o cronograma e a disponibilidade da equipe.",
    dateWhen: "Tenho uma data fixa",
    index: 9,
    theme: "Prazo",
    question: "Quando o trabalho precisa estar concluído?",
    options: [
      "Em até 2 semanas",
      "Em 3 ou 4 semanas",
      "Em 5 a 8 semanas",
      "Após 8 semanas",
      "Tenho uma data fixa",
      "Ainda não definido",
    ],
  },
  {
    id: "q10",
    purpose: "Ajustar o escopo e o formato de contratação à capacidade de investimento.",
    hint: "Se achar interessante, indique no campo Comentários o orçamento que tem para esse projeto.",
    index: 10,
    theme: "Investimento",
    question: "Como está a definição do investimento para este trabalho?",
    options: [
      "Existe uma faixa de investimento definida",
      "Existe um teto máximo",
      "Prefiro receber uma proposta por fases",
      "Ainda não há orçamento definido",
      "Outro formato de contratação",
    ],
  },
];

export const SCOPE_QUESTION_IDS = SCOPE_QUESTIONS.map((q) => q.id);
