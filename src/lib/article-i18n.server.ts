/**
 * Tradução automática de conteúdos publicados (texto e PDF).
 * O português é a fonte; EN/ES/ZH são gerados sob demanda e guardados no banco,
 * de forma que cada visitante vê o artigo — e baixa o arquivo — no seu idioma.
 */
import type { Lang } from "@/i18n/config";
import type { ArticleRecord } from "./site-config";

type TargetLang = Exclude<Lang, "pt">;
const TARGETS: TargetLang[] = ["en", "es", "zh"];

const FIELDS = ["kind", "title", "summary", "body", "table_data", "chart_data"] as const;

/** Garante que o artigo tenha a tradução do idioma pedido, gerando e salvando se faltar. */
export async function ensureArticleTranslations(
  article: ArticleRecord,
  lang: Lang,
): Promise<ArticleRecord> {
  if (lang === "pt") return article;
  const current = (article.translations ?? {}) as Record<string, Record<string, string>>;

  const source: Record<string, string> = {};
  for (const f of FIELDS) {
    const value = (article as unknown as Record<string, string | null>)[f];
    if (value && String(value).trim()) source[f] = String(value);
  }
  if (!source["title"]) return article;

  // Falta algum campo (ex.: tabela ou gráfico adicionados depois) na tradução atual?
  const target = current[lang] ?? {};
  const complete = Object.keys(source).every((f) => target[f] && String(target[f]).trim());
  if (complete) return article;

  try {
    const { translateRecord } = await import("./admin.server");
    const t = await translateRecord(source);
    const merged = { ...current };
    for (const l of TARGETS) if (t[l] && Object.keys(t[l]).length) merged[l] = { ...(merged[l] ?? {}), ...t[l] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Textos mudaram: os PDFs traduzidos precisam ser gerados novamente.
    await supabaseAdmin
      .from("content_articles")
      .update({ translations: merged, translated_files: {} })
      .eq("id", article.id);
    return { ...article, translations: merged, translated_files: {} } as ArticleRecord;
  } catch (err) {
    console.error("[content i18n] falha ao traduzir artigo", err);
    return article;
  }
}


function camel(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .slice(0, max);
}

const LANG_NAME: Record<TargetLang, string> = {
  en: "inglês",
  es: "espanhol",
  zh: "inglês",
};

/** Extrai o texto integral do PDF original (português) e guarda em cache. */
async function originalDocumentText(article: ArticleRecord): Promise<string | null> {
  const current = (article.translations ?? {}) as Record<string, Record<string, string>>;
  const cached = current["pt"]?.["doc_body"];
  if (cached && cached.trim()) return cached;
  if (!article.file_path) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("content").download(article.file_path);
  if (error || !data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  if (bytes.byteLength > 20_000_000) return null;

  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = String(text ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length < 200) return null;

  const merged = { ...current, pt: { ...(current["pt"] ?? {}), doc_body: clean } };
  await supabaseAdmin.from("content_articles").update({ translations: merged }).eq("id", article.id);
  (article as unknown as Record<string, unknown>)["translations"] = merged;
  return clean;
}

/** Divide o texto em blocos de tamanho parecido, sempre em quebras de parágrafo. */
function chunkText(text: string, size = 4500): string[] {
  const parts: string[] = [];
  let buffer = "";
  for (const paragraph of text.split(/\n\n+/)) {
    if (buffer && buffer.length + paragraph.length + 2 > size) {
      parts.push(buffer);
      buffer = "";
    }
    buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    while (buffer.length > size * 1.6) {
      parts.push(buffer.slice(0, size));
      buffer = buffer.slice(size);
    }
  }
  if (buffer.trim()) parts.push(buffer);
  return parts;
}

/** Fallback para PDFs digitalizados: o modelo lê o arquivo e devolve a tradução integral. */
async function translateFileWithAi(
  article: ArticleRecord,
  lang: TargetLang,
): Promise<string | null> {
  if (!article.file_path) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from("content").download(article.file_path);
  if (error || !data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  if (buf.byteLength > 20_000_000) return null;

  const { askJsonWithFile } = await import("./ai.server");
  const out = await askJsonWithFile<{ body?: string }>(
    "Você é tradutor técnico de documentos de consultoria empresarial.",
    `Transcreva o documento anexo por completo e traduza para ${LANG_NAME[lang]}.\n` +
      `Regras: não resuma, não omita seções, mantenha a ordem original, títulos em markdown (##), ` +
      `listas com "-", tabelas em markdown e legendas de imagens/gráficos como texto. ` +
      `Não inclua cabeçalho/rodapé institucional nem numeração de página.\n` +
      `Devolva {"body":"<markdown traduzido completo>"}.`,
    {
      name: article.file_name || "artigo.pdf",
      dataUrl: `data:application/pdf;base64,${buf.toString("base64")}`,
    },
  );
  return (out?.body ?? "").trim() || null;
}

/**
 * Traduz a íntegra do PDF original para o idioma pedido, em blocos paralelos,
 * e guarda o resultado em translations[lang].doc_body para não repetir o custo.
 */
async function fullDocumentBody(
  article: ArticleRecord,
  lang: TargetLang,
): Promise<string | null> {
  const current = (article.translations ?? {}) as Record<string, Record<string, string>>;
  const cached = current[lang]?.["doc_body"];
  if (cached && cached.trim()) return cached;

  try {
    const source = await originalDocumentText(article);
    let body: string | null = null;

    if (!source) {
      // PDF sem camada de texto (digitalizado): o próprio modelo lê o arquivo.
      body = await translateFileWithAi(article, lang);
    } else {
      const { askText } = await import("./ai.server");
      const chunks = chunkText(source);
      const system =
        "Você é tradutor técnico de documentos de consultoria empresarial. Responda apenas com a tradução.";
      const translated: string[] = [];
      const CONCURRENCY = 4;
      for (let i = 0; i < chunks.length; i += CONCURRENCY) {
        const slice = chunks.slice(i, i + CONCURRENCY);
        const done = await Promise.all(
          slice.map((chunk, j) =>
            askText(
              system,
              `Traduza para ${LANG_NAME[lang]} o trecho ${i + j + 1} de ${chunks.length} de um artigo. ` +
                `Não resuma, não comente, não adicione títulos novos: traduza integralmente, mantendo a ordem, ` +
                `listas com "-" e tabelas em markdown.\n\n---\n${chunk}`,
            ).catch(() => ""),
          ),
        );
        if (done.some((d) => !d.trim())) return null;
        translated.push(...done);
      }
      body = translated.join("\n\n").trim();
    }

    if (!body) return null;


    const latest = (article.translations ?? {}) as Record<string, Record<string, string>>;
    const merged = { ...latest, [lang]: { ...(latest[lang] ?? {}), doc_body: body } };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("content_articles")
      .update({ translations: merged })
      .eq("id", article.id);
    (article as unknown as Record<string, unknown>)["translations"] = merged;
    return body;
  } catch (err) {
    console.error("[content i18n] falha ao traduzir o PDF original", err);
    return null;
  }
}

/**
 * Devolve o caminho do PDF no idioma pedido, gerando-o na primeira vez.
 * Idiomas com alfabeto latino (EN/ES) ganham um PDF institucional traduzido;
 * em mandarim entregamos a versão em inglês, pois a fonte do PDF não tem ideogramas.
 */
export async function ensureTranslatedPdf(
  article: ArticleRecord,
  lang: Lang,
): Promise<{ path: string; name: string } | null> {
  const original = article.file_path
    ? { path: article.file_path, name: article.file_name || "artigo.pdf" }
    : null;
  if (lang === "pt") return original;

  const fileLang: TargetLang = lang === "zh" ? "en" : (lang as TargetLang);

  // Traduz primeiro: se o texto mudou, os PDFs antigos são descartados.
  const withTr = await ensureArticleTranslations(article, fileLang);
  const stored = ((withTr as unknown as Record<string, unknown>)["translated_files"] ?? {}) as
    Record<string, { path: string; name: string }>;
  const tr = (withTr.translations?.[fileLang] ?? {}) as Record<string, string>;
  // Só reaproveitamos o PDF salvo se ele já foi gerado a partir da íntegra traduzida.
  const hasFullDoc = Boolean(tr["doc_body"]?.trim()) || !article.file_path;
  if (stored[fileLang]?.path && hasFullDoc) return stored[fileLang]!;
  if (!tr["title"]) return original;



  try {
    const { buildBrandedPdf } = await import("./pdf.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { formatCompanyAddress } = await import("./company-footer.server");
    const { siteOrigin } = await import("./bulletin.server");

    const [{ data: branding }, { data: company }] = await Promise.all([
      supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle(),
      supabaseAdmin.from("company_profile").select("*").limit(1).maybeSingle(),
    ]);
    const c = (company ?? {}) as Record<string, string>;
    const logoUrl =
      ((branding?.value ?? {}) as { logoUrl?: string }).logoUrl ||
      c["logo_url"] ||
      `${siteOrigin()}/logo.png`;
    const companyName = c["trade_name"] || c["legal_name"] || "Liberato Consulting";

    // Preferimos a íntegra do PDF original traduzida; o resumo publicado é só o fallback.
    const fullDoc = await fullDocumentBody(withTr, fileLang);
    const bodyParts = fullDoc
      ? [fullDoc]
      : [tr["body"] ?? "", tr["table_data"] ?? "", tr["chart_data"] ?? ""].filter(Boolean);

    const bytes = await buildBrandedPdf({
      title: tr["title"]!,
      subtitle: tr["summary"] ?? "",
      authors: article.authors ?? "",
      authorContact: article.author_contact ?? "",
      referenceDate: article.article_date ?? "",
      body: bodyParts.join("\n\n"),
      logoDataUrl: logoUrl,
      coverImageUrl: article.cover_url || null,
      contact: {
        name: companyName,
        line1:
          [c["phone"], c["email"]].filter(Boolean).join("  |  ") ||
          "contato@liberatoconsulting.com.br",
        line2:
          [formatCompanyAddress(c), c["cnpj"] ? `CNPJ ${c["cnpj"]}` : ""]
            .filter(Boolean)
            .join("  |  ") || "Consultoria em gestão empresarial",
        website: c["website"] || "www.liberatoconsulting.com.br",
      },
    });

    const name = `${camel(tr["title"]!, 60) || "Article"}_${fileLang.toUpperCase()}_${camel(companyName, 40)}.pdf`;
    const path = `articles/${article.slug}-${fileLang}.pdf`;
    const { error } = await supabaseAdmin.storage
      .from("content")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (error) return original;

    await supabaseAdmin
      .from("content_articles")
      .update({ translated_files: { ...stored, [fileLang]: { path, name } } })
      .eq("id", article.id);
    return { path, name };
  } catch (err) {
    console.error("[content i18n] falha ao gerar PDF traduzido", err);
    return original;
  }
}
