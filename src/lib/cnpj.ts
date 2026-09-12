/** Consulta pública de dados cadastrais por CNPJ (BrasilAPI). */

import { onlyDigits } from "@/lib/validation";

export type CnpjCompany = {
  legalName: string;
  tradeName: string;
  segment: string;
  street: string;
  district: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  foundedOn: string;
};

export async function lookupCnpj(cnpj: string): Promise<CnpjCompany | null> {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14) return null;
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
    if (!res.ok) return null;
    const d = (await res.json()) as Record<string, any>;
    const number = String(d['numero'] ?? "").trim();
    const street = [d['logradouro'], number].filter(Boolean).join(", ");
    const phone = String(d['ddd_telefone_1'] ?? "").trim();
    return {
      legalName: String(d['razao_social'] ?? "").trim(),
      tradeName: String(d['nome_fantasia'] ?? "").trim(),
      segment: String(d['cnae_fiscal_descricao'] ?? "").trim(),
      street,
      district: String(d['bairro'] ?? "").trim(),
      city: String(d['municipio'] ?? "").trim(),
      state: String(d['uf'] ?? "").trim(),
      zip: String(d['cep'] ?? "").trim(),
      country: "Brasil",
      email: String(d['email'] ?? "").trim(),
      phone: phone ? `+55 ${phone}` : "",
      foundedOn: String(d['data_inicio_atividade'] ?? "").trim(),
    };
  } catch {
    return null;
  }
}
