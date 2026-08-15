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


function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Desenha a logomarca (PNG sem fundo) no canto superior direito, em tamanho
 * reduzido, para que nunca seja cortada pelos recortes de cada rede.
 * Escolhe a versão clara ou escura conforme o brilho da área, garantindo leitura.
 */
async function drawLogo(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const pad = Math.round(width * 0.045);
  // 40% menor do que o tamanho anterior (aplicado duas vezes: 0.6 * 0.6)
  const logoW = Math.round(width * (width > height ? 0.2 : 0.26) * 0.36);
  const probeH = Math.round(height * 0.12);
  const dark =
    areaLuminance(ctx, Math.max(0, width - logoW - pad * 2), 0, logoW + pad * 2, probeH) < 0.55;
  try {
    const logo = await loadImage(dark ? "/logo-light.png" : "/logo.png");
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
  const { compareIndicator } = await import("./indicator-compare");
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
  const rowGap = Math.round(labelSize * 2.5);

  for (const r of list) {
    if (y > f.height - pad * 2.4 - rowGap) break;
    const delta = compareIndicator(r.value, r.previous_value, r.unit);

    ctx.font = `600 ${labelSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = fg;
    ctx.textAlign = "left";
    const label = wrap(ctx, r.label, Math.round(maxWidth * 0.55))[0] ?? r.label;
    ctx.fillText(label, pad, y);

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
    ctx.fillText(`${prev}${forecast}`, pad, y + labelSize * 1.2);

    ctx.textAlign = "right";
    ctx.font = `700 ${valueSize}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = fg;
    ctx.fillText(`${r.value}${r.unit}`, f.width - pad, y);

    if (delta.direction !== "none") {
      ctx.font = `700 ${smallSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = delta.direction === "up" ? "#22c55e" : delta.direction === "down" ? "#ef4444" : muted;
      ctx.fillText(`${delta.arrow} ${delta.label}`, f.width - pad, y + labelSize * 1.2);
    }
    ctx.textAlign = "left";

    y += rowGap;
    ctx.fillStyle = light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)";
    ctx.fillRect(pad, y - Math.round(labelSize * 0.7), maxWidth, 1);
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
