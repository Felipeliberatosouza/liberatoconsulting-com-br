/** Envio automático dos e-mails de aniversário de empresas e pessoas do CRM. */

type Result = { ok: boolean; sent: number; skipped: number; failed: number; errors: string[] };

function monthDay(iso: string | null | undefined) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.slice(0, 10));
  if (!m) return null;
  return { year: Number(m[1]), md: `${m[2]}-${m[3]}` };
}

export async function dispatchCrmBirthdays(): Promise<Result> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTemplateEmail } = await import("./email-templates/send-email");

  const now = new Date();
  const today = `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  const year = now.getUTCFullYear();

  const result: Result = { ok: true, sent: 0, skipped: 0, failed: 0, errors: [] };

  const [{ data: companies }, { data: contacts }] = await Promise.all([
    supabaseAdmin.from("crm_companies").select("id, name, trade_name, email, founded_on, birthday_email"),
    supabaseAdmin
      .from("crm_contacts")
      .select("id, full_name, email, birth_date, birthday_email, email_opt_in, active, company_id"),
  ]);

  const companyName = new Map<string, string>(
    ((companies ?? []) as any[]).map((c) => [c.id as string, (c.trade_name || c.name) as string]),
  );

  type Job = { type: "empresa" | "pessoa"; id: string; name: string; email: string; company: string; years: number | null };
  const jobs: Job[] = [];

  for (const c of (companies ?? []) as any[]) {
    const info = monthDay(c.founded_on);
    if (!c.birthday_email || !c.email || !info || info.md !== today) continue;
    // O e-mail de aniversário usa o nome fantasia da empresa.
    const label = (c.trade_name || c.name) as string;
    jobs.push({ type: "empresa", id: c.id, name: label, email: c.email, company: label, years: year - info.year });
  }
  for (const p of (contacts ?? []) as any[]) {
    const info = monthDay(p.birth_date);
    if (!p.birthday_email || !p.email_opt_in || !p.active || !p.email || !info || info.md !== today) continue;
    jobs.push({
      type: "pessoa",
      id: p.id,
      name: p.full_name,
      email: p.email,
      company: companyName.get(p.company_id) ?? "",
      years: null,
    });
  }

  for (const job of jobs) {
    const { data: already } = await supabaseAdmin
      .from("crm_birthday_sends")
      .select("id")
      .eq("target_type", job.type)
      .eq("target_id", job.id)
      .eq("year", year)
      .maybeSingle();
    if (already) {
      result.skipped += 1;
      continue;
    }

    try {
      const res = await sendTemplateEmail("crm-birthday", job.email, {
        templateData: { name: job.name, target: job.type, company: job.company, years: job.years },
        idempotencyKey: `crm-birthday-${job.type}-${job.id}-${year}`,
      });
      await supabaseAdmin.from("crm_birthday_sends").insert({
        target_type: job.type,
        target_id: job.id,
        year,
        recipient: job.email,
        status: res.sent ? "sent" : "suppressed",
      });
      if (res.sent) result.sent += 1;
      else result.skipped += 1;
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : "Falha no envio.";
      result.errors.push(`${job.name}: ${message}`);
      await supabaseAdmin.from("crm_birthday_sends").insert({
        target_type: job.type,
        target_id: job.id,
        year,
        recipient: job.email,
        status: "error",
        error: message.slice(0, 500),
      });
    }
  }

  result.ok = result.failed === 0;
  return result;
}
