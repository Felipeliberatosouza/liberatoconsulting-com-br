import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { pt, type Dict } from "@/i18n/pt";
import { contentHash, LANG_NAMES, type Lang } from "@/i18n/config";
import { dict as enDict, sourceHash as enHash } from "@/i18n/generated/en";
import { dict as esDict, sourceHash as esHash } from "@/i18n/generated/es";
import { dict as zhDict, sourceHash as zhHash } from "@/i18n/generated/zh";

const baseline: Record<Exclude<Lang, "pt">, { dict: Dict; hash: string }> = {
  en: { dict: enDict, hash: enHash },
  es: { dict: esDict, hash: esHash },
  zh: { dict: zhDict, hash: zhHash },
};

/** Cache em memória das traduções geradas por IA, por (idioma, hash do PT). */
const cache = new Map<string, Dict>();
const inflight = new Map<string, Promise<Dict>>();

function gateway(key: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
  });
}

async function translate(lang: Exclude<Lang, "pt">): Promise<Dict> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const { text } = await generateText({
    model: gateway(key)("google/gemini-3-flash-preview"),
    system:
      "You are a professional marketing translator for a management consulting firm. " +
      "Translate the JSON values from Brazilian Portuguese into " +
      LANG_NAMES[lang] +
      ". Keep the exact same JSON structure, keys and array order. " +
      "Never translate keys. Keep brand names (Liberato Consulting) and short codes " +
      "(numbers, 'BR') as they are, but localise acronyms such as 'IA' when the target " +
      "language uses a different one. Keep the tone concise, corporate and confident. " +
      "Return ONLY raw JSON, no markdown fences, no commentary.",
    prompt: JSON.stringify(pt),
  });

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Dict;
  if (!parsed?.nav?.home || !Array.isArray(parsed.services?.items)) {
    throw new Error("Invalid translation payload");
  }
  return parsed;
}

/**
 * Retorna o dicionário para o idioma pedido.
 * Se o conteúdo em português mudou desde o baseline gerado, a tradução é
 * refeita automaticamente por IA e guardada em cache.
 */
export async function getDictionary(lang: Lang): Promise<Dict> {
  if (lang === "pt") return pt;

  const hash = contentHash(pt);
  const base = baseline[lang];
  if (base.hash === hash) return base.dict;

  const cacheKey = `${lang}:${hash}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const pending = inflight.get(cacheKey);
  if (pending) return pending;

  const promise = translate(lang)
    .then((d) => {
      cache.set(cacheKey, d);
      return d;
    })
    .catch((err) => {
      console.error("[i18n] auto-translation failed", err);
      return base.dict; // fallback: baseline anterior
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, promise);
  return promise;
}
