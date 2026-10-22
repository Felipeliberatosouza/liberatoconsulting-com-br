import { createFileRoute } from "@tanstack/react-router";

// TEMPORÁRIO: envio de teste único; removido logo após uso.
export const Route = createFileRoute("/api/public/tmp-prospect-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-test") !== "lib-7f3k9q2") return new Response("no", { status: 403 });
        const SITE = "https://liberatoconsulting.com.br";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const React = await import("react");
        const { render } = await import("@react-email/render");
        const { getEmailBrandFooter } = await import("@/lib/email-brand.server");
        const srv = await import("@/lib/prospect-email.server");
        const { ProspectOutreachEmail } = await import("@/lib/email-templates/prospect-outreach");
        const { KIT_FILES } = await import("@/lib/prospect-kit.functions");
        const { sectorInsight } = await import("@/lib/prospect-insight.server");
        const { data: tpl } = await supabaseAdmin.from("email_templates").select("subject, body").eq("slug", "prospect_outreach").maybeSingle();
        const [bannerB64, pdfB64] = await Promise.all([srv.storageBase64("presentations", KIT_FILES.banner), srv.storageBase64("presentations", KIT_FILES.pdf)]);
        const empresa = "Grupo Exemplo Indústria";
        const ins = await sectorInsight(empresa, "Indústria de alimentos", "São Paulo - SP");
        const fill = (s: string) => s.replaceAll("{{nome}}", "Felipe").replaceAll("{{empresa}}", empresa).replaceAll("{{link}}", SITE);
        const to = [{ name: "Felipe Liberato", email: "felipesza@yahoo.com.br" }];
        const unsub = `${SITE}/descadastro?t=${encodeURIComponent(await srv.unsubscribeToken(to.map((a) => a.email)))}`;
        const subject = "[TESTE] " + fill(tpl?.subject ?? "Liberato Consulting");
        const el = React.createElement(ProspectOutreachEmail, {
          subject,
          body: fill(tpl?.body ?? ""),
          insight: ins?.paragraph ?? "",
          bannerUrl: bannerB64 ? "cid:banner.png" : "",
          attachmentNote: pdfB64 && !/anexo/i.test(tpl?.body ?? "") ? "Envio em anexo um resumo dos nossos serviços." : "",
          appendix: `Não deseja mais receber estes e-mails? Cancele aqui: ${unsub}`,
          brandFooter: await getEmailBrandFooter(),
          logoUrl: srv.EMAIL_LOGO_CID,
        });
        const r = await srv.sendBrevoEmail({
          sender: { email: "contato@liberatoconsulting.com.br", name: "Liberato Consulting" },
          to, subject, html: await render(el), text: await render(el, { plainText: true }), unsubscribeUrl: unsub,
          attachments: [
            ...(bannerB64 ? [{ name: "banner.png", content: bannerB64 }] : []),
            ...(pdfB64 ? [{ name: "Resumo-Servicos-Liberato.pdf", content: pdfB64 }] : []),
          ],
        });
        return Response.json({ ok: true, banner: !!bannerB64, pdf: !!pdfB64, insight: !!ins, r });
      },
    },
  },
});
