import { EMPTY_PRODUCT, type ServiceProduct } from "./services-catalog";
import { crmScopeQuestions, fechouCopy } from "./fechou-copy";
import type { CatalogActivity } from "./pricing-catalog";

export const CRM_SERVICE_SLUG = "crm-sob-medida";
export const isCrmService = (slug: string) => slug === CRM_SERVICE_SLUG || slug === "crm";
export const CRM_SERVICE: ServiceProduct = {
  ...EMPTY_PRODUCT,
  slug: CRM_SERVICE_SLUG,
  group_id: "estrategia",
  groups: ["estrategia"],
  family_id: "crm",
  family_title: "Gestão comercial",
  code: "CRM",
  title: "Fechou! CRM sob Medida",
  lead: fechouCopy.pt.body,
  problem: fechouCopy.pt.title,
  body: "Mapeamento do processo comercial, parametrização do funil, migração de dados, definição de acessos e capacitação da equipe.",
  bullets: fechouCopy.pt.features,
  results: [
    "Mais clareza sobre etapas e responsáveis",
    "Acompanhamento dos prazos e metas comerciais",
  ],
  modules: [
    "Diagnóstico comercial",
    "Configuração do funil e migração",
    "Treinamento e acompanhamento",
  ],
  ai: "Assistente para dúvidas, rascunhos e solicitação de indicadores comerciais.",
};
export function withCrmService<T extends { slug: string }>(products: T[] = []) {
  return products.some((p) => p.slug === CRM_SERVICE_SLUG) ? products : [...products, CRM_SERVICE];
}
export const CRM_DIAGNOSTIC = crmScopeQuestions("pt").map((q) => ({
  id: q.id,
  question: q.question,
  block: q.theme,
  purpose: q.purpose,
  options: q.options,
  required: true,
  multi: false,
}));
export const CRM_ACTIVITIES: CatalogActivity[] = [
  {
    id: "crm-map",
    phase: "p1",
    label: "Mapear funil e responsáveis",
    consultant: 4,
    assistant: 0,
    freelancer: 0,
    thirdParty: 0,
    reps: 1,
  },
  {
    id: "crm-data",
    phase: "p2",
    label: "Validar arquivos e regras de migração",
    consultant: 4,
    assistant: 2,
    freelancer: 0,
    thirdParty: 0,
    reps: 1,
  },
  {
    id: "crm-setup",
    phase: "p3",
    label: "Configurar etapas, prazos, metas e permissões",
    consultant: 8,
    assistant: 0,
    freelancer: 0,
    thirdParty: 0,
    reps: 1,
  },
  {
    id: "crm-training",
    phase: "p4",
    label: "Treinar vendedores e gestor",
    consultant: 4,
    assistant: 0,
    freelancer: 0,
    thirdParty: 0,
    reps: 1,
  },
  {
    id: "crm-review",
    phase: "p5",
    label: "Revisar operação após implantação",
    consultant: 2,
    assistant: 0,
    freelancer: 0,
    thirdParty: 0,
    reps: 1,
  },
];
