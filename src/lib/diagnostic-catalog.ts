/**
 * Etapa 2 do processo de Projetos — Diagnóstico Detalhado.
 * Blocos de perguntas (base + específicos por família de serviço),
 * matriz de esforço, módulos de escopo e premissas de orçamento.
 */

export type DiagnosticQuestion = {
  id: string;
  block: string;
  question: string;
  format: string;
  required: boolean;
  impact: "Muito alto" | "Alto" | "Médio" | "Baixo";
};

const q = (
  id: string,
  block: string,
  question: string,
  format: string,
  required: boolean,
  impact: DiagnosticQuestion["impact"],
): DiagnosticQuestion => ({ id, block, question, format, required, impact });

/** Blocos comuns a qualquer serviço da consultoria. */
export const BASE_BLOCKS: DiagnosticQuestion[] = [
  q("OBJ-01", "Objetivo e decisão", "Qual decisão concreta o cliente quer tomar ao final da consultoria?", "Texto livre", true, "Muito alto"),
  q("OBJ-02", "Objetivo e decisão", "Quem usará o resultado e quem tomará a decisão? Identifique sócios, investidores, comitê ou outros decisores.", "Texto livre", true, "Alto"),
  q("OBJ-03", "Objetivo e decisão", "Qual é o prazo desejado e existe data fixa de lançamento, captação, contratação ou apresentação?", "Data + contexto", true, "Alto"),
  q("OBJ-04", "Objetivo e decisão", "Como o cliente definirá que o projeto foi bem-sucedido? Quais perguntas precisam ser respondidas sem ambiguidade?", "Texto livre", true, "Alto"),
  q("NEG-01", "Empresa e contexto", "Descreva a empresa em uma frase: o que faz, para quem e qual problema resolve.", "Texto livre", true, "Muito alto"),
  q("NEG-02", "Empresa e contexto", "Porte atual: faturamento, número de pessoas, unidades, canais e principais produtos ou serviços.", "Faixas e texto", true, "Alto"),
  q("NEG-03", "Empresa e contexto", "Quais tentativas anteriores já foram feitas para resolver esse problema e por que não funcionaram?", "Texto livre", false, "Alto"),
  q("NEG-04", "Empresa e contexto", "Quais restrições existem: orçamento, tecnologia, contratos, sazonalidade, cultura ou regulação?", "Texto livre", false, "Alto"),
  q("ENT-01", "Entregáveis", "Quais formatos são necessários: relatório, apresentação, planilha, plano de ação, painel, workshop ou treinamento?", "Lista priorizada", true, "Alto"),
  q("ENT-02", "Entregáveis", "Qual idioma, identidade visual, nível de detalhamento e quantos ciclos de revisão são esperados?", "Texto livre", false, "Médio"),
  q("ENT-03", "Entregáveis", "O cliente quer receber fontes, bases de dados, arquivos editáveis e fórmulas?", "Lista", false, "Alto"),
  q("GOV-01", "Governança e dados", "Quem será o ponto focal e qual é o processo de aprovação? Quais áreas ou parceiros estão envolvidos?", "Texto livre", true, "Médio"),
  q("GOV-02", "Governança e dados", "Quais materiais e acessos o cliente fornecerá e em que prazo? O que depende de terceiros?", "Lista + prazo", true, "Alto"),
  q("GOV-03", "Governança e dados", "Há requisitos de confidencialidade, anonimização, armazenamento, LGPD ou aprovação para citar fontes?", "Texto livre", true, "Muito alto"),
  q("GOV-04", "Governança e dados", "Há dependências jurídicas, regulatórias, de compliance ou de propriedade intelectual a considerar?", "Texto livre", false, "Alto"),
  q("COM-01", "Contratação e orçamento", "Existe faixa de investimento aprovada ou limite orçamentário? Se não, quais critérios definem a escolha do fornecedor?", "Faixa + critérios", false, "Muito alto"),
  q("COM-02", "Contratação e orçamento", "Qual a data-limite para proposta, contratação e início? Há etapas formais de compras?", "Datas + processo", true, "Médio"),
  q("COM-03", "Contratação e orçamento", "Há preferência por preço fechado, cobrança por fase, diária, mensalidade ou êxito? Quais condições de pagamento?", "Seleção + texto", false, "Alto"),
  q("COM-04", "Contratação e orçamento", "O que está explicitamente fora do escopo? Inclua especialistas, bases pagas, viagens, jurídico e implementação.", "Lista de exclusões", true, "Muito alto"),
];

/** Blocos técnicos por família de serviço. */
export const FAMILY_BLOCKS: Record<string, DiagnosticQuestion[]> = {
  "inteligencia-de-mercado-e-decisoes": [
    q("MKT-01", "Mercado e geografia", "O foco será Brasil inteiro, regiões específicas ou também mercados internacionais?", "Lista + texto", true, "Alto"),
    q("MKT-02", "Mercado e geografia", "Quais setores devem ser incluídos e quais devem ser excluídos?", "Lista + exclusões", true, "Muito alto"),
    q("MKT-03", "Mercado e geografia", "A análise é do mercado em geral, de um nicho setorial ou de uma cadeia específica?", "Seleção", true, "Muito alto"),
    q("MKT-04", "Mercado e geografia", "Qual período de análise é relevante: fotografia atual, histórico, projeção ou os três?", "Seleção + anos", true, "Médio"),
    q("TAM-01", "Dimensionamento", "É necessário estimar TAM, SAM e SOM? Qual decisão esse dimensionamento deve suportar?", "Sim/Não + texto", true, "Alto"),
    q("TAM-02", "Dimensionamento", "Existe lista de empresas, transações ou dados de mercado já disponível?", "Sim/Não + link", true, "Alto"),
    q("TAM-03", "Dimensionamento", "Quais variáveis podem ser observadas: número de empresas, receita, ticket, penetração, preço, volume?", "Lista + qualidade", false, "Alto"),
    q("TAM-04", "Dimensionamento", "Qual horizonte de projeção é desejado e quais cenários são necessários?", "Anos + cenários", false, "Médio"),
    q("COMP-01", "Concorrência", "Quais concorrentes diretos, substitutos e novos entrantes o cliente já conhece?", "Lista", true, "Alto"),
    q("COMP-02", "Concorrência", "É necessário mapa competitivo? Qual eixo organiza a comparação: porte, setor, região, canal ou proposta de valor?", "Texto livre", false, "Alto"),
    q("COMP-03", "Concorrência", "É necessário benchmark de preços, condições comerciais ou modelo de cobrança?", "Sim/Não + escopo", false, "Alto"),
    q("PRI-01", "Pesquisa primária", "É necessário entrevistar clientes, não clientes, canais, especialistas ou fornecedores?", "Sim/Não + perfis", true, "Muito alto"),
    q("PRI-02", "Pesquisa primária", "Quantas entrevistas por perfil e quem fornecerá os contatos?", "Número + origem", false, "Muito alto"),
    q("PRI-03", "Pesquisa primária", "Haverá pesquisa quantitativa? Público, amostra, canal, taxa de resposta e instrumento previstos.", "Texto + números", false, "Muito alto"),
    q("PRI-04", "Pesquisa primária", "Quem fará recrutamento, agenda, consentimento, gravação, transcrição e validação?", "Responsáveis", false, "Alto"),
  ],
  "crescimento-expansao-e-novos-produtos": [
    q("GRW-01", "Crescimento e posicionamento", "Qual é a ambição de crescimento em receita, margem ou participação e em qual prazo?", "Números + prazo", true, "Muito alto"),
    q("GRW-02", "Crescimento e posicionamento", "Quais vetores estão em avaliação: novos produtos, novos segmentos, novas praças, canais, parcerias ou aquisições?", "Lista priorizada", true, "Muito alto"),
    q("GRW-03", "Crescimento e posicionamento", "Qual é a proposta de valor atual e por que os clientes compram hoje?", "Texto livre", true, "Alto"),
    q("GRW-04", "Crescimento e posicionamento", "Quais hipóteses precisam ser testadas sobre dor, disposição a pagar, canal e ciclo de venda?", "Lista priorizada", true, "Muito alto"),
    q("GRW-05", "Viabilidade", "É necessário modelo financeiro de viabilidade? Horizonte, moeda, periodicidade e nível de detalhe.", "Texto + parâmetros", false, "Alto"),
    q("GRW-06", "Viabilidade", "Quais premissas existem sobre demanda, conversão, ticket, custos, investimento e equipe?", "Lista + dados", false, "Muito alto"),
    q("GRW-07", "Viabilidade", "Há necessidade de teste de mercado, piloto ou MVP antes da decisão?", "Sim/Não + texto", false, "Alto"),
    q("GRW-08", "Execução", "Quais capacidades internas já existem e quais precisam ser contratadas ou desenvolvidas?", "Lista", false, "Alto"),
  ],
  "eficiencia-operacional": [
    q("OPE-01", "Processos", "Quais processos entram no escopo e onde começam e terminam (do pedido à entrega, por exemplo)?", "Lista + fronteiras", true, "Muito alto"),
    q("OPE-02", "Processos", "Onde estão hoje os principais gargalos, retrabalhos, esperas e erros percebidos?", "Texto livre", true, "Muito alto"),
    q("OPE-03", "Volumes e capacidade", "Quais volumes mensais, sazonalidade, número de pessoas envolvidas e turnos?", "Números", true, "Alto"),
    q("OPE-04", "Indicadores", "Quais indicadores existem hoje: prazo, produtividade, qualidade, custo por unidade, OTIF, retrabalho?", "Lista + valores", true, "Alto"),
    q("OPE-05", "Indicadores", "Qual é a meta de ganho esperada: redução de custo, de prazo, de perdas ou aumento de capacidade?", "Números + prazo", true, "Muito alto"),
    q("OPE-06", "Dados e sistemas", "Quais sistemas suportam o processo (ERP, planilhas, WMS, CRM) e é possível extrair dados?", "Lista + acesso", true, "Alto"),
    q("OPE-07", "Campo", "Serão necessárias visitas, cronoanálise, mapeamento no chão de fábrica ou acompanhamento de rotina?", "Sim/Não + locais", true, "Muito alto"),
    q("OPE-08", "Pessoas", "Quem executa o processo e como será conduzida a mudança de rotina com as equipes?", "Texto livre", false, "Alto"),
  ],
  "digital-dados-e-ia-aplicada": [
    q("DIG-01", "Casos de uso", "Quais problemas de negócio devem ser atacados com digital, dados ou IA, em ordem de prioridade?", "Lista priorizada", true, "Muito alto"),
    q("DIG-02", "Dados", "Quais dados existem, onde estão, com que qualidade, volume e histórico?", "Lista + qualidade", true, "Muito alto"),
    q("DIG-03", "Sistemas", "Quais sistemas estão em uso e quais integrações ou APIs estão disponíveis?", "Lista + acesso", true, "Alto"),
    q("DIG-04", "Processos", "Quais processos seriam automatizados e qual o volume de transações por mês?", "Números", true, "Alto"),
    q("DIG-05", "Maturidade", "Qual a maturidade atual de tecnologia e o nível de conhecimento das equipes?", "Escala + texto", false, "Médio"),
    q("DIG-06", "Governança", "Quais regras de privacidade, LGPD, segurança e uso de dados de clientes devem ser respeitadas?", "Texto livre", true, "Muito alto"),
    q("DIG-07", "Entrega", "O projeto termina em recomendação, protótipo, piloto em produção ou implantação assistida?", "Seleção", true, "Muito alto"),
    q("DIG-08", "Custos", "Há licenças, créditos de IA, infraestrutura ou fornecedores que entram no orçamento?", "Lista + valores", false, "Alto"),
  ],
  "ciberseguranca-privacidade-e-confianca-digital": [
    q("SEC-01", "Escopo técnico", "Quais ambientes entram no escopo: rede, endpoints, nuvem, aplicações, e-mail, acessos remotos?", "Lista", true, "Muito alto"),
    q("SEC-02", "Escopo técnico", "Quantos usuários, dispositivos, servidores e sistemas críticos existem?", "Números", true, "Alto"),
    q("SEC-03", "Referências", "Há exigência de algum referencial: LGPD, ISO 27001, NIST CSF, exigência de cliente ou seguro?", "Lista", true, "Muito alto"),
    q("SEC-04", "Incidentes", "Houve incidentes, vazamentos, fraudes ou paradas nos últimos 24 meses?", "Texto livre", true, "Alto"),
    q("SEC-05", "Dados pessoais", "Quais dados pessoais ou sensíveis são tratados e quem tem acesso?", "Lista", true, "Muito alto"),
    q("SEC-06", "Testes", "Serão necessários testes técnicos (varredura, teste de invasão, simulação de phishing) ou apenas avaliação documental?", "Seleção", true, "Muito alto"),
    q("SEC-07", "Continuidade", "Existem backup, plano de resposta a incidentes e plano de continuidade testados?", "Sim/Não + texto", false, "Alto"),
    q("SEC-08", "Terceiros", "Quais fornecedores críticos têm acesso a dados ou sistemas?", "Lista", false, "Alto"),
  ],
  "financas-estrategicas-e-controles": [
    q("FIN-01", "Situação atual", "Quais demonstrativos existem (DRE, fluxo de caixa, balanço) e com qual periodicidade são fechados?", "Lista + periodicidade", true, "Muito alto"),
    q("FIN-02", "Situação atual", "Qual o faturamento, margem bruta, resultado e endividamento dos últimos 12 a 36 meses?", "Números", true, "Muito alto"),
    q("FIN-03", "Custos e preços", "Existe custeio por produto, serviço, cliente ou canal? Como os preços são formados hoje?", "Texto + planilhas", true, "Muito alto"),
    q("FIN-04", "Capital de giro", "Quais são prazos de recebimento, pagamento e estoque? Há aperto de caixa recorrente?", "Números", true, "Alto"),
    q("FIN-05", "Planejamento", "Existe orçamento anual, metas e acompanhamento de desvios?", "Sim/Não + texto", true, "Alto"),
    q("FIN-06", "Sistemas", "Qual ERP ou sistema financeiro é usado e é possível exportar dados analíticos?", "Lista + acesso", true, "Alto"),
    q("FIN-07", "Modelagem", "É necessário modelo financeiro projetado? Horizonte, cenários e nível de detalhe.", "Texto + parâmetros", false, "Alto"),
    q("FIN-08", "Governança", "Quem aprova gastos, como são os controles internos e há auditoria ou contabilidade externa?", "Texto livre", false, "Médio"),
  ],
  "cliente-vendas-e-experiencia": [
    q("COM-C1", "Funil e vendas", "Como funciona hoje o funil: origem dos leads, etapas, taxas de conversão e ciclo médio de venda?", "Números + texto", true, "Muito alto"),
    q("COM-C2", "Funil e vendas", "Qual o tamanho e a estrutura da equipe comercial, metas e forma de remuneração?", "Números + texto", true, "Alto"),
    q("COM-C3", "Clientes", "Qual a base de clientes, concentração, ticket médio, recorrência e taxa de perda (churn)?", "Números", true, "Muito alto"),
    q("COM-C4", "Canais", "Quais canais de aquisição são usados e qual o custo de aquisição por canal?", "Lista + valores", true, "Alto"),
    q("COM-C5", "Experiência", "Quais pontos de contato geram mais atrito ou reclamação? Há NPS ou pesquisa de satisfação?", "Texto + indicadores", true, "Alto"),
    q("COM-C6", "Preço e oferta", "Como os preços, descontos e condições são definidos e controlados?", "Texto livre", false, "Alto"),
    q("COM-C7", "Sistemas", "Há CRM e histórico de interações? É possível extrair a base para análise?", "Sim/Não + acesso", true, "Alto"),
    q("COM-C8", "Pesquisa", "Serão necessárias entrevistas com clientes e não clientes? Quantos perfis e quem dá acesso?", "Sim/Não + perfis", false, "Muito alto"),
  ],
  "esg-sustentabilidade-e-clima": [
    q("ESG-01", "Motivação", "O que motiva o trabalho: exigência de cliente, financiamento, regulação, licitação ou posicionamento?", "Seleção + texto", true, "Muito alto"),
    q("ESG-02", "Escopo", "Quais unidades, operações e países entram no escopo?", "Lista", true, "Alto"),
    q("ESG-03", "Inventário", "É necessário inventário de emissões? Quais escopos (1, 2 e 3) e qual ano-base?", "Seleção + ano", true, "Muito alto"),
    q("ESG-04", "Dados", "Existem dados de energia, combustíveis, resíduos, água, transporte e fornecedores? Em que formato?", "Lista + qualidade", true, "Muito alto"),
    q("ESG-05", "Cadeia", "Quantos fornecedores relevantes entram na análise e haverá coleta junto a eles?", "Números", false, "Alto"),
    q("ESG-06", "Referenciais", "Há referencial exigido: GHG Protocol, GRI, SASB, CDP, ISO 14064 ou exigência específica de cliente?", "Lista", true, "Alto"),
    q("ESG-07", "Metas", "O cliente quer apenas medir ou também definir metas, plano de redução e comunicação?", "Seleção", true, "Alto"),
    q("ESG-08", "Verificação", "Haverá verificação ou auditoria externa do resultado?", "Sim/Não", false, "Alto"),
  ],
  "pessoas-lideranca-e-gestao-da-mudanca": [
    q("PEO-01", "Estrutura", "Qual a estrutura atual: organograma, número de pessoas por área, níveis e lacunas de papéis?", "Organograma + números", true, "Muito alto"),
    q("PEO-02", "Rotina de gestão", "Quais reuniões, indicadores e rotinas de acompanhamento existem hoje?", "Lista", true, "Alto"),
    q("PEO-03", "Desempenho", "Como são definidas metas, avaliação, feedback e reconhecimento?", "Texto livre", true, "Alto"),
    q("PEO-04", "Clima e retenção", "Qual a rotatividade, absenteísmo e principais queixas das equipes?", "Números + texto", true, "Alto"),
    q("PEO-05", "Liderança", "Quantos líderes serão envolvidos e qual o nível de preparo atual?", "Números + texto", true, "Muito alto"),
    q("PEO-06", "Mudança", "Quais resistências são esperadas e quem patrocina a mudança na empresa?", "Texto livre", true, "Muito alto"),
    q("PEO-07", "Capacitação", "Haverá treinamento, mentoria ou acompanhamento de rotina? Com que frequência e em quais locais?", "Seleção + frequência", true, "Alto"),
    q("PEO-08", "Dados de RH", "Há sistema de RH e dados de folha, cargos, salários e histórico disponíveis?", "Sim/Não + acesso", false, "Médio"),
  ],
};

/** Conjunto de perguntas para um serviço, pela família. */
export function questionsForFamily(familyId: string): DiagnosticQuestion[] {
  const specific = FAMILY_BLOCKS[familyId] ?? FAMILY_BLOCKS["inteligencia-de-mercado-e-decisoes"]!;
  const base = BASE_BLOCKS;
  return [
    ...base.filter((b) => b.block === "Objetivo e decisão" || b.block === "Empresa e contexto"),
    ...specific,
    ...base.filter(
      (b) => b.block !== "Objetivo e decisão" && b.block !== "Empresa e contexto",
    ),
  ];
}

/** Matriz de esforço e complexidade (notas 1 a 5). */
export const SCORE_DIMENSIONS: Array<{ id: string; label: string; hint: string; weight: number }> = [
  { id: "clareza", label: "Clareza do objetivo", hint: "Há decisão e perguntas de negócio claramente definidas?", weight: 0.1 },
  { id: "amplitude", label: "Amplitude do escopo", hint: "Número de áreas, unidades, segmentos e regiões a cobrir.", weight: 0.1 },
  { id: "complexidade", label: "Complexidade técnica", hint: "Fragmentação, falta de dados, dependências e profundidade exigida.", weight: 0.1 },
  { id: "primaria", label: "Necessidade de coleta em campo", hint: "Volume e dificuldade de entrevistas, visitas, survey e acesso.", weight: 0.15 },
  { id: "dados", label: "Disponibilidade de dados", hint: "Qualidade dos materiais, bases e fontes disponíveis ao consultor.", weight: 0.1 },
  { id: "validacao", label: "Profundidade da validação", hint: "Número de hipóteses a testar e evidências exigidas.", weight: 0.15 },
  { id: "financeiro", label: "Profundidade financeira", hint: "Necessidade de projeções, cenários e revisão de modelo.", weight: 0.1 },
  { id: "governanca", label: "Governança e stakeholders", hint: "Decisores, aprovações, confidencialidade e dependências.", weight: 0.1 },
  { id: "prazo", label: "Pressão de prazo", hint: "Prazo curto, marco externo ou paralelismo necessário.", weight: 0.05 },
  { id: "entregaveis", label: "Carga de entregáveis", hint: "Formatos, bases editáveis, workshops e ciclos de revisão.", weight: 0.05 },
];

export type ScopeModule = {
  id: string;
  label: string;
  phase: string;
  include: boolean;
  qty: number;
  unitDays: number;
  senior: number;
  analyst: number;
  pm: number;
  directCost: number;
  deliverable: string;
};

/** Módulos de trabalho padrão, editáveis em cada diagnóstico. */
export const DEFAULT_MODULES: ScopeModule[] = [
  { id: "m1", label: "Alinhamento e desenho do trabalho", phase: "Planejamento", include: true, qty: 1, unitDays: 2, senior: 0.6, analyst: 0.2, pm: 0.2, directCost: 0, deliverable: "Plano de trabalho, perguntas-chave e critérios de decisão." },
  { id: "m2", label: "Coleta e análise de dados existentes", phase: "Diagnóstico", include: true, qty: 1, unitDays: 5, senior: 0.4, analyst: 0.5, pm: 0.1, directCost: 0, deliverable: "Levantamento, triagem e síntese das informações disponíveis." },
  { id: "m3", label: "Definição de escopo, segmentos ou processos", phase: "Diagnóstico", include: true, qty: 1, unitDays: 3, senior: 0.45, analyst: 0.45, pm: 0.1, directCost: 0, deliverable: "Definições, inclusões e exclusões acordadas." },
  { id: "m4", label: "Dimensionamento ou quantificação (top-down)", phase: "Análise", include: false, qty: 1, unitDays: 4, senior: 0.55, analyst: 0.35, pm: 0.1, directCost: 0, deliverable: "Estimativas com premissas, cenários e fontes." },
  { id: "m5", label: "Levantamento detalhado (bottom-up)", phase: "Análise", include: false, qty: 1, unitDays: 6, senior: 0.55, analyst: 0.35, pm: 0.1, directCost: 0, deliverable: "Base construída item a item, com critérios de inclusão." },
  { id: "m6", label: "Benchmark e mapa comparativo", phase: "Análise", include: false, qty: 1, unitDays: 5, senior: 0.5, analyst: 0.4, pm: 0.1, directCost: 0, deliverable: "Comparativo com eixo analítico, critérios e limites." },
  { id: "m7", label: "Roteiro e preparação de entrevistas", phase: "Campo", include: false, qty: 1, unitDays: 2, senior: 0.6, analyst: 0.25, pm: 0.15, directCost: 0, deliverable: "Roteiro, amostragem, convite e protocolo." },
  { id: "m8", label: "Entrevistas com stakeholders", phase: "Campo", include: false, qty: 10, unitDays: 0.65, senior: 0.45, analyst: 0.35, pm: 0.2, directCost: 0, deliverable: "Entrevistas completas, com transcrição e síntese." },
  { id: "m9", label: "Pesquisa quantitativa / survey", phase: "Campo", include: false, qty: 1, unitDays: 5, senior: 0.45, analyst: 0.4, pm: 0.15, directCost: 0, deliverable: "Instrumento, coleta, limpeza e leitura dos dados." },
  { id: "m10", label: "Visitas técnicas e observação em campo", phase: "Campo", include: false, qty: 2, unitDays: 1, senior: 0.5, analyst: 0.4, pm: 0.1, directCost: 0, deliverable: "Registro de campo, medições e evidências." },
  { id: "m11", label: "Validação de hipóteses e recomendações", phase: "Solução", include: true, qty: 1, unitDays: 5, senior: 0.55, analyst: 0.3, pm: 0.15, directCost: 0, deliverable: "Hipóteses testadas e recomendações priorizadas." },
  { id: "m12", label: "Desenho da solução ou do plano de ação", phase: "Solução", include: true, qty: 1, unitDays: 4, senior: 0.6, analyst: 0.25, pm: 0.15, directCost: 0, deliverable: "Plano com responsáveis, prazos e indicadores." },
  { id: "m13", label: "Modelo financeiro e cenários", phase: "Solução", include: false, qty: 1, unitDays: 7, senior: 0.6, analyst: 0.25, pm: 0.15, directCost: 0, deliverable: "Modelo editável, cenários e sensibilidades." },
  { id: "m14", label: "Workshop de decisão", phase: "Solução", include: false, qty: 1, unitDays: 2, senior: 0.65, analyst: 0.1, pm: 0.25, directCost: 0, deliverable: "Sessão de decisão, alinhamento e próximos passos." },
  { id: "m15", label: "Relatório final", phase: "Entrega", include: true, qty: 1, unitDays: 5, senior: 0.65, analyst: 0.25, pm: 0.1, directCost: 0, deliverable: "Relatório executivo com método, achados e recomendações." },
  { id: "m16", label: "Apresentação executiva", phase: "Entrega", include: true, qty: 1, unitDays: 2, senior: 0.7, analyst: 0.1, pm: 0.2, directCost: 0, deliverable: "Deck para sócios, investidores ou comitê." },
  { id: "m17", label: "Base editável, fontes e anexos", phase: "Entrega", include: false, qty: 1, unitDays: 2, senior: 0.45, analyst: 0.45, pm: 0.1, directCost: 0, deliverable: "Arquivos editáveis, evidências e registro de fontes." },
  { id: "m18", label: "Acompanhamento pós-entrega", phase: "Entrega", include: false, qty: 1, unitDays: 3, senior: 0.6, analyst: 0.2, pm: 0.2, directCost: 0, deliverable: "Reuniões de acompanhamento e ajuste do plano." },
  { id: "m19", label: "Gestão do projeto e coordenação", phase: "Gestão", include: true, qty: 1, unitDays: 2, senior: 0, analyst: 0, pm: 1, directCost: 0, deliverable: "Coordenação, cronograma e comunicação." },
];

export type DiagnosticBudget = {
  rateSenior: number;
  rateAnalyst: number;
  ratePm: number;
  contingencyPct: number;
  taxPct: number;
  discountPct: number;
};

export const DEFAULT_BUDGET: DiagnosticBudget = {
  rateSenior: 3500,
  rateAnalyst: 1800,
  ratePm: 2500,
  contingencyPct: 10,
  taxPct: 0,
  discountPct: 0,
};

export function moduleDays(m: ScopeModule) {
  const total = m.include ? m.qty * m.unitDays : 0;
  return {
    senior: total * m.senior,
    analyst: total * m.analyst,
    pm: total * m.pm,
    direct: m.include ? m.qty * m.directCost : 0,
  };
}

export function computeTotals(modules: ScopeModule[], budget: DiagnosticBudget) {
  const days = modules.reduce(
    (acc, m) => {
      const d = moduleDays(m);
      return {
        senior: acc.senior + d.senior,
        analyst: acc.analyst + d.analyst,
        pm: acc.pm + d.pm,
        direct: acc.direct + d.direct,
      };
    },
    { senior: 0, analyst: 0, pm: 0, direct: 0 },
  );
  const fees =
    days.senior * budget.rateSenior + days.analyst * budget.rateAnalyst + days.pm * budget.ratePm;
  const subtotal = fees + days.direct;
  const contingency = subtotal * (budget.contingencyPct / 100);
  const withContingency = subtotal + contingency;
  const tax = withContingency * (budget.taxPct / 100);
  const beforeDiscount = withContingency + tax;
  const discount = beforeDiscount * (budget.discountPct / 100);
  const final = beforeDiscount - discount;
  return { days, fees, subtotal, contingency, withContingency, tax, beforeDiscount, discount, final };
}

export function weightedScore(scores: Record<string, number>) {
  let sum = 0;
  let weight = 0;
  for (const d of SCORE_DIMENSIONS) {
    const v = Number(scores[d.id] ?? 0);
    if (v > 0) {
      sum += v * d.weight;
      weight += d.weight;
    }
  }
  return weight > 0 ? sum / weight : 0;
}

export function scoreBand(avg: number) {
  if (avg <= 0) return "Preencher notas";
  if (avg < 2.5) return "Baixa complexidade";
  if (avg < 3.7) return "Complexidade média";
  return "Alta complexidade";
}
