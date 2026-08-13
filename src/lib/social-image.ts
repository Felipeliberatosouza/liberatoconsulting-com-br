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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem base."));
    img.src = src;
  });
}

/** Média de luminância da área onde o texto será escrito (0 = escuro, 1 = claro). */
function areaLuminance(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const data = ctx.getImageData(x, y, Math.max(1, w), Math.max(1, h)).data;
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

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
