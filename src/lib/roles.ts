/** Papéis com acesso à área administrativa. */
export const PANEL_ROLES = ["admin", "consultor", "autor"] as const;
export type PanelRole = (typeof PANEL_ROLES)[number];

export const ROLE_LABEL: Record<PanelRole, string> = {
  admin: "Administrador",
  consultor: "Consultor",
  autor: "Autor de artigos",
};

export const ROLE_DESCRIPTION: Record<PanelRole, string> = {
  admin: "Acesso completo ao painel, aprovações e configurações.",
  consultor:
    "Acesso a Conteúdos, Indicadores, Newsletter, Dados do Brasil e Boletim Semanal. Alterações passam por aprovação.",
  autor:
    "Acesso a Conteúdos, Indicadores, Newsletter, Dados do Brasil e Boletim Semanal. Alterações passam por aprovação.",
};

const PANEL_AREAS = [
  "/admin",
  "/admin/content",
  "/admin/brasil",
  "/admin/indicadores",
  "/admin/newsletter",
  "/admin/boletim",
  "/admin/contrato",
];

/** Rotas do painel liberadas para cada papel. */
export const ROLE_ROUTES: Record<PanelRole, string[]> = {
  admin: ["*"],
  consultor: PANEL_AREAS,
  autor: PANEL_AREAS,
};


export function canAccess(roles: string[], path: string): boolean {
  if (roles.includes("admin")) return true;
  return roles.some((r) => (ROLE_ROUTES[r as PanelRole] ?? []).includes(path));
}

/** Papéis que precisam assinar contrato antes de usar o sistema. */
export const CONTRACT_ROLES: PanelRole[] = ["consultor", "autor"];

export type SessionInfo = {
  userId: string | null;
  roles: string[];
  isAdmin: boolean;
  name: string;
  email: string;
  needsContract: null | { audience: string; title: string; body: string; version: number };
};
