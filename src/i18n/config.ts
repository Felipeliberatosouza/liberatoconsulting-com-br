import type { Dict } from "./pt";

export const LANGS = ["pt", "en", "es", "zh"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  zh: "中文",
};

export const LANG_SHORT: Record<Lang, string> = {
  pt: "PT",
  en: "EN",
  es: "ES",
  zh: "中",
};

export const LANG_HTML: Record<Lang, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
  zh: "zh-CN",
};

export const LANG_NAMES: Record<Lang, string> = {
  pt: "Brazilian Portuguese",
  en: "English",
  es: "Spanish (neutral Latin American)",
  zh: "Simplified Chinese (Mandarin)",
};

/** Países cujo idioma oficial mapeia para uma das versões do site. */
export const COUNTRY_TO_LANG: Record<string, Lang> = {
  // Português
  BR: "pt",
  PT: "pt",
  AO: "pt",
  MZ: "pt",
  CV: "pt",
  GW: "pt",
  ST: "pt",
  TL: "pt",
  // Espanhol
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  BO: "es",
  PY: "es",
  UY: "es",
  CR: "es",
  PA: "es",
  GT: "es",
  HN: "es",
  SV: "es",
  NI: "es",
  CU: "es",
  DO: "es",
  PR: "es",
  GQ: "es",
  // Mandarim
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  SG: "zh",
  // Inglês
  US: "en",
  GB: "en",
  IE: "en",
  CA: "en",
  AU: "en",
  NZ: "en",
  ZA: "en",
  IN: "en",
  NG: "en",
  KE: "en",
  GH: "en",
  PH: "en",
  JM: "en",
  TT: "en",
  MT: "en",
  PK: "en",
  UG: "en",
  TZ: "en",
  ZW: "en",
  ZM: "en",
  BW: "en",
  BB: "en",
  BS: "en",
  BZ: "en",
  FJ: "en",
  GY: "en",
  LR: "en",
  MW: "en",
  NA: "en",
  RW: "en",
  SL: "en",
  SS: "en",
};

export const DEFAULT_LANG: Lang = "en";

export function langFromCountry(country?: string | null): Lang {
  if (!country) return DEFAULT_LANG;
  return COUNTRY_TO_LANG[country.toUpperCase()] ?? DEFAULT_LANG;
}

/** Fallback quando não há país: usa o idioma do navegador. */
export function langFromLocale(locale?: string | null): Lang {
  if (!locale) return DEFAULT_LANG;
  const l = locale.toLowerCase();
  if (l.startsWith("pt")) return "pt";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("en")) return "en";
  return DEFAULT_LANG;
}

/** Hash estável do conteúdo em português — detecta alterações no texto fonte. */
export function contentHash(value: unknown): string {
  const json = JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export type TranslationBundle = { lang: Lang; sourceHash: string; dict: Dict };
