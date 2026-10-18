import { createFileRoute, redirect } from "@tanstack/react-router";

// Tela consolidada na Central de usuários (aba Clientes de materiais).
export const Route = createFileRoute("/admin/ferramentas-clientes")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users", search: { aba: "tools" }, replace: true });
  },
});
