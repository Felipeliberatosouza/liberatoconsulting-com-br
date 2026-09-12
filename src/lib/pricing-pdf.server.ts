import {
  COUNTRIES,
  formatMoney,
  type PricingSettings,
  type QuoteOptions,
  type QuoteResult,
} from "./pricing-catalog";

function br(date: string) {
  const d = new Date(`${date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("pt-BR");
}

function camel(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .slice(0, max);
}

export type QuotePdfInput = {
  quote: QuoteResult;
  settings: PricingSettings;
  options: QuoteOptions;
  serviceTitle: string;
  clientName: string;
  notes: string;
};

/** Monta o corpo do orçamento (etapas, cronograma e total) e gera o PDF. */
export async function renderQuotePdf(input: QuotePdfInput) {
  const { quote, options } = input;
  const cur = options.currency;
  const rate = options.fxRate || 1;
  const money = (brl: number) => formatMoney(brl * rate, cur);
  const country = COUNTRIES.find((c) => c.id === options.country);

  const lines: string[] = [];
  lines.push(`## Orçamento e cronograma de execução`);
  lines.push("");
  lines.push(
    [
      input.clientName ? `- Cliente: ${input.clientName}` : "",
      `- Serviço: ${input.serviceTitle}`,
      `- Porte: ${options.companyType === "sme" ? "Pequena empresa / startup" : "Corporação"}`,
      `- Localização: ${country?.label ?? options.country}`,
      `- Início previsto: ${br(quote.start)} · Conclusão prevista: ${br(quote.end)}`,
      `- Prazo total: ${quote.totalDays.toFixed(0)} dias úteis`,
      options.remoteOnly
        ? "- Formato: encontros e workshops realizados on-line, sem deslocamento da equipe."
        : "- Formato: encontros-chave presenciais, demais atividades remotas.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  lines.push("");
  lines.push(`### Etapas e composição dos serviços`);
  lines.push("");
  lines.push("| Etapa / atividade | Início | Dias úteis | Conclusão | Valor |");
  lines.push("|---|---|---|---|---|");
  for (const phase of quote.phases) {
    lines.push(
      `| ${phase.title} | ${br(phase.start)} | ${phase.days.toFixed(1)} | ${br(phase.end)} | ${money(phase.priceBrl)} |`,
    );
    for (const item of phase.items) {
      const label = item.remoteNote ? `${item.label} (on-line)` : item.label;
      lines.push(
        `| - ${label} | ${br(item.start)} | ${item.days.toFixed(1)} | ${br(item.end)} | ${money(item.priceBrl)} |`,
      );
    }
  }
  lines.push("");
  lines.push("### Investimento");
  lines.push("");
  lines.push("| Descrição | Valor |");
  lines.push("|---|---|");
  lines.push(`| Subtotal | ${money(quote.subtotalBrl)} |`);
  if (quote.discountBrl > 0) {
    lines.push(`| Desconto comercial (${options.discountPct}%) | -${money(quote.discountBrl)} |`);
  }
  lines.push(`| **Total do projeto** | **${money(quote.totalBrl)}** |`);
  lines.push("");
  if (cur !== "BRL") {
    lines.push(
      `Valores convertidos a partir de ${formatMoney(quote.totalBrl, "BRL")} pela cotação de referência utilizada na emissão desta proposta.`,
    );
    lines.push("");
  }
  if (input.notes.trim()) {
    lines.push("### Observações");
    lines.push("");
    lines.push(input.notes.trim());
    lines.push("");
  }
  lines.push("### Condições");
  lines.push("");
  lines.push(
    "- Proposta válida por 30 dias a contar da data de emissão.\n" +
      "- O cronograma considera dias úteis e depende da disponibilidade de dados e agendas do cliente.\n" +
      "- Despesas de viagem e hospedagem, quando houver atividades presenciais fora da sede do cliente, são cobradas à parte.\n" +
      "- Serviços de terceiros (pesquisas de campo, cliente oculto, registros) já estão incluídos nas etapas em que aparecem.",
  );

  const { buildBrandedPdf } = await import("./pdf.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: branding }, { data: company }] = await Promise.all([
    supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
    supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
  ]);
  const { formatCompanyAddress } = await import("./company-footer.server");
  const { siteOrigin } = await import("./bulletin.server");
  const c = (company ?? {}) as Record<string, string>;
  const logoUrl =
    ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl ||
    c["logo_url"] ||
    `${siteOrigin()}/logo.png`;
  const companyName = c["trade_name"] || c["legal_name"] || "Liberato Consulting";

  const bytes = await buildBrandedPdf({
    title: input.serviceTitle,
    subtitle: input.clientName ? `Proposta para ${input.clientName}` : "Proposta comercial",
    referenceDate: new Date().toLocaleDateString("pt-BR"),
    body: lines.join("\n"),
    logoDataUrl: logoUrl,
    contact: {
      name: companyName,
      line1:
        [c["phone"], c["email"]].filter(Boolean).join("  |  ") ||
        "contato@liberatoconsulting.com.br",
      line2:
        [formatCompanyAddress(c), c["cnpj"] ? `CNPJ ${c["cnpj"]}` : ""].filter(Boolean).join("  |  ") ||
        "Consultoria em gestão empresarial",
      website: c["website"] || "www.liberatoconsulting.com.br",
    },
  });

  const fileName = `Orcamento_${camel(input.serviceTitle, 40) || "Projeto"}_${camel(companyName, 30) || "LiberatoConsulting"}.pdf`;
  return { bytes, fileName };
}
