import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

/** Lista suspensa com seleção de várias opções (caixas de marcação). Vazio = "qualquer". */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className = "",
}: {
  options: Array<string | Option>;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const opts: Option[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelOf = (v: string) => opts.find((o) => o.value === v)?.label ?? v;
  const summary =
    value.length === 0 ? placeholder : value.length <= 2 ? value.map(labelOf).join(", ") : `${value.length} selecionados`;
  const shown = q ? opts.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) : opts;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${className} flex items-center justify-between text-left disabled:opacity-60`}
      >
        <span className="truncate">{summary}</span>
        <span className="ml-2 text-xs text-muted-foreground">▾</span>
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          {opts.length > 8 && (
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar…"
              className="w-full border-b border-border bg-background px-3 py-2 text-sm outline-none"
            />
          )}
          <div className="flex justify-between border-b border-border px-3 py-1.5 text-xs">
            <button type="button" className="text-accent hover:underline" onClick={() => onChange(opts.map((o) => o.value))}>
              Marcar todos
            </button>
            <button type="button" className="text-muted-foreground hover:underline" onClick={() => onChange([])}>
              Limpar
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {shown.map((o) => (
              <li key={o.value}>
                <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted">
                  <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
                  {o.label}
                </label>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-2 text-xs text-muted-foreground">Nenhuma opção</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
