/**
 * Tradução automática dos dados dos consultores.
 * O português cadastrado no painel é a fonte; EN/ES/ZH são gerados sob demanda
 * pela IA e guardados na coluna `translations` da tabela `consultants`.
 */
import { contentHash, type Lang } from "@/i18n/config";

const TEXT_FIELDS = ["headline", "education", "experience", "clients", "works"] as const;
const LIST_FIELDS = ["specialties", "segments"] as const;

type Row = Record<string, unknown> & { id: string };

type Bundle = Record<string, string>;

function sourceOf(row: Row): Bundle {
  const source: Bundle = {};
  for (const f of TEXT_FIELDS) {
    const value = String((row[f] as string | null) ?? "").trim();
    if (value) source[f] = value;
  }
  for (const f of LIST_FIELDS) {
    const list = Array.isArray(row[f]) ? (row[f] as string[]).filter(Boolean) : [];
    if (list.length) source[f] = JSON.stringify(list);
  }
  return source;
}

function applyTranslation(row: Row, bundle: Bundle): Row {
  const out: Row = { ...row };
  for (const f of TEXT_FIELDS) {
    const value = bundle[f];
    if (value && value.trim()) out[f] = value;
  }
  for (const f of LIST_FIELDS) {
    const raw = bundle[f];
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) out[f] = parsed.map((v) => String(v));
    } catch {
      /* mantém o original */
    }
  }
  return out;
}

/**
 * Devolve os consultores no idioma pedido, gerando e salvando o que faltar.
 * Em caso de falha na IA, o conteúdo original em português é mantido.
 */
export async function localizeConsultants<T extends { id: string }>(
  rows: T[],
  lang: Lang,
): Promise<T[]> {
  if (lang === "pt" || rows.length === 0) return rows;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("consultants")
    .select("id, translations")
    .in(
      "id",
      rows.map((r) => r.id),
    );

  const stored = new Map<string, Record<string, unknown>>();
  for (const r of (data ?? []) as { id: string; translations: unknown }[]) {
    stored.set(r.id, (r.translations ?? {}) as Record<string, unknown>);
  }

  const out: T[] = [];
  for (const row of rows) {
    const source = sourceOf(row as unknown as Row);
    if (Object.keys(source).length === 0) {
      out.push(row);
      continue;
    }
    const hash = contentHash(source);
    const current = stored.get(row.id) ?? {};
    const cached = current[lang] as Bundle | undefined;

    if (cached && current["hash"] === hash) {
      out.push(applyTranslation(row as unknown as Row, cached) as unknown as T);
      continue;
    }

    try {
      const { translateRecord } = await import("./admin.server");
      const translated = await translateRecord(source);
      const merged: Record<string, unknown> = { hash };
      for (const l of ["en", "es", "zh"] as const) {
        if (translated[l] && Object.keys(translated[l]).length) merged[l] = translated[l];
      }
      await supabaseAdmin
        .from("consultants")
        .update({ translations: merged as never })
        .eq("id", row.id);
      const bundle = merged[lang] as Bundle | undefined;
      out.push(bundle ? (applyTranslation(row as unknown as Row, bundle) as unknown as T) : row);
    } catch (err) {
      console.error("[consultants i18n] falha ao traduzir", row.id, err);
      out.push(row);
    }
  }
  return out;
}
