/**
 * DE-PARA do catálogo antigo (service_products) para o portfólio por dor
 * (src/lib/solutions.ts). Históricos (orçamentos, diagnósticos, ferramentas)
 * continuam com o nome antigo; o painel mostra o novo destino.
 */
export type DeParaTarget = { kind: "solucao" | "treinamento"; slug: string };

export const SERVICES_DEPARA: Record<string, DeParaTarget> = {
  "crm": { kind: "solucao", slug: "crm-sob-medida" },
  // Preço e lucro
  "precificacao-margem": { kind: "solucao", slug: "preco-certo-lucro-real" },
  "advisory-financeiro": { kind: "solucao", slug: "preco-certo-lucro-real" },
  "financeiro-sob-controle": { kind: "solucao", slug: "preco-certo-lucro-real" },
  "performance-finance-and-controls": { kind: "solucao", slug: "preco-certo-lucro-real" },
  // Vendas
  "estrutura-comercial": { kind: "solucao", slug: "vendas-sem-depender-do-dono" },
  "cliente-que-retem": { kind: "solucao", slug: "vendas-sem-depender-do-dono" },
  "customer-growth-and-experience-transformation": { kind: "solucao", slug: "vendas-sem-depender-do-dono" },
  // Operação
  "otimizacao-processos": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  "academia-de-qualidade-e-lean-para-certificacoes": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  "diagnostico-de-qualidade-90": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  "programa-de-excelencia-operacional": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  "sprint-de-produtividade": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  "sprint-lean-six-sigma-de-resultado": { kind: "solucao", slug: "operacao-sem-retrabalho" },
  // Metas e gestão
  "planejamento-metas": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "governanca-gestao": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "modelo-crescimento": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "organizacao-e-pessoas-para-crescer": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "people-and-transformation-office": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "esg-essencial": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  "sustainability-and-climate-strategy": { kind: "solucao", slug: "metas-que-saem-do-papel" },
  // Automação e IA
  "automacao-ia": { kind: "solucao", slug: "automacao-e-ia" },
  "mapa-digital-e-ia-pratica": { kind: "solucao", slug: "automacao-e-ia" },
  "enterprise-digital-and-ai-transformation": { kind: "solucao", slug: "automacao-e-ia" },
  "cyber-essentials-pme": { kind: "solucao", slug: "automacao-e-ia" },
  "cyber-resilience-and-digital-trust": { kind: "solucao", slug: "automacao-e-ia" },
  "trust-review-mensal": { kind: "solucao", slug: "automacao-e-ia" },
  // Validar ideia
  "validacao-negocios": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "decisao-viabilidade": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "pesquisa-demanda": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "plano-de-negocios": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "validacao-e-viabilidade": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "market-opportunity-decision": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  "customer-insight-sprint": { kind: "solucao", slug: "validar-ideia-antes-de-investir" },
  // Brasil
  "mercado-brasil": { kind: "solucao", slug: "entrada-no-brasil" },
  "inteligencia-competitiva": { kind: "solucao", slug: "entrada-no-brasil" },
  "brazil-entry-navigator": { kind: "solucao", slug: "entrada-no-brasil" },
  "market-signal-monitor": { kind: "solucao", slug: "entrada-no-brasil" },
  "carbono-e-cadeia": { kind: "solucao", slug: "entrada-no-brasil" },
  // Treinamentos
  "financas-margem": { kind: "treinamento", slug: "financas-para-nao-financeiros" },
  "vendas-b2b": { kind: "treinamento", slug: "vendas-consultivas-b2b" },
  "treinamento-relacionamento-clientes": { kind: "treinamento", slug: "vendas-consultivas-b2b" },
  "lean-processos": { kind: "treinamento", slug: "lean-eficiencia-processos" },
  "lideranca-rotina": { kind: "treinamento", slug: "lideranca-gestao-da-rotina" },
  "projetos-ageis": { kind: "treinamento", slug: "lideranca-gestao-da-rotina" },
  "ia-gestores": { kind: "treinamento", slug: "ia-pratica-gestores" },
  "treinamento-transformacao-digital": { kind: "treinamento", slug: "ia-pratica-gestores" },
};

export const deParaFor = (oldSlug: string): DeParaTarget | undefined => SERVICES_DEPARA[oldSlug];
export const deParaPath = (t: DeParaTarget) => (t.kind === "solucao" ? `/solucoes/${t.slug}` : `/treinamentos/${t.slug}`);
