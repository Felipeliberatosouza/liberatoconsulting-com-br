import { useMemo } from "react";

import { useLanguage } from "@/i18n";

/**
 * Lista de serviços derivada do cadastro em Serviços (painel), sempre atual:
 * área · família e área · família · produto.
 */
export function useServiceOptions() {
  const { t } = useLanguage();
  return useMemo(() => {
    const pages = t.serviceDetail.pages;
    return pages.map((p) => ({ id: p.id, label: p.title, kind: "product" as const }));
  }, [t]);
}
