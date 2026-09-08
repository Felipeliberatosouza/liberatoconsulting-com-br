/**
 * Endereços dos 19 serviços antigos: continuam respondendo com redirecionamento
 * permanente para a família de produto equivalente, evitando erros 404 no Google.
 */
export const LEGACY_SERVICE_REDIRECTS: Record<string, string> = {
  "desdobramento-de-metas": "pessoas-lideranca-e-gestao-da-mudanca",
  "projetos-de-capital": "eficiencia-operacional",
  "transformacao-digital": "digital-dados-e-ia-aplicada",
  "excelencia-comercial": "cliente-vendas-e-experiencia",
  "excelencia-em-processos": "eficiencia-operacional",
  "excelencia-industrial": "eficiencia-operacional",
  "gestao-da-rotina": "eficiencia-operacional",
  "modelagem-de-negocio": "crescimento-expansao-e-novos-produtos",
  "validacao-de-mercado": "crescimento-expansao-e-novos-produtos",
  "precificacao-unit-economics": "financas-estrategicas-e-controles",
  "captacao-investidores": "financas-estrategicas-e-controles",
  "operacao-inicial": "eficiencia-operacional",
  "estudo-de-viabilidade": "crescimento-expansao-e-novos-produtos",
  "dimensionamento-de-mercado": "inteligencia-de-mercado-e-decisoes",
  "analise-competitiva": "inteligencia-de-mercado-e-decisoes",
  "estudos-setoriais-brasil": "inteligencia-de-mercado-e-decisoes",
  "comportamento-do-consumidor": "cliente-vendas-e-experiencia",
  "leitura-regulatoria": "inteligencia-de-mercado-e-decisoes",
  "parceiros-e-alvos-locais": "crescimento-expansao-e-novos-produtos",
};
