/**
 * Monta o material de apresentação da Liberato Consulting e exporta em PPTX e PDF.
 * Os slides são desenhados uma única vez sobre uma "prancheta" comum, com duas
 * implementações (PowerPoint e PDF) para garantir o mesmo layout nos dois formatos.
 */
import type { PresentationDraft } from "./presentation.functions";
import { formatMoney } from "./pricing-catalog";

export type Img = { data: string; w: number; h: number } | null;

export type DeckInput = {
  clientName: string;
  sector: string;
  location: string;
  website: string;
  description: string;
  offerings: string[];
  highlights: string[];
  clientLogo: Img;
  liberatoLogo: Img;
  liberatoLogoLight: Img;
  service: {
    title: string;
    family: string;
    lead: string;
    bullets: string[];
    results: string[];
    modules: string[];
    duration: string;
    ai: string;
  };
  draft: PresentationDraft;
  institutional: {
    introduction?: { title: string; body: string };
    metrics: Array<{ value: string; label: string }>;
    impact: Array<{ title: string; body: string }>;
    mission: string;
    purpose: string;
    clients: Array<{ name: string; logo: Img }>;
  };
  tools: Array<{ title: string; summary: string | null }>;
  identity: { tradeName: string; website: string; phone: string; email: string; address: string; cnpj: string };
  quote: null | {
    currency: string;
    total: number;
    start: string | null;
    end: string | null;
    discountPct: number;
    phases: Array<{ title: string; days: number; price: number }>;
    totalDays: number;
  };
};

const C = {
  navy: "1B2A41",
  ink: "141C2B",
  accent: "E0702A",
  cream: "FAF7F0",
  white: "FFFFFF",
  muted: "5B6475",
  light: "EEF0F4",
  soft: "FCEBDD",
};
const W = 13.333;
const H = 7.5;

type TextOpts = {
  size: number;
  color?: string;
  bold?: boolean;
  align?: "left" | "center" | "right";
  display?: boolean;
};

interface Board {
  newSlide(bg: string): void;
  rect(x: number, y: number, w: number, h: number, color: string, round?: boolean): void;
  text(str: string, x: number, y: number, w: number, h: number, o: TextOpts): void;
  image(img: Img, x: number, y: number, w: number, h: number): void;
}

function fit(img: NonNullable<Img>, x: number, y: number, w: number, h: number) {
  const r = Math.min(w / img.w, h / img.h);
  const iw = img.w * r;
  const ih = img.h * r;
  return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
}

// ---------- PowerPoint ----------
async function pptBoard() {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  let slide: any = null;
  const board: Board = {
    newSlide(bg) {
      slide = pptx.addSlide();
      slide.background = { color: bg };
    },
    rect(x, y, w, h, color, round) {
      slide.addShape(round ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
        x, y, w, h,
        fill: { color },
        line: { color, width: 0 },
        rectRadius: round ? 0.12 : undefined,
      });
    },
    text(str, x, y, w, h, o) {
      if (!str) return;
      slide.addText(str, {
        x, y, w, h,
        fontSize: o.size,
        bold: !!o.bold,
        color: o.color ?? C.ink,
        align: o.align ?? "left",
        valign: "top",
        margin: 0,
        fontFace: o.display ? "Space Grotesk" : "DM Sans",
        lineSpacingMultiple: 1.05,
        fit: "shrink",
      });
    },
    image(img, x, y, w, h) {
      if (!img) return;
      const f = fit(img, x, y, w, h);
      slide.addImage({ data: img.data, ...f });
    },
  };
  return { board, save: (name: string) => pptx.writeFile({ fileName: name }) };
}

// ---------- PDF ----------
async function pdfBoard() {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "in", format: [W, H] });
  let first = true;
  const rgb = (hex: string) => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] as const;
  const board: Board = {
    newSlide(bg) {
      if (!first) doc.addPage([W, H], "landscape");
      first = false;
      doc.setFillColor(...rgb(bg));
      doc.rect(0, 0, W, H, "F");
    },
    rect(x, y, w, h, color, round) {
      doc.setFillColor(...rgb(color));
      if (round) doc.roundedRect(x, y, w, h, 0.12, 0.12, "F");
      else doc.rect(x, y, w, h, "F");
    },
    text(str, x, y, w, h, o) {
      if (!str) return;
      let size = o.size;
      doc.setFont("helvetica", o.bold ? "bold" : "normal");
      let lines: string[] = [];
      let lh = 0;
      // Reduz a fonte até caber, como o "shrink" do PowerPoint.
      for (; size >= 8; size -= 1) {
        doc.setFontSize(size);
        lines = doc.splitTextToSize(str, w) as string[];
        lh = (size * 1.18) / 72;
        if (lines.length * lh <= h + 0.02) break;
      }
      doc.setTextColor(...rgb(o.color ?? C.ink));
      const maxLines = Math.max(1, Math.floor((h + 0.02) / lh));
      lines.slice(0, maxLines).forEach((line, i) => {
        const ty = y + (size * 0.9) / 72 + i * lh;
        const tx = o.align === "center" ? x + w / 2 : o.align === "right" ? x + w : x;
        doc.text(line, tx, ty, { align: o.align ?? "left" });
      });
    },
    image(img, x, y, w, h) {
      if (!img) return;
      const f = fit(img, x, y, w, h);
      try {
        doc.addImage(img.data, "PNG", f.x, f.y, f.w, f.h);
      } catch {
        /* imagem inválida é ignorada */
      }
    },
  };
  return { board, save: (name: string) => doc.save(name) };
}

// ---------- Slides ----------
function drawDeck(b: Board, d: DeckInput) {
  const client = d.clientName;
  const total = { n: 0 };
  const date = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const light = (kicker: string, title: string) => {
    total.n += 1;
    b.newSlide(C.cream);
    b.rect(0, 0, 0.18, H, C.accent);
    b.text(kicker.toUpperCase(), 0.7, 0.45, 9.5, 0.3, { size: 11, bold: true, color: C.accent });
    b.text(title, 0.7, 0.75, 10.2, 1.0, { size: 28, bold: true, color: C.navy, display: true });
    b.rect(0.7, 1.8, 1.2, 0.06, C.accent);
    if (d.clientLogo) {
      b.rect(11.2, 0.4, 1.6, 0.9, C.white, true);
      b.image(d.clientLogo, 11.3, 0.48, 1.4, 0.74);
    }
    footer(false);
  };
  const dark = (kicker: string, title: string) => {
    total.n += 1;
    b.newSlide(C.navy);
    b.rect(0, 0, 0.18, H, C.accent);
    b.text(kicker.toUpperCase(), 0.7, 0.45, 9.5, 0.3, { size: 11, bold: true, color: C.accent });
    b.text(title, 0.7, 0.75, 10.2, 1.0, { size: 28, bold: true, color: C.white, display: true });
    b.rect(0.7, 1.8, 1.2, 0.06, C.accent);
    if (d.clientLogo) {
      b.rect(11.2, 0.4, 1.6, 0.9, C.white, true);
      b.image(d.clientLogo, 11.3, 0.48, 1.4, 0.74);
    }
    footer(true);
  };
  function footer(onDark: boolean) {
    b.image(onDark ? d.liberatoLogoLight ?? d.liberatoLogo : d.liberatoLogo, 0.7, 6.9, 1.4, 0.38);
    b.text(`Liberato Consulting · Proposta exclusiva para ${client}`, 3.5, 7.0, 6.3, 0.25, {
      size: 9,
      color: onDark ? "C9CFDA" : C.muted,
      align: "center",
    });
    b.text(String(total.n), 12.0, 7.0, 0.7, 0.25, { size: 9, color: onDark ? "C9CFDA" : C.muted, align: "right" });
  }
  const numbered = (items: string[], x: number, y: number, w: number, rowH: number, onDark = false) => {
    items.forEach((it, i) => {
      const yy = y + i * rowH;
      b.rect(x, yy, 0.55, 0.55, C.accent, true);
      b.text(String(i + 1).padStart(2, "0"), x, yy + 0.13, 0.55, 0.3, { size: 14, bold: true, color: C.white, align: "center" });
      b.text(it, x + 0.8, yy + 0.08, w - 0.8, rowH - 0.1, { size: 16, color: onDark ? C.white : C.ink });
    });
  };
  const cards = (
    items: Array<{ title: string; body: string }>,
    x: number, y: number, w: number, h: number, cols: number, onDark = false,
  ) => {
    const gap = 0.3;
    const rows = Math.ceil(items.length / cols);
    const cw = (w - gap * (cols - 1)) / cols;
    const ch = (h - gap * (rows - 1)) / rows;
    items.forEach((it, i) => {
      const cx = x + (i % cols) * (cw + gap);
      const cy = y + Math.floor(i / cols) * (ch + gap);
      b.rect(cx, cy, cw, ch, onDark ? "243553" : C.white, true);
      b.rect(cx, cy + 0.25, 0.08, 0.5, C.accent);
      b.text(it.title, cx + 0.3, cy + 0.22, cw - 0.5, 0.6, { size: 16, bold: true, color: onDark ? C.white : C.navy, display: true });
      b.text(it.body, cx + 0.3, cy + 0.85, cw - 0.5, ch - 1.0, { size: 13, color: onDark ? "D5DAE3" : C.muted });
    });
  };

  // 1. Capa
  total.n += 1;
  b.newSlide(C.navy);
  b.rect(0, 0, 0.35, H, C.accent);
  b.image(d.liberatoLogoLight ?? d.liberatoLogo, 0.9, 0.6, 2.6, 0.8);
  if (d.clientLogo) {
    b.rect(9.6, 0.5, 3.0, 1.5, C.white, true);
    b.image(d.clientLogo, 9.8, 0.65, 2.6, 1.2);
  }
  b.text(`PROPOSTA DE VALOR · ${(d.service.family || "CONSULTORIA").toUpperCase()}`, 0.9, 2.5, 11, 0.35, { size: 13, bold: true, color: C.accent });
  b.text(d.draft.headline || `${d.service.title} para ${client}`, 0.9, 2.95, 11.2, 1.9, { size: 40, bold: true, color: C.white, display: true });
  b.text(`${d.service.title} · preparado para ${client}`, 0.9, 5.0, 11, 0.5, { size: 18, color: "D5DAE3" });
  b.text([d.sector, d.location, date].filter(Boolean).join("  ·  "), 0.9, 5.6, 11, 0.4, { size: 14, color: C.accent });

  // 2. Agenda
  light("Agenda", `O que vamos apresentar a ${client}`);
  numbered(
    [
      `O que entendemos sobre ${client}`,
      `O mercado de ${d.sector || "atuação"} e os desafios de ${client}`,
      "Quem é a Liberato Consulting e os resultados que entregamos",
      `${d.service.title}: a solução desenhada para ${client}`,
      `Impactos esperados no negócio de ${client}`,
      "Proposta comercial e próximos passos",
    ],
    0.9, 2.2, 11, 0.72,
  );

  // 3. Sobre o cliente
  light("Entendimento do negócio", `O que entendemos sobre ${client}`);
  b.text(d.draft.aboutClient, 0.7, 2.15, 6.2, 1.4, { size: 18, color: C.navy, bold: true });
  b.text(d.description, 0.7, 3.65, 6.2, 2.8, { size: 14, color: C.muted });
  const facts = [...d.offerings.slice(0, 3), ...d.highlights.slice(0, 3)].slice(0, 5);
  b.rect(7.4, 2.15, 5.3, 4.4, C.white, true);
  b.text(`${client} em destaque`, 7.7, 2.35, 4.8, 0.4, { size: 15, bold: true, color: C.accent });
  facts.forEach((f, i) => {
    b.rect(7.7, 2.98 + i * 0.7, 0.12, 0.12, C.accent);
    b.text(f, 8.0, 2.85 + i * 0.7, 4.5, 0.62, { size: 13, color: C.ink });
  });

  // 4. Setor e região
  light("Contexto de mercado", `${d.sector || "O setor"}${d.location ? ` em ${d.location}` : ""}: o momento de ${client}`);
  b.text(d.draft.sectorContext, 0.7, 2.1, 11.8, 0.9, { size: 16, color: C.muted });
  cards(d.draft.sectorTrends.slice(0, 4).map((t, i) => ({ title: `Oportunidade ${i + 1}`, body: t })), 0.7, 3.15, 11.9, 3.4, 2);

  // 5. Desafios
  light("Desafios", `Os desafios que ${client} pode transformar em vantagem`);
  numbered(d.draft.challenges.slice(0, 4), 0.9, 2.3, 11.4, 1.0);

  // 6. Liberato
  dark("Quem somos", "Liberato Consulting: gestão prática, resultados reais");
  b.text(d.institutional.introduction?.body ?? "", 0.7, 2.1, 7.2, 1.3, { size: 16, color: "D5DAE3" });
  b.text(`Missão: ${d.institutional.mission}`, 0.7, 3.5, 7.2, 0.9, { size: 13, color: C.white });
  b.text(`Propósito: ${d.institutional.purpose}`, 0.7, 4.4, 7.2, 0.9, { size: 13, color: C.white });
  d.institutional.metrics.slice(0, 4).forEach((m, i) => {
    const x = 8.4 + (i % 2) * 2.2;
    const y = 2.1 + Math.floor(i / 2) * 2.1;
    b.rect(x, y, 2.0, 1.9, "243553", true);
    b.text(m.value, x + 0.15, y + 0.3, 1.7, 0.7, { size: 28, bold: true, color: C.accent, align: "center", display: true });
    b.text(m.label, x + 0.15, y + 1.05, 1.7, 0.7, { size: 12, color: C.white, align: "center" });
  });

  // 7. Resultados
  light("Resultados alcançados", "O que a Liberato entrega aos seus clientes");
  cards(d.institutional.impact.slice(0, 6), 0.7, 2.15, 11.9, 4.4, 3);

  // 8. Clientes
  const withLogos = d.institutional.clients.filter((c) => c.name || c.logo);
  if (withLogos.length > 0) {
    light("Casos de sucesso", "Empresas que já confiam na Liberato Consulting");
    withLogos.slice(0, 8).forEach((c, i) => {
      const x = 0.7 + (i % 4) * 3.0;
      const y = 2.3 + Math.floor(i / 4) * 2.0;
      b.rect(x, y, 2.75, 1.7, C.white, true);
      if (c.logo) b.image(c.logo, x + 0.3, y + 0.25, 2.15, 1.0);
      else b.text(c.name, x + 0.2, y + 0.6, 2.35, 0.5, { size: 15, bold: true, color: C.navy, align: "center" });
      if (c.logo && c.name) b.text(c.name, x + 0.1, y + 1.3, 2.55, 0.3, { size: 10, color: C.muted, align: "center" });
    });
  }

  // 9. Serviço
  light("A solução", `${d.service.title} para ${client}`);
  b.text(d.service.lead, 0.7, 2.1, 6.6, 1.3, { size: 18, bold: true, color: C.navy });
  b.text(d.draft.approach, 0.7, 3.5, 6.6, 2.4, { size: 15, color: C.muted });
  b.rect(7.8, 2.1, 4.9, 4.5, C.navy, true);
  b.text("O que está incluído", 8.1, 2.3, 4.4, 0.4, { size: 15, bold: true, color: C.accent });
  d.service.bullets.slice(0, 6).forEach((it, i) => {
    b.rect(8.1, 2.98 + i * 0.6, 0.12, 0.12, C.accent);
    b.text(it, 8.4, 2.85 + i * 0.6, 4.1, 0.55, { size: 13, color: C.white });
  });

  // 10. Metodologia
  light("Como vamos trabalhar", `A jornada de ${client} com a Liberato`);
  const mods = d.service.modules.slice(0, 6);
  if (mods.length) {
    const gap = 0.2;
    const mw = (11.9 - gap * (mods.length - 1)) / mods.length;
    mods.forEach((m, i) => {
      const x = 0.7 + i * (mw + gap);
      b.rect(x, 2.4, mw, 0.7, i % 2 ? C.navy : C.accent, true);
      b.text(`Etapa ${i + 1}`, x, 2.6, mw, 0.35, { size: 14, bold: true, color: C.white, align: "center" });
      b.rect(x, 3.25, mw, 2.6, C.white, true);
      b.text(m, x + 0.15, 3.45, mw - 0.3, 2.3, { size: 13, color: C.ink });
    });
  }
  if (d.service.duration) b.text(`Duração de referência: ${d.service.duration}`, 0.7, 6.1, 11.9, 0.4, { size: 14, bold: true, color: C.accent });

  // 11. Impactos
  dark("Impactos no negócio", `O que muda para ${client}`);
  cards(d.draft.impacts.slice(0, 4), 0.7, 2.15, 11.9, 3.5, 4, true);
  if (d.service.results.length) {
    b.text(`Indicadores que ${client} passará a acompanhar: ${d.service.results.slice(0, 5).join(" · ")}`, 0.7, 5.9, 11.9, 0.7, { size: 13, color: C.accent, bold: true });
  }

  // 12. Ferramentas
  light("Ferramentas e autonomia", `Ferramentas e IA que dão autonomia a ${client}`);
  if (d.service.ai) b.text(d.service.ai, 0.7, 2.1, 11.9, 0.9, { size: 15, color: C.muted });
  cards(
    d.tools.slice(0, 6).map((t) => ({ title: t.title, body: t.summary ?? "" })),
    0.7, d.service.ai ? 3.1 : 2.2, 11.9, d.service.ai ? 3.45 : 4.35, 3,
  );

  // 13. Por que a Liberato
  light("Por que a Liberato", `Por que ${client} deve escolher a Liberato Consulting`);
  cards(d.draft.whyLiberato.slice(0, 4).map((t, i) => ({ title: `${String(i + 1).padStart(2, "0")}`, body: t })), 0.7, 2.2, 11.9, 4.3, 2);

  // 14. Proposta comercial
  if (d.quote) {
    const q = d.quote;
    dark("Proposta comercial", `Investimento para ${client}`);
    b.rect(0.7, 2.1, 4.4, 4.4, C.accent, true);
    b.text("Investimento total", 0.95, 2.35, 3.9, 0.4, { size: 15, bold: true, color: C.white });
    b.text(formatMoney(q.total, q.currency), 0.95, 2.85, 3.9, 1.0, { size: 34, bold: true, color: C.white, display: true });
    const period = q.start && q.end ? `${new Date(q.start).toLocaleDateString("pt-BR")} a ${new Date(q.end).toLocaleDateString("pt-BR")}` : "";
    b.text(`${q.totalDays ? `${Math.round(q.totalDays)} dias de trabalho` : ""}${period ? `\n${period}` : ""}${q.discountPct ? `\nCondição especial: ${q.discountPct}% de desconto` : ""}`, 0.95, 4.1, 3.9, 1.6, { size: 14, color: C.white });
    b.text("Proposta válida por 30 dias", 0.95, 5.95, 3.9, 0.35, { size: 11, color: C.white });
    b.text("Fase", 5.5, 2.15, 4.6, 0.35, { size: 12, bold: true, color: C.accent });
    b.text("Dias", 10.0, 2.15, 0.9, 0.35, { size: 12, bold: true, color: C.accent, align: "right" });
    b.text("Valor", 11.0, 2.15, 1.7, 0.35, { size: 12, bold: true, color: C.accent, align: "right" });
    q.phases.slice(0, 6).forEach((p, i) => {
      const y = 2.6 + i * 0.62;
      b.rect(5.5, y, 7.2, 0.52, "243553", true);
      b.text(p.title, 5.7, y + 0.13, 4.3, 0.3, { size: 13, color: C.white });
      b.text(String(Math.round(p.days)), 10.0, y + 0.13, 0.9, 0.3, { size: 13, color: C.white, align: "right" });
      b.text(formatMoney(p.price, q.currency), 11.0, y + 0.13, 1.55, 0.3, { size: 13, color: C.white, align: "right" });
    });
  } else {
    dark("Proposta comercial", `Proposta comercial para ${client}`);
    b.rect(0.7, 2.4, 11.9, 3.4, "243553", true);
    b.text(`A proposta comercial detalhada será enviada a ${client} em seguida.`, 1.2, 2.9, 10.9, 1.2, { size: 28, bold: true, color: C.white, display: true });
    b.text(`Ela trará o investimento, o cronograma e as condições ajustadas ao escopo validado com ${client}, com foco no retorno sobre o investimento.`, 1.2, 4.3, 10.9, 1.2, { size: 16, color: "D5DAE3" });
  }

  // 15. Próximos passos e contato
  dark("Próximos passos", `Vamos começar, ${client}?`);
  numbered(d.draft.nextSteps.slice(0, 4), 0.7, 2.2, 6.6, 0.95, true);
  b.rect(7.9, 2.2, 4.8, 4.2, C.white, true);
  b.image(d.liberatoLogo, 8.2, 2.45, 2.4, 0.7);
  b.text(
    [d.identity.tradeName || "Liberato Consulting", d.identity.phone, d.identity.email, d.identity.website || "liberatoconsulting.com.br", d.identity.address]
      .filter(Boolean)
      .join("\n"),
    8.2, 3.35, 4.2, 2.9,
    { size: 13, color: C.ink },
  );
}

export async function exportDeck(d: DeckInput, format: "pptx" | "pdf") {
  const safe = d.clientName.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "cliente";
  const name = `Apresentacao-Liberato-${safe}.${format}`;
  const { board, save } = format === "pptx" ? await pptBoard() : await pdfBoard();
  drawDeck(board, d);
  await save(name);
}

/** Carrega uma imagem, converte para PNG e remove fundo liso (branco ou uniforme). */
export async function prepareImage(src: string, removeBackground: boolean): Promise<Img> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const max = 900;
        const r = Math.min(1, max / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const w = Math.max(1, Math.round((img.naturalWidth || 300) * r));
        const h = Math.max(1, Math.round((img.naturalHeight || 150) * r));
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        if (removeBackground) {
          const px = ctx.getImageData(0, 0, w, h);
          const a = px.data as unknown as number[];
          const at = (x: number, y: number) => (y * w + x) * 4;
          const corners: number[] = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
          const opaque = corners.every((i) => a[i + 3] > 240);
          const c0 = corners[0] as number; const r0 = a[c0] as number, g0 = a[c0 + 1] as number, b0 = a[c0 + 2] as number;
          const uniform = corners.every((i) => Math.abs(a[i] - r0) + Math.abs(a[i + 1] - g0) + Math.abs(a[i + 2] - b0) < 30);
          if (opaque && uniform) {
            for (let i = 0; i < a.length; i += 4) {
              const dist = Math.abs(a[i] - r0) + Math.abs(a[i + 1] - g0) + Math.abs(a[i + 2] - b0);
              if (dist < 36) a[i + 3] = 0;
              else if (dist < 70) a[i + 3] = Math.round(a[i + 3] * ((dist - 36) / 34));
            }
            ctx.putImageData(px, 0, 0);
          }
        }
        resolve({ data: cv.toDataURL("image/png"), w, h });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
