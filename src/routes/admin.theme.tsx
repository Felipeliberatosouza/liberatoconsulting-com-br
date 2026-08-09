import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/AdminShell";
import { getSiteConfig, saveTheme } from "@/lib/admin.functions";
import { THEME_FIELDS, applyTheme, type Theme } from "@/lib/site-config";

export const Route = createFileRoute("/admin/theme")({
  head: () => ({
    meta: [
      { title: "Cores do site — Painel Liberato" },
      { name: "description", content: "Ajuste a paleta principal do site." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Cores do site — Painel Liberato" },
      { property: "og:description", content: "Ajuste a paleta principal do site." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminTheme,
});

function AdminTheme() {
  const [theme, setTheme] = useState<Theme>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSiteConfig()
      .then((c) => setTheme(c.theme ?? {}))
      .catch(() => undefined);
  }, []);

  function update(key: string, value: string) {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
  }

  return (
    <AdminShell
      title="Cores do site"
      description="Escolha as cores da paleta principal. A pré-visualização é imediata; clique em salvar para publicar."
    >
      <div className="max-w-2xl space-y-4 rounded-lg border border-border bg-background p-6">
        {THEME_FIELDS.map((f) => {
          const value = theme[f.key] ?? f.fallback;
          return (
            <div key={f.key} className="flex items-center gap-4">
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : f.fallback}
                onChange={(e) => update(f.key, e.target.value)}
                className="size-10 cursor-pointer rounded border border-input bg-background"
                aria-label={f.label}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{f.label}</p>
                <input
                  value={value}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="mt-1 w-40 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs outline-none focus:border-accent"
                />
              </div>
            </div>
          );
        })}

        <div className="flex gap-3 pt-4">
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await saveTheme({ data: theme as Record<string, string> });
                if (r.ok) toast.success("Cores salvas.");
                else toast.error(r.error);
              } catch {
                toast.error("Não foi possível salvar.");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
          >
            {busy ? "Salvando…" : "Salvar cores"}
          </button>
          <button
            onClick={() => {
              const reset: Theme = {};
              setTheme(reset);
              applyTheme(reset);
            }}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Restaurar padrão
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
