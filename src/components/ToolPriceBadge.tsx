import { useLanguage } from "@/i18n";
/** Selo de preço das ferramentas: "Gratuita" em destaque ou valor em R$. */
export function ToolPriceBadge({ pricingMode, price }: { pricingMode: string; price: number }) {
  const lang = useLanguage().lang;
  const labels = {pt:["Gratuita","Gratuita por indicação"],en:["Free","Free with referral"],es:["Gratis","Gratis con recomendación"],zh:["免费","推荐后免费"]}[lang];
  const free = pricingMode !== "paid";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${free ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-foreground"}`}>
      {free ? labels[pricingMode === "referral" ? 1 : 0] : Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </span>
  );
}
