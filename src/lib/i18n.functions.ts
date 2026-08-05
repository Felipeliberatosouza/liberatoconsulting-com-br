import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { LANGS, contentHash, langFromCountry, type Lang } from "@/i18n/config";
import { pt, type Dict } from "@/i18n/pt";

function parseLang(input: unknown): Lang {
  const lang = (input as { lang?: string })?.lang;
  return (LANGS as readonly string[]).includes(lang ?? "") ? (lang as Lang) : "pt";
}

/** Idioma sugerido pelo país de origem do acesso (header de geolocalização do edge). */
export const detectLanguage = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const get = (name: string) =>
    typeof (headers as Headers).get === "function"
      ? (headers as Headers).get(name)
      : ((headers as unknown as Record<string, string | undefined>)[name] ?? null);

  const country =
    get("cf-ipcountry") ??
    get("x-vercel-ip-country") ??
    get("x-country-code") ??
    get("x-geo-country");

  return { country: country ?? null, lang: langFromCountry(country) };
});

/** Dicionário do idioma, retraduzido automaticamente se o conteúdo PT mudou. */
export const getTranslations = createServerFn({ method: "GET" })
  .inputValidator(parseLang)
  .handler(async ({ data: lang }): Promise<{ lang: Lang; hash: string; dict: Dict }> => {
    const hash = contentHash(pt);
    if (lang === "pt") return { lang, hash, dict: pt };
    const { getDictionary } = await import("./translate.server");
    return { lang, hash, dict: await getDictionary(lang) };
  });
