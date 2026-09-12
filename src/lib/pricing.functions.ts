import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  CATALOG,
  DEFAULT_PRICING,
  buildQuote,
  formatMoney,
  type PricedActivity,
  type PricingSettings,
} from "./pricing-catalog";

const activitySchema = z.object({
  id: z.string().min(1).max(60),
  phase: z.enum(["p1", "p2", "p3", "p4", "p5"]),
  label: z.string().trim().min(1).max(200),
  consultant: z.number().min(0).max(400),
  assistant: z.number().min(0).max(400),
  freelancer: z.number().min(0).max(400),
  thirdParty: z.number().min(0).max(500000),
  reps: z.number().min(0).max(200),
  onsite: z.boolean(),
  enabled: z.boolean(),
});

const settingsSchema = z.object({
  rates: z.object({
    sme: z.object({ consultant: z.number().min(0), assistant: z.number().min(0), freelancer: z.number().min(0) }),
    corporate: z.object({ consultant: z.number().min(0), assistant: z.number().min(0), freelancer: z.number().min(0) }),
  }),
  thirdPartyMarkup: z.number().min(0).max(3),
  hoursPerDay: z.number().min(1).max(24),
  countryFactors: z.record(z.string(), z.number().min(0.1).max(10)),
  fxFallback: z.record(z.string(), z.number().min(0.0001).max(1000)),
  aiSuggestion: z
    .object({ text: z.string().max(6000), sources: z.string().max(4000), updatedAt: z.string().max(40) })
    .optional(),
});

const optionsSchema = z.object({
  companyType: z.enum(["sme", "corporate"]),
  country: z.string().trim().min(2).max(4),
  currency: z.enum(["BRL", "USD", "CNY", "EUR"]),
  startDate: z.string().trim().min(8).max(10),
  remoteOnly: z.boolean(),
  discountPct: z.number().min(0).max(60),
  fxRate: z.number().min(0).max(1000),
});

/** Parâmetros globais (valor-hora, fatores de país, cotações de reserva). */
export const getPricingSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "pricing")
      .maybeSingle();
    const stored = (data?.value ?? {}) as Partial<PricingSettings>;
    return { ...DEFAULT_PRICING, ...stored } as PricingSettings;
  });

export const savePricingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ key: "pricing", value: data }, { onConflict: "key" });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

/** Sugestão de valor-hora por IA, considerando os países dos idiomas do site. */
export const suggestHourlyRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");
    try {
      const out = await askJson<{
        sme: { consultant: number; assistant: number; freelancer: number };
        corporate: { consultant: number; assistant: number; freelancer: number };
        countryFactors: Record<string, number>;
        rationale: string;
        sources: string;
      }>(
        "Você é economista especialista em precificação de serviços de consultoria de gestão. " +
          "Responda com valores realistas de mercado, em reais (BRL).",
        JSON.stringify({
          tarefa:
            "Sugira o valor do homem-hora de uma consultoria brasileira de gestão empresarial com uso intensivo de IA, " +
            "para clientes de pequeno porte (PME/startup) e para corporações. Considere benchmarks de consultorias " +
            "concorrentes e o custo da mão de obra nos principais países dos idiomas atendidos: Brasil (português), " +
            "Estados Unidos e Emirados (inglês), Espanha e México (espanhol) e China (mandarim).",
          ano_referencia: new Date().getFullYear(),
          formato: {
            sme: "{consultant, assistant, freelancer} valor-hora em BRL para PME",
            corporate: "{consultant, assistant, freelancer} valor-hora em BRL para corporações",
            countryFactors:
              "multiplicador de preço por país, com as chaves BR, PT, US, ES, MX, CL, CN, AE (BR = 1)",
            rationale: "até 6 linhas explicando os valores, em português simples",
            sources: "3 a 6 referências de mercado citadas, uma por linha",
          },
        }),
      );
      return { ok: true as const, ...out };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Etapas cadastradas para um serviço. */
export const getServicePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ slug: z.string().trim().min(1).max(120) }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data: row } = await context.supabase
      .from("service_pricing")
      .select("activities, notes, ai_rationale")
      .eq("slug", data.slug)
      .maybeSingle();
    return {
      activities: (row?.activities ?? []) as PricedActivity[],
      notes: row?.notes ?? "",
      aiRationale: row?.ai_rationale ?? "",
    };
  });

export const saveServicePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(120),
        activities: z.array(activitySchema).max(120),
        notes: z.string().trim().max(4000).default(""),
        aiRationale: z.string().trim().max(6000).default(""),
        /** Atualiza os preços do Cadastro de serviços com o valor calculado. */
        updateCatalogPrices: z.boolean().default(true),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);

    const { data: product } = await context.supabase
      .from("service_products")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    const { error } = await context.supabase.from("service_pricing").upsert(
      {
        slug: data.slug,
        product_id: product?.id ?? null,
        activities: data.activities,
        notes: data.notes,
        ai_rationale: data.aiRationale,
      },
      { onConflict: "slug" },
    );
    if (error) return { ok: false as const, error: error.message };

    let prices: { sme: string; corporate: string } | null = null;
    if (data.updateCatalogPrices && product?.id) {
      const { data: cfg } = await context.supabase
        .from("site_settings")
        .select("value")
        .eq("key", "pricing")
        .maybeSingle();
      const settings = { ...DEFAULT_PRICING, ...((cfg?.value ?? {}) as Partial<PricingSettings>) };
      const base = {
        country: "BR",
        currency: "BRL",
        startDate: new Date().toISOString().slice(0, 10),
        remoteOnly: false,
        discountPct: 0,
        fxRate: 1,
      };
      const sme = buildQuote(data.activities, settings, { ...base, companyType: "sme" });
      const corp = buildQuote(data.activities, settings, { ...base, companyType: "corporate" });
      prices = {
        sme: formatMoney(sme.totalBrl, "BRL"),
        corporate: formatMoney(corp.totalBrl, "BRL"),
      };
      await context.supabase
        .from("service_products")
        .update({ price_sme: prices.sme, price_corporate: prices.corporate })
        .eq("id", product.id);
    }
    return { ok: true as const, prices };
  });

/** A IA seleciona as etapas que fazem sentido para o serviço e ajusta as horas. */
export const suggestServiceStages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(120),
        title: z.string().trim().min(2).max(300),
        lead: z.string().trim().max(1000).default(""),
        body: z.string().trim().max(6000).default(""),
        bullets: z.array(z.string().max(300)).max(30).default([]),
        duration: z.string().trim().max(200).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { askJson } = await import("./ai.server");
    try {
      const out = await askJson<{
        activities: Array<{ id: string; consultant: number; assistant: number; freelancer: number; reps: number; thirdParty?: number }>;
        rationale: string;
      }>(
        "Você é sócio de uma consultoria de gestão empresarial e desenha o escopo e o esforço de projetos. " +
          "Baseie-se na prática corrente do mercado de consultoria (diagnóstico, entregas, apresentação e acompanhamento).",
        JSON.stringify({
          tarefa:
            "Escolha, entre as atividades do catálogo, apenas as que realmente são executadas neste serviço e ajuste " +
            "as horas e o número de realizações ao porte do trabalho. Não invente ids fora do catálogo.",
          servico: {
            titulo: data.title,
            promessa: data.lead,
            descricao: data.body,
            entregas: data.bullets,
            duracao_informada: data.duration,
          },
          catalogo: CATALOG.map((a) => ({
            id: a.id,
            etapa: a.phase,
            atividade: a.label,
            horas_padrao: { consultor: a.consultant, assistente: a.assistant, freelancer: a.freelancer },
            realizacoes_padrao: a.reps,
            terceiros_padrao: a.thirdParty,
          })),
          formato: {
            activities:
              "lista de { id, consultant, assistant, freelancer, reps, thirdParty } somente com as atividades aplicáveis",
            rationale: "até 8 linhas explicando o escopo escolhido e o esforço, em português simples",
          },
        }),
      );
      const activities: PricedActivity[] = CATALOG.map((c) => {
        const hit = out.activities?.find((a) => a.id === c.id);
        return {
          id: c.id,
          phase: c.phase,
          label: c.label,
          consultant: Number(hit?.consultant ?? c.consultant) || 0,
          assistant: Number(hit?.assistant ?? c.assistant) || 0,
          freelancer: Number(hit?.freelancer ?? c.freelancer) || 0,
          thirdParty: Number(hit?.thirdParty ?? c.thirdParty) || 0,
          reps: Number(hit?.reps ?? c.reps) || 0,
          onsite: Boolean(c.onsite),
          enabled: Boolean(hit),
        };
      });
      return { ok: true as const, activities, rationale: out.rationale ?? "" };
    } catch (err) {
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Cotação do dia (1 BRL = X moeda), com valor de reserva do painel. */
export const getFxRate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ currency: z.enum(["BRL", "USD", "CNY", "EUR"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    if (data.currency === "BRL") return { ok: true as const, rate: 1, source: "—" };
    const { data: cfg } = await context.supabase
      .from("site_settings")
      .select("value")
      .eq("key", "pricing")
      .maybeSingle();
    const settings = { ...DEFAULT_PRICING, ...((cfg?.value ?? {}) as Partial<PricingSettings>) };
    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?base=BRL&symbols=${data.currency}`,
      );
      if (res.ok) {
        const json = (await res.json()) as { rates?: Record<string, number>; date?: string };
        const rate = json.rates?.[data.currency];
        if (rate) return { ok: true as const, rate, source: `cotação de ${json.date ?? "hoje"}` };
      }
    } catch {
      /* usa a cotação de reserva */
    }
    return {
      ok: true as const,
      rate: settings.fxFallback[data.currency] ?? 1,
      source: "cotação de reserva do painel",
    };
  });

/** Gera o PDF do orçamento e devolve um link de download. */
export const buildQuotePdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().trim().min(1).max(120),
        serviceTitle: z.string().trim().min(1).max(300),
        clientName: z.string().trim().max(200).default(""),
        activities: z.array(activitySchema).max(120),
        options: optionsSchema,
        notes: z.string().trim().max(4000).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    if (!data.activities.some((a) => a.enabled)) {
      return {
        ok: false as const,
        error:
          "Este serviço ainda não tem etapas cadastradas. Monte as etapas antes de gerar o orçamento.",
      };
    }
    try {
      const { data: cfg } = await context.supabase
        .from("site_settings")
        .select("value")
        .eq("key", "pricing")
        .maybeSingle();
      const settings = { ...DEFAULT_PRICING, ...((cfg?.value ?? {}) as Partial<PricingSettings>) };
      const quote = buildQuote(data.activities, settings, data.options);

      const { renderQuotePdf } = await import("./pricing-pdf.server");
      const { bytes, fileName } = await renderQuotePdf({
        quote,
        settings,
        options: data.options,
        serviceTitle: data.serviceTitle,
        clientName: data.clientName,
        notes: data.notes,
      });

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const path = `quotes/${crypto.randomUUID()}/${fileName}`;
      const { error } = await supabaseAdmin.storage
        .from("content")
        .upload(path, bytes, { contentType: "application/pdf", upsert: false });
      if (error) return { ok: false as const, error: error.message };
      const { data: signed } = await supabaseAdmin.storage
        .from("content")
        .createSignedUrl(path, 3600, { download: fileName });

      await context.supabase.from("quotes").insert({
        slug: data.slug,
        service_title: data.serviceTitle,
        client_name: data.clientName,
        company_type: data.options.companyType,
        country: data.options.country,
        currency: data.options.currency,
        start_date: quote.start,
        end_date: quote.end,
        remote_only: data.options.remoteOnly,
        discount_pct: data.options.discountPct,
        total_brl: quote.totalBrl,
        total_currency: quote.totalCurrency,
        fx_rate: data.options.fxRate,
        payload: { quote, options: data.options, notes: data.notes },
        file_path: path,
        file_name: fileName,
        created_by: context.userId,
      });

      return { ok: true as const, url: signed?.signedUrl ?? "", name: fileName };
    } catch (err) {
      console.error("buildQuotePdf failed", err);
      return { ok: false as const, error: (err as Error).message };
    }
  });

/** Últimos orçamentos gerados. */
export const listQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("quotes")
      .select("id, slug, service_title, client_name, company_type, country, currency, total_currency, total_brl, created_at, file_path, file_name")
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  });

/** Link de download de um orçamento já gerado. */
export const quoteFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ path: z.string().trim().min(3).max(300), name: z.string().trim().max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./access.server");
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("content")
      .createSignedUrl(data.path, 3600, { download: data.name || true });
    return { ok: true as const, url: signed?.signedUrl ?? "" };
  });
