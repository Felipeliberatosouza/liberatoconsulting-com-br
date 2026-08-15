import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { askJson } from "./ai.server";

type PendingIndicator = {
  id: string;
  slug: string;
  label: string;
  unit: string;
  value: string;
  reference_period: string;
  source_name: string;
  source_url: string;
  previous_value: string;
  previous_period: string;
};

type PreviousIndicatorOutput = {
  indicators: Array<{
    slug: string;
    previous_value: string;
    previous_period: string;
  }>;
};

export async function fillMissingPreviousIndicators() {
  const { data: rows, error: readError } = await supabaseAdmin
    .from("economic_indicators")
    .select(
      "id, slug, label, unit, value, reference_period, source_name, source_url, previous_value, previous_period",
    );
  if (readError) throw new Error(readError.message);

  const pending = ((rows ?? []) as PendingIndicator[]).filter(
    (row) => !row.previous_value?.trim() || !row.previous_period?.trim(),
  );
  if (pending.length === 0) return { ok: true as const, updated: 0 };

  const output = await askJson<PreviousIndicatorOutput>(
    "Você é um economista sênior brasileiro. Para cada indicador, informe obrigatoriamente " +
      "a observação imediatamente anterior da MESMA série e unidade, publicada pela fonte " +
      "original indicada. O período anterior deve ser anterior ao período atual e ter a mesma " +
      "frequência (dia, mês, trimestre ou ano). Não use projeções, estimativas ou outra série. " +
      "Nunca deixe campos vazios. Preserve o slug exatamente e use vírgula como separador decimal. " +
      "Execute a tarefa: não repita nem reformate o objeto de entrada. O objeto raiz da resposta " +
      "deve conter exclusivamente a chave indicators.",
    JSON.stringify({
      tarefa: "Preencha o array indicators com um resultado para cada registro de entrada.",
      formato_de_resposta: {
        indicators: [
          { slug: "string", previous_value: "string", previous_period: "string exato" },
        ],
      },
      entrada: pending.map((row) => ({
        slug: row.slug,
        indicador: row.label,
        unidade: row.unit,
        valor_atual: row.value,
        periodo_atual: row.reference_period,
        fonte_original: row.source_name,
        url_fonte: row.source_url,
      })),
    }),
  );

  if (!Array.isArray(output.indicators)) {
    throw new Error("A pesquisa não retornou os períodos anteriores no formato esperado.");
  }

  const returned = new Map(
    (output.indicators ?? []).map((item) => [item.slug, item]),
  );
  let updated = 0;
  const failures: string[] = [];

  for (const target of pending) {
    const item = returned.get(target.slug);
    const previousValue = item?.previous_value?.trim() ?? "";
    const previousPeriod = item?.previous_period?.trim() ?? "";
    if (!previousValue || !previousPeriod) {
      failures.push(target.label);
      continue;
    }
    const { error } = await supabaseAdmin
      .from("economic_indicators")
      .update({ previous_value: previousValue, previous_period: previousPeriod })
      .eq("id", target.id);
    if (error) failures.push(target.label);
    else updated += 1;
  }

  if (failures.length > 0) {
    throw new Error(`Não foi possível preencher: ${failures.join(", ")}.`);
  }
  return { ok: true as const, updated };
}