/**
 * Endereços curtos: o link específico após a "/" usa no máximo duas palavras
 * significativas do título, ignorando artigos, preposições e conectivos.
 */
const STOP = new Set([
  // português
  "a","o","as","os","um","uma","uns","umas","de","do","da","dos","das","em","no","na","nos","nas",
  "por","para","pra","com","sem","sob","sobre","ao","aos","à","às","e","ou","que","se","como",
  "entre","até","mais","menos","seu","sua","seus","suas","este","esta","esse","essa","aquele",
  "aquela","isso","isto","the","of","and","or","for","to","in","on","at","with","from","by","a",
  "an","is","are","how","what","why","el","la","los","las","un","una","del","al","y","con","por",
  "para","que","como","es",
]);

function normalize(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ");
}

/**
 * Gera um slug curto e memorizável: até `maxWords` palavras significativas,
 * mantendo os conectivos curtos entre elas (ex.: "ponto-de-equilibrio").
 */
export function shortSlug(title: string, maxWords = 2) {
  const words = normalize(title)
    .split(/[\s-]+/)
    .filter(Boolean);
  const isStrong = (w: string) => w.length > 2 && !STOP.has(w);
  if (!words.some(isStrong)) return words.slice(0, maxWords).join("-").slice(0, 40);
  const picked: string[] = [];
  let strong = 0;
  for (const w of words) {
    if (isStrong(w)) {
      picked.push(w);
      if (++strong >= maxWords) break;
    } else if (strong > 0) picked.push(w);
  }
  return picked.join("-").slice(0, 40).replace(/^-+|-+$/g, "");
}

/** Garante endereço único acrescentando -2, -3… somente quando necessário. */
export async function uniqueShortSlug(
  client: any,
  table: string,
  base: string,
  fallback: string,
  currentId: string | null = null,
) {
  const root = base || fallback;
  for (let i = 0; i < 30; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const { data } = await client.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === currentId) return candidate;
  }
  return `${root}-${Date.now().toString(36).slice(-3)}`;
}
