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
  consultant?: null | {
    name: string;
    headline: string;
    photo: Img;
    education: string;
    experience: string;
    clients: string;
    specialties: string[];
    segments: string[];
  };
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

/** Remove palavras repetidas em sequência ("vantagem vantagem"). */
function clean(str: string) {
  return str.replace(/(^|[^\p{L}])(\p{L}+)((?:\s+\2)+)(?=[^\p{L}]|$)/giu, "$1$2").trim();
}

/** Largura aproximada de cada caractere (em "em"), para medir a linha com mais precisão. */
function charEm(c: string, bold: boolean) {
  let e: number;
  if (c === " ") e = 0.27;
  else if ("iljI.,:;'!|".includes(c)) e = 0.26;
  else if ("frt()-–".includes(c)) e = 0.36;
  else if ("mwMW".includes(c)) e = 0.84;
  else if (/[A-ZÀ-Ý0-9]/.test(c)) e = 0.64;
  else e = 0.52;
  return bold ? e * 1.06 : e;
}
function textWidth(s: string, size: number, bold: boolean) {
  let em = 0;
  for (const c of s) em += charEm(c, bold);
  return (em * size) / 72;
}
/** Divide em linhas: só passa para a próxima quando a palavra realmente não cabe na atual. */
function splitLines(str: string, w: number, size: number, bold: boolean) {
  const max = w * 0.93; // folga para margens internas da caixa
  const out: string[] = [];
  for (const para of str.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? line + " " + word : word;
      if (!line || textWidth(next, size, bold) <= max) line = next;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}
/** Estima quebra de linhas para escolher um tamanho de fonte que caiba de verdade na caixa. */
function wrapLines(str: string, w: number, size: number, bold: boolean) {
  return splitLines(str, w, size, bold).reduce(
    (n, l) => n + Math.max(1, Math.ceil(textWidth(l, size, bold) / (w * 0.93))),
    0,
  );
}
/** Quebra o texto em linhas explícitas, para o PowerPoint não refazer a quebra (evita repetir palavras). */
function breakLines(str: string, w: number, size: number, bold: boolean) {
  return splitLines(str, w, size, bold).join("\n");
}
function fitSize(str: string, w: number, h: number, size: number, bold: boolean) {
  for (let s = size; s > 7; s -= 0.5) {
    if (wrapLines(str, w, s, bold) * ((s * 1.22) / 72) <= h) return s;
  }
  return 7;
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
      str = clean(str);
      const fs = fitSize(str, w, h, o.size, !!o.bold);
      slide.addText(breakLines(str, w, fs, !!o.bold), {
        x, y, w, h,
        lang: "pt-BR",
        fontSize: Math.floor(fs),
        bold: !!o.bold,
        color: o.color ?? C.ink,
        align: o.align ?? "left",
        valign: "top",
        margin: 0,
        fontFace: o.display ? "Space Grotesk" : "DM Sans",
        lineSpacingMultiple: 1.05,
      });
    },
    image(img, x, y, w, h) {
      if (!img) return;
      const f = fit(img, x, y, w, h);
      slide.addImage({ data: img.data, ...f });
    },
  };
  return {
    board,
    save: (name: string) => pptx.writeFile({ fileName: name }),
    base64: async () => String(await pptx.write({ outputType: "base64" })),
  };
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
      str = clean(str);
      let size = Math.floor(fitSize(str, w, h, o.size, !!o.bold));
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
  return {
    board,
    save: (name: string) => doc.save(name),
    base64: async () => doc.output("datauristring").split(",")[1] ?? "",
  };
}

// ---------- Slides ----------
function drawDeck(b: Board, d: DeckInput) {
  const client = d.clientName;
  const g = d.draft.clientGender === "m" ? "o" : "a";
  const A = `${g} ${client}`; // a Mark Up
  const Acap = `${g.toUpperCase()} ${client}`;
  const DE = `d${g} ${client}`; // da Mark Up
  const NA = `n${g} ${client}`; // na Mark Up
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
  /** Garantias padrão do trabalho: NDA e pesquisas documentadas com evidências. */
  function assurances(y: number) {
    const items = [
      "Confidencialidade: firmaremos um contrato de confidencialidade de informações (NDA).",
      "Rastreabilidade: todos os processos de pesquisa são documentados, com evidências de execução.",
    ];
    const gap = 0.25;
    const w = (11.9 - gap) / 2;
    items.forEach((t, i) => {
      const x = 0.7 + i * (w + gap);
      b.rect(x, y, w, 0.36, C.navy, true);
      b.rect(x, y, 0.08, 0.36, C.accent);
      b.text(t, x + 0.2, y + 0.07, w - 0.3, 0.26, { size: 10, bold: true, color: C.white });
    });
  }
  function footer(onDark: boolean) {
    b.image(onDark ? d.liberatoLogoLight ?? d.liberatoLogo : d.liberatoLogo, 0.7, 6.9, 1.4, 0.38);
    b.text(`Liberato Consulting · Proposta exclusiva para ${A}`, 3.5, 7.0, 6.3, 0.25, {
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
  b.text(d.draft.headline || `${d.service.title} para ${A}`, 0.9, 2.95, 11.2, 1.9, { size: 40, bold: true, color: C.white, display: true });
  b.text(`${d.service.title} · preparado para ${A}`, 0.9, 5.0, 11, 0.5, { size: 18, color: "D5DAE3" });
  b.text([d.sector, d.location, date].filter(Boolean).join("  ·  "), 0.9, 5.6, 11, 0.4, { size: 14, color: C.accent });

  // 2. Agenda
  light("Agenda", `O que vamos apresentar para ${A}`);
  numbered(
    [
      `O que entendemos sobre ${A}`,
      `O mercado de ${d.sector || "atuação"} e os desafios ${DE}`,
      "Quem é a Liberato Consulting e os resultados que entregamos",
      `${d.service.title}: a solução desenhada para ${A}`,
      `Impactos esperados no negócio ${DE}`,
      "Proposta comercial e próximos passos",
    ],
    0.9, 2.2, 11, 0.72,
  );

  // 3. Sobre o cliente
  light("Entendimento do negócio", `O que entendemos sobre ${A}`);
  b.text(d.draft.aboutClient, 0.7, 2.15, 6.2, 1.4, { size: 18, color: C.navy, bold: true });
  b.text(d.description, 0.7, 3.65, 6.2, 2.8, { size: 14, color: C.muted });
  const facts = [...d.offerings.slice(0, 3), ...d.highlights.slice(0, 3)].slice(0, 5);
  b.rect(7.4, 2.15, 5.3, 4.4, C.white, true);
  b.text(`${Acap} em destaque`, 7.7, 2.35, 4.8, 0.4, { size: 15, bold: true, color: C.accent });
  facts.forEach((f, i) => {
    b.rect(7.7, 2.98 + i * 0.7, 0.12, 0.12, C.accent);
    b.text(f, 8.0, 2.85 + i * 0.7, 4.5, 0.62, { size: 13, color: C.ink });
  });

  // 4. Setor e região
  light("Contexto de mercado", `${d.sector || "O setor"}${d.location ? ` em ${d.location}` : ""}: o momento ${DE}`);
  b.text(d.draft.sectorContext, 0.7, 2.1, 11.8, 0.9, { size: 16, color: C.muted });
  cards(d.draft.sectorTrends.slice(0, 4).map((t, i) => ({ title: `Oportunidade ${i + 1}`, body: t })), 0.7, 3.15, 11.9, 3.4, 2);

  // 5. Desafios
  light("Desafios", `Os desafios que ${A} pode transformar em vantagem competitiva`);
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

  // 6b. Consultor responsável
  const cons = d.consultant;
  if (cons) {
    light("Quem conduz o projeto", `${cons.name}: consultor responsável pelo projeto ${NA}`);
    b.rect(0.7, 2.15, 3.4, 4.4, C.white, true);
    if (cons.photo) b.image(cons.photo, 0.9, 2.35, 3.0, 2.9);
    b.text(cons.name, 0.9, 5.35, 3.0, 0.45, { size: 16, bold: true, color: C.navy, align: "center", display: true });
    b.text(cons.headline, 0.9, 5.8, 3.0, 0.65, { size: 11, color: C.muted, align: "center" });
    const blocks = [
      { t: "Formação acadêmica", v: cons.education },
      { t: "Áreas de atuação", v: [...cons.specialties, ...cons.segments].filter(Boolean).join(" · ") || cons.experience },
      { t: "Clientes atendidos", v: cons.clients },
    ].filter((x) => x.v && x.v.trim());
    const bh = blocks.length ? (4.4 - 0.2 * (blocks.length - 1)) / blocks.length : 0;
    blocks.forEach((bl, i) => {
      const y = 2.15 + i * (bh + 0.2);
      b.rect(4.4, y, 8.3, bh, C.white, true);
      b.rect(4.4, y + 0.2, 0.08, 0.45, C.accent);
      b.text(bl.t, 4.7, y + 0.18, 7.8, 0.4, { size: 14, bold: true, color: C.accent });
      b.text(bl.v, 4.7, y + 0.62, 7.8, bh - 0.75, { size: 12, color: C.ink });
    });
  }

  // 7. Resultados
  light("Resultados alcançados", "O que a Liberato entrega aos seus clientes");
  cards(d.institutional.impact.slice(0, 6), 0.7, 2.15, 11.9, 4.4, 3);

  // 8. Clientes
  const withLogos = d.institutional.clients.filter((c) => c.logo);
  if (withLogos.length > 0) {
    light("Casos de sucesso", "Empresas que já confiam na Liberato Consulting");
    withLogos.slice(0, 8).forEach((c, i) => {
      const x = 0.7 + (i % 4) * 3.0;
      const y = 2.3 + Math.floor(i / 4) * 2.0;
      b.rect(x, y, 2.75, 1.7, C.white, true);
      if (c.logo) b.image(c.logo, x + 0.3, y + 0.25, 2.15, 1.2);
    });
  }

  // 9. Serviço
  light("A solução", `${d.service.title} para ${A}`);
  b.text(d.service.lead, 0.7, 2.1, 6.6, 1.3, { size: 18, bold: true, color: C.navy });
  b.text(d.draft.approach, 0.7, 3.5, 6.6, 2.4, { size: 15, color: C.muted });
  b.rect(7.8, 2.1, 4.9, 4.5, C.navy, true);
  b.text("O que está incluído", 8.1, 2.3, 4.4, 0.4, { size: 15, bold: true, color: C.accent });
  d.service.bullets.slice(0, 6).forEach((it, i) => {
    b.rect(8.1, 2.98 + i * 0.6, 0.12, 0.12, C.accent);
    b.text(it, 8.4, 2.85 + i * 0.6, 4.1, 0.55, { size: 13, color: C.white });
  });

  // 10. Metodologia
  const plan = (d.draft.workPlan ?? []).filter((p) => p && p.stage).slice(0, 6);
  if (plan.length) {
    for (let start = 0; start < plan.length; start += 3) {
      const part = plan.slice(start, start + 3);
      const suffix = plan.length > 3 ? ` (${start / 3 + 1}/${Math.ceil(plan.length / 3)})` : "";
      light("Como vamos trabalhar", `A jornada ${DE} com a Liberato${suffix}`);
      const gap = 0.25;
      const cw = (11.9 - gap * 2) / 3;
      part.forEach((p, i) => {
        const x = 0.7 + i * (cw + gap);
        const n = start + i + 1;
        b.rect(x, 2.15, cw, 0.6, n % 2 ? C.accent : C.navy, true);
        b.text(`Etapa ${n} · ${p.stage}`, x + 0.15, 2.28, cw - 0.3, 0.38, { size: 13, bold: true, color: C.white });
        b.rect(x, 2.85, cw, 3.35, C.white, true);
        const rows = [
          { t: "Como faremos", v: p.how, h: 1.15 },
          { t: "Pesquisas e levantamentos", v: p.research, h: 0.95 },
          { t: "Quem participa", v: p.stakeholders, h: 0.85 },
        ];
        let yy = 2.97;
        rows.forEach((r) => {
          b.text(r.t.toUpperCase(), x + 0.2, yy, cw - 0.4, 0.25, { size: 9, bold: true, color: C.accent });
          b.text(r.v || "", x + 0.2, yy + 0.27, cw - 0.4, r.h - 0.3, { size: 11, color: C.ink });
          yy += r.h + 0.05;
        });
      });
      assurances(6.28);
      if (d.service.duration && start + 3 >= plan.length) b.text(`Duração de referência: ${d.service.duration}`, 0.7, 6.68, 11.9, 0.2, { size: 10, bold: true, color: C.accent });
    }
  } else {
    light("Como vamos trabalhar", `A jornada ${DE} com a Liberato`);
    const mods = d.service.modules.slice(0, 6);
    if (mods.length) {
      const gap = 0.2;
      const mw = (11.9 - gap * (mods.length - 1)) / mods.length;
      mods.forEach((m, i) => {
        const x = 0.7 + i * (mw + gap);
        b.rect(x, 2.4, mw, 0.7, i % 2 ? C.navy : C.accent, true);
        b.text(`Etapa ${i + 1}`, x, 2.6, mw, 0.35, { size: 14, bold: true, color: C.white, align: "center" });
        b.rect(x, 3.25, mw, 2.3, C.white, true);
        b.text(m, x + 0.15, 3.45, mw - 0.3, 2.0, { size: 13, color: C.ink });
      });
    }
    assurances(5.7);
    if (d.service.duration) b.text(`Duração de referência: ${d.service.duration}`, 0.7, 6.25, 11.9, 0.4, { size: 14, bold: true, color: C.accent });
  }

  // 11. Impactos
  dark("Impactos no negócio", `O que muda para ${A}`);
  cards(d.draft.impacts.slice(0, 4), 0.7, 2.15, 11.9, 3.5, 4, true);
  if (d.service.results.length) {
    b.text(`Indicadores que ${A} passará a acompanhar: ${d.service.results.slice(0, 5).join(" · ")}`, 0.7, 5.9, 11.9, 0.7, { size: 13, color: C.accent, bold: true });
  }

  // 12. Ferramentas
  light("Ferramentas e autonomia", `Ferramentas e IA que dão autonomia ${g === "a" ? "à" : "ao"} ${client}`);
  if (d.service.ai) b.text(d.service.ai, 0.7, 2.1, 11.9, 0.9, { size: 15, color: C.muted });
  cards(
    d.tools.slice(0, 6).map((t) => ({ title: t.title, body: t.summary ?? "" })),
    0.7, d.service.ai ? 3.1 : 2.2, 11.9, d.service.ai ? 3.45 : 4.35, 3,
  );

  // 13. Por que a Liberato
  light("Por que a Liberato", `Por que ${A} deve escolher a Liberato Consulting`);
  cards(d.draft.whyLiberato.slice(0, 4).map((t, i) => ({ title: `${String(i + 1).padStart(2, "0")}`, body: t })), 0.7, 2.2, 11.9, 4.3, 2);

  // 14. Proposta comercial
  if (d.quote) {
    const q = d.quote;
    dark("Proposta comercial", `Investimento para ${A}`);
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
    dark("Proposta comercial", `Proposta comercial para ${A}`);
    b.rect(0.7, 2.4, 11.9, 3.4, "243553", true);
    b.text(`A proposta comercial detalhada será enviada para ${A} em seguida.`, 1.2, 2.9, 10.9, 1.2, { size: 28, bold: true, color: C.white, display: true });
    b.text(`Ela trará o investimento, o cronograma e as condições ajustadas ao escopo validado com ${A}, com foco no retorno sobre o investimento.`, 1.2, 4.3, 10.9, 1.2, { size: 16, color: "D5DAE3" });
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

/** Gera PowerPoint e PDF de uma vez, devolvendo os dois em base64. */
export async function buildDeckFiles(d: DeckInput): Promise<{ pptx: string; pdf: string }> {
  const ppt = await pptBoard();
  drawDeck(ppt.board, d);
  const pdf = await pdfBoard();
  drawDeck(pdf.board, d);
  return { pptx: await ppt.base64(), pdf: await pdf.base64() };
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
          const opaque = corners.every((i) => (a[i + 3] ?? 0) > 240);
          const c0 = corners[0] as number; const r0 = (a[c0] ?? 0) as number, g0 = (a[c0 + 1] ?? 0) as number, b0 = (a[c0 + 2] ?? 0) as number;
          const uniform = corners.every((i) => Math.abs((a[i] ?? 0) - r0) + Math.abs((a[i + 1] ?? 0) - g0) + Math.abs((a[i + 2] ?? 0) - b0) < 30);
          if (opaque && uniform) {
            for (let i = 0; i < a.length; i += 4) {
              const dist = Math.abs((a[i] ?? 0) - r0) + Math.abs((a[i + 1] ?? 0) - g0) + Math.abs((a[i + 2] ?? 0) - b0);
              if (dist < 36) a[i + 3] = 0;
              else if (dist < 70) a[i + 3] = Math.round((a[i + 3] ?? 0) * ((dist - 36) / 34));
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
