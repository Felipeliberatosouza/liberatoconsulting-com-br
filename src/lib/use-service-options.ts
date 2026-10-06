import { useMemo } from "react";

import { useLanguage } from "@/i18n";

/**
 * Lista de serviços derivada do cadastro em Serviços (painel), sempre atual:
 * área · família e área · família · produto.
 */
export function useServiceOptions() {
  const { t } = useLanguage();
  return useMemo(() => {
    const families = t.serviceFamilies.items;
    const pages = t.serviceDetail.pages;
    const out: Array<{ id: string; label: string; kind: "family" | "product" }> = [];
    for (const g of t.megaMenu.groups) {
      for (const item of g.items) {
        out.push({ id: item.id, label: `${g.title} · ${item.label}`, kind: "family" });
        const fam = families.find((f) => f.id === item.id);
        for (const p of pages) {
          if (fam?.products.includes(p.id) && p.groups.includes(g.id)) {
            out.push({ id: p.id, label: `${g.title} · ${item.label} · ${p.title}`, kind: "product" });
          }
        }
      }
    }
    return out;
  }, [t]);
}
