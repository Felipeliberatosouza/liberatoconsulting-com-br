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
  contact: { name: string; line1: string; line2: string };
};

function wrap(text: string, font: any, size: number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
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

async function embedLogo(pdf: PDFDocument, dataUrl?: string | null) {
  if (!dataUrl) return null;
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;
  const bytes = Buffer.from(match[2]!, "base64");
  try {
    return match[1]!.toLowerCase() === "png"
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

/**
 * Gera o PDF institucional: marca d'água com a logomarca, cabeçalho com o nome
 * da consultoria à esquerda e rodapé com nome e contatos.
 */
export async function buildBrandedPdf(input: PdfDocInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf, input.logoDataUrl ?? null);

  const W = 595.28;
  const H = 841.89;
  const M = 56;
  const contentWidth = W - M * 2;

  let page = pdf.addPage([W, H]);
  let y = H - M;

  const decorate = (p: typeof page) => {
    // Marca d'água
    if (logo) {
      const target = 320;
      const scale = target / logo.width;
      const w = target;
      const h = logo.height * scale;
      p.drawImage(logo, {
        x: (W - w) / 2,
        y: (H - h) / 2,
        width: w,
        height: h,
        opacity: 0.07,
        rotate: degrees(20),
      });
    } else {
      p.drawText("LIBERATO CONSULTING", {
        x: 90,
        y: H / 2,
        size: 42,
        font: bold,
        color: rgb(0.85, 0.85, 0.85),
        opacity: 0.25,
        rotate: degrees(30),
      });
    }
    // Cabeçalho
    p.drawText("Liberato Consulting", { x: M, y: H - 34, size: 10, font: bold, color: rgb(0.1, 0.12, 0.18) });
    p.drawLine({
      start: { x: M, y: H - 42 },
      end: { x: W - M, y: H - 42 },
      thickness: 0.6,
      color: rgb(0.8, 0.8, 0.8),
    });
    // Rodapé
    p.drawLine({
      start: { x: M, y: 58 },
      end: { x: W - M, y: 58 },
      thickness: 0.6,
      color: rgb(0.8, 0.8, 0.8),
    });
    p.drawText(sanitize(input.contact.name), { x: M, y: 44, size: 8, font: bold, color: rgb(0.3, 0.3, 0.3) });
    p.drawText(sanitize(input.contact.line1), { x: M, y: 33, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
    p.drawText(sanitize(input.contact.line2), { x: M, y: 23, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  };

  decorate(page);
  y = H - 80;

  const write = (text: string, size: number, useBold = false, gap = 6) => {
    const lines = wrap(sanitize(text), useBold ? bold : font, size, contentWidth);
    for (const line of lines) {
      if (y < 80) {
        page = pdf.addPage([W, H]);
        decorate(page);
        y = H - 80;
      }
      page.drawText(line, {
        x: M,
        y,
        size,
        font: useBold ? bold : font,
        color: rgb(0.12, 0.14, 0.2),
      });
      y -= size + 4;
    }
    y -= gap;
  };

  write(input.title, 20, true, 4);
  if (input.subtitle) write(input.subtitle, 11, false, 4);
  const meta: string[] = [];
  if (input.authors) meta.push(`Autores: ${input.authors}`);
  if (input.authorContact) meta.push(`Contato: ${input.authorContact}`);
  meta.push(`Atualizado em: ${input.referenceDate ?? new Date().toLocaleDateString("pt-BR")}`);
  write(meta.join("  |  "), 9, false, 12);

  write(input.body, 11, false, 10);

  if (input.sources?.trim()) {
    write("Fontes", 13, true, 4);
    write(input.sources, 9, false, 4);
  }

  return pdf.save();
}
