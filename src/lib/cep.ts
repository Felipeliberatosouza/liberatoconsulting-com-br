/** Consulta de endereço por CEP (ViaCEP), compartilhada pelos formulários. */

import { onlyDigits } from "@/lib/validation";

export type CepAddress = {
  street: string;
  district: string;
  city: string;
  state: string;
};

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      erro?: boolean | string;
      logradouro?: string;
      bairro?: string;
      localidade?: string;
      uf?: string;
    };
    if (data.erro) return null;
    return {
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
