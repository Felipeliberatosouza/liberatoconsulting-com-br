import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE = "https://liberatoconsulting.com.br";
const SLUG = "prospect_outreach";

/** Modelo editável, remetente padrão e lista de bloqueados. */
export const getProspectSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const [tpl, company, unsubs] = await Promise.all([
      context.supabase.from("email_templates").select("subject, body, enabled").eq("slug", SLUG).maybeSingle(),
      context.supabase.from("company_profile").select("email").limit(1).maybeSingle(),
      context.supabase.from("prospect_unsubscribes").select("id, email, company, ip, created_at").order("created_at", { ascending: false }),
    ]);
    return {
      subject: tpl.data?.subject ?? "",
      body: tpl.data?.body ?? "",
      enabled: tpl.data?.enabled ?? true,
      senderEmail: (company.data?.email as string) || "contato@liberatoconsulting.com.br",
      unsubscribes: (unsubs.data ?? []) as Array<{ id: string; email: string; company: string; ip: string; created_at: string }>,
    };
  });

const addr = z.object({ name: z.string().trim().max(160).default(""), email: z.string().trim().email().max(180) });
const sendSchema = z.object({
  senderEmail: z.string().trim().email().max(180),
  senderName: z.string().trim().max(120).default("Liberato Consulting"),
  subject: z.string().trim().min(2).max(250),
  body: z.string().trim().min(10).max(10000),
  groups: z
    .array(z.object({ company: z.string().trim().max(160).default(""), to: z.array(addr).min(1).max(20), cc: z.array(addr).max(20).default([]), bcc: z.array(addr).max(20).default([]) }))
    .min(1)
    .max(200),
});

/** Envia um e-mail por empresa via Brevo, pulando endereços descadastrados. */
export const sendProspectEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: blocked }, React, { render }, { TEMPLATES }, { getEmailBrandFooter }, { loadEmailBrand }, srv, { logDeliveries }] =
      await Promise.all([
        supabaseAdmin.from("prospect_unsubscribes").select("email"),
        import("react"),
        import("@react-email/render"),
        import("./email-templates/registry"),
        import("./email-brand.server"),
        import("./company-footer.server"),
        import("./prospect-email.server"),
        import("./delivery-log.server"),
      ]);
    const block = new Set((blocked ?? []).map((b) => String(b.email).toLowerCase()));
    // Identidade lida no momento do envio: alterações no painel valem já no próximo disparo.
    const [brandFooter, brand] = await Promise.all([getEmailBrandFooter(), loadEmailBrand(SITE)]);
    const component = TEMPLATES["consultant-notice"]!.component;

    let sent = 0, failed = 0, skipped = 0;
    const log: Parameters<typeof logDeliveries>[0] = [];
    for (const g of data.groups) {
      const clean = (list: { name: string; email: string }[]) => {
        const out = list.filter((a) => !block.has(a.email.toLowerCase()));
        skipped += list.length - out.length;
        return out;
      };
      const to = clean(g.to), cc = clean(g.cc), bcc = clean(g.bcc);
      if (to.length === 0) continue;
      const first = to[0]!;
      const nome = first.name.split(" ")[0] || "";
      const empresa = g.company || "sua empresa";
      const fill = (s: string) => s.replaceAll("{{nome}}", nome).replaceAll("{{empresa}}", empresa).replaceAll("{{link}}", SITE);
      const subject = fill(data.subject);
      const unsubUrl = `${SITE}/descadastro?t=${encodeURIComponent(await srv.unsubscribeToken(first.email))}`;
      const element = React.createElement(component, {
        subject,
        body: fill(data.body),
        appendix: `Não deseja mais receber estes e-mails? Cancele aqui: ${unsubUrl}`,
        brandFooter,
        logoUrl: brand.logoUrl.startsWith("http") ? brand.logoUrl : undefined,
      });
      const all = [...to, ...cc, ...bcc];
      try {
        await srv.sendBrevoEmail({
          sender: { email: data.senderEmail, name: data.senderName },
          to, cc, bcc, subject,
          html: await render(element),
          text: await render(element, { plainText: true }),
          unsubscribeUrl: unsubUrl,
        });
        sent += all.length;
        all.forEach((a) => log.push({ source: "prospeccao", subject, recipient_name: a.name, recipient_email: a.email, channel: "email", status: "enviado" }));
      } catch (err) {
        failed += all.length;
        const msg = err instanceof Error ? err.message : "Falha";
        all.forEach((a) => log.push({ source: "prospeccao", subject, recipient_name: a.name, recipient_email: a.email, channel: "email", status: "falhou", error: msg }));
      }
    }
    await logDeliveries(log);
    const firstError = log.find((l) => l.status === "falhou")?.error;
    return { sent, failed, skipped, error: firstError ?? null };
  });

export const removeProspectUnsubscribe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase.from("prospect_unsubscribes").delete().eq("id", data.id);
    return { ok: !error };
  });

/** Público: confirma o descadastro a partir do link assinado do e-mail. */
export const confirmProspectUnsubscribe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ t: z.string().max(600) }).parse(d))
  .handler(async ({ data }) => {
    const { verifyUnsubscribeToken } = await import("./prospect-email.server");
    const email = await verifyUnsubscribeToken(data.t);
    if (!email) return { ok: false as const };
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const ip = req?.headers.get("cf-connecting-ip") || req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("prospect_unsubscribes")
      .upsert({ email, ip, user_agent: (req?.headers.get("user-agent") ?? "").slice(0, 300) }, { onConflict: "email", ignoreDuplicates: true });
    return { ok: true as const };
  });
