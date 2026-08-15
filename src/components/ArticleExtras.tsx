/** Tabela, gráfico e vídeo opcionais exibidos dentro do texto de um conteúdo. */

function parseTable(markdown: string) {
  const lines = markdown
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  const rows = lines
    .filter((l) => !/^\|[\s:-]+\|$/.test(l.replace(/\s/g, "")))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim()),
    )
    .filter((cells) => cells.some((c) => c && !/^:?-+:?$/.test(c)));
  if (rows.length === 0) return null;
  const [head, ...body] = rows;
  return { head: head ?? [], body };
}

export function ArticleTable({ data }: { data: string }) {
  const table = parseTable(data);
  if (!table) return null;
  return (
    <div className="mt-10 overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {table.head.map((c, i) => (
              <th key={i} className="px-4 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.body.map((row, i) => (
            <tr key={i} className="border-t border-border/60">
              {row.map((c, j) => (
                <td key={j} className="px-4 py-3 align-top text-foreground/90">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseChart(raw: string) {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  let title = "";
  const series: Array<{ label: string; value: number }> = [];
  for (const line of lines) {
    const t = /^t[ií]tulo\s*:\s*(.+)$/i.exec(line);
    if (t) {
      title = t[1] ?? "";
      continue;
    }
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 2) {
      const value = Number(String(parts[1]).replace(",", "."));
      if (Number.isFinite(value)) series.push({ label: parts[0] ?? "", value });
    }
  }
  return series.length ? { title, series } : null;
}

export function ArticleChart({ data }: { data: string }) {
  const chart = parseChart(data);
  if (!chart) return null;
  const max = Math.max(...chart.series.map((s) => Math.abs(s.value)), 1);
  return (
    <figure className="mt-10 rounded-lg border border-border p-6">
      {chart.title && (
        <figcaption className="mb-4 text-sm font-semibold text-foreground">{chart.title}</figcaption>
      )}
      <div className="space-y-3">
        {chart.series.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">{s.label}</span>
            <div className="h-3 flex-1 rounded-full bg-secondary">
              <div
                className="h-3 rounded-full bg-accent"
                style={{ width: `${Math.max(2, (Math.abs(s.value) / max) * 100)}%` }}
              />
            </div>
            <span className="w-16 shrink-0 text-right text-xs font-semibold">{s.value}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** Converte um link de YouTube/Vimeo em endereço de incorporação. */
function embedUrl(url: string) {
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(url);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

export function ArticleVideo({ url, title }: { url: string; title: string }) {
  if (!url) return null;
  const embed = embedUrl(url);
  if (embed) {
    return (
      <div className="mt-10 aspect-video w-full overflow-hidden rounded-lg border border-border">
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="h-full w-full"
        />
      </div>
    );
  }
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return (
      <video controls preload="metadata" className="mt-10 w-full rounded-lg border border-border">
        <source src={url} />
      </video>
    );
  }
  return null;
}
