import { createFileRoute, redirect } from "@tanstack/react-router";

/** Tela unificada em /admin/areas: mantém endereços antigos funcionando. */
export const Route = createFileRoute("/admin/texts")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/areas" });
  },
});
