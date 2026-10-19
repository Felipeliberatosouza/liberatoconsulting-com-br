import { formatValue, type ToolSpec } from "./tool-engine";

export type Branding = { logoUrl: string; name: string; cnpj: string; phone: string; email: string; website: string; address: string };
export type ExportData = {
  spec: ToolSpec;
  context: Record<string, string>;
  inputs: Record<string, number>;
  values: Record<string, number>;
  recommendations: string[];
  chart: Array<Record<string, number>> | null;
};

const INK = "1B2430", ACCENT = "E07A1F", MUTED = "6B7280";

async function logoPng(url: string): Promise<string | null> {
  for (const src of [url, "/logo.png"]) {
    try {
      const img = new Image(); img.crossOrigin = "anonymous"; img.src = src; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      return c.toDataURL("image/png");
    } catch { /* tenta a próxima */ }
  }
  return null;
}

function footerLine(b: Branding) {
  return [b.name, b.cnpj && `CNPJ ${b.cnpj}`, b.phone, b.email, b.website].filter(Boolean).join("  ·  ");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function fileBase(d: ExportData) {
  const company = Object.values(d.context)[0] ?? "";
  return `${d.spec.title} ${company}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function buildPptx(d: ExportData, b: Branding): Promise<Blob> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  const logo = await logoPng(b.logoUrl);
  const foot = footerLine(b);
  const addFrame = (s: any, title: string) => {
    s.background = { color: "FFFFFF" };
    s.addShape("rect", { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: ACCENT } });
    s.addText(title, { x: 0.6, y: 0.35, w: 10, h: 0.8, fontFace: "Georgia", fontSize: 30, bold: true, color: INK });
    if (logo) s.addImage({ data: logo, x: 11.2, y: 0.35, w: 1.7, h: 0.6, sizing: { type: "contain", w: 1.7, h: 0.6 } });
    s.addText(foot, { x: 0.6, y: 6.95, w: 12.2, h: 0.35, fontSize: 10, color: MUTED });
  };
  // Capa
  const cover = pptx.addSlide();
  cover.background = { color: INK };
  if (logo) cover.addImage({ data: logo, x: 0.7, y: 0.6, w: 2.6, h: 0.9, sizing: { type: "contain", w: 2.6, h: 0.9 } });
  cover.addText(d.spec.title, { x: 0.7, y: 2.3, w: 11.5, h: 1.4, fontFace: "Georgia", fontSize: 44, bold: true, color: "FFFFFF" });
  const ctxLine = d.spec.context_fields.map((f) => d.context[f.id]).filter(Boolean).join(" · ");
  if (ctxLine) cover.addText(ctxLine, { x: 0.7, y: 3.8, w: 11.5, h: 0.6, fontSize: 22, color: ACCENT });
  cover.addText(`${new Date().toLocaleDateString("pt-BR")}  ·  ${foot}`, { x: 0.7, y: 6.6, w: 12, h: 0.5, fontSize: 12, color: "C9CED6" });
  // Premissas
  const s2 = pptx.addSlide(); addFrame(s2, "Dados informados");
  const rows = d.spec.inputs.map((i) => [{ text: i.label }, { text: `${d.inputs[i.id]?.toLocaleString("pt-BR")} ${i.unit}`.trim(), options: { align: "right" as const, bold: true } }]);
  s2.addTable(rows, { x: 0.6, y: 1.4, w: 12, fontSize: 18, color: INK, border: { type: "solid", pt: 0.5, color: "E5E7EB" }, rowH: 0.5 });
  // Resultados
  const s3 = pptx.addSlide(); addFrame(s3, "Resultados");
  const outs = d.spec.outputs.slice(0, 6);
  outs.forEach((o, idx) => {
    const col = idx % 3, row = Math.floor(idx / 3);
    const x = 0.6 + col * 4.1, y = 1.5 + row * 2.6;
    s3.addShape("rect", { x, y, w: 3.8, h: 2.3, fill: { color: "F6F4F1" }, line: { color: "F6F4F1" } });
    s3.addText(formatValue(d.values[o.id] ?? 0, o.format, o.unit === "R$" || o.unit === "%" ? "" : o.unit), { x: x + 0.2, y: y + 0.25, w: 3.4, h: 0.9, fontSize: 30, bold: true, color: ACCENT, fontFace: "Georgia" });
    s3.addText(o.label, { x: x + 0.2, y: y + 1.15, w: 3.4, h: 0.45, fontSize: 16, bold: true, color: INK });
    s3.addText(o.explanation, { x: x + 0.2, y: y + 1.55, w: 3.4, h: 0.7, fontSize: 11, color: MUTED, valign: "top" });
  });
  // Gráfico
  if (d.chart && d.spec.chart.type === "line") {
    const s4 = pptx.addSlide(); addFrame(s4, d.spec.chart.title || "Gráfico");
    const labels = d.chart.map((p) => Math.round(p["x"]!).toLocaleString("pt-BR"));
    const data = d.spec.chart.series.map((se, i) => ({ name: se.label, labels, values: d.chart!.map((p) => p[`s${i}`] ?? 0) }));
    s4.addChart("line", data, { x: 0.6, y: 1.3, w: 12.1, h: 5.4, showLegend: true, legendPos: "b", catAxisTitle: d.spec.chart.x_label, showCatAxisTitle: true, chartColors: [ACCENT, INK, "3B82F6", "10B981"], lineDataSymbol: "none" });
  }
  // Conclusões
  const s5 = pptx.addSlide(); addFrame(s5, "Conclusões e recomendações");
  const recs = d.recommendations.length ? d.recommendations : ["Os resultados estão dentro dos parâmetros esperados para os dados informados."];
  s5.addText(recs.map((r) => ({ text: r, options: { bullet: true, breakLine: true } })), { x: 0.6, y: 1.4, w: 12, h: 4, fontSize: 20, color: INK, valign: "top", paraSpaceAfter: 10 });
  s5.addText(`Metodologia: ${d.spec.methodology}`, { x: 0.6, y: 5.6, w: 12, h: 1.1, fontSize: 12, color: MUTED, valign: "top" });
  const out = (await pptx.write({ outputType: "blob" })) as Blob;
  return out;
}

/** Remove caracteres que a fonte padrão do PDF não consegue desenhar. */
function safe(s: string) { return s.replace(/[≥]/g, ">=").replace(/[≤]/g, "<=").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x20-\x7E\u00A0-\u00FF·•]/g, ""); }

export async function buildPdf(d: ExportData, b: Branding): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const hex = (h: string) => rgb(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
  const logoData = await logoPng(b.logoUrl);
  const logo = logoData ? await doc.embedPng(logoData) : null;
  const W = 595, H = 842, M = 48;
  let page = doc.addPage([W, H]);
  let y = 0;
  const header = () => {
    page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: hex(ACCENT) });
    if (logo) { const s = Math.min(130 / logo.width, 40 / logo.height); page.drawImage(logo, { x: M, y: H - 62, width: logo.width * s, height: logo.height * s }); }
    page.drawText(new Date().toLocaleDateString("pt-BR"), { x: W - M - 60, y: H - 45, size: 9, font, color: hex(MUTED) });
    const f = safe(footerLine(b));
    page.drawLine({ start: { x: M, y: 44 }, end: { x: W - M, y: 44 }, thickness: 0.5, color: hex("E5E7EB") });
    page.drawText(f.slice(0, 120), { x: M, y: 30, size: 8, font, color: hex(MUTED) });
    if (b.address) page.drawText(safe(b.address).slice(0, 120), { x: M, y: 19, size: 8, font, color: hex(MUTED) });
    y = H - 95;
  };
  const ensure = (h: number) => { if (y - h < 60) { page = doc.addPage([W, H]); header(); } };
  const wrap = (text: string, size: number, f = font, width = W - 2 * M) => {
    const words = safe(text).split(/\s+/); const lines: string[] = []; let cur = "";
    for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (f.widthOfTextAtSize(t, size) > width) { if (cur) lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  };
  const para = (text: string, size = 10, f = font, color = INK) => { for (const l of wrap(text, size, f)) { ensure(size + 4); page.drawText(l, { x: M, y, size, font: f, color: hex(color) }); y -= size + 4; } };
  const h2 = (t: string) => { y -= 8; ensure(30); page.drawText(safe(t), { x: M, y, size: 14, font: bold, color: hex(INK) }); y -= 20; };
  header();
  para(d.spec.title, 20, bold);
  const ctxLine = d.spec.context_fields.map((f) => `${f.label}: ${d.context[f.id] ?? ""}`).join("   ");
  if (ctxLine) para(ctxLine, 10, font, ACCENT);
  y -= 4; para(d.spec.summary, 10, font, MUTED);
  h2("Dados informados");
  for (const i of d.spec.inputs) { ensure(16); page.drawText(safe(i.label).slice(0, 70), { x: M, y, size: 10, font, color: hex(INK) }); const v = safe(`${d.inputs[i.id]?.toLocaleString("pt-BR")} ${i.unit}`.trim()); page.drawText(v, { x: W - M - bold.widthOfTextAtSize(v, 10), y, size: 10, font: bold, color: hex(INK) }); y -= 16; }
  h2("Resultados");
  for (const o of d.spec.outputs) {
    ensure(40);
    const v = safe(formatValue(d.values[o.id] ?? 0, o.format, o.unit === "R$" || o.unit === "%" ? "" : o.unit));
    page.drawRectangle({ x: M, y: y - 6, width: 3, height: 18, color: hex(ACCENT) });
    page.drawText(safe(o.label).slice(0, 60), { x: M + 10, y, size: 11, font: bold, color: hex(INK) });
    page.drawText(v, { x: W - M - bold.widthOfTextAtSize(v, 12), y, size: 12, font: bold, color: hex(ACCENT) });
    y -= 15; if (o.explanation) para(o.explanation, 8.5, font, MUTED); y -= 6;
  }
  if (d.chart && d.spec.chart.type === "line") {
    h2(d.spec.chart.title || "Gráfico");
    const ch = 200; ensure(ch + 40);
    const x0 = M + 40, x1 = W - M, y0 = y - ch, y1 = y;
    const all = d.chart.flatMap((p) => d.spec.chart.series.map((_, i) => p[`s${i}`] ?? 0));
    const maxY = Math.max(1, ...all), minY = Math.min(0, ...all), maxX = d.chart[d.chart.length - 1]!["x"]! || 1;
    const px = (x: number) => x0 + (x / maxX) * (x1 - x0), py = (v: number) => y0 + ((v - minY) / (maxY - minY)) * (y1 - y0);
    page.drawLine({ start: { x: x0, y: y0 }, end: { x: x1, y: y0 }, thickness: 0.6, color: hex(MUTED) });
    page.drawLine({ start: { x: x0, y: y0 }, end: { x: x0, y: y1 }, thickness: 0.6, color: hex(MUTED) });
    page.drawText(maxY.toLocaleString("pt-BR", { maximumFractionDigits: 0 }), { x: M - 6, y: y1 - 4, size: 7, font, color: hex(MUTED) });
    page.drawText(Math.round(maxX).toLocaleString("pt-BR"), { x: x1 - 20, y: y0 - 12, size: 7, font, color: hex(MUTED) });
    const colors = [ACCENT, INK, "3B82F6", "10B981"];
    d.spec.chart.series.forEach((s, i) => {
      for (let k = 1; k < d.chart!.length; k++) { const a = d.chart![k - 1]!, c = d.chart![k]!; page.drawLine({ start: { x: px(a["x"]!), y: py(a[`s${i}`] ?? 0) }, end: { x: px(c["x"]!), y: py(c[`s${i}`] ?? 0) }, thickness: 1.6, color: hex(colors[i % 4]!) }); }
      page.drawRectangle({ x: x0 + i * 130, y: y0 - 28, width: 8, height: 8, color: hex(colors[i % 4]!) });
      page.drawText(safe(s.label).slice(0, 24), { x: x0 + i * 130 + 12, y: y0 - 27, size: 8, font, color: hex(INK) });
    });
    y = y0 - 44;
  }
  h2("Conclusões e recomendações");
  for (const r of d.recommendations.length ? d.recommendations : ["Os resultados estão dentro dos parâmetros esperados para os dados informados."]) para(`• ${r}`, 10);
  h2("Metodologia");
  para(d.spec.methodology, 9, font, MUTED);
  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function exportTool(kind: "pptx" | "pdf", d: ExportData, b: Branding) {
  const blob = kind === "pptx" ? await buildPptx(d, b) : await buildPdf(d, b);
  downloadBlob(blob, `${fileBase(d)}.${kind}`);
}
