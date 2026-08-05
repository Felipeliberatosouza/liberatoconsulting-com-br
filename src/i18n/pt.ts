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
    items: [
      {
        title: "Gestão estratégica de negócios",
        body: "Estratégia, desdobramento de metas, eficiência operacional e rotina de gestão. Traduzimos ambição em indicadores acompanhados semana a semana, com análises e previsões apoiadas por IA.",
        bullets: [
          "Planejamento estratégico e desdobramento de metas",
          "Redução de custos e eficiência operacional",
          "Painéis de gestão e previsão de demanda com IA",
        ],
      },
      {
        title: "Empreendedorismo",
        body: "Do modelo de negócio à tração. Estruturamos operação, precificação e captação para fundadores e empresas em crescimento, usando IA para validar hipóteses mais rápido e com menos capital.",
        bullets: [
          "Modelagem de negócio e validação de mercado",
          "Estruturação financeira e material para investidores",
          "Automação e produtividade com IA desde o dia um",
        ],
      },
      {
        title: "Pesquisas de mercado sobre o Brasil",
        body: "Inteligência de mercado para empresas internacionais que querem entender, entrar ou expandir no Brasil: setor, concorrência, regulação, cultura de consumo e cenários de entrada.",
        bullets: [
          "Estudos setoriais e dimensionamento de mercado",
          "Mapeamento competitivo e de parceiros locais",
          "Análise de dados em escala com modelos de IA",
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
