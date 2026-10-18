import { createFileRoute, redirect } from "@tanstack/react-router";

// Tela consolidada na Central de usuários (aba Leads).
export const Route = createFileRoute("/admin/leads")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users", search: { aba: "leads" }, replace: true });
  },
});
