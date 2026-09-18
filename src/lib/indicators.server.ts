import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { askJson } from "./ai.server";
import { fetchLiveIndicators } from "./indicators-live.server";


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
    const patch: Partial<
      Pick<
        PendingIndicator,
        | "previous_value"
        | "previous_period"
        | "forecast_value"
        | "forecast_period"
        | "forecast_source_name"
        | "forecast_source_url"
      >
    > = {};

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

type RefreshOut = {
  indicators: Array<{
    slug: string;
    value: string;
    unit?: string;
    reference_period: string;
    previous_value?: string;
    previous_period?: string;
    forecast_value?: string;
    forecast_period?: string;
    forecast_source_name?: string;
    forecast_source_url?: string;
    trend?: string;
    note?: string;
    source_name: string;
    source_url: string;
    /** true = veio direto da série oficial (fonte primária), não de estimativa por IA. */
    official?: boolean;
  }>;
};

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Ordena períodos ("2025", "Novembro/2024", "3T2024") para comparar recência. */
function periodRank(period: string): number {
  const text = (period ?? "").toLowerCase();
  // Datas diárias no formato dd/mm/aaaa (ex.: cotações e CDS).
  const daily = text.match(/(\d{1,2})\/(\d{1,2})\/((?:19|20)\d{2})/);
  if (daily) {
    return Number(daily[3]) * 10000 + Number(daily[2]) * 100 + Number(daily[1]);
  }
  const year = Number(text.match(/(19|20)\d{2}/)?.[0] ?? 0);
  if (!year) return 0;
  const monthIndex = MONTHS.findIndex((m) => text.includes(m.slice(0, 4)));
  if (monthIndex >= 0) return year * 10000 + (monthIndex + 1) * 100;
  // Aceita "3T2025" e também "3º trimestre/2025".
  const quarter = Number(text.match(/([1-4])\s*[ºo°]?\s*(?:t\b|trim)/)?.[1] ?? 0);
  if (quarter) return year * 10000 + quarter * 300;
  return year * 10000 + 9999;
}


/**
 * Busca nas fontes oficiais a leitura mais recente de cada indicador.
 * Regra: o valor ATUAL é sempre a última leitura publicada e o valor ANTERIOR
 * é a penúltima — ou seja, ao entrar um dado novo, o dado que estava como atual
 * passa automaticamente para a coluna "anterior".
 */
export async function refreshIndicatorsFromSources() {
  const { data: rows } = await supabaseAdmin
    .from("economic_indicators")
    .select("id, slug, label, unit, value, reference_period, previous_value, previous_period");
  const list = (rows ?? []) as Array<{
    id: string;
    slug: string;
    label: string;
    unit: string;
    value: string;
    reference_period: string;
    previous_value: string;
    previous_period: string;
  }>;
  if (list.length === 0) return { ok: false as const, error: "Nenhum indicador cadastrado." };

  // 1) Busca automática na internet, direto nas séries oficiais publicadas.
  const live = await fetchLiveIndicators();
  const items: RefreshOut["indicators"] = [];
  for (const item of live.values()) {
    items.push({
      slug: item.slug,
      value: item.value,
      unit: item.unit,
      reference_period: item.reference_period,
      previous_value: item.previous_value,
      previous_period: item.previous_period,
      trend: item.trend,
      source_name: item.source_name,
      source_url: item.source_url,
      official: true,
    });
  }

  // 2) Para os indicadores sem série oficial automatizada, a IA pesquisa a leitura mais recente.
  const remaining = list.filter((i) => !live.has(i.slug));
  if (remaining.length > 0) {
    try {
      const out = await askJson<RefreshOut>(
        "Você é um economista sênior brasileiro. Informe a leitura MAIS RECENTE já publicada de " +
          "cada indicador do Brasil, com a fonte oficial (IBGE, Banco Central do Brasil, " +
          "MDIC/Comex Stat, Ipeadata) e o período de referência exato. " +
          "Regra obrigatória: value/reference_period = última observação publicada; " +
          "previous_value/previous_period = observação imediatamente anterior da MESMA série e " +
          "MESMA fonte (nunca uma leitura antiga de anos atrás quando existir uma mais recente). " +
          "Informe também a projeção oficial para o próximo período (Focus, IBGE, Ipea) com nome e " +
          "link. Use vírgula como separador decimal. Não invente fontes.",
        JSON.stringify({
          formato: {
            indicators: [
              {
                slug: "string",
                value: "string",
                unit: "string",
                reference_period: "string",
                previous_value: "string (observação imediatamente anterior)",
                previous_period: "string",
                forecast_value: "string",
                forecast_period: "string",
                forecast_source_name: "string",
                forecast_source_url: "string",
                trend: "alta|baixa|estável",
                note: "1 frase de contexto",
                source_name: "string",
                source_url: "string",
              },
            ],
          },
          indicadores: remaining.map((i) => ({
            slug: i.slug,
            label: i.label,
            unidade: i.unit,
            valor_atual_registrado: i.value,
            periodo_atual_registrado: i.reference_period,
          })),
        }),
      );
      for (const item of out.indicators ?? []) {
        if (!live.has(item.slug)) items.push(item);
      }
    } catch {
      // Se a IA estiver indisponível, mantemos ao menos os dados oficiais coletados.
    }
  }

  const now = new Date().toISOString();
  let updated = 0;
  for (const item of items) {

    const target = list.find((i) => i.slug === item.slug);
    if (!target) continue;

    const newValue = (item.value ?? "").trim();
    const newPeriod = (item.reference_period ?? "").trim();
    if (!newValue) continue;

    // Nunca substituir um dado publicado por outro mais antigo.
    const newRank = periodRank(newPeriod);
    const currentRank = periodRank(target.reference_period ?? "");
    if (newRank > 0 && currentRank > 0 && newRank < currentRank) continue;

    const changed =
      (!!target.value && newValue !== target.value.trim()) ||
      (!!target.reference_period && newPeriod !== target.reference_period.trim());

    // Rotação: o dado que estava como atual vira o "anterior".
    let previous = changed
      ? { previous_value: target.value, previous_period: target.reference_period }
      : { previous_value: target.previous_value, previous_period: target.previous_period };

    // Se a fonte informou a penúltima leitura e ela é mais recente do que a
    // que temos guardada (e anterior à atual), usamos a da fonte.
    const aiPrev = (item.previous_value ?? "").trim();
    const aiPrevPeriod = (item.previous_period ?? "").trim();
    const aiPrevRank = periodRank(aiPrevPeriod);
    if (aiPrev && aiPrevPeriod && aiPrevPeriod !== newPeriod && aiPrevRank < newRank) {
      if (
        !previous.previous_value?.trim() ||
        periodRank(previous.previous_period ?? "") >= newRank ||
        aiPrevRank >= periodRank(previous.previous_period ?? "")
      ) {


        previous = { previous_value: aiPrev, previous_period: aiPrevPeriod };
      }
    }

    const forecast = item.forecast_value?.trim()
      ? {
          forecast_value: item.forecast_value,
          forecast_period: item.forecast_period ?? "",
          forecast_source_name: item.forecast_source_name ?? "",
          forecast_source_url: item.forecast_source_url ?? "",
        }
      : {};

    const { error } = await supabaseAdmin
      .from("economic_indicators")
      .update({
        ...previous,
        ...forecast,
        value: newValue,
        unit: item.unit ?? target.unit,
        reference_period: newPeriod,
        trend: item.trend ?? "",
        note: item.note ?? "",
        source_name: item.source_name ?? "",
        source_url: item.source_url ?? "",
        updated_by_ai: true,
        last_checked_at: now,
      })
      .eq("id", target.id);
    if (!error) updated += 1;
  }
  return { ok: true as const, updated };
}
