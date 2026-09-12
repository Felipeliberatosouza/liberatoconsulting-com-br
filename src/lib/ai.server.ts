const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const TEXT_MODEL = "google/gemini-3-flash-preview";
export const IMAGE_MODEL = "google/gemini-3-pro-image-preview";

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("IA indisponível: chave não configurada.");
  return key;
}

async function chat(body: Record<string, unknown>) {
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey() },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente em instantes.");
  if (res.status === 402) throw new Error("Créditos de IA esgotados.");
  if (!res.ok) throw new Error(`Falha na IA (${res.status}).`);
  return (await res.json()) as {
    choices: Array<{
      message: {
        content?: string;
        images?: Array<{ image_url?: { url?: string } }>;
      };
    }>;
  };
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
