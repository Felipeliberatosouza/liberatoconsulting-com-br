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
  forecast_value: string;
  forecast_period: string;
  forecast_source_name: string;
  forecast_source_url: string;
};

type SeriesOutput = {
  indicators: Array<{
    slug: string;
    previous_value: string;
    previous_period: string;
    forecast_value: string;
    forecast_period: string;
    forecast_source_name: string;
    forecast_source_url: string;
  }>;
};

const SELECT =
  "id, slug, label, unit, value, reference_period, source_name, source_url, previous_value, previous_period, forecast_value, forecast_period, forecast_source_name, forecast_source_url";

/**
 * Preenche automaticamente, nas fontes oficiais, o dado anterior (obrigatoriamente
 * da MESMA fonte usada no dado atual) e a estimativa do próximo período.
 */
export async function fillMissingIndicatorSeries() {
  const { data: rows, error: readError } = await supabaseAdmin
    .from("economic_indicators")
    .select(SELECT);
  if (readError) throw new Error(readError.message);

  const pending = ((rows ?? []) as PendingIndicator[]).filter(
    (row) =>
      !row.previous_value?.trim() ||
      !row.previous_period?.trim() ||
      !row.forecast_value?.trim() ||
      !row.forecast_period?.trim() ||
      !row.forecast_source_name?.trim(),
  );
  if (pending.length === 0) return { ok: true as const, updated: 0 };

  const output = await askJson<SeriesOutput>(
    "Você é um economista sênior brasileiro. Para cada indicador: (1) informe a observação " +
      "imediatamente anterior da MESMA série, MESMA unidade e MESMA fonte original indicada na " +
      "entrada (fonte_original/url_fonte) — nunca use outra fonte ou outra série para o dado " +
      "anterior; (2) informe a estimativa/projeção oficial mais recente para o próximo período, " +
      "priorizando as instituições responsáveis pelo dado no Brasil (Banco Central — Relatório " +
      "Focus, IBGE, Ministério da Fazenda, Ipea), com nome e link da fonte da estimativa. " +
      "Nunca deixe campos vazios. Preserve o slug exatamente e use vírgula como separador " +
      "decimal. Execute a tarefa: não repita nem reformate o objeto de entrada. O objeto raiz " +
      "da resposta deve conter exclusivamente a chave indicators.",
    JSON.stringify({
      tarefa: "Preencha o array indicators com um resultado para cada registro de entrada.",
      formato_de_resposta: {
        indicators: [
          {
            slug: "string",
            previous_value: "string",
            previous_period: "string exato",
            forecast_value: "string",
            forecast_period: "string exato",
            forecast_source_name: "string",
            forecast_source_url: "string",
          },
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
    throw new Error("A pesquisa não retornou os dados no formato esperado.");
  }

  const returned = new Map((output.indicators ?? []).map((item) => [item.slug, item]));
  let updated = 0;
  const failures: string[] = [];

  for (const target of pending) {
    const item = returned.get(target.slug);
    const patch: Record<string, string> = {};

    const previousValue = item?.previous_value?.trim() ?? "";
    const previousPeriod = item?.previous_period?.trim() ?? "";
    if (!target.previous_value?.trim() && previousValue) patch["previous_value"] = previousValue;
    if (!target.previous_period?.trim() && previousPeriod)
      patch["previous_period"] = previousPeriod;

    const forecastValue = item?.forecast_value?.trim() ?? "";
    const forecastPeriod = item?.forecast_period?.trim() ?? "";
    const forecastSource = item?.forecast_source_name?.trim() ?? "";
    const forecastUrl = item?.forecast_source_url?.trim() ?? "";
    if (!target.forecast_value?.trim() && forecastValue) patch["forecast_value"] = forecastValue;
    if (!target.forecast_period?.trim() && forecastPeriod)
      patch["forecast_period"] = forecastPeriod;
    if (!target.forecast_source_name?.trim() && forecastSource)
      patch["forecast_source_name"] = forecastSource;
    if (!target.forecast_source_url?.trim() && forecastUrl)
      patch["forecast_source_url"] = forecastUrl;

    if (Object.keys(patch).length === 0) {
      failures.push(target.label);
      continue;
    }
    const { error } = await supabaseAdmin
      .from("economic_indicators")
      .update(patch)
      .eq("id", target.id);
    if (error) failures.push(target.label);
    else updated += 1;
  }

  if (failures.length > 0) {
    throw new Error(`Não foi possível preencher: ${failures.join(", ")}.`);
  }
  return { ok: true as const, updated };
}

/** Compatibilidade com chamadas anteriores. */
export const fillMissingPreviousIndicators = fillMissingIndicatorSeries;
