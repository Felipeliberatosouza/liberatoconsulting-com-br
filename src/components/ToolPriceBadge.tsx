/** Selo de preço das ferramentas: "Gratuita" em destaque ou valor em R$. */
export function ToolPriceBadge({ pricingMode, price }: { pricingMode: string; price: number }) {
  const free = pricingMode !== "paid";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${free ? "bg-accent text-accent-foreground" : "border border-border bg-secondary text-foreground"}`}>
      {free ? "Gratuita" : Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
    </span>
  );
}
