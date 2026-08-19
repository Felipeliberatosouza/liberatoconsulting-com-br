/**
 * Composição, no navegador, da arte de redes sociais: a mesma imagem base
 * recebe o título (em forma de pergunta) e os bullets, em cada formato ideal.
 */

export type SocialFormatKey = "whatsapp" | "instagram" | "linkedin";

export const SOCIAL_IMAGE_FORMATS: Record<
  SocialFormatKey,
  { label: string; width: number; height: number; mime: "image/jpeg" | "image/png"; ext: string }
> = {
  whatsapp: { label: "WhatsApp", width: 1080, height: 1080, mime: "image/jpeg", ext: "jpg" },
  instagram: { label: "Instagram", width: 1080, height: 1350, mime: "image/jpeg", ext: "jpg" },
  linkedin: { label: "LinkedIn", width: 1200, height: 627, mime: "image/png", ext: "png" },
};

function loadImage(src: string, anonymous = true) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (anonymous && !src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Alguns servidores não enviam cabeçalhos CORS: tenta de novo sem anonymous.
      if (anonymous && !src.startsWith("data:")) loadImage(src, false).then(resolve, reject);
      else reject(new Error("Não foi possível carregar a imagem base."));
    };
    img.src = src;
  });
}

/** Média de luminância da área onde o texto será escrito (0 = escuro, 1 = claro). */
function areaLuminance(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Imagens de outra origem podem "contaminar" o canvas; nesse caso o navegador
  // lança SecurityError. Retornamos um valor neutro em vez de quebrar a arte.
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h)).data;
  } catch {
    return 0.5;
  }
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4 * 16) {
    sum += (0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255;
    n++;
  }
  return n ? sum / n : 0.5;
}

/**
 * Nomes que nunca podem ser quebrados entre duas linhas: o nome da consultoria
 * fica sempre junto, na mesma linha, em qualquer idioma.
 */
const KEEP_TOGETHER = [
  "Liberato Consulting",
  "Liberato Global",
  "利伯拉托咨询",
  "Consultoría Liberato",
];

/** Une o nome da consultoria com espaço inquebrável antes da quebra de linhas. */
function protectNames(text: string) {
  let out = text;
  for (const name of KEEP_TOGETHER) {
    const re = new RegExp(
      name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"),
      "gi",
    );
    out = out.replace(re, (m) => m.replace(/\s+/g, "\u00a0"));
  }
  return out;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = protectNames(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  const push = () => {
    if (line) lines.push(line);
    line = "";
  };
  for (const w of words) {
    // palavras muito longas (ex.: endereços) são quebradas por caractere
    // para nunca invadirem a área da logomarca.
    if (ctx.measureText(w).width > maxWidth) {
      push();
      let chunk = "";
      for (const ch of w) {
        if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
      continue;
    }
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  push();
  // devolve espaços normais para o desenho no canvas
  return lines.map((l) => l.replace(/\u00a0/g, " "));
}

/**
 * Desenha a logomarca (PNG sem fundo) no canto superior direito, em tamanho
 * reduzido, para que nunca seja cortada pelos recortes de cada rede.
 * Escolhe a versão clara ou escura conforme o brilho da área, garantindo leitura.
 */
async function drawLogo(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoSrc?: string,
) {
  const pad = Math.round(width * 0.045);
  // 40% menor do que o tamanho anterior (aplicado duas vezes: 0.6 * 0.6)
  const logoW = Math.round(width * (width > height ? 0.2 : 0.26) * 0.36);
  const probeH = Math.round(height * 0.12);
  const dark =
    areaLuminance(ctx, Math.max(0, width - logoW - pad * 2), 0, logoW + pad * 2, probeH) < 0.55;
  try {
    const logo = await loadImage(logoSrc || (dark ? "/logo-light.png" : "/logo.png"));
    const logoH = Math.round((logo.height / logo.width) * logoW);
    ctx.save();
    ctx.shadowColor = dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.75)";
    ctx.shadowBlur = Math.round(width * 0.02);
    ctx.globalAlpha = 0.98;
    ctx.drawImage(logo, width - logoW - pad, pad, logoW, logoH);
    ctx.restore();
  } catch {
    /* sem logomarca disponível */
  }
}

/** Arte de propaganda: 4 bullets (PT, EN, ZH, ES), logomarca do painel e rodapé de contato. */
export async function composeAdImage(opts: {
  baseImage: string;
  format: SocialFormatKey;
  lines: string[];
  logoUrl?: string;
  footer: string;
}): Promise<string> {
  const f = SOCIAL_IMAGE_FORMATS[opts.format];
  const img = await loadImage(opts.baseImage);
  const canvas = document.createElement("canvas");
  canvas.width = f.width;
  canvas.height = f.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");

  const scale = Math.max(f.width / img.width, f.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (f.width - dw) / 2, (f.height - dh) / 2, dw, dh);

  const light = areaLuminance(ctx, 0, 0, f.width, f.height) > 0.55;
  const fg = light ? "#0b0b0b" : "#ffffff";
  const base = light ? "255,255,255" : "0,0,0";
  const veil = ctx.createLinearGradient(0, 0, 0, f.height);
  veil.addColorStop(0, `rgba(${base},0.72)`);
  veil.addColorStop(0.55, `rgba(${base},0.55)`);
  veil.addColorStop(1, `rgba(${base},0.82)`);
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, f.width, f.height);

  const pad = Math.round(f.width * 0.07);
  const maxWidth = f.width - pad * 2;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  const lines = opts.lines.filter((l) => l.trim()).slice(0, 4);
  const size = Math.round(f.width * (opts.format === "linkedin" ? 0.042 : 0.05));
  const blockGap = Math.round(size * 0.85);

  // altura total para centralizar verticalmente o bloco de frases
  ctx.font = `700 ${size}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
  const wrapped = lines.map((l) => wrap(ctx, l.trim(), maxWidth - Math.round(size * 1.1)));
  const totalH =
    wrapped.reduce((acc, ls) => acc + ls.length * size * 1.18, 0) + blockGap * (lines.length - 1);
  let y = Math.max(
    Math.round(f.height * 0.22),
    Math.round((f.height - totalH) / 2 - f.height * 0.04),
  );

  for (const ls of wrapped) {
    ctx.fillStyle = "#d1622a";
    const dot = Math.max(6, Math.round(size * 0.18));
    ctx.beginPath();
    ctx.arc(pad + dot, y + size * 0.55, dot, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fg;
    for (const line of ls) {
      ctx.fillText(line, pad + Math.round(size * 1.1), y);
      y += size * 1.18;
    }
    y += blockGap;
  }

  const footSize = Math.round(f.width * (opts.format === "linkedin" ? 0.022 : 0.026));
  ctx.font = `600 ${footSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = fg;
  const footLines = wrap(ctx, opts.footer, maxWidth);
  let fy = f.height - pad - footLines.length * footSize * 1.3;
  for (const line of footLines) {
    ctx.fillText(line, pad, fy);
    fy += footSize * 1.3;
  }

  await drawLogo(ctx, f.width, f.height, opts.logoUrl);
  return canvas.toDataURL(f.mime, 0.92);
}

/** Aplica somente a logomarca sobre uma imagem existente (ex.: cabeçalho do texto). */
export async function stampLogo(baseImage: string): Promise<string> {
  const img = await loadImage(baseImage);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return baseImage;
  ctx.drawImage(img, 0, 0);
  await drawLogo(ctx, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export async function composeSocialImage(
  baseImage: string,
  format: SocialFormatKey,
  headline: string,
  bullets: string[],
): Promise<string> {
  const f = SOCIAL_IMAGE_FORMATS[format];
  const img = await loadImage(baseImage);
  const canvas = document.createElement("canvas");
  canvas.width = f.width;
  canvas.height = f.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");

  // desenha a imagem cobrindo todo o quadro (cover)
  const scale = Math.max(f.width / img.width, f.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (f.width - dw) / 2, (f.height - dh) / 2, dw, dh);

  const pad = Math.round(f.width * 0.07);
  const maxWidth = f.width - pad * 2;
  const light = areaLuminance(ctx, 0, 0, f.width, f.height) > 0.55;
  const fg = light ? "#0b0b0b" : "#ffffff";

  // véu para garantir contraste
  const veil = ctx.createLinearGradient(0, 0, 0, f.height);
  const base = light ? "255,255,255" : "0,0,0";
  veil.addColorStop(0, `rgba(${base},0.72)`);
  veil.addColorStop(0.65, `rgba(${base},0.45)`);
  veil.addColorStop(1, `rgba(${base},0.7)`);
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, f.width, f.height);

  const titleSize = Math.round(f.width * (format === "linkedin" ? 0.062 : 0.072));
  ctx.fillStyle = fg;
  ctx.textBaseline = "top";
  ctx.font = `700 ${titleSize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
  // reserva o canto superior direito para a logomarca
  const titleLines = wrap(ctx, headline.trim(), Math.round(maxWidth * 0.8));
  let y = pad;
  for (const line of titleLines) {
    ctx.fillText(line, pad, y);
    y += titleSize * 1.15;
  }

  // filete de destaque
  y += titleSize * 0.25;
  ctx.fillStyle = "#d1622a";
  ctx.fillRect(pad, y, Math.round(f.width * 0.18), Math.max(4, Math.round(f.width * 0.008)));
  y += titleSize * 0.7;

  const bulletSize = Math.round(f.width * (format === "linkedin" ? 0.034 : 0.04));
  ctx.font = `500 ${bulletSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = fg;
  for (const b of bullets.slice(0, 5)) {
    const lines = wrap(ctx, `•  ${b.trim()}`, maxWidth);
    for (const line of lines) {
      if (y > f.height - pad - bulletSize) break;
      ctx.fillText(line, pad, y);
      y += bulletSize * 1.3;
    }
    y += bulletSize * 0.4;
  }

  await drawLogo(ctx, f.width, f.height);

  return canvas.toDataURL(f.mime, 0.92);
}

/** Converte data URL em Blob (evita navegar para URLs gigantes no celular). */
function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/is.exec(dataUrl);
  if (!match) throw new Error("Imagem inválida.");
  const mime = match[1] || "image/jpeg";
  const payload = match[3] ?? "";
  if (match[2]) {
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(payload)], { type: mime });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  // Em navegadores móveis, um href com data URL muito grande abre uma aba em
  // branco/quebrada. Usar Blob + objectURL mantém o download estável.
  let url = dataUrl;
  let revoke = false;
  try {
    if (dataUrl.startsWith("data:")) {
      url = URL.createObjectURL(dataUrlToBlob(dataUrl));
      revoke = true;
    }
  } catch {
    url = dataUrl;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type IndicatorArtRow = {
  slug?: string;
  label: string;
  value: string;
  unit: string;
  reference_period: string;
  previous_value: string;
  previous_period: string;
  forecast_value?: string;
  forecast_period?: string;
};

/** Chamada exibida na arte no lugar das fontes de informação. */
export const SOCIAL_SOURCES_CTA =
  "Acesse liberatoconsulting.com.br para mais detalhes e para ter as fontes de informação.";

/**
 * Arte com os indicadores do Boletim Semanal sobre uma imagem de fundo com o
 * tema de dados econômicos do Brasil. A cor do texto acompanha o brilho da
 * imagem: fonte escura em fundo claro e fonte clara em fundo escuro.
 */
export async function composeIndicatorsImage(
  baseImage: string,
  format: SocialFormatKey,
  title: string,
  subtitle: string,
  rows: IndicatorArtRow[],
): Promise<string> {
  const { compareIndicator, resolvePolarity } = await import("./indicator-compare");
  const f = SOCIAL_IMAGE_FORMATS[format];
  const img = await loadImage(baseImage);
  const canvas = document.createElement("canvas");
  canvas.width = f.width;
  canvas.height = f.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");

  const scale = Math.max(f.width / img.width, f.height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (f.width - dw) / 2, (f.height - dh) / 2, dw, dh);

  const light = areaLuminance(ctx, 0, 0, f.width, f.height) > 0.55;
  const fg = light ? "#0b0b0b" : "#ffffff";
  const muted = light ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.72)";
  const base = light ? "255,255,255" : "0,0,0";
  const veil = ctx.createLinearGradient(0, 0, 0, f.height);
  veil.addColorStop(0, `rgba(${base},0.78)`);
  veil.addColorStop(0.5, `rgba(${base},0.6)`);
  veil.addColorStop(1, `rgba(${base},0.8)`);
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, f.width, f.height);

  const pad = Math.round(f.width * 0.07);
  const maxWidth = f.width - pad * 2;
  ctx.textBaseline = "top";

  const titleSize = Math.round(f.width * (format === "linkedin" ? 0.055 : 0.065));
  ctx.fillStyle = fg;
  ctx.font = `700 ${titleSize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
  let y = pad;
  for (const line of wrap(ctx, title.trim(), Math.round(maxWidth * 0.78))) {
    ctx.fillText(line, pad, y);
    y += titleSize * 1.14;
  }

  const subSize = Math.round(f.width * 0.028);
  ctx.font = `500 ${subSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = muted;
  ctx.fillText(subtitle.trim(), pad, y);
  y += subSize * 1.8;

  ctx.fillStyle = "#d1622a";
  ctx.fillRect(pad, y, Math.round(f.width * 0.18), Math.max(4, Math.round(f.width * 0.007)));
  y += Math.round(f.width * 0.035);

  const list = rows.slice(0, format === "linkedin" ? 4 : 6);
  const labelSize = Math.round(f.width * (format === "linkedin" ? 0.028 : 0.032));
  const valueSize = Math.round(labelSize * 1.25);
  const smallSize = Math.round(labelSize * 0.78);
  const rowGap = Math.round(labelSize * 2.7);
  const colGap = Math.round(f.width * 0.03);

  /** Reduz o texto até caber na largura disponível, com reticências. */
  const fit = (text: string, max: number) => {
    if (ctx.measureText(text).width <= max) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
    return `${t.trim()}…`;
  };

  for (const r of list) {
    if (y > f.height - pad * 2.4 - rowGap) break;
    const delta = compareIndicator(
      r.value,
      r.previous_value,
      r.unit,
      "pt-BR",
      resolvePolarity(r.polarity, r.slug, r.label),
    );

    // Primeiro medimos a coluna da direita para reservar o espaço dela.
    const valueText = `${r.value}${r.unit}`;
    ctx.font = `700 ${valueSize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
    let rightW = ctx.measureText(valueText).width;
    const deltaText = delta.direction !== "none" ? `${delta.arrow} ${delta.label}` : "";
    if (deltaText) {
      ctx.font = `700 ${smallSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      rightW = Math.max(rightW, ctx.measureText(deltaText).width);
    }
    rightW = Math.min(rightW, maxWidth * 0.45);
    const leftW = maxWidth - rightW - colGap;

    ctx.font = `600 ${labelSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = fg;
    ctx.textAlign = "left";
    ctx.fillText(fit(r.label, leftW), pad, y);

    ctx.font = `500 ${smallSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = muted;
    const prev = r.previous_value
      ? `anterior: ${r.previous_value}${r.unit}${
          r.previous_period ? ` (${r.previous_period})` : ""
        }`
      : r.reference_period;
    const forecast = r.forecast_value
      ? ` · tendência: ${r.forecast_value}${r.unit}${
          r.forecast_period ? ` (${r.forecast_period})` : ""
        }`
      : "";
    ctx.fillText(fit(`${prev}${forecast}`, leftW), pad, y + labelSize * 1.2);

    ctx.textAlign = "right";
    ctx.font = `700 ${valueSize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = fg;
    ctx.fillText(valueText, f.width - pad, y, rightW);

    if (deltaText) {
      ctx.font = `700 ${smallSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle =
        delta.direction === "up" ? "#22c55e" : delta.direction === "down" ? "#ef4444" : muted;
      ctx.fillText(deltaText, f.width - pad, y + labelSize * 1.2, rightW);
    }
    ctx.textAlign = "left";

    y += rowGap;
    ctx.fillStyle = light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)";
    ctx.fillRect(pad, y - Math.round(labelSize * 0.8), maxWidth, 1);
  }

  // Sem fontes na arte: apenas a chamada para o site.
  const ctaSize = Math.round(f.width * (format === "linkedin" ? 0.022 : 0.026));
  ctx.font = `600 ${ctaSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = fg;
  const ctaLines = wrap(ctx, SOCIAL_SOURCES_CTA, maxWidth);
  let ctaY = f.height - pad - ctaLines.length * ctaSize * 1.25;
  for (const line of ctaLines) {
    ctx.fillText(line, pad, ctaY);
    ctaY += ctaSize * 1.25;
  }

  await drawLogo(ctx, f.width, f.height);
  return canvas.toDataURL(f.mime, 0.92);
}

/* ------------------------------------------------------------------ */
/*  Layouts de propaganda inspirados nas referências de mercado         */
/* ------------------------------------------------------------------ */

const AD_BG = "#efedE8";
const AD_INK = "#14181c";
const AD_ACCENT = "#d1622a";
const AD_MUTED = "rgba(20,24,28,0.62)";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Desenha a imagem cobrindo (cover) um retângulo arredondado. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 0,
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** Traço decorativo curvo, discreto, no alto da arte. */
function drawArc(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(209,98,42,0.45)";
  ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
  ctx.beginPath();
  ctx.moveTo(w * 0.12, -h * 0.02);
  ctx.bezierCurveTo(w * 0.35, h * 0.22, w * 0.72, h * 0.2, w * 1.02, h * 0.02);
  ctx.stroke();
  ctx.restore();
}

/** Duplo chevron da marca (▶▶). */
function drawChevrons(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.fillStyle = AD_ACCENT;
  for (let i = 0; i < 2; i++) {
    const ox = x + i * size * 0.72;
    ctx.beginPath();
    ctx.moveTo(ox, y);
    ctx.lineTo(ox + size * 0.62, y + size * 0.5);
    ctx.lineTo(ox, y + size);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Título em duas cores: primeira linha em tinta escura, demais em destaque. */
function drawTwoToneTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
) {
  ctx.font = `600 ${size}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  const lines = wrap(ctx, text.trim(), maxWidth);
  let cy = y;
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? AD_INK : AD_ACCENT;
    ctx.fillText(line, x, cy);
    cy += size * 1.08;
  });
  return cy;
}

/** Mockup do celular com a página da Liberato Consulting no LinkedIn. */
function drawLinkedInPhone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  shot: HTMLImageElement | null,
) {
  const r = w * 0.13;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = w * 0.18;
  ctx.shadowOffsetY = w * 0.06;
  ctx.fillStyle = "#0d1117";
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  const b = w * 0.032;
  const sx = x + b;
  const sy = y + b;
  const sw = w - b * 2;
  const sh = h - b * 2;
  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, r - b);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(sx, sy, sw, sh);

  if (shot) {
    const scale = sw / shot.width;
    ctx.drawImage(shot, sx, sy, sw, shot.height * scale);
  } else {
    // Reconstituição sóbria da página da empresa no LinkedIn.
    const cover = sh * 0.16;
    ctx.fillStyle = "#0a66c2";
    ctx.fillRect(sx, sy, sw, cover);
    const av = sw * 0.24;
    const ax = sx + sw * 0.08;
    const ay = sy + cover - av * 0.45;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, ax - sw * 0.012, ay - sw * 0.012, av + sw * 0.024, av + sw * 0.024, sw * 0.03);
    ctx.fill();
    ctx.fillStyle = "#0a66c2";
    roundRect(ctx, ax, ay, av, av, sw * 0.025);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(av * 0.55)}px "DM Sans", Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("in", ax + av / 2, ay + av * 0.55);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let ty = ay + av + sh * 0.035;
    ctx.fillStyle = AD_INK;
    ctx.font = `700 ${Math.round(sw * 0.085)}px "Space Grotesk", Arial, sans-serif`;
    ctx.fillText("Liberato Consulting", ax, ty);
    ty += sw * 0.11;
    ctx.fillStyle = AD_MUTED;
    ctx.font = `500 ${Math.round(sw * 0.05)}px "DM Sans", Arial, sans-serif`;
    ctx.fillText("Consultoria em gestão empresarial", ax, ty);
    ty += sw * 0.075;
    ctx.fillText("linkedin.com/company/liberatoglobal", ax, ty);
    ty += sw * 0.11;

    const bw = sw * 0.36;
    const bh = sw * 0.13;
    ctx.fillStyle = "#0a66c2";
    roundRect(ctx, ax, ty, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${Math.round(sw * 0.055)}px "DM Sans", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+ Seguir", ax + bw / 2, ty + bh / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ty += bh + sh * 0.045;

    ctx.fillStyle = "rgba(20,24,28,0.10)";
    for (let i = 0; i < 6 && ty < sy + sh - sh * 0.05; i++) {
      const lw = sw * (i % 3 === 2 ? 0.5 : 0.84);
      roundRect(ctx, ax, ty, lw, sw * 0.035, sw * 0.02);
      ctx.fill();
      ctx.fillStyle = "rgba(20,24,28,0.10)";
      ty += sw * 0.075;
    }
  }
  ctx.restore();

  // entalhe superior
  ctx.fillStyle = "#0d1117";
  const nw = w * 0.34;
  roundRect(ctx, x + (w - nw) / 2, y + b * 0.6, nw, w * 0.075, w * 0.04);
  ctx.fill();
}

/** Medidas do rodapé: permite reservar o espaço antes de desenhar qualquer outro elemento. */
function footerLayout(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  footer: string,
  maxWidth: number,
) {
  const size = Math.round(w * (w > h ? 0.021 : 0.025));
  ctx.font = `600 ${size}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  const lines = wrap(ctx, footer, maxWidth);
  return { size, lines, height: Math.ceil(lines.length * size * 1.3) };
}

function adFooter(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  footer: string,
  maxWidth?: number,
) {
  const mw = maxWidth ?? w - pad * 2;
  const { size, lines, height } = footerLayout(ctx, w, h, footer, mw);
  let y = h - pad - height;

  // Placa de legibilidade: o texto pode ficar sobre uma imagem, mas nunca ilegível.
  const plateW = Math.min(mw, Math.max(...lines.map((l) => ctx.measureText(l).width))) + size * 0.8;
  ctx.save();
  ctx.fillStyle = "rgba(247,245,242,0.86)";
  roundRect(ctx, pad - size * 0.4, y - size * 0.35, plateW, height + size * 0.6, size * 0.35);
  ctx.fill();
  ctx.restore();

  ctx.font = `600 ${size}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillStyle = AD_MUTED;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const line of lines) {
    ctx.fillText(line, pad, y);
    y += size * 1.3;
  }
  return y;
}

/**
 * Logomarca do painel administrativo posicionada no canto inferior direito,
 * em uma faixa exclusiva: o rodapé e os blocos de texto respeitam esse espaço,
 * de modo que a marca nunca fique sobreposta a textos ou imagens.
 */
async function drawAdLogo(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pad: number,
  box: { w: number; h: number },
  logoSrc?: string,
) {
  try {
    const logo = await loadImage(logoSrc || "/logo.png");
    const lw = box.w;
    const lh = Math.round((logo.height / logo.width) * lw);
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.drawImage(logo, w - pad - lw, h - pad - lh, lw, lh);
    ctx.restore();
  } catch {
    /* sem logomarca disponível */
  }
}

/** Linha da tabela de indicadores usada na peça de propaganda. */
export type AdIndicatorRow = {
  slug?: string;
  polarity?: string | null;
  label: string;
  value: string;
  unit: string;
  previous_value: string;
};

/**
 * Arte de propaganda com três layouts editoriais:
 * - "seguidor": convite para seguir a página no LinkedIn, com mockup de celular;
 * - "card": cartão de conteúdo com número, título em duas cores, texto e foto;
 * - "indicadores": tabela em colunas com valor atual, anterior e variação.
 */
export async function composeAdArt(opts: {
  variant: "seguidor" | "card" | "indicadores";
  format: SocialFormatKey;
  lines: string[];
  baseImage?: string;
  logoUrl?: string;
  footer: string;
  index?: number;
  indicators?: AdIndicatorRow[];
  date?: string;
}): Promise<string> {
  const f = SOCIAL_IMAGE_FORMATS[opts.format];
  const canvas = document.createElement("canvas");
  canvas.width = f.width;
  canvas.height = f.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");
  const W = f.width;
  const H = f.height;
  const wide = W > H;
  const pad = Math.round(W * 0.06);

  ctx.fillStyle = AD_BG;
  ctx.fillRect(0, 0, W, H);
  drawArc(ctx, W, H);

  const texts = opts.lines.map((l) => l.trim()).filter(Boolean);
  const headline = texts[0] ?? "";
  const others = texts.slice(1);

  let photo: HTMLImageElement | null = null;
  if (opts.baseImage) {
    try {
      photo = await loadImage(opts.baseImage);
    } catch {
      photo = null;
    }
  }

  // Quanto menos idiomas, mais generoso o espaço de cada bloco.
  const count = Math.max(1, others.length);
  const density = count >= 3 ? 1 : count === 2 ? 1.12 : 1.28;

  /** Reduz o corpo do título até caber na caixa reservada (evita invadir a foto). */
  function fitTitle(text: string, maxW: number, maxH: number, start: number) {
    let size = start;
    for (let i = 0; i < 18; i++) {
      ctx!.font = `600 ${size}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
      const ls = wrap(ctx!, text.trim(), maxW);
      if (ls.length * size * 1.08 <= maxH || size <= start * 0.5) return size;
      size = Math.round(size * 0.93);
    }
    return size;
  }

  /** Escreve os textos dentro de uma coluna, reduzindo o corpo até caber. */
  function drawBlocks(
    items: string[],
    x: number,
    y: number,
    w: number,
    maxY: number,
    start: number,
  ) {
    let size = start;
    for (let i = 0; i < 20; i++) {
      ctx!.font = `500 ${size}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      const h = items.reduce(
        (acc, t) => acc + wrap(ctx!, t, w).length * size * 1.34 + size * 0.55,
        0,
      );
      if (y + h <= maxY || size <= start * 0.55) break;
      size = Math.round(size * 0.94);
    }
    ctx!.font = `500 ${size}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx!.textBaseline = "top";
    ctx!.textAlign = "left";
    let cy = y;
    for (const t of items) {
      ctx!.fillStyle = AD_INK;
      for (const line of wrap(ctx!, t, w)) {
        if (cy > maxY) break;
        ctx!.fillText(line, x, cy);
        cy += size * 1.34;
      }
      cy += size * 0.55;
    }
    return { y: cy, size };
  }

  // Faixa exclusiva da logomarca (canto inferior direito).
  const logoW = Math.round(W * (wide ? 0.14 : 0.2));
  let logoH = Math.round(logoW * 0.28);
  try {
    const probe = await loadImage(opts.logoUrl || "/logo.png");
    logoH = Math.round((probe.height / probe.width) * logoW);
  } catch {
    /* usa a proporção padrão */
  }
  // O rodapé é medido antes do layout: nenhum bloco de texto ou foto invade sua faixa.
  const footerMaxW = W - pad * 2 - logoW - pad * 0.6;
  const footerH = footerLayout(ctx, W, H, opts.footer, footerMaxW).height;
  const footerTop =
    H - Math.max(pad * (wide ? 2.1 : 2.4), pad + logoH + pad * 0.6, pad + footerH + pad * 0.7);

  if (opts.variant === "seguidor") {
    const chev = Math.round(W * (wide ? 0.042 : 0.05));

    if (wide) {
      // Celular à esquerda, coluna de texto à direita — colunas independentes.
      const phoneH = Math.min(H * 0.78, footerTop - pad * 0.8);
      const phoneW = phoneH * 0.49;
      const phoneX = pad;
      const phoneY = Math.max(pad * 0.8, (footerTop - phoneH) / 2);
      drawLinkedInPhone(ctx, phoneX, phoneY, phoneW, phoneH, null);

      const colX = phoneX + phoneW + pad;
      const colW = W - colX - pad;
      let y = Math.round(H * 0.09);
      drawChevrons(ctx, colX, y, chev);
      y += chev * 1.6;

      const titleSize = fitTitle(headline, colW, H * 0.3 * density, Math.round(W * 0.05));
      y = drawTwoToneTitle(ctx, headline, colX, y, colW, titleSize) + titleSize * 0.5;

      ctx.fillStyle = AD_ACCENT;
      ctx.font = `700 ${Math.round(W * 0.038)}px Georgia, serif`;
      ctx.textBaseline = "top";
      ctx.fillText("“", colX, y);
      y += W * 0.032;

      const res = drawBlocks(others, colX, y, colW, footerTop - H * 0.06, Math.round(W * 0.022));
      ctx.fillStyle = AD_ACCENT;
      ctx.fillRect(colX, res.y, Math.round(W * 0.08), Math.max(3, Math.round(W * 0.004)));
      ctx.fillStyle = AD_MUTED;
      ctx.font = `600 ${Math.round(res.size * 0.86)}px "DM Sans", Arial, sans-serif`;
      ctx.fillText("linkedin.com/company/liberatoglobal", colX, res.y + res.size * 0.9);
    } else {
      // Título no topo, ocupando toda a largura; abaixo, celular e textos lado a lado.
      let y = Math.round(H * 0.09);
      drawChevrons(ctx, pad, y, chev);
      y += chev * 1.7;

      const titleSize = fitTitle(headline, W - pad * 2, H * 0.2 * density, Math.round(W * 0.068));
      y = drawTwoToneTitle(ctx, headline, pad, y, W - pad * 2, titleSize) + titleSize * 0.6;

      const blockTop = y;
      const blockBottom = footerTop - H * 0.02;
      const phoneH = Math.min((blockBottom - blockTop) * 0.94, H * 0.44);
      const phoneW = phoneH * 0.49;
      drawLinkedInPhone(ctx, pad, blockTop, phoneW, phoneH, null);

      const qx = pad + phoneW + pad * 0.9;
      const qw = W - qx - pad;
      let qy = blockTop;
      ctx.fillStyle = AD_ACCENT;
      ctx.font = `700 ${Math.round(W * 0.045)}px Georgia, serif`;
      ctx.textBaseline = "top";
      ctx.fillText("“", qx, qy);
      qy += W * 0.038;

      const res = drawBlocks(others, qx, qy, qw, blockBottom - H * 0.045, Math.round(W * 0.027));
      ctx.fillStyle = AD_ACCENT;
      ctx.fillRect(qx, res.y, Math.round(W * 0.1), Math.max(3, Math.round(W * 0.005)));
      ctx.fillStyle = AD_MUTED;
      ctx.font = `600 ${Math.round(res.size * 0.82)}px "DM Sans", Arial, sans-serif`;
      ctx.fillText("linkedin.com/company/liberatoglobal", qx, res.y + res.size * 0.85);
    }
  } else if (opts.variant === "indicadores") {
    // Tabela em colunas, no mesmo padrão do Boletim Semanal.
    const { compareIndicator, resolvePolarity } = await import("./indicator-compare");
    const rows = opts.indicators ?? [];
    const colW = W - pad * 2;

    let y = Math.round(H * (wide ? 0.07 : 0.08));
    const titleSize = fitTitle(
      headline,
      colW,
      H * (wide ? 0.13 : 0.18),
      Math.round(W * (wide ? 0.042 : 0.062)),
    );
    y = drawTwoToneTitle(ctx, headline, pad, y, colW, titleSize) + titleSize * 0.3;

    if (opts.date) {
      const dSize = Math.round(W * (wide ? 0.017 : 0.026));
      ctx.font = `600 ${dSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = AD_MUTED;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(opts.date, pad, y);
      y += dSize * (wide ? 1.5 : 2);
    }

    // Colunas: rótulo | atual | anterior | variação
    const cValue = pad + colW * 0.5;
    const cPrev = pad + colW * 0.7;
    const cDelta = pad + colW;
    const headSize = Math.round(W * (wide ? 0.017 : 0.022));
    ctx.font = `700 ${headSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = AD_MUTED;
    ctx.textAlign = "left";
    ctx.fillText("Indicador", pad, y);
    ctx.textAlign = "right";
    ctx.fillText("Atual", cValue, y);
    ctx.fillText("Anterior", cPrev, y);
    ctx.fillText("Variação", cDelta, y);
    ctx.textAlign = "left";
    y += headSize * 1.5;
    ctx.fillStyle = AD_ACCENT;
    ctx.fillRect(pad, y, colW, Math.max(2, Math.round(W * 0.003)));
    y += headSize * 1.1;

    const bottom = footerTop - H * 0.03;
    const list = rows.slice(0, 8);

    // No formato deitado (LinkedIn) o espaço é curto: a tabela tem prioridade
    // e os textos complementares ficam limitados a poucas linhas.
    const notesSize = Math.round(W * (wide ? 0.016 : 0.023));
    const notesList = others.slice(0, wide ? 1 : 4);
    const space = Math.max(1, bottom - y);
    let notesH = 0;
    if (notesList.length) {
      ctx.font = `500 ${notesSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      notesH = notesList.reduce(
        (acc, t) => acc + wrap(ctx, t, colW).length * notesSize * 1.3 + notesSize * 0.5,
        0,
      );
      notesH = Math.min(notesH + notesSize, space * (wide ? 0.2 : 0.3));
    }

    // A tabela se ajusta para que TODOS os indicadores selecionados apareçam.
    const avail = Math.max(1, space - notesH);
    const maxBody = Math.round(W * (wide ? 0.021 : 0.027));
    const n = Math.max(1, list.length);
    const rowH = Math.max(Math.round(W * 0.02), avail / n);
    let bodySize = Math.min(maxBody, Math.floor(rowH / 1.9));
    bodySize = Math.max(Math.round(W * 0.012), bodySize);
    const fitText = (text: string, max: number) => {
      if (ctx!.measureText(text).width <= max) return text;
      let t = text;
      while (t.length > 1 && ctx!.measureText(`${t}…`).width > max) t = t.slice(0, -1);
      return `${t.trim()}…`;
    };

    for (const r of list) {
      const delta = compareIndicator(
        r.value,
        r.previous_value,
        r.unit,
        "pt-BR",
        resolvePolarity(r.polarity, r.slug, r.label),
      );
      const unit = r.unit ? ` ${r.unit}` : "";

      ctx.font = `600 ${bodySize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = AD_INK;
      ctx.textAlign = "left";
      ctx.fillText(fitText(r.label, colW * 0.46), pad, y);

      ctx.textAlign = "right";
      ctx.font = `700 ${bodySize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = AD_INK;
      ctx.fillText(`${r.value}${unit}`, cValue, y, colW * 0.18);

      ctx.font = `500 ${Math.round(bodySize * 0.9)}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = AD_MUTED;
      ctx.fillText(r.previous_value ? `${r.previous_value}${unit}` : "—", cPrev, y, colW * 0.18);

      ctx.font = `700 ${Math.round(bodySize * 0.9)}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle =
        delta.direction === "up" ? "#15803d" : delta.direction === "down" ? "#b91c1c" : AD_MUTED;
      const dText = delta.direction === "none" ? "—" : `${delta.arrow} ${delta.label}`;
      ctx.fillText(dText, cDelta, y, colW * 0.29);
      ctx.textAlign = "left";

      y += rowH;
      ctx.fillStyle = "rgba(20,24,28,0.12)";
      ctx.fillRect(pad, y - rowH * 0.32, colW, 1);
    }

    if (notesList.length) {
      drawBlocks(notesList, pad, Math.min(y + bodySize * 0.4, bottom), colW, bottom, notesSize);
    }
  } else {
    // Cartão editorial: número fantasma, título em duas cores, texto e foto.
    const n = String(opts.index ?? 1).padStart(2, "0");
    ctx.save();
    ctx.fillStyle = "rgba(20,24,28,0.07)";
    ctx.font = `700 ${Math.round(W * (wide ? 0.16 : 0.2))}px "Space Grotesk", Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(n, W - pad, Math.round(H * 0.06));
    ctx.restore();

    // Reserva primeiro a área da foto; o texto nunca ultrapassa esse limite.
    let photoBox: { x: number; y: number; w: number; h: number } | null = null;
    if (photo) {
      if (wide) {
        const iw = W * 0.36;
        const ih = Math.min(H * 0.66, footerTop - pad * 0.6);
        photoBox = { x: W - pad - iw, y: Math.max(pad * 0.7, (footerTop - ih) / 2), w: iw, h: ih };
      } else {
        const iw = W - pad * 2;
        const ih = H * (count >= 3 ? 0.24 : 0.3);
        photoBox = { x: pad, y: footerTop - H * 0.03 - ih, w: iw, h: ih };
      }
      drawCover(ctx, photo, photoBox.x, photoBox.y, photoBox.w, photoBox.h, Math.round(W * 0.025));
    }

    const colW = wide ? (photoBox ? photoBox.x - pad * 1.8 : W * 0.56) : W - pad * 2;
    const titleSize = fitTitle(
      headline,
      colW,
      H * (wide ? 0.24 : 0.2) * density,
      Math.round(W * (wide ? 0.05 : 0.066)),
    );
    let y = Math.round(H * (wide ? 0.12 : 0.1));
    y = drawTwoToneTitle(ctx, headline, pad, y, colW, titleSize) + titleSize * 0.5;

    const bodyLimit = photoBox && !wide ? photoBox.y - H * 0.03 : footerTop - H * 0.02;
    drawBlocks(others, pad, y, colW, bodyLimit, Math.round(W * (wide ? 0.022 : 0.028)));
  }

  adFooter(ctx, W, H, pad, opts.footer, footerMaxW);
  await drawAdLogo(ctx, W, H, pad, { w: logoW, h: logoH }, opts.logoUrl);

  return canvas.toDataURL(f.mime, 0.92);
}
