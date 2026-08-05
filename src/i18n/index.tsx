import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "pt" | "en";

type Dict = typeof pt;

const pt = {
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
      { t: "Transferência de conhecimento", d: "O cliente termina o projeto mais capaz do que começou." },
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

const en: Dict = {
  nav: {
    home: "Home",
    services: "Services",
    about: "About",
    contact: "Contact",
    cta: "Get in touch",
  },
  hero: {
    eyebrow: "Business management consulting",
    title: "Management that decides. Artificial intelligence that delivers.",
    body: "Liberato Consulting combines management discipline, entrepreneurial thinking and market intelligence on Brazil — with AI at the core of every engagement.",
    primary: "Explore services",
    secondary: "Book a conversation",
  },
  stats: [
    { value: "AI", label: "at the core of every project" },
    { value: "3", label: "integrated practice areas" },
    { value: "BR", label: "local intelligence for global companies" },
  ],
  purpose: {
    eyebrow: "Our purpose",
    title: "Artificial intelligence applied to management, not to hype",
    body: "We don't treat AI as a separate offering. It is the method: we map where artificial intelligence creates real value in each process, define responsible data use, and train teams to run it on their own after we leave.",
    points: [
      "AI maturity assessment and prioritisation by return",
      "AI-assisted process design and data governance",
      "Training for leadership and operating teams",
    ],
  },
  services: {
    eyebrow: "Services",
    title: "Three practices, one method",
    body: "Every practice ships with artificial intelligence built in — from diagnosis to execution.",
    items: [
      {
        title: "Strategic business management",
        body: "Strategy, goal deployment, operational efficiency and management routine. We turn ambition into indicators tracked week by week, with AI-supported analysis and forecasting.",
        bullets: [
          "Strategic planning and goal deployment",
          "Cost reduction and operational efficiency",
          "Management dashboards and AI demand forecasting",
        ],
      },
      {
        title: "Entrepreneurship",
        body: "From business model to traction. We structure operations, pricing and fundraising for founders and growing companies, using AI to validate hypotheses faster and with less capital.",
        bullets: [
          "Business modelling and market validation",
          "Financial structuring and investor materials",
          "AI automation and productivity from day one",
        ],
      },
      {
        title: "Market research on Brazil",
        body: "Market intelligence for international companies that want to understand, enter or expand in Brazil: sector, competition, regulation, consumer culture and entry scenarios.",
        bullets: [
          "Sector studies and market sizing",
          "Competitive and local partner mapping",
          "Data analysis at scale with AI models",
        ],
      },
    ],
  },
  approach: {
    eyebrow: "How we work",
    title: "A method in four movements",
    steps: [
      { n: "01", t: "Diagnosis", d: "Data, interviews and a read of the competitive context." },
      { n: "02", t: "Design", d: "Priorities, targets and where AI enters each process." },
      { n: "03", t: "Implementation", d: "Working side by side with your team, in the real routine." },
      { n: "04", t: "Autonomy", d: "Training and full transfer of the method to the client." },
    ],
  },
  about: {
    eyebrow: "About us",
    title: "A Brazilian consultancy with a global read",
    body: "Liberato Consulting was born from the conviction that good management is discipline, and that artificial intelligence only creates value when anchored in process, reliable data and prepared people.",
    body2:
      "We work alongside Brazilian companies that want to grow with method, and international companies that need to understand Brazil before investing. In every case we deliver clarity: what to do, in what order, and how to measure it.",
    values: [
      { t: "Method before tooling", d: "Technology serves the decision, never the other way around." },
      { t: "Measured results", d: "Every project has indicators agreed at the start." },
      { t: "Knowledge transfer", d: "Clients finish a project more capable than they started." },
    ],
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk about your next cycle",
    body: "Tell us about your challenge. We reply within two business days.",
    name: "Name",
    email: "Email",
    company: "Company",
    message: "How can we help?",
    submit: "Send message",
    sent: "Message received. Thank you for reaching out!",
    info: "Or write directly to",
  },
  cta: {
    title: "Ready to put AI to work in your management?",
    body: "An initial 45-minute conversation is usually enough to map the first opportunities.",
    button: "Talk to Liberato",
  },
  footer: {
    tagline: "Business management consulting with artificial intelligence at its core.",
    rights: "All rights reserved.",
  },
};

const dictionaries: Record<Lang, Dict> = { pt, en };

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: Dict;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "liberato-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pt" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "pt" ? "en" : "pt"),
      t: dictionaries[lang],
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
