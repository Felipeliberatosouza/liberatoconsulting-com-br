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
  includeInsight: z.boolean().default(true),
  attachKit: z.boolean().default(true),
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
    void TEMPLATES;
    const { ProspectOutreachEmail } = await import("./email-templates/prospect-outreach");
    const { KIT_FILES } = await import("./prospect-kit.functions");
    const { sectorInsight } = await import("./prospect-insight.server");
    // Banner (inline, CID) e resumo em PDF: material atual salvo em Projetos → Apresentações.
    const [bannerB64, pdfB64] = data.attachKit
      ? await Promise.all([srv.storageBase64("presentations", KIT_FILES.banner), srv.storageBase64("presentations", KIT_FILES.pdf)])
      : [null, null];
    const kitAttachments = [
      ...(bannerB64 ? [{ name: "banner.png", content: bannerB64 }] : []),
      ...(pdfB64 ? [{ name: "Resumo-Servicos-Liberato.pdf", content: pdfB64 }] : []),
    ];
    // Notícia do setor por empresa, pesquisada em paralelo (lotes de 5).
    const insights = new Map<string, string>();
    if (data.includeInsight) {
      const names = [...new Set(data.groups.map((g) => g.company).filter(Boolean))];
      const { data: crm } = names.length
        ? await supabaseAdmin.from("crm_companies").select("name, trade_name, segment, city, state").in("name", names)
        : { data: [] as any[] };
      const info = new Map((crm ?? []).map((c: any) => [c.name, c]));
      for (let i = 0; i < names.length; i += 5) {
        await Promise.all(
          names.slice(i, i + 5).map(async (n) => {
            const c: any = info.get(n) ?? {};
            const r = await sectorInsight(n, c.segment ?? "", [c.city, c.state].filter(Boolean).join(" - "));
            if (r) insights.set(n, r.paragraph);
          }),
        );
      }
    }

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
      const unsubUrl = `${SITE}/descadastro?t=${encodeURIComponent(await srv.unsubscribeToken([...to, ...cc, ...bcc].map((a) => a.email)))}`;
      const element = React.createElement(ProspectOutreachEmail, {
        subject,
        body: fill(data.body),
        insight: insights.get(g.company) ?? "",
        bannerUrl: bannerB64 ? "cid:banner.png" : "",
        attachmentNote: pdfB64 && !/anexo/i.test(data.body) ? "Envio em anexo um resumo dos nossos serviços." : "",
        appendix: `Não deseja mais receber estes e-mails? Cancele aqui: ${unsubUrl}`,
        brandFooter,
        logoUrl: srv.EMAIL_LOGO_CID,
      });
      const all = [...to, ...cc, ...bcc];
      try {
        await srv.sendBrevoEmail({
          sender: { email: data.senderEmail, name: data.senderName },
          to, cc, bcc, subject,
          html: await render(element),
          text: await render(element, { plainText: true }),
          unsubscribeUrl: unsubUrl,
          attachments: kitAttachments,
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
  .inputValidator((d: unknown) =>
    z.object({ t: z.string().max(12000), email: z.string().trim().max(180).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { verifyUnsubscribeToken } = await import("./prospect-email.server");
    const list = await verifyUnsubscribeToken(data.t);
    if (!list || list.length === 0) return { ok: false as const, needEmail: false };
    // E-mail enviado a várias pessoas: quem clicou informa o próprio endereço.
    let email: string;
    if (list.length === 1) email = list[0]!;
    else {
      const typed = (data.email ?? "").toLowerCase();
      if (!typed) return { ok: false as const, needEmail: true };
      if (!list.includes(typed)) return { ok: false as const, needEmail: true, mismatch: true };
      email = typed;
    }
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    const ip = req?.headers.get("cf-connecting-ip") || req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("prospect_unsubscribes")
      .upsert({ email, ip, user_agent: (req?.headers.get("user-agent") ?? "").slice(0, 300) }, { onConflict: "email", ignoreDuplicates: true });
    return { ok: true as const };
  });
