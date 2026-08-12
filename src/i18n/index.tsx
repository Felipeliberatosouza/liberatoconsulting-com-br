import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { pt, type Dict } from "./pt";
import {
  DEFAULT_LANG,
  LANGS,
  LANG_HTML,
  LANG_LABELS,
  LANG_SHORT,
  contentHash,
  langFromLocale,
  type Lang,
} from "./config";
import { dict as enDict, sourceHash as enHash } from "./generated/en";
import { dict as esDict, sourceHash as esHash } from "./generated/es";
import { dict as zhDict, sourceHash as zhHash } from "./generated/zh";
import { detectLanguage, getTranslations } from "@/lib/i18n.functions";
import { getSiteConfig } from "@/lib/admin.functions";
import {
  EMPTY_CONFIG,
  applyBrazilOverrides,
  applyTextOverrides,
  applyTheme,
  type ArticleRecord,
  type HeroSettings,
  type SiteConfig,
} from "@/lib/site-config";
import { DEFAULT_SEGMENTS } from "@/lib/audience-filters";

export type { Lang };
export { LANGS, LANG_LABELS, LANG_SHORT, LANG_HTML };

const baseline: Record<Lang, { dict: Dict; hash: string }> = {
  pt: { dict: pt, hash: "" },
  en: { dict: enDict, hash: enHash },
  es: { dict: esDict, hash: esHash },
  zh: { dict: zhDict, hash: zhHash },
};

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: Dict;
  translating: boolean;
  /** Conteúdos cadastrados no painel administrativo (já traduzidos). */
  articles: ArticleRecord[];
  /** URL da logomarca atual (padrão: arquivo do projeto). */
  logoUrl: string;
  /** Número de WhatsApp configurado no painel. */
  whatsapp: string | undefined;
  /** Configuração do carrossel da página inicial. */
  hero: HeroSettings;
  /** Segmentos atendidos pela consultoria (configuráveis no painel). */
  segments: string[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "liberato-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");
  const [dicts, setDicts] = useState<Partial<Record<Lang, Dict>>>({});
  const [translating, setTranslating] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(EMPTY_CONFIG);

  // Configuração do painel administrativo: cores, textos e conteúdos.
  useEffect(() => {
    let cancelled = false;
    getSiteConfig()
      .then((c) => {
        if (cancelled) return;
        setConfig(c);
        applyTheme(c.theme);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Idioma inicial: escolha salva > país de origem do acesso > idioma do navegador.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGS as readonly string[]).includes(stored)) {
      setLangState(stored as Lang);
      return;
    }
    let cancelled = false;
    detectLanguage()
      .then((r) => {
        if (!cancelled) setLangState(r.lang);
      })
      .catch(() => {
        if (!cancelled) setLangState(langFromLocale(navigator.language) ?? DEFAULT_LANG);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Se o conteúdo em português mudou, busca a tradução atualizada por IA.
  useEffect(() => {
    if (lang === "pt" || dicts[lang]) return;
    if (baseline[lang].hash === contentHash(pt)) return;

    let cancelled = false;
    setTranslating(true);
    getTranslations({ data: { lang } })
      .then((r) => {
        if (!cancelled) setDicts((d) => ({ ...d, [lang]: r.dict as Dict }));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, dicts]);

  useEffect(() => {
    document.documentElement.lang = LANG_HTML[lang];
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "pt" ? "en" : "pt"),
      t: applyBrazilOverrides(
        applyTextOverrides(dicts[lang] ?? baseline[lang].dict, config.texts, lang),
        config.brazil ?? {},
        lang,
      ),
      translating,
      articles: config.articles,
      logoUrl: config.branding?.logoUrl || "/logo.png",
      whatsapp: config.branding?.whatsapp,
      hero: config.hero ?? {},
      segments:
        config.branding?.segments && config.branding.segments.length > 0
          ? config.branding.segments
          : DEFAULT_SEGMENTS,
    }),
    [lang, setLang, dicts, translating, config],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

const FALLBACK_VALUE: LanguageContextValue = {
  lang: "pt",
  setLang: () => undefined,
  toggle: () => undefined,
  t: pt,
  translating: false,
  articles: [],
  logoUrl: "/logo.png",
  whatsapp: undefined,
  hero: {},
  segments: DEFAULT_SEGMENTS,
};

export function useLanguage() {
  // Fallback evita tela em branco caso o contexto ainda não esteja montado (ex.: HMR).
  return useContext(LanguageContext) ?? FALLBACK_VALUE;
}
