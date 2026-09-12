import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CRM_SEGMENTS } from "@/lib/crm-segments";

/** Sugestões de IA para o cadastro de empresas do CRM. */

type Draft = {
  legal_name?: string;
  cnpj?: string;
  segment?: string;
  size?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  zip?: string;
  address?: string;
  website?: string;
  email?: string;
  phone?: string;
  founded_on?: string;
  employees?: number | string;
  revenue_range?: string;
  owner_name?: string;
  owner_title?: string;
  tags?: string[];
  notes?: string;
};

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export const draftCrmCompanyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        tradeName: z.string().trim().min(2).max(200),
        legalName: z.string().trim().max(200).default(""),
        cnpj: z.string().trim().max(40).default(""),
        segment: z.string().trim().max(160).default(""),
        city: z.string().trim().max(120).default(""),
        country: z.string().trim().max(80).default("Brasil"),
        website: z.string().trim().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJsonGrounded } = await import("./ai.server");

    try {
      const draft = await askJsonGrounded<Draft>(
        "Você é analista de inteligência de mercado de uma consultoria brasileira. " +
          "Pesquise na web dados públicos e ATUAIS das empresas e complete o cadastro. Nunca invente CNPJ ou CEP: " +
          "deixe em branco quando não tiver confiança razoável.",
        `Empresa (nome fantasia): ${data.tradeName}${data.legalName ? ` | razão social informada: ${data.legalName}` : ""}.
${data.cnpj ? `CNPJ informado: ${data.cnpj}. Este CNPJ é a fonte da verdade: reconfira TODOS os dados para a empresa titular deste CNPJ e corrija o que estiver divergente.` : ""}
Segmento informado: ${data.segment || "não informado"}. Local informado: ${[data.city, data.country].filter(Boolean).join(", ") || "não informado"}. Site informado: ${data.website || "não informado"}.

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
 "revenue_range":"faixa de FATURAMENTO MENSAL em reais, média estimada dos últimos 12 meses, ex.: 'R$ 500 mil a R$ 1 milhão/mês'",
 "owner_name":"nome do principal executivo EM EXERCÍCIO hoje (confirme trocas recentes de comando)",
 "owner_title":"cargo do principal executivo",
 "tags":["até 8 tags curtas em português sobre atuação, produtos, mercado e porte"],
 "notes":"resumo executivo de até 600 caracteres sobre a empresa"
}

Se não encontrar a empresa exata, estime pela média do segmento e porte equivalente.`,
      );

      const tags = (draft.tags ?? [])
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, 8);

      const segment = CRM_SEGMENTS.find(
        (s) => s.toLowerCase() === str(draft.segment, 160).toLowerCase(),
      );
      const size = str(draft.size, 20).toLowerCase() === "corporacao" ? "corporacao" : "pme";
      const founded = str(draft.founded_on, 10);
      const employeesNum = Number(draft.employees);

      return {
        ok: true as const,
        legal_name: str(draft.legal_name, 200),
        cnpj: str(draft.cnpj, 40),
        segment: segment ?? "",
        size,
        country: str(draft.country, 80),
        state: str(draft.state, 80),
        city: str(draft.city, 120),
        district: str(draft.district, 160),
        zip: str(draft.zip, 20),
        address: str(draft.address, 300),
        website: str(draft.website, 200),
        email: str(draft.email, 255),
        phone: str(draft.phone, 60),
        founded_on: /^\d{4}-\d{2}-\d{2}$/.test(founded) ? founded : "",
        employees: Number.isFinite(employeesNum) && employeesNum > 0 ? Math.round(employeesNum) : null,
        revenue_range: str(draft.revenue_range, 120),
        owner_name: str(draft.owner_name, 160),
        owner_title: str(draft.owner_title, 160),
        tags,
        notes: str(draft.notes, 2000),
      };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Falha na sugestão de IA." };
    }
  });
