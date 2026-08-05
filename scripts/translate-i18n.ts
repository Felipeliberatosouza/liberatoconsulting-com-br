/**
 * Regenera os dicionários EN / ES / ZH a partir de src/i18n/pt.ts usando Lovable AI.
 * Uso: bun run scripts/translate-i18n.ts
 */
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { pt } from "../src/i18n/pt";
import { contentHash, LANG_NAMES } from "../src/i18n/config";

const key = process.env["LOVABLE_API_KEY"];
if (!key) throw new Error("Missing LOVABLE_API_KEY");

const gateway = createOpenAICompatible({
  name: "lovable",
  baseURL: "https://ai.gateway.lovable.dev/v1",
  headers: { "Lovable-API-Key": key },
});

const hash = contentHash(pt);

for (const lang of ["en", "es", "zh"] as const) {
  const { text } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system:
      "You are a professional marketing translator for a management consulting firm. " +
      `Translate the JSON values from Brazilian Portuguese into ${LANG_NAMES[lang]}. ` +
      "Keep the exact same JSON structure, keys and array order. Never translate keys. " +
      "Keep 'id' values, brand names (Liberato Consulting), numbers and short codes unchanged. " +
      "Localise acronyms such as 'IA' to the target language. Tone: concise, corporate, confident. " +
      "Return ONLY raw JSON, no markdown fences.",
    prompt: JSON.stringify(pt),
  });

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const dict = JSON.parse(cleaned);

  const file = `import type { Dict } from "../pt";

// Gerado automaticamente por scripts/translate-i18n.ts — não editar à mão.
export const sourceHash = ${JSON.stringify(hash)};

export const dict: Dict = ${JSON.stringify(dict, null, 2)};
`;
  await Bun.write(`src/i18n/generated/${lang}.ts`, file);
  console.log(`✓ ${lang} (${hash})`);
}
