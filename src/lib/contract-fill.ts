/**
 * Preenchimento automático dos contratos padrão.
 * Os textos usam marcadores no formato {{campo}}, substituídos pelos dados
 * cadastrais do consultor/autor e pelos dados da consultoria.
 */

export type ContractVars = Record<string, string>;

export const CONTRACT_TOKENS: Array<{ token: string; label: string }> = [
  { token: "nome", label: "Nome completo do consultor/autor" },
  { token: "cpf", label: "CPF" },
  { token: "rg", label: "RG" },
  { token: "nacionalidade", label: "Nacionalidade" },
  { token: "estado_civil", label: "Estado civil" },
  { token: "endereco", label: "Endereço completo" },
  { token: "email", label: "E-mail" },
  { token: "telefone", label: "Telefone" },
  { token: "banco", label: "Banco" },
  { token: "agencia", label: "Agência" },
  { token: "conta", label: "Conta" },
  { token: "pix", label: "Chave PIX" },
  { token: "empresa_razao_social", label: "Razão social da consultoria" },
  { token: "empresa_nome_fantasia", label: "Nome fantasia" },
  { token: "empresa_cnpj", label: "CNPJ" },
  { token: "empresa_endereco", label: "Endereço da consultoria" },
  { token: "empresa_email", label: "E-mail da consultoria" },
  { token: "empresa_telefone", label: "Telefone da consultoria" },
  { token: "empresa_site", label: "Site" },
  { token: "cidade_foro", label: "Cidade do foro" },
  { token: "data_extenso", label: "Data da assinatura por extenso" },
];

/** Substitui os marcadores {{campo}} pelos valores informados. */
export function fillContract(body: string, vars: ContractVars): string {
  return (body ?? "").replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (full, key: string) => {
    const value = vars[key.toLowerCase()];
    if (value === undefined) return full;
    return value.trim() ? value : "____________________";
  });
}

export function formatDateExtenso(date = new Date()): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
