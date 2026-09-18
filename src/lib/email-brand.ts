/**
 * Identidade visual compartilhada pelos e-mails automáticos:
 * logomarca no topo e dados institucionais no rodapé.
 * Módulo puro (sem acesso ao banco) — usado no envio e na pré-visualização.
 */

export const EMAIL_SITE_URL = "https://liberatoconsulting.com.br";
export const EMAIL_LOGO_URL = `${EMAIL_SITE_URL}/logo.png`;

export type EmailBrandIdentity = {
  legalName?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
};

/** Linhas do rodapé institucional, já limpas de campos vazios. */
export function brandFooterLines(identity: EmailBrandIdentity | undefined): string[] {
  const id = identity ?? {};
  const first = [id.legalName || "Liberato Consulting", id.cnpj ? `CNPJ ${id.cnpj}` : ""]
    .filter(Boolean)
    .join(" — ");
  const contact = [id.phone, id.email].filter(Boolean).join(" · ");
  return [first, id.address || "", contact, "liberatoconsulting.com.br"].filter(
    (l) => l.trim().length > 0,
  );
}

export function brandFooterText(identity: EmailBrandIdentity | undefined): string {
  return brandFooterLines(identity).join(" · ");
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Monta o HTML da pré-visualização de um modelo editável do painel,
 * com a mesma moldura usada nos envios reais.
 */
export function buildEmailPreviewHtml(params: {
  subject: string;
  body: string;
  identity?: EmailBrandIdentity | undefined;
  logoUrl?: string | undefined;
  buttonLabel?: string | undefined;
}): string {
  const previewBody = params.body
    .replace(/\s*(?:,|—|-)?\s*(?:disponível\s+também\s+)?(?:neste|no|pelo)\s+link\s*:\s*\{\{link\}\}/gi, "")
    .replace(/\s*\{\{link\}\}/g, "");
  const paragraphs = previewBody
    .replace(/\\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:24px;color:#1f2937;margin:0 0 14px">${esc(p).replace(
          /\n/g,
          "<br />",
        )}</p>`,
    )
    .join("");

  const footer = brandFooterLines(params.identity)
    .map((l) => `<div>${esc(l)}</div>`)
    .join("");

  const button = params.buttonLabel
    ? `<p style="font-size:15px;line-height:24px;margin:0 0 14px"><span style="display:inline-block;background:#E8630A;color:#ffffff;font-size:14px;line-height:20px;font-weight:bold;border-radius:999px;padding:12px 22px;text-decoration:none">${esc(params.buttonLabel)}</span></p>`
    : "";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /></head>
<body style="margin:0;background:#f5f5f4;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px">
    <img src="${esc(params.logoUrl || EMAIL_LOGO_URL)}" alt="Liberato Consulting" width="180" style="display:block;width:180px;height:auto;margin:0 0 24px" />
    <h1 style="font-size:22px;color:#0f172a;margin:0 0 16px">${esc(params.subject || "(sem assunto)")}</h1>
    ${paragraphs || '<p style="color:#9ca3af;font-size:14px">(sem texto)</p>'}
    ${button}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <div style="font-size:12px;line-height:18px;color:#6b7280">${footer}</div>
    <div style="font-size:12px;line-height:18px;color:#9ca3af;margin-top:12px;border-top:1px dashed #e5e7eb;padding-top:12px">
      Se não quiser mais receber estes e-mails, cancele o recebimento aqui.
      <em>(link de cancelamento incluído automaticamente no envio)</em>
    </div>
  </div>
</body></html>`;
}
