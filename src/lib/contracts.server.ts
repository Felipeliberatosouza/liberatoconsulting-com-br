import { sendLovableEmail } from "@lovable.dev/email-js";

import { companyFooterHtml, companyFooterText, loadCompanyFooter } from "./company-footer.server";
import { SENDER_DOMAIN } from "./email-templates/send-email";

function escapeHtml(value: string) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Envia por e-mail o contrato ativo do papel (consultor ou autor) para o novo
 * membro da equipe. Retorna ok=false quando não há contrato ou serviço de e-mail.
 */
export async function sendContractEmail(input: {
  audience: "consultor" | "autor";
  toEmail: string;
  toName: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: tpl } = await supabaseAdmin
    .from("contract_templates")
    .select("title, body, version")
    .eq("audience", input.audience)
    .eq("active", true)
    .maybeSingle();
  if (!tpl) return { ok: false as const, error: "Nenhum contrato ativo cadastrado para este papel." };

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { ok: false as const, error: "Serviço de e-mail indisponível." };

  const company = await loadCompanyFooter("https://liberatoconsulting.com.br");
  const replyTo = company.email || "contato@liberatoconsulting.com.br";
  const fromName = company.name || "Liberato Consulting";

  const { buildContractVars } = await import("./contract-fill.server");
  const { fillContract } = await import("./contract-fill");
  const filledBody = fillContract(String(tpl.body), await buildContractVars({ email: input.toEmail }));

  const paragraphs = filledBody
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#1f2328">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f4;padding:28px 0;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:92%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="padding:26px 30px;border-bottom:1px solid #e7e5e4">
<span style="font-size:20px;font-weight:800;color:#111111">LIBERATO</span><span style="font-size:20px;font-weight:600;color:#ea580c"> consulting</span>
</td></tr>
<tr><td style="padding:28px 30px">
<p style="margin:0 0 18px;font-size:15px">Olá, ${escapeHtml(input.toName || "")}.</p>
<p style="margin:0 0 18px;font-size:15px">Este documento foi preparado para você após o seu cadastro como ${input.audience}. Segue o contrato para leitura e assinatura. Após assinar, responda diretamente a este e-mail para que o seu acesso ao painel seja liberado.</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#111111">${escapeHtml(tpl.title)} (versão ${tpl.version})</h1>
${paragraphs}
</td></tr>
<tr><td style="padding:20px 30px;background:#14192a;color:#f7f6f4">${companyFooterHtml(company)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Olá, ${input.toName}.\n\nEste documento foi preparado para você após o seu cadastro como ${input.audience}. Segue o contrato para leitura e assinatura. Após assinar, responda diretamente a este e-mail para que o seu acesso ao painel seja liberado.\n\n${tpl.title} (versão ${tpl.version})\n\n${filledBody}\n\n${companyFooterText(company)}`;

  await sendLovableEmail(
    {
      to: input.toEmail,
      from: `${fromName} <noreply@${SENDER_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      reply_to: replyTo,
      subject: `${input.toName}, seu contrato para assinatura — ${fromName}`,
      html,
      text,
      purpose: "transactional",
      label: "team-contract",
      idempotency_key: `team-contract-${input.audience}-${input.toEmail}-${tpl.version}`.slice(0, 200),
    } as never,
    { apiKey },
  );

  return { ok: true as const };
}
