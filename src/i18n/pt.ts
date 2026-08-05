// Fonte única de verdade do conteúdo do site.
// Qualquer alteração aqui é propagada automaticamente para EN / ES / ZH
// pela tradução automática (src/lib/translate.server.ts).
export const pt = {
  nav: {
    home: "Início",
    services: "Serviços",
    about: "Quem somos",
    contact: "Contato",
    cta: "Fale conosco",
  },
  megaMenu: {
    more: "ver todos os serviços",
    groups: [
      {
        id: "estrategia",
        title: "Estratégia",
        anchor: "gestao",
        items: [
          { id: "desdobramento-de-metas", label: "Desdobramento de Metas" },
          { id: "projetos-de-capital", label: "Gestão de Projetos de Capital" },
          { id: "transformacao-digital", label: "Transformação Digital" },
        ],
      },
      {
        id: "operacoes",
        title: "Operações",
        anchor: "gestao",
        items: [
          { id: "excelencia-comercial", label: "Excelência Comercial" },
          { id: "excelencia-em-processos", label: "Excelência em Processos" },
          { id: "excelencia-industrial", label: "Excelência Industrial" },
          { id: "gestao-da-rotina", label: "Gestão da Rotina" },
        ],
      },
      {
        id: "empreendedorismo",
        title: "Empreendedorismo",
        anchor: "empreendedorismo",
        items: [
          { id: "modelagem-de-negocio", label: "Modelagem de Negócio" },
          { id: "validacao-de-mercado", label: "Validação de Mercado" },
          { id: "precificacao-unit-economics", label: "Precificação e Unit Economics" },
          { id: "captacao-investidores", label: "Captação e Materiais para Investidores" },
          { id: "operacao-inicial", label: "Estruturação da Operação Inicial" },
        ],
      },
      {
        id: "pesquisas",
        title: "Pesquisas de Mercado",
        anchor: "pesquisas-brasil",
        items: [
          { id: "dimensionamento-de-mercado", label: "Dimensionamento de Mercado" },
          { id: "analise-competitiva", label: "Análise Competitiva" },
          { id: "estudos-setoriais-brasil", label: "Estudos Setoriais sobre o Brasil" },
          { id: "comportamento-do-consumidor", label: "Comportamento do Consumidor" },
          { id: "leitura-regulatoria", label: "Leitura Regulatória e Barreiras de Entrada" },
          { id: "parceiros-e-alvos-locais", label: "Mapeamento de Parceiros e Alvos Locais" },
        ],
      },
    ],
  },
  hero: {
    eyebrow: "Consultoria em gestão empresarial",
    title: "Gestão que decide. Inteligência artificial que executa.",
    body: "A Liberato Consulting une método de gestão, visão empreendedora e inteligência de mercado sobre o Brasil — com IA no centro de cada entrega.",
    primary: "Conheça os serviços",
    secondary: "Agendar conversa",
  },
  stats: [
    { value: "IA", label: "no núcleo de todos os projetos" },
    { value: "3", label: "frentes de atuação integradas" },
    { value: "BR", label: "inteligência local para empresas globais" },
  ],
  purpose: {
    eyebrow: "Nosso propósito",
    title: "Inteligência artificial aplicada à gestão, não à moda",
    body: "Não tratamos IA como um serviço à parte. Ela é o método: mapeamos onde a inteligência artificial gera valor real em cada processo, definimos o uso responsável dos dados e capacitamos as equipes para operar com autonomia depois que saímos.",
    points: [
      "Diagnóstico de maturidade em IA e priorização por retorno",
      "Desenho de processos assistidos por IA e governança de dados",
      "Capacitação de lideranças e times operacionais",
    ],
  },
  services: {
    eyebrow: "Serviços",
    title: "Três frentes, um método",
    body: "Cada frente é entregue com inteligência artificial embarcada — do diagnóstico à execução.",
    labels: {
      scope: "O que fazemos",
      ai: "Onde a inteligência artificial entra",
      deliverables: "O que você recebe",
      audience: "Para quem é",
      duration: "Duração típica",
    },
    items: [
      {
        id: "gestao",
        title: "Gestão estratégica de negócios",
        lead: "Da ambição à rotina de gestão que sustenta o resultado.",
        body: "Estratégia, desdobramento de metas, eficiência operacional e rotina de gestão. Traduzimos ambição em indicadores acompanhados semana a semana, com análises e previsões apoiadas por IA.",
        audience: "Empresas com operação estabelecida que precisam recuperar margem, acelerar crescimento ou dar previsibilidade ao resultado.",
        duration: "3 a 9 meses, com ciclos mensais de revisão.",
        bullets: [
          "Planejamento estratégico e desdobramento de metas",
          "Redução de custos e eficiência operacional",
          "Rotina de gestão: reuniões, indicadores e planos de ação",
          "Governança de dados e padronização de processos",
        ],
        ai: {
          body: "A IA não substitui a decisão do gestor: ela encurta o caminho até a informação confiável e antecipa o que ainda não apareceu no relatório.",
          items: [
            "Previsão de demanda, receita e caixa a partir do histórico da própria empresa",
            "Painéis com leitura automática de desvios e explicação da causa provável",
            "Agentes que consolidam dados de ERP, CRM e planilhas em um único relatório de gestão",
            "Simulação de cenários de preço, custo e capacidade antes de comprometer investimento",
          ],
        },
        deliverables: [
          "Mapa estratégico com metas desdobradas por área",
          "Painel de indicadores em operação, alimentado automaticamente",
          "Carteira de projetos de ganho com retorno estimado",
          "Time treinado para conduzir a rotina sem a consultoria",
        ],
      },
      {
        id: "empreendedorismo",
        title: "Empreendedorismo",
        lead: "Do modelo de negócio à tração, com menos capital queimado por hipótese.",
        body: "Estruturamos operação, precificação e captação para fundadores e empresas em crescimento, usando IA para validar hipóteses mais rápido e com menos capital.",
        audience: "Fundadores, negócios em early stage e novas unidades de negócio dentro de empresas já estabelecidas.",
        duration: "6 a 16 semanas, em sprints de validação.",
        bullets: [
          "Modelagem de negócio e validação de mercado",
          "Precificação, unit economics e estrutura financeira",
          "Material para investidores e preparação de rodada",
          "Desenho da operação mínima viável e das primeiras contratações",
        ],
        ai: {
          body: "Usamos IA para reduzir o custo de aprender: cada hipótese é testada com evidência real antes de virar estrutura fixa.",
          items: [
            "Pesquisa de mercado e análise competitiva aceleradas por modelos de linguagem",
            "Testes de proposta de valor e mensagem com síntese automática das respostas",
            "Modelo financeiro com cenários gerados e estressados por IA",
            "Automação de vendas, atendimento e back office desde o dia um, sem inflar o time",
          ],
        },
        deliverables: [
          "Modelo de negócio validado, com hipóteses testadas e descartadas documentadas",
          "Modelo financeiro e política de preços",
          "Deck e materiais de captação prontos para investidor",
          "Stack inicial de automação e IA em funcionamento",
        ],
      },
      {
        id: "pesquisas-brasil",
        title: "Pesquisas de mercado sobre o Brasil",
        lead: "Inteligência local para quem decide sobre o Brasil de fora do Brasil.",
        body: "Inteligência de mercado para empresas internacionais que querem entender, entrar ou expandir no Brasil: setor, concorrência, regulação, cultura de consumo e cenários de entrada.",
        audience: "Empresas internacionais, fundos e áreas corporativas de expansão avaliando o mercado brasileiro.",
        duration: "4 a 12 semanas, conforme a profundidade setorial.",
        bullets: [
          "Estudos setoriais e dimensionamento de mercado",
          "Mapeamento competitivo, de canais e de parceiros locais",
          "Leitura regulatória, tributária e de barreiras de entrada",
          "Cenários de entrada: orgânico, parceria ou aquisição",
        ],
        ai: {
          body: "O Brasil produz muito dado público em português. A IA nos permite ler tudo isso em escala e entregar a conclusão no idioma do cliente.",
          items: [
            "Leitura automatizada de bases públicas, editais, balanços e notícias em português",
            "Monitoramento contínuo de concorrentes, preços e movimentos de mercado",
            "Análise de sentimento e cultura de consumo a partir de dados sociais e reviews",
            "Relatórios entregues em inglês, espanhol ou mandarim com rastreabilidade das fontes",
          ],
        },
        deliverables: [
          "Relatório setorial com dimensionamento e projeções",
          "Mapa competitivo e shortlist de parceiros ou alvos locais",
          "Avaliação de risco regulatório e operacional",
          "Recomendação de entrada com plano de 12 meses",
        ],
      },
    ],
  },

  approach: {
    eyebrow: "Como trabalhamos",
    title: "Método em quatro tempos",
    steps: [
      { n: "01", t: "Diagnóstico", d: "Dados, entrevistas e leitura do contexto competitivo." },
      { n: "02", t: "Desenho", d: "Prioridades, metas e onde a IA entra em cada processo." },
      { n: "03", t: "Implantação", d: "Trabalho lado a lado com o time, na rotina real." },
      { n: "04", t: "Autonomia", d: "Capacitação e transferência de método para o cliente." },
    ],
  },
  about: {
    eyebrow: "Quem somos",
    title: "Consultoria brasileira com leitura global",
    body: "A Liberato Consulting nasceu da convicção de que boa gestão é disciplina, e que inteligência artificial só cria valor quando está ancorada em processo, dado confiável e gente preparada.",
    body2:
      "Trabalhamos ao lado de empresas brasileiras que querem crescer com método e de empresas internacionais que precisam entender o Brasil antes de investir. Em todos os casos, entregamos clareza: o que fazer, em que ordem e como medir.",
    values: [
      { t: "Método antes de ferramenta", d: "A tecnologia serve à decisão, nunca o contrário." },
      { t: "Resultado medido", d: "Cada projeto tem indicadores acordados no início." },
      {
        t: "Transferência de conhecimento",
        d: "O cliente termina o projeto mais capaz do que começou.",
      },
    ],
  },
  contact: {
    eyebrow: "Contato",
    title: "Vamos conversar sobre o seu próximo ciclo",
    body: "Conte o desafio da sua empresa. Respondemos em até dois dias úteis.",
    name: "Nome",
    email: "E-mail",
    company: "Empresa",
    message: "Como podemos ajudar?",
    submit: "Enviar mensagem",
    sent: "Mensagem registrada. Obrigado pelo contato!",
    info: "Ou escreva diretamente para",
  },
  cta: {
    title: "Pronto para colocar IA a serviço da sua gestão?",
    body: "Uma conversa inicial de 45 minutos costuma ser suficiente para mapear as primeiras oportunidades.",
    button: "Falar com a Liberato",
  },
  footer: {
    tagline: "Consultoria em gestão empresarial com inteligência artificial no centro.",
    rights: "Todos os direitos reservados.",
  },
};

export type Dict = typeof pt;
