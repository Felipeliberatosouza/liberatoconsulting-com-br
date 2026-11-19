import { useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { prospectFechou } from "@/lib/fechou-prospect.functions";
import type { DealInput } from "@/lib/fechou";

export function Prospecting({
  workspace,
  fill,
}: {
  workspace: string;
  fill: (draft: Partial<DealInput>) => void;
}) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof prospectFechou>>>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="mt-6 grid gap-5">
      <h2 className="text-xl font-bold">Encontrar empresas</h2>
      <form
        className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setError("");
          setResults(undefined);
          try {
            setResults(
              await prospectFechou({
                data: {
                  workspace,
                  segment: String(f.get("segment")),
                  location: String(f.get("location")),
                  profile: String(f.get("profile")),
                },
              }),
            );
          } catch {
            setError("Não foi possível buscar. Confira se o perfil é público ou tente novamente.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="grid gap-1 text-sm">
          Tipo de empresa
          <Input name="segment" maxLength={100} placeholder="Ex.: indústrias de alimentos" />
        </label>
        <label className="grid gap-1 text-sm">
          Localização
          <Input name="location" maxLength={120} placeholder="Ex.: Campinas, SP" />
        </label>
        <label className="grid gap-1 text-sm">
          Perfil público (opcional)
          <Input name="profile" type="url" maxLength={300} placeholder="LinkedIn ou Instagram" />
        </label>
        <Button disabled={busy}>
          <Search />
          {busy ? "Pesquisando…" : "Buscar empresas"}
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {results &&
        (!results.length ? (
          <p role="status" className="text-sm text-muted-foreground">
            Nenhuma empresa encontrada em fontes públicas.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.map((r, i) => (
              <li key={i} className="grid gap-2 rounded-lg border border-border bg-background p-4">
                <h3 className="font-bold">{r.company}</h3>
                <p className="text-sm text-muted-foreground">
                  {[r.segment, r.city].filter(Boolean).join(" · ")}
                </p>
                {r.notes && <p className="text-sm">{r.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={r.source} target="_blank" rel="noreferrer">
                      Conferir fonte
                      <ExternalLink />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      fill({
                        company: r.company,
                        segment: r.segment,
                        linkedin: r.linkedin,
                        instagram: r.instagram,
                        notes: [r.city, r.notes, `Fonte: ${r.source}`].filter(Boolean).join("\n"),
                      })
                    }
                  >
                    Revisar cadastro
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </section>
  );
}
