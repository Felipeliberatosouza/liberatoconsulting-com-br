import type { ReactNode } from "react";

import { useLanguage } from "@/i18n";
import type { AreaKey } from "@/lib/site-config";

/**
 * Faixa de topo das grandes áreas do site. Quando há imagem configurada
 * no painel administrativo, ela entra como fundo com véu escuro para
 * manter a legibilidade do texto.
 */
export function AreaBannerSection({
  area,
  className = "py-24",
  children,
}: {
  area: AreaKey;
  className?: string;
  children: ReactNode;
}) {
  const { banners } = useLanguage();
  const image = banners?.[area]?.imageUrl;

  if (!image) {
    return <section className={`bg-ink text-ink-foreground ${className}`}>{children}</section>;
  }

  return (
    <section className={`relative isolate bg-ink text-ink-foreground ${className}`}>
      <img
        src={image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/75" />
      {children}
    </section>
  );
}
