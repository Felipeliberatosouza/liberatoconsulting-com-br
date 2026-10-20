import { SOCIAL_IMAGE_FORMATS, type SocialFormatKey } from "./social-image";

/** Browser-only canvas composition; colors come from the active design tokens. */
export async function composeToolPromotion(opts: {
  format: SocialFormatKey; title: string; details: string[]; steps: string[];
  footer: string; logoUrl: string; priceLabel: string;
}) {
  const f = SOCIAL_IMAGE_FORMATS[opts.format];
  const canvas = document.createElement("canvas");
  canvas.width = f.width; canvas.height = f.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível montar a imagem.");
  const styles = getComputedStyle(document.documentElement);
  const color = (token: string) => styles.getPropertyValue(token).trim();
  const bg = color("--background"), ink = color("--foreground"), accent = color("--accent"), muted = color("--muted-foreground");
  const W = f.width, H = f.height, pad = W * 0.055, wide = W > H;
  const textWidth = W - pad * 2;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const wrap = (text: string, width: number) => {
    const lines: string[] = []; let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= width) { line = next; continue; }
      if (line) { lines.push(line); line = ""; }
      if (ctx.measureText(word).width <= width) { line = word; continue; }
      for (const ch of word) {
        if (ctx.measureText(line + ch).width > width && line) { lines.push(line); line = ""; }
        line += ch;
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  };
  const write = (text: string, x: number, y: number, width: number, height: number, start: number, bold = false, fill = ink) => {
    let size = start;
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    while (size > 10) {
      ctx.font = `${bold ? 700 : 500} ${size}px "DM Sans", Arial, sans-serif`;
      if (wrap(text, width).length * size * 1.25 <= height) break;
      size -= 1;
    }
    ctx.fillStyle = fill;
    wrap(text, width).forEach((line, i) => ctx.fillText(line, x, y + i * size * 1.25));
  };
  let logo: HTMLImageElement | null = null;
  try {
    logo = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = reject; img.src = opts.logoUrl || "/logo.png";
    });
  } catch { throw new Error("Não foi possível carregar a logomarca da consultoria."); }
  const logoW = W * 0.18, logoH = logo.height / logo.width * logoW;
  const footerH = Math.max(H * 0.14, logoH + pad * 1.1);
  const footerTop = H - footerH;
  const stepsH = opts.steps.length ? H * (wide ? 0.32 : 0.34) : 0;
  const stepsTop = footerTop - stepsH;
  write("NOVA FERRAMENTA DE GESTÃO", pad, pad * 0.6, textWidth, H * 0.05, wide ? 20 : 24, true, accent);
  const titleTop = pad * 0.6 + H * 0.07;
  const titleH = (stepsTop - titleTop) * 0.38;
  write(opts.title, pad, titleTop, textWidth, titleH, wide ? 48 : 60, true);
  const detailTop = titleTop + titleH + H * 0.015;
  const priceH = H * 0.04;
  write(opts.details.join("\n\n").replace(/\n+/g, " · "), pad, detailTop, textWidth,
    Math.max(20, stepsTop - detailTop - priceH - H * 0.035), wide ? 26 : 32);
  write(opts.priceLabel, pad, stepsTop - priceH - H * 0.015, textWidth, priceH, wide ? 20 : 25, true, accent);
  if (opts.steps.length) {
    ctx.fillStyle = accent; ctx.fillRect(pad, stepsTop, textWidth, 3);
    write("COMO ACESSAR", pad, stepsTop + H * 0.015, textWidth, H * 0.035, wide ? 18 : 24, true, accent);
    const rowTop = stepsTop + H * 0.065;
    const colW = textWidth / opts.steps.length;
    opts.steps.forEach((step, i) => {
      const x = pad + i * colW, r = wide ? 16 : 22;
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(x + r, rowTop + r, r, 0, Math.PI * 2); ctx.fill();
      ctx.font = `700 ${r}px Arial`; ctx.fillStyle = color("--accent-foreground"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), x + r, rowTop + r);
      if (i < opts.steps.length - 1) {
        ctx.strokeStyle = muted; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + r * 3, rowTop + r); ctx.lineTo(x + colW - 18, rowTop + r); ctx.stroke();
      }
      write(step, x, rowTop + r * 2 + H * 0.016, colW - 18, footerTop - rowTop - r * 2 - H * 0.035, wide ? 18 : 25);
    });
  }
  ctx.fillStyle = muted; ctx.fillRect(pad, footerTop, textWidth, 1);
  write(opts.footer, pad, footerTop + H * 0.025, textWidth - logoW - pad * 0.5, footerH - H * 0.045, wide ? 18 : 23, false, muted);
  ctx.drawImage(logo, W - pad - logoW, H - pad * 0.5 - logoH, logoW, logoH);
  return canvas.toDataURL(f.mime, 0.92);
}