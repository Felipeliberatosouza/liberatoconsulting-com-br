const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const TEXT_MODEL = "google/gemini-3-flash-preview";
export const IMAGE_MODEL = "google/gemini-3-pro-image-preview";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("IA indisponível: chave não configurada.");
  return key;
}

type ChatJson = {
  choices: Array<{ message: { content?: string; images?: Array<{ image_url?: { url?: string } }> } }>;
};

const CACHE_DAYS = 30;

/** Respostas idênticas são reutilizadas; buscas na web e imagens nunca usam cache. */
async function chat(body: Record<string, unknown>): Promise<ChatJson> {
  const cacheable = !body["tools"] && !body["modalities"];
  if (!cacheable) return chatLive(body);
  let key = "";
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(body)));
    key = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - CACHE_DAYS * 86400000).toISOString();
    const { data } = await supabaseAdmin.from("ai_cache").select("response").eq("key", key).gte("created_at", since).maybeSingle();
    if (data?.response) return data.response as unknown as ChatJson;
  } catch { key = key || ""; }
  const json = await chatLive(body);
  if (key && json.choices?.[0]?.message?.content) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("ai_cache").upsert({ key, response: json as never, created_at: new Date().toISOString() });
    } catch { /* cache é opcional */ }
  }
  return json;
}

async function chatLive(body: Record<string, unknown>): Promise<ChatJson> {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey() },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados.");
  if (!res.ok) throw new Error(`Falha na IA (${res.status}).`);
  return (await res.json()) as ChatJson;
}

function stripFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

/** Pede um JSON ao modelo e devolve o objeto já convertido. */
export async function askJson<T>(system: string, prompt: string): Promise<T> {
  const json = await chat({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: `${system}\nResponda APENAS com JSON válido, sem markdown.` },
      { role: "user", content: prompt },
    ],
  });
  const content = json.choices?.[0]?.message?.content ?? "";
  return JSON.parse(stripFences(content)) as T;
}

/**
 * Igual ao askJson, mas com busca na web ativada para dados que mudam com o tempo
 * (executivos, faturamento, endereço). Cai para o modo normal se a busca falhar.
 */
export async function askJsonGrounded<T>(system: string, prompt: string): Promise<T> {
  const today = new Date().toISOString().slice(0, 10);
  const sys =
    `${system}\nData de hoje: ${today}. Use a busca na web para confirmar TODOS os dados que mudam com o tempo ` +
    `(executivos, cargos, sede, faturamento, número de funcionários) e considere apenas as informações mais recentes ` +
    `disponíveis nesta data. Se houver troca recente de executivo, informe o ocupante atual, nunca o anterior.\n` +
    `Responda APENAS com JSON válido, sem markdown.`;
  const messages = [
    { role: "system", content: sys },
    { role: "user", content: prompt },
  ];
  let content = "";
  try {
    const json = await chat({ model: TEXT_MODEL, messages, tools: [{ type: "google_search" }] });
    content = json.choices?.[0]?.message?.content ?? "";
    return JSON.parse(stripFences(content)) as T;
  } catch {
    const json = await chat({ model: TEXT_MODEL, messages });
    return JSON.parse(stripFences(json.choices?.[0]?.message?.content ?? "")) as T;
  }
}

/** Public-source discovery must fail rather than silently falling back to ungrounded guesses. */
export async function askJsonGroundedOnly<T>(system: string, prompt: string): Promise<T> {
  const result = await chat({model: TEXT_MODEL, messages: [{role:"system",content:system},{role:"user",content:prompt}], tools:[{type:"google_search"}]});
  return JSON.parse(stripFences(result.choices?.[0]?.message?.content ?? "")) as T;
}

/** Pede um JSON ao modelo a partir de um arquivo (PDF) enviado como anexo. */
export async function askJsonWithFile<T>(
  system: string,
  prompt: string,
  file: { name: string; dataUrl: string },
): Promise<T> {
  const json = await chat({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: `${system}\nResponda APENAS com JSON válido, sem markdown.` },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "file", file: { filename: file.name, file_data: file.dataUrl } },
        ],
      },
    ],
  });
  const content = json.choices?.[0]?.message?.content ?? "";
  return JSON.parse(stripFences(content)) as T;
}


/** Texto livre gerado pelo modelo. */
export async function askText(system: string, prompt: string): Promise<string> {
  const json = await chat({
    model: TEXT_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

/** Gera uma imagem e devolve uma data URL pronta para uso. */
export async function askImage(prompt: string): Promise<string | null> {
  const json = await chat({
    model: IMAGE_MODEL,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
  });
  return json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
}
