import type { Dict } from "../pt";

// Baseline gerado a partir do português. Se o conteúdo em PT mudar,
// a tradução é regenerada automaticamente por IA em tempo de execução.
export const sourceHash = "__PT_HASH__";

export const dict: Dict = {
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
      {
        n: "03",
        t: "Implementation",
        d: "Working side by side with your team, in the real routine.",
      },
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
      {
        t: "Method before tooling",
        d: "Technology serves the decision, never the other way around.",
      },
      { t: "Measured results", d: "Every project has indicators agreed at the start." },
      {
        t: "Knowledge transfer",
        d: "Clients finish a project more capable than they started.",
      },
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
