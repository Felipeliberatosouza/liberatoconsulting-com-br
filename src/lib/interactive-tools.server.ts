import { verifySpec, type ToolSpec } from "./tool-engine";

/** Modelo usado pelos agentes que desenham e revisam as ferramentas. */
export const TOOL_MODEL = "openai/gpt-6-astra";
/** Tabela de preço estimada (US$ por milhão de tokens) e câmbio usados no custo exibido ao admin. */
const USD_PER_M_INPUT = 2.5;
const USD_PER_M_OUTPUT = 10;
const BRL_PER_USD = 5.6;

export type AiUsage = { step: string; model: string; input_tokens: number; output_tokens: number; cost_brl: number };

export function usageCost(input: number, output: number) {
  return ((input * USD_PER_M_INPUT + output * USD_PER_M_OUTPUT) / 1_000_000) * BRL_PER_USD;
}

const str = { type: "string" };
const num = { type: "number" };
const nullableNum = { type: ["number", "null"] };
const obj = (properties: Record<string, unknown>) => ({ type: "object", additionalProperties: false, required: Object.keys(properties), properties });
const arr = (items: unknown) => ({ type: "array", items });

const SPEC_SCHEMA = obj({
  title: str, summary: str, category: str, methodology: str,
  context_fields: arr(obj({ id: str, label: str })),
  inputs: arr(obj({ id: str, label: str, unit: str, help: str, min: nullableNum, max: nullableNum })),
  outputs: arr(obj({ id: str, label: str, unit: str, formula: str, format: { type: "string", enum: ["currency", "number", "integer", "percent"] }, explanation: str })),
  chart: obj({ type: { type: "string", enum: ["line", "none"] }, title: str, x_input: { type: ["string", "null"] }, x_label: str, x_max_formula: { type: ["string", "null"] }, series: arr(obj({ label: str, formula: str })) }),
  recommendations: arr(obj({ condition: str, text: str })),
  test_cases: arr(obj({ inputs: arr(obj({ id: str, value: num })), expected: arr(obj({ id: str, value: num })) })),
});

const REVIEW_SCHEMA = obj({ approved: { type: "boolean" }, issues: arr(str) });

async function callJson<T>(step: string, system: string, user: string, schema: object, name: string): Promise<{ data: T; usage: AiUsage }> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("IA indisponível: chave não configurada.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: TOOL_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "medium" },
      instructions: system,
      input: [{ role: "user", content: user }],
      text: { format: { type: "json_schema", name, strict: true, schema } },
    }),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Configurações → Planos e créditos.");
  if (res.status === 403) throw new Error("Uso de IA bloqueado pelo limite do workspace.");
  if (!res.ok || !res.body) throw new Error(`Falha na IA (${res.status}).`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "", inTok = 0, outTok = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload) as { type?: string; delta?: string; response?: { usage?: { input_tokens?: number; output_tokens?: number } } };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
        if (ev.type === "response.completed" && ev.response?.usage) { inTok = ev.response.usage.input_tokens ?? 0; outTok = ev.response.usage.output_tokens ?? 0; }
        if (ev.type === "response.failed" || ev.type === "error") throw new Error("A IA não conseguiu concluir.");
      } catch (e) { if (e instanceof Error && e.message.startsWith("A IA")) throw e; }
    }
  }
  if (!text.trim()) throw new Error("A IA não devolveu conteúdo.");
  return { data: JSON.parse(text) as T, usage: { step, model: TOOL_MODEL, input_tokens: inTok, output_tokens: outTok, cost_brl: usageCost(inTok, outTok) } };
}

const DESIGNER = `Você é um agente especialista em gestão empresarial, contabilidade gerencial e finanças corporativas no Brasil.
Desenhe uma ferramenta de gestão interativa. Regras obrigatórias:
- Use somente metodologias consagradas e conceitualmente corretas (ex.: margem de contribuição, ponto de equilíbrio contábil, markup divisor, DRE gerencial). Cite a metodologia em "methodology".
- NÃO faça contas no texto. Escreva fórmulas que serão executadas por um motor determinístico.
- Sintaxe das fórmulas: números, + - * / ^, parênteses, comparações (> < >= <= == !=) e funções min, max, abs, round(x, casas), ceil, floor, sqrt, if(condição, a, b). Nada além disso.
- Identificadores em snake_case minúsculo sem acento (ex.: custo_fixo). Cada saída só pode usar entradas e saídas anteriores.
- Percentuais são informados como número de 0 a 100 (ex.: 18 para 18%); divida por 100 nas fórmulas.
- Defina min/max realistas nos campos para impedir dados absurdos (ex.: preço mínimo 0).
- "context_fields" são dados textuais do negócio (nome da empresa, produto analisado) usados para personalizar o relatório.
- O gráfico (quando fizer sentido) varia um campo de entrada de 0 até x_max_formula e plota séries.
- "recommendations": condições (fórmulas que retornam 1/0) com orientações práticas em português.
- "test_cases": pelo menos 3 casos com valores esperados calculados com cuidado à mão, incluindo um caso limite.
- Todos os textos em português do Brasil, claros para um empresário.`;

const REVIEWER = `Você é um auditor independente de modelos financeiros e de gestão. Revise a ferramenta recebida.
Verifique: (1) conceitos e metodologia corretos; (2) fórmulas matematicamente corretas para o que os rótulos prometem; (3) unidades e percentuais coerentes; (4) campos suficientes e sem ambiguidade; (5) recomendações corretas.
Aprove apenas se não houver nenhum erro conceitual ou de cálculo. Liste cada problema de forma objetiva.`;

export type GenerationResult = { spec: ToolSpec; usage: AiUsage[]; issues: string[]; reviewIssues: string[]; attempts: number };

/**
 * Agente projetista + verificação determinística + agente auditor.
 * Se os testes ou a auditoria encontrarem problemas, o projetista corrige (até 3 rodadas).
 */
export async function generateToolSpec(params: { prompt: string; spreadsheet?: string }): Promise<GenerationResult> {
  const usage: AiUsage[] = [];
  let brief = `Pedido do administrador:\n${params.prompt}`;
  if (params.spreadsheet) brief += `\n\nPlanilha Excel enviada como base (melhore, corrija erros e complete o que faltar):\n${params.spreadsheet}`;
  let feedback = "";
  let spec: ToolSpec | null = null;
  let issues: string[] = [];
  let reviewIssues: string[] = [];
  let attempt = 0;
  for (attempt = 1; attempt <= 3; attempt++) {
    const user: string = feedback && spec ? `${brief}\n\nVersão anterior:\n${JSON.stringify(spec)}\n\nCorrija TODOS estes problemas:\n${feedback}` : brief;
    const gen: { data: ToolSpec; usage: AiUsage } = await callJson<ToolSpec>(attempt === 1 ? "projeto" : `correcao_${attempt - 1}`, DESIGNER, user, SPEC_SCHEMA, "management_tool");
    usage.push(gen.usage);
    spec = gen.data;
    issues = verifySpec(gen.data);
    if (issues.length) { feedback = issues.join("\n"); reviewIssues = []; continue; }
    const rev = await callJson<{ approved: boolean; issues: string[] }>(`auditoria_${attempt}`, REVIEWER, JSON.stringify(spec), REVIEW_SCHEMA, "tool_review");
    usage.push(rev.usage);
    reviewIssues = rev.data.approved ? [] : rev.data.issues;
    if (!reviewIssues.length) break;
    feedback = reviewIssues.join("\n");
  }
  return { spec: spec!, usage, issues, reviewIssues, attempts: Math.min(attempt, 3) };
}

// ───────────────────────── Asaas ─────────────────────────

function asaasBase() {
  const key = process.env["ASAAS_API_KEY"];
  if (!key) throw new Error("Pagamentos ainda não configurados.");
  const prod = key.includes("_prod_");
  return { key, url: prod ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3" };
}

export async function asaas<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const { key, url } = asaasBase();
  const res = await fetch(`${url}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", access_token: key, "User-Agent": "LiberatoConsulting" },
    ...(init?.body ? { body: JSON.stringify(init.body) } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as T & { errors?: Array<{ description?: string }> };
  if (!res.ok) {
    console.error("[asaas]", res.status, JSON.stringify(json).slice(0, 500));
    throw new Error(json.errors?.[0]?.description ?? "Falha ao comunicar com o sistema de pagamentos.");
  }
  return json;
}
