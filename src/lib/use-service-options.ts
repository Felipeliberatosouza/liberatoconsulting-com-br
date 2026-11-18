import { useMemo } from "react";

import { useLanguage } from "@/i18n";

/**
 * One current service per choice; historical records keep their saved names.
 */
export function useServiceOptions() {
  const { t } = useLanguage();
  return useMemo(() => {
    const pages = t.serviceDetail.pages;
    return pages.map((p): { id: string; label: string; kind: "family" | "product" } => ({ id: p.id, label: p.title, kind: "product" }));
  }, [t]);
}
