/** Datas exibidas na Central de usuários: cadastro e última modificação. */
export function fmtDate(d?: string | null) {
  if (!d) return "—";
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? "—" : t.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Última modificação = a data mais recente entre as informadas (cadastro, atualização, descadastro). */
export function lastChange(...dates: Array<string | null | undefined>) {
  let best: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    if (!best || t > new Date(best).getTime()) best = d;
  }
  return best;
}

export function firstDate(...dates: Array<string | null | undefined>) {
  let best: string | null = null;
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    if (!best || t < new Date(best).getTime()) best = d;
  }
  return best;
}
