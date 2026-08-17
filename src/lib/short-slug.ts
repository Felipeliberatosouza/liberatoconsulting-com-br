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

/** Gera um slug curto (1 a 2 palavras) a partir de um título. */
export function shortSlug(title: string, maxWords = 2) {
  const words = normalize(title)
    .split(/[\s-]+/)
    .filter(Boolean);
  const strong = words.filter((w) => w.length > 2 && !STOP.has(w));
  const picked = (strong.length ? strong : words).slice(0, maxWords);
  return picked.join("-").slice(0, 40).replace(/^-+|-+$/g, "");
}
