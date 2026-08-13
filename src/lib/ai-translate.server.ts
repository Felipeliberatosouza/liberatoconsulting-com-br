import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { LANG_NAMES } from "@/i18n/config";
import type { EmailLang } from "./email-i18n.server";

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

async function run<T>(source: T, lang: Exclude<EmailLang, "pt">): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": key },
  });
  const { text } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system:
      "You are a professional editorial translator for a management consulting firm. " +
      `Translate the JSON values from Brazilian Portuguese into ${LANG_NAMES[lang]}. ` +
      "Keep the exact same JSON structure, keys and array order. Never translate keys. " +
      "Keep brand names (Liberato Consulting), people names, URLs, slugs and numeric values unchanged. " +
      "Preserve line breaks inside values. Return ONLY raw JSON, no markdown fences.",
    prompt: JSON.stringify(source),
  });
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Traduz um objeto de conteúdo dinâmico para o idioma do destinatário,
 * com cache em memória por chave + idioma. Em caso de falha devolve o original.
 */
export async function translateContent<T>(
  cacheKey: string,
  lang: EmailLang,
  source: T,
): Promise<T> {
  if (lang === "pt") return source;
  const key = `${cacheKey}:${lang}`;
  const cached = cache.get(key);
  if (cached) return cached as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = run(source, lang)
    .then((r) => {
      cache.set(key, r);
      return r;
    })
    .catch((err) => {
      console.error("[email i18n] translation failed", err);
      return source;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise as Promise<unknown>);
  return promise;
}
