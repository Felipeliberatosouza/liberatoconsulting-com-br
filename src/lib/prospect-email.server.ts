/** Utilitários de servidor do envio de prospecção (Brevo + descadastro). */

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function sign(value: string) {
  const secret = process.env["PROSPECT_UNSUB_SECRET"];
  if (!secret) throw new Error("PROSPECT_UNSUB_SECRET não configurado");
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}

/** Token assinado com todos os destinatários do e-mail (Para, CC e CCO). */
export async function unsubscribeToken(emails: string[]) {
  const e = [...new Set(emails.map((x) => x.trim().toLowerCase()))].join(",");
  return `${b64url(enc.encode(e))}.${await sign(e)}`;
}

export async function verifyUnsubscribeToken(token: string): Promise<string[] | null> {
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;
  try {
    const value = new TextDecoder().decode(fromB64url(p));
    if ((await sign(value)) !== sig) return null;
    return value.split(",").filter(Boolean);
  } catch {
    return null;
  }
}

export type BrevoAddr = { email: string; name?: string };

/** Referência da logomarca incorporada (CID) — exibida sem download externo. */
export const EMAIL_LOGO_CID = "cid:logo.png";

/** Logomarca atual do painel (Identidade visual); usa o arquivo do site se não houver. */
async function logoAttachment() {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", "branding").maybeSingle();
    const url = (data?.value as { logoUrl?: string } | null)?.logoUrl;
    if (url) {
      const res = await fetch(url);
      if (res.ok) {
        const buf = new Uint8Array(await res.arrayBuffer());
        let bin = "";
        for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
        return { name: "logo.png", content: btoa(bin) };
      }
    }
  } catch {
    /* usa o arquivo padrão abaixo */
  }
  const mod = (await import("../../public/logo.png?inline")) as { default: string };
  return { name: "logo.png", content: mod.default.split(",")[1] ?? "" };
}

export async function sendBrevoEmail(params: {
  sender: BrevoAddr;
  to: BrevoAddr[];
  cc?: BrevoAddr[];
  bcc?: BrevoAddr[];
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
  attachments?: Array<{ name: string; content: string }>;
}) {
  const key = process.env["BREVO_API_KEY"];
  if (!key) throw new Error("Chave do Brevo não configurada");
  const attachment = [...(params.html.includes(EMAIL_LOGO_CID) ? [await logoAttachment()] : []), ...(params.attachments ?? [])];
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: params.sender,
      to: params.to,
      ...(params.cc?.length ? { cc: params.cc } : {}),
      ...(params.bcc?.length ? { bcc: params.bcc } : {}),
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
      ...(attachment.length ? { attachment } : {}),
      headers: { "List-Unsubscribe": `<${params.unsubscribeUrl}>` },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[brevo] ${res.status}: ${body}`);
    throw new Error(`Brevo recusou o envio (${res.status}): ${body.slice(0, 200)}`);
  }
}

/** Lê um arquivo do armazenamento e devolve em base64 (anexos do e-mail). */
export async function storageBase64(bucket: string, path: string): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
