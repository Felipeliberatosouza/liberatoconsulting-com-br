import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { LANG_NAMES, type Lang } from "@/i18n/config";

export const TARGET_LANGS: Array<Exclude<Lang, "pt">> = ["en", "es", "zh"];

/** Cliente público (chave publicável) para leituras anônimas no servidor. */
export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function gateway(key: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
  });
}

/**
 * Traduz um conjunto de textos em português para EN/ES/ZH.
 * Retorna { en: {...}, es: {...}, zh: {...} } com as mesmas chaves recebidas.
 */
export async function translateRecord(
  source: Record<string, string>,
): Promise<Record<Exclude<Lang, "pt">, Record<string, string>>> {
  const empty = { en: {}, es: {}, zh: {} } as Record<
    Exclude<Lang, "pt">,
    Record<string, string>
  >;
  const keys = Object.keys(source).filter((k) => (source[k] ?? "").trim().length > 0);
  if (keys.length === 0) return empty;

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return empty;

  const payload: Record<string, string> = {};
  for (const k of keys) payload[k] = source[k]!;

  const results = await Promise.all(
    TARGET_LANGS.map(async (lang) => {
      try {
        const { text } = await generateText({
          model: gateway(apiKey)("google/gemini-3-flash-preview"),
          system:
            "You are a professional marketing translator for a management consulting firm. " +
            "Translate the JSON values from Brazilian Portuguese into " +
            LANG_NAMES[lang] +
            ". Keep the exact same JSON keys. Never translate keys. Keep brand names " +
            "(Liberato Consulting) unchanged. Tone: concise, corporate, confident. " +
            "Return ONLY raw JSON, no markdown fences, no commentary.",
          prompt: JSON.stringify(payload),
        });
        const cleaned = text
          .trim()
          .replace(/^```(?:json)?/i, "")
          .replace(/```$/, "")
          .trim();
        return [lang, JSON.parse(cleaned) as Record<string, string>] as const;
      } catch (err) {
        console.error("[admin] translation failed", lang, err);
        return [lang, {} as Record<string, string>] as const;
      }
    }),
  );

  for (const [lang, dict] of results) empty[lang] = dict;
  return empty;
}
