import type { ProspectLead } from "@/lib/crm-prospect.functions";

/** One row per contact (or one row per company without contacts). */
export function prospectRows(leads: ProspectLead[]): Record<string, string | number>[] {
  const rows: Record<string, string | number>[] = [];
  for (const l of leads) {
    const base = {
      Empresa: l.name, "Nome fantasia": l.trade_name, CNPJ: l.cnpj, Segmento: l.segment,
      Funcionários: l.employees ?? "", Faturamento: l.revenue_range, País: l.country, UF: l.state,
      Cidade: l.city, Bairro: l.district, CEP: l.zip, Endereço: l.address, Site: l.website,
      "E-mail empresa": l.email, "Telefone empresa": l.phone, Qualidade: l.quality ?? "",
      "Já no CRM": l.duplicate ? "Sim" : "Não", Fontes: l.sources.join(" | "), Observações: l.notes,
    };
    const contacts = l.contacts.length ? l.contacts : [null];
    for (const c of contacts) {
      rows.push({
        ...base,
        Contato: c?.full_name ?? "", Cargo: c?.role_title ?? "", Departamento: c?.department ?? "",
        "E-mail contato": c?.email ?? "", "Telefone contato": c?.phone ?? "", LinkedIn: c?.linkedin_url ?? "",
      });
    }
  }
  return rows;
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function exportProspects(leads: ProspectLead[], format: "xlsx" | "csv") {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(prospectRows(leads));
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
    save(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }), `prospeccao-${stamp}.csv`);
    return;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Prospecção");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  save(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `prospeccao-${stamp}.xlsx`);
}
