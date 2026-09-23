import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";

import { LANG_NAMES, type Lang } from "@/i18n/config";

export type NewsletterText = {
  subject: string;
  preheader: string;
  fullText: string;
  sources: string;
};

/** Cache em memória por (slug, idioma). */
const cache = new Map<string, NewsletterText>();
const inflight = new Map<string, Promise<NewsletterText>>();

async function run(source: NewsletterText, lang: Exclude<Lang, "pt">): Promise<NewsletterText> {
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
      "Keep the exact same JSON keys and the paragraph/line-break structure of each value. " +
      "Keep brand names (Liberato Consulting), people names, URLs and numbers unchanged. " +
      "Return ONLY raw JSON, no markdown fences, no commentary.",
    prompt: JSON.stringify(source),
  });

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as NewsletterText;
  if (typeof parsed?.subject !== "string") throw new Error("Invalid translation payload");
  return {
    subject: parsed.subject || source.subject,
    preheader: parsed.preheader ?? "",
    fullText: parsed.fullText ?? "",
    sources: parsed.sources ?? "",
  };
}

/** Traduz o conteúdo da newsletter, com cache por slug + idioma. */
export async function translateNewsletter(
  slug: string,
  lang: Lang,
  source: NewsletterText,
): Promise<NewsletterText> {
  if (lang === "pt") return source;
  const cacheKey = `${slug}:${lang}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const pending = inflight.get(cacheKey);
  if (pending) return pending;

  // Cache durável: cada edição publicada é traduzida no máximo uma vez por idioma.
  const settingKey = `newsletter_i18n:${cacheKey}`;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: stored } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", settingKey)
    .maybeSingle();
  const storedValue = stored?.value as NewsletterText | undefined;
  if (storedValue && typeof storedValue === "object" && typeof storedValue.subject === "string") {
    cache.set(cacheKey, storedValue);
    return storedValue;
  }

  const promise = run(source, lang)
    .then(async (r) => {
      cache.set(cacheKey, r);
      try {
        await supabaseAdmin
          .from("site_settings")
          .upsert({ key: settingKey, value: r as never }, { onConflict: "key" });
      } catch (e) {
        console.error("[newsletter i18n] cache save failed", e);
      }
      return r;
    })
    .catch((err) => {
      console.error("[newsletter i18n] translation failed", err);
      return source;
    })
    .finally(() => inflight.delete(cacheKey));

  inflight.set(cacheKey, promise);
  return promise;
}
