import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export type PdfDocInput = {
  title: string;
  subtitle?: string;
  authors?: string;
  authorContact?: string;
  referenceDate?: string;
  body: string;
  sources?: string;
  logoDataUrl?: string | null;
  /** Imagem de capa exibida logo abaixo de "Atualizado em:". */
  coverImageUrl?: string | null;
  /** Usa fonte com ideogramas (mandarim). */
  cjk?: boolean;
  /** Idioma dos rótulos fixos do documento (Por / Contato / Atualizado em / Fontes). */
  lang?: "pt" | "en" | "es" | "zh";
  contact: { name: string; line1: string; line2: string; website?: string };
};

const PDF_LABELS = {
  pt: { by: "Por", contact: "Contato", updated: "Atualizado em", sources: "Fontes", locale: "pt-BR" },
  en: { by: "By", contact: "Contact", updated: "Updated on", sources: "Sources", locale: "en-US" },
  es: { by: "Por", contact: "Contacto", updated: "Actualizado el", sources: "Fuentes", locale: "es-ES" },
  zh: { by: "作者", contact: "联系方式", updated: "更新日期", sources: "参考来源", locale: "zh-CN" },
} as const;

const CJK_FONT_URL =
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf";
const CJK_FONT_PATH = "fonts/NotoSansSC-Regular.otf";
let cjkFontCache: Uint8Array | null = null;

/** Baixa (e guarda no storage) a fonte com ideogramas usada nos PDFs em mandarim. */
async function loadCjkFont(): Promise<Uint8Array> {
  if (cjkFontCache) return cjkFontCache;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const cached = await supabaseAdmin.storage.from("content").download(CJK_FONT_PATH);
  if (cached.data) {
    cjkFontCache = new Uint8Array(await cached.data.arrayBuffer());
    return cjkFontCache;
  }
  const res = await fetch(CJK_FONT_URL);
  if (!res.ok) throw new Error(`Falha ao baixar a fonte chinesa (${res.status})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  await supabaseAdmin.storage
    .from("content")
    .upload(CJK_FONT_PATH, bytes, { contentType: "font/otf", upsert: true });
  cjkFontCache = bytes;
  return bytes;
}

function wrap(
  text: string,
  font: any,
  size: number,
  maxWidth: number,
  breakAnywhere = false,
): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (breakAnywhere) {
      // Mandarim: quebra caractere a caractere, respeitando espaços quando houver.
      let line = "";
      for (const ch of rawLine) {
        const candidate = line + ch;
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          out.push(line);
          line = ch === " " ? "" : ch;
        } else {
          line = candidate;
        }
      }
      out.push(line);
      continue;
    }
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let line = "";
    for (const w of words) {
      const candidate = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = w;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out;
}

/** Remove caracteres fora do WinAnsi que quebram as fontes padrão do PDF. */
function sanitize(text: string) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "");
}

/** Limpa marcações markdown residuais (negrito, itálico, marcadores). */
function stripMd(text: string) {
  return text
    .replace(/\*\*/g, "")
    .replace(/(^|\s)\*(\S)/g, "$1$2")
    .replace(/`/g, "")
    .trim();
}

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function embedImage(pdf: PDFDocument, src?: string | null) {
  if (!src) return null;
  try {
    const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(src);
    if (match) {
      const bytes = b64ToBytes(match[2]!);
      return match[1]!.toLowerCase() === "png"
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
    }
    if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      const bytes = new Uint8Array(await res.arrayBuffer());
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
      return isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
    }
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------ parser do corpo ----------------------------- */

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "table"; rows: string[][] }
  | { type: "chart"; title: string; data: Array<{ label: string; value: number }> };

function isTableLine(line: string) {
  return /^\s*\|.*\|\s*$/.test(line);
}
function isSeparatorRow(cells: string[]) {
  return cells.every((c) => /^:?-{2,}:?$/.test(c.trim()));
}
function splitRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => stripMd(c.trim()));
}

function parseBlocks(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    const text = stripMd(paragraph.join(" ").trim());
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Bloco de gráfico: ```chart / título / Rótulo | valor
    if (/^\s*```\s*chart\s*$/i.test(line)) {
      flush();
      const data: Array<{ label: string; value: number }> = [];
      let title = "";
      i++;
      for (; i < lines.length && !/^\s*```/.test(lines[i]!); i++) {
        const raw = lines[i]!.trim();
        if (!raw) continue;
        if (/^(t[ií]tulo|title)\s*:/i.test(raw)) {
          title = stripMd(raw.split(":").slice(1).join(":").trim());
          continue;
        }
        const parts = raw.split("|").map((p) => p.trim());
        if (parts.length >= 2) {
          const value = Number(parts[1]!.replace(/[^\d.,-]/g, "").replace(",", "."));
          if (Number.isFinite(value)) data.push({ label: stripMd(parts[0]!), value });
        }
      }
      if (data.length) blocks.push({ type: "chart", title, data });
      continue;
    }

    if (/^\s*```/.test(line)) continue;

    if (isTableLine(line)) {
      flush();
      const rows: string[][] = [];
      for (; i < lines.length && isTableLine(lines[i]!); i++) {
        const cells = splitRow(lines[i]!);
        if (!isSeparatorRow(cells)) rows.push(cells);
      }
      i--;
      if (rows.length) blocks.push({ type: "table", rows });
      continue;
    }

    const heading = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      blocks.push({ type: "heading", level: heading[1]!.length, text: stripMd(heading[2]!) });
      continue;
    }

    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) {
      flush();
      blocks.push({ type: "bullet", text: stripMd(bullet[1]!) });
      continue;
    }

    if (!line.trim()) {
      flush();
      continue;
    }
    paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

/**
 * Gera o PDF institucional: logomarca no cabeçalho, marca d'água, tabelas e
 * gráficos formatados, rodapé com contatos, site e paginação (1/2).
 */
export async function buildBrandedPdf(input: PdfDocInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // Em mandarim usamos uma fonte com ideogramas; as fontes padrão do PDF não os têm.
  const cjk = Boolean(input.cjk);
  let font: any;
  let bold: any;
  if (cjk) {
    const [{ default: fontkit }, cjkBytes] = await Promise.all([
      import("@pdf-lib/fontkit"),
      loadCjkFont(),
    ]);
    pdf.registerFontkit(fontkit as never);
    // subset:false — o subconjunto CFF gerado pelo fontkit não abre em vários leitores.
    font = await pdf.embedFont(cjkBytes, { subset: false });
    bold = font;
  } else {
    font = await pdf.embedFont(StandardFonts.Helvetica);
    bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  }

  /** Mantém os ideogramas quando a fonte os suporta. */
  const S = (text: string) => (cjk ? text : sanitize(text));
  /** Em mandarim a quebra de linha acontece entre caracteres, não entre espaços. */
  const WRAP = (text: string, f: any, size: number, maxWidth: number) =>
    wrap(text, f, size, maxWidth, cjk);

  const logo = await embedImage(pdf, input.logoDataUrl ?? null);
  const cover = await embedImage(pdf, input.coverImageUrl ?? null);

  const W = 595.28;
  const H = 841.89;
  const M = 56;
  const TOP = H - 88;
  const BOTTOM = 82;
  const contentWidth = W - M * 2;
  const ink = rgb(0.12, 0.14, 0.2);
  const accent = rgb(0.886, 0.459, 0.122);

  let page = pdf.addPage([W, H]);
  let y = TOP;

  const decorate = (p: typeof page) => {
    if (logo) {
      const target = 320;
      const scale = target / logo.width;
      p.drawImage(logo, {
        x: (W - target) / 2,
        y: (H - logo.height * scale) / 2,
        width: target,
        height: logo.height * scale,
        opacity: 0.07,
        rotate: degrees(20),
      });
      // Cabeçalho: logomarca
      const hw = Math.min(78, logo.width);
      const hs = hw / logo.width;
      const hh = Math.min(logo.height * hs, 18);
      p.drawImage(logo, { x: M, y: H - 34 - hh / 2 + 4, width: hw, height: hh });
    } else {
      p.drawText(S(input.contact.name), {
        x: M,
        y: H - 34,
        size: 11,
        font: bold,
        color: ink,
      });
    }
    p.drawLine({
      start: { x: M, y: H - 48 },
      end: { x: W - M, y: H - 48 },
      thickness: 0.6,
      color: rgb(0.8, 0.8, 0.8),
    });
    p.drawLine({
      start: { x: M, y: 62 },
      end: { x: W - M, y: 62 },
      thickness: 0.6,
      color: rgb(0.8, 0.8, 0.8),
    });
    p.drawText(S(input.contact.name), { x: M, y: 48, size: 8, font: bold, color: rgb(0.3, 0.3, 0.3) });
    p.drawText(S(input.contact.line1), { x: M, y: 37, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    p.drawText(S(input.contact.line2), { x: M, y: 27, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    if (input.contact.website) {
      p.drawText(S(input.contact.website), { x: M, y: 17, size: 8, font: bold, color: accent });
    }
  };

  const newPage = () => {
    page = pdf.addPage([W, H]);
    decorate(page);
    y = TOP;
  };
  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) newPage();
  };

  decorate(page);

  const write = (
    text: string,
    size: number,
    useBold = false,
    gap = 6,
    indent = 0,
    color = ink,
  ) => {
    const lines = WRAP(S(text), useBold ? bold : font, size, contentWidth - indent);
    for (const line of lines) {
      ensure(size + 6);
      page.drawText(line, { x: M + indent, y, size, font: useBold ? bold : font, color });
      y -= size + 4;
    }
    y -= gap;
  };

  const drawTable = (rows: string[][]) => {
    const cols = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => {
      const copy = [...r];
      while (copy.length < cols) copy.push("");
      return copy;
    });
    const size = 8.5;
    const pad = 5;
    // Larguras proporcionais ao conteúdo, com mínimo razoável.
    const weights = Array.from({ length: cols }, (_, c) =>
      Math.max(...norm.map((r) => font.widthOfTextAtSize(S(r[c] ?? ""), size)), 30),
    );
    const total = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => Math.max(50, (w / total) * contentWidth));
    const scale = contentWidth / widths.reduce((a, b) => a + b, 0);
    const cw = widths.map((w) => w * scale);

    y -= 4;
    norm.forEach((row, rowIndex) => {
      const isHead = rowIndex === 0;
      const cells = row.map((cell, c) =>
        WRAP(S(cell), isHead ? bold : font, size, cw[c]! - pad * 2),
      );
      const rowHeight = Math.max(...cells.map((l) => l.length)) * (size + 3) + pad * 2;
      ensure(rowHeight + 4);
      const top = y;
      let x = M;
      row.forEach((_, c) => {
        page.drawRectangle({
          x,
          y: top - rowHeight,
          width: cw[c]!,
          height: rowHeight,
          color: isHead ? rgb(0.11, 0.14, 0.21) : rowIndex % 2 === 0 ? rgb(0.96, 0.96, 0.97) : rgb(1, 1, 1),
          borderColor: rgb(0.78, 0.79, 0.82),
          borderWidth: 0.5,
        });
        let ty = top - pad - size;
        for (const line of cells[c]!) {
          page.drawText(line, {
            x: x + pad,
            y: ty,
            size,
            font: isHead ? bold : font,
            color: isHead ? rgb(1, 1, 1) : ink,
          });
          ty -= size + 3;
        }
        x += cw[c]!;
      });
      y = top - rowHeight;
    });
    y -= 12;
  };

  const drawChart = (title: string, data: Array<{ label: string; value: number }>) => {
    const barH = 16;
    const gapH = 8;
    const chartH = data.length * (barH + gapH) + (title ? 22 : 0) + 12;
    ensure(chartH);
    if (title) {
      page.drawText(S(stripMd(title)), { x: M, y, size: 10, font: bold, color: ink });
      y -= 18;
    }
    const labelW = Math.min(
      170,
      Math.max(...data.map((d) => font.widthOfTextAtSize(S(d.label), 8.5))) + 8,
    );
    const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);
    const trackW = contentWidth - labelW - 46;
    for (const d of data) {
      page.drawText(S(d.label).slice(0, 46), {
        x: M,
        y: y - barH + 5,
        size: 8.5,
        font,
        color: ink,
      });
      page.drawRectangle({
        x: M + labelW,
        y: y - barH,
        width: trackW,
        height: barH,
        color: rgb(0.94, 0.94, 0.95),
      });
      page.drawRectangle({
        x: M + labelW,
        y: y - barH,
        width: Math.max(2, (Math.abs(d.value) / max) * trackW),
        height: barH,
        color: accent,
      });
      const valueLabel = String(d.value);
      page.drawText(valueLabel, {
        x: M + labelW + trackW + 6,
        y: y - barH + 5,
        size: 8.5,
        font: bold,
        color: ink,
      });
      y -= barH + gapH;
    }
    y -= 8;
  };

  /* --------------------------------- capa --------------------------------- */

  write(input.title, 20, true, 6);
  if (input.authors) write(`Por ${input.authors}`, 11, true, 4, 0, rgb(0.35, 0.37, 0.42));
  if (input.subtitle) write(input.subtitle, 11, false, 4);
  const meta: string[] = [];
  if (input.authorContact) meta.push(`Contato: ${input.authorContact}`);
  meta.push(`Atualizado em: ${input.referenceDate ?? new Date().toLocaleDateString("pt-BR")}`);
  write(meta.join("  |  "), 9, false, 10);

  if (cover) {
    const w = contentWidth;
    const h = Math.min((cover.height / cover.width) * w, 260);
    ensure(h + 12);
    page.drawImage(cover, { x: M, y: y - h, width: w, height: h });
    y -= h + 18;
  }

  /* --------------------------------- corpo -------------------------------- */

  for (const block of parseBlocks(input.body)) {
    if (block.type === "heading") {
      const size = block.level <= 2 ? 14 : block.level === 3 ? 12 : 11;
      y -= 4;
      ensure(size + 14);
      write(block.text, size, true, 6);
    } else if (block.type === "paragraph") {
      write(block.text, 10.5, false, 8);
    } else if (block.type === "bullet") {
      ensure(20);
      page.drawCircle({ x: M + 3, y: y + 3.5, size: 1.8, color: accent });
      write(block.text, 10.5, false, 4, 14);
    } else if (block.type === "table") {
      drawTable(block.rows);
    } else {
      drawChart(block.title, block.data);
    }
  }

  if (input.sources?.trim()) {
    y -= 6;
    write("Fontes", 13, true, 4);
    write(input.sources, 9, false, 4);
  }

  /* ------------------------------- paginação ------------------------------ */

  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    const label = `${i + 1}/${pages.length}`;
    const width = bold.widthOfTextAtSize(label, 9);
    p.drawText(label, { x: W - M - width, y: 27, size: 9, font: bold, color: rgb(0.3, 0.3, 0.3) });
  });

  return pdf.save();
}
