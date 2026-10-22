/**
 * Material de prospecção da Liberato Consulting (gerado no navegador):
 * - banner PNG leve usado no corpo do e-mail;
 * - resumo de serviços em 3 slides (PowerPoint e PDF) anexado ao e-mail.
 * Tudo é montado a partir dos dados atuais do painel (logomarca, métricas,
 * impactos, serviços, consultores e dados da consultoria).
 */
import { C, H, W, pdfBoard, pptBoard, type Board, type Img } from "./presentation-deck";

export type KitInput = {
  logo: Img; // para fundo claro
  logoLight: Img; // para fundo escuro
  introduction: { title: string; body: string };
  metrics: Array<{ value: string; label: string }>;
  impact: Array<{ title: string; body: string }>;
  services: Array<{ title: string; bullets: string[] }>;
  consultants: Array<{ name: string; headline: string; education: string[]; clients: string[]; specialties: string[] }>;
  identity: { tradeName: string; website: string; phone: string; email: string; address: string };
};

const short = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** Três frentes do slide "O que entregamos" (texto definido pela Liberato). */
export const DELIVERY_PILLARS = [
  {
    title: "AUMENTO DE PRODUTIVIDADE E EFICIÊNCIA",
    body:
      "Processos mais enxutos liberam capacidade sem novas contratações. Eliminamos desperdícios, padronizamos rotinas e usamos dados e IA para reduzir retrabalho e prazos — o resultado é menor custo por entrega, mais caixa e um time focado no que gera valor.",
  },
  {
    title: "AUMENTO DE VENDAS E MARGEM",
    body:
      "Ferramentas práticas para vender mais e melhor: inteligência de mercado, prospecção estruturada, funil e CRM com metas claras, precificação baseada em valor e análise de rentabilidade por cliente e produto. Mais receita, com margem protegida.",
  },
  {
    title: "TREINAMENTOS IN COMPANY",
    body:
      "Programas sob medida em liderança, Lean, gestão de projetos, precificação, vendas e uso de IA na gestão. Um time preparado sustenta os ganhos, toma decisões melhores e executa a estratégia com autonomia — a melhoria deixa de depender de poucas pessoas.",
  },
];

function drawKit(b: Board, k: KitInput) {
  const name = k.identity.tradeName || "Liberato Consulting";
  const metrics = k.metrics.slice(0, 4);

  // Slide 1 — Por que a Liberato
  b.newSlide(C.cream);
  b.rect(0, 0, 5.2, H, C.navy);
  b.image(k.logoLight ?? k.logo, 0.6, 0.55, 2.8, 0.9);
  b.text("POR QUE A", 0.6, 1.9, 4.2, 0.6, { size: 30, color: C.white, bold: true, display: true });
  b.text(name.toUpperCase(), 0.6, 2.45, 4.2, 1.1, { size: 30, color: C.accent, bold: true, display: true });
  b.text(k.introduction.body, 0.6, 3.75, 4.1, 2.0, { size: 16, color: C.white });
  b.text("O QUE SUA EMPRESA GANHA", 5.8, 0.6, 7, 0.5, { size: 20, color: C.navy, bold: true, display: true });
  k.impact.slice(0, 4).forEach((it, i) => {
    const y = 1.25 + i * 0.78;
    b.rect(5.8, y + 0.06, 0.32, 0.32, C.accent, true);
    b.text("•", 5.86, y + 0.02, 0.2, 0.35, { size: 16, color: C.white, bold: true, align: "center" });
    b.text(it.title, 6.3, y, 6.4, 0.38, { size: 16, color: C.ink, bold: true });
    b.text(it.body, 6.3, y + 0.36, 6.4, 0.38, { size: 12, color: C.muted });
  });
  const mw = (W - 5.8 - 0.6 - 0.3 * (metrics.length - 1)) / Math.max(1, metrics.length);
  metrics.forEach((m, i) => {
    const x = 5.8 + i * (mw + 0.3);
    b.rect(x, 4.6, mw, 2.1, C.white, true);
    b.rect(x, 4.6, mw, 0.1, C.accent);
    b.text(m.value, x + 0.2, 4.95, mw - 0.4, 0.9, { size: 34, color: C.accent, bold: true, display: true, align: "center" });
    b.text(m.label.toUpperCase(), x + 0.2, 5.85, mw - 0.4, 0.7, { size: 12, color: C.navy, bold: true, align: "center" });
  });

  // Slide 2 — O que entregamos
  b.newSlide(C.white);
  b.rect(0, 0, W, 1.55, C.navy);
  b.text("O QUE ENTREGAMOS", 0.6, 0.35, 9, 0.6, { size: 28, color: C.white, bold: true, display: true });
  b.text(short(k.introduction.title, 120), 0.6, 0.95, 9.5, 0.45, { size: 14, color: C.soft });
  b.image(k.logoLight ?? k.logo, 10.6, 0.4, 2.2, 0.75);
  const main = DELIVERY_PILLARS;
  const cw = (W - 1.2 - 0.4 * (main.length - 1)) / main.length;
  main.forEach((s, i) => {
    const x = 0.6 + i * (cw + 0.4);
    b.rect(x, 1.95, cw, 3.9, C.light, true);
    b.rect(x, 1.95, cw, 0.12, C.accent);
    b.text(s.title, x + 0.25, 2.2, cw - 0.5, 0.8, { size: 15, color: C.navy, bold: true, display: true });
    b.text(s.body, x + 0.25, 3.05, cw - 0.5, 2.7, { size: 13, color: C.ink });
  });
  b.rect(0.6, 6.05, W - 1.2, 0.55, C.soft, true);
  b.text("Como entregamos: diagnóstico  ›  piloto com ganhos rápidos  ›  escala  ›  capacitação da liderança", 0.85, 6.18, W - 1.7, 0.35, { size: 13, color: C.navy, bold: true });
  const others = k.services.slice(0, 8).map((s) => s.title);
  if (others.length) b.text(`Também atuamos em: ${others.join(" · ")}`, 0.6, 6.78, W - 1.2, 0.4, { size: 11, color: C.muted });

  // Slide 3 — Vamos conversar
  b.newSlide(C.navy);
  b.image(k.logoLight ?? k.logo, 0.6, 0.45, 2.6, 0.85);
  b.text("VAMOS CONVERSAR?", 0.6, 1.45, 12, 0.8, { size: 36, color: C.white, bold: true, display: true });
  b.text("Em 20 a 30 minutos, trazemos uma primeira análise de oportunidades de melhoria para a sua empresa.", 0.6, 2.2, 12, 0.5, { size: 16, color: C.soft });
  const c = k.consultants[0];
  const cx = 0.6, cwid = W - 1.2, cy = 2.85, ch = 3.45;
  b.rect(cx, cy, cwid, ch, C.white, true);
  b.rect(cx, cy, 0.12, ch, C.accent);
  if (c) {
    b.text(c.name, cx + 0.35, cy + 0.15, 6, 0.45, { size: 18, color: C.navy, bold: true, display: true });
    b.text(c.headline, cx + 0.35, cy + 0.58, 6, 0.35, { size: 12, color: C.accent, bold: true });
    const cols = [
      { t: "FORMAÇÃO", items: c.education.slice(0, 7), w: 5.6 },
      { t: "CLIENTES", items: c.clients.slice(0, 7), w: 2.4 },
      { t: "ESPECIALIDADES", items: c.specialties.slice(0, 7), w: cwid - 0.6 - 5.6 - 2.4 - 0.6 },
    ];
    let x = cx + 0.35;
    cols.forEach((col) => {
      b.rect(x, cy + 1.05, col.w, 0.04, C.accent);
      b.text(col.t, x, cy + 1.12, col.w, 0.32, { size: 11, color: C.accent, bold: true });
      b.text(col.items.map((l) => `• ${short(l, col.w > 4 ? 95 : 48)}`).join("\n") || "—", x, cy + 1.48, col.w, ch - 1.6, { size: 10, color: C.ink });
      x += col.w + 0.3;
    });
  } else {
    b.text(k.introduction.body, cx + 0.35, cy + 0.3, cwid - 0.7, ch - 0.6, { size: 14, color: C.ink });
  }
  const contact = [k.identity.website, k.identity.email, k.identity.phone].filter(Boolean).join("  ·  ");
  b.text(contact, 0.6, 6.45, W - 1.2, 0.35, { size: 13, color: C.white, bold: true, align: "center" });
  if (k.identity.address) b.text(k.identity.address, 0.6, 6.85, W - 1.2, 0.35, { size: 10, color: C.soft, align: "center" });
}

export async function buildKitDeck(k: KitInput): Promise<{ pptx: string; pdf: string }> {
  const ppt = await pptBoard();
  drawKit(ppt.board, k);
  const pdf = await pdfBoard();
  drawKit(pdf.board, k);
  return { pptx: await ppt.base64(), pdf: await pdf.base64() };
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

/** Banner PNG do e-mail (1200 px), leve e sem texto essencial — o texto real fica no corpo do e-mail. */
export async function buildKitBanner(k: KitInput): Promise<string> {
  const Wd = 1200, Hd = 640;
  const cv = document.createElement("canvas");
  cv.width = Wd; cv.height = Hd;
  const ctx = cv.getContext("2d")!;
  const hex = (h: string) => `#${h}`;
  ctx.fillStyle = hex(C.navy); ctx.fillRect(0, 0, Wd, Hd);
  ctx.fillStyle = hex(C.accent); ctx.fillRect(0, 0, 14, Hd);
  const logo = k.logoLight ?? k.logo;
  if (logo) {
    const im = await loadImg(logo.data);
    if (im) { const h = 64, w = (im.width / im.height) * h; ctx.drawImage(im, 60, 44, Math.min(w, 320), h); }
  }
  ctx.fillStyle = hex(C.white);
  ctx.font = "bold 40px Arial, Helvetica, sans-serif";
  wrap(ctx, k.introduction.title, 1080).slice(0, 2).forEach((l, i) => ctx.fillText(l, 60, 170 + i * 50));
  // pilares
  const pillars = k.impact.slice(0, 3);
  const pw = (1080 - 40) / Math.max(1, pillars.length);
  pillars.forEach((p, i) => {
    const x = 60 + i * (pw + 20), y = 260;
    ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(x, y, pw, 170);
    ctx.fillStyle = hex(C.accent); ctx.fillRect(x, y, pw, 6);
    ctx.fillStyle = hex(C.white); ctx.font = "bold 22px Arial, Helvetica, sans-serif";
    wrap(ctx, p.title, pw - 40).slice(0, 2).forEach((l, j) => ctx.fillText(l, x + 20, y + 44 + j * 28));
    ctx.fillStyle = hex(C.soft); ctx.font = "17px Arial, Helvetica, sans-serif";
    wrap(ctx, p.body, pw - 40).slice(0, 3).forEach((l, j) => ctx.fillText(l, x + 20, y + 106 + j * 22));
  });
  // métricas
  const ms = k.metrics.slice(0, 4);
  const mw = 1080 / Math.max(1, ms.length);
  ms.forEach((m, i) => {
    const x = 60 + i * mw;
    ctx.fillStyle = hex(C.accent); ctx.font = "bold 46px Arial, Helvetica, sans-serif";
    ctx.fillText(m.value, x, 520);
    ctx.fillStyle = hex(C.white); ctx.font = "15px Arial, Helvetica, sans-serif";
    // Quebra o rótulo dentro da própria coluna para não encostar na métrica vizinha.
    wrap(ctx, m.label.toUpperCase(), mw - 40).slice(0, 2).forEach((l, j) => ctx.fillText(l, x, 550 + j * 20));
  });
  ctx.fillStyle = hex(C.soft); ctx.font = "15px Arial, Helvetica, sans-serif";
  ctx.fillText(k.identity.website.replace(/^https?:\/\//, ""), 60, 612);
  return cv.toDataURL("image/png").split(",")[1] ?? "";
}
