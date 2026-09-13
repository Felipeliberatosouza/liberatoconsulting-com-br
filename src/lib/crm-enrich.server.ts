import { CRM_SEGMENTS } from "@/lib/crm-segments";

/**
 * Enriquecimento completo de uma empresa com IA e busca na web — o mesmo
 * conjunto de dados do botão "IA" do cadastro de empresas do CRM.
 */

export type CompanyEnrichment = {
  legal_name: string;
  cnpj: string;
  segment: string;
  size: "pme" | "corporacao" | "";
  country: string;
  state: string;
  city: string;
  district: string;
  zip: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  founded_on: string;
  employees: number | null;
  revenue_range: string;
  owner_name: string;
  owner_title: string;
  tags: string[];
  notes: string;
};

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function enrichCompanyProfile(input: {
  tradeName: string;
  legalName?: string;
  cnpj?: string;
  segment?: string;
  city?: string;
  country?: string;
  website?: string;
}): Promise<CompanyEnrichment | null> {
  const { askJsonGrounded } = await import("./ai.server");
  try {
    const draft = await askJsonGrounded<Record<string, unknown>>(
      "Você é analista de inteligência de mercado de uma consultoria brasileira. " +
        "Pesquise na web dados públicos e ATUAIS das empresas e complete o cadastro. Nunca invente CNPJ ou CEP: " +
        "deixe em branco quando não tiver confiança razoável.",
      `Empresa (nome fantasia): ${input.tradeName}${input.legalName ? ` | razão social informada: ${input.legalName}` : ""}.
${input.cnpj ? `CNPJ informado: ${input.cnpj}. Este CNPJ é a fonte da verdade: reconfira TODOS os dados para a empresa titular deste CNPJ.` : ""}
Segmento informado: ${input.segment || "não informado"}. Local informado: ${[input.city, input.country].filter(Boolean).join(", ") || "não informado"}. Site informado: ${input.website || "não informado"}.

Responda com JSON exatamente neste formato (strings vazias quando não souber):
{
 "legal_name":"razão social",
 "cnpj":"00.000.000/0000-00",
 "segment":"escolha EXATAMENTE um item desta lista: ${CRM_SEGMENTS.join(" | ")}",
 "size":"pme ou corporacao",
 "country":"país da sede",
 "state":"UF ou estado/província",
 "city":"cidade",
 "district":"bairro",
 "zip":"CEP",
 "address":"rua e número",
 "website":"site oficial",
 "email":"e-mail público de contato",
 "phone":"telefone com DDI, ex.: +55 11 3000-0000",
 "founded_on":"AAAA-MM-DD da fundação",
 "employees": 0,
 "revenue_range":"faixa de FATURAMENTO MENSAL em reais, média estimada dos últimos 12 meses",
 "owner_name":"nome do principal executivo EM EXERCÍCIO hoje (confirme trocas recentes de comando)",
 "owner_title":"cargo do principal executivo",
 "tags":["até 8 tags curtas em português"],
 "notes":"resumo executivo de até 600 caracteres sobre a empresa"
}`,
    );

    const segment = CRM_SEGMENTS.find(
      (s) => s.toLowerCase() === str(draft['segment'], 160).toLowerCase(),
    );
    const founded = str(draft['founded_on'], 10);
    const employees = Number(draft['employees']);
    const size = str(draft['size'], 20).toLowerCase() === "corporacao" ? "corporacao" : "pme";

    return {
      legal_name: str(draft['legal_name'], 200),
      cnpj: str(draft['cnpj'], 40),
      segment: segment ?? "",
      size,
      country: str(draft['country'], 80),
      state: str(draft['state'], 80),
      city: str(draft['city'], 120),
      district: str(draft['district'], 160),
      zip: str(draft['zip'], 20),
      address: str(draft['address'], 300),
      website: str(draft['website'], 200),
      email: str(draft['email'], 255),
      phone: str(draft['phone'], 60),
      founded_on: /^\d{4}-\d{2}-\d{2}$/.test(founded) ? founded : "",
      employees: Number.isFinite(employees) && employees > 0 ? Math.round(employees) : null,
      revenue_range: str(draft['revenue_range'], 120),
      owner_name: str(draft['owner_name'], 160),
      owner_title: str(draft['owner_title'], 160),
      tags: (Array.isArray(draft['tags']) ? (draft['tags'] as unknown[]) : [])
        .map((t) => str(t, 40))
        .filter(Boolean)
        .slice(0, 8),
      notes: str(draft['notes'], 2000),
    };
  } catch {
    return null;
  }
}
