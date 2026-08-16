import { useQuery } from "@tanstack/react-query";

import { useAuthReady } from "@/hooks/useAuthReady";
import { listAuthorOptions } from "@/lib/users.functions";

type Props = {
  /** Lista de autores separada por vírgula. */
  authors: string;
  /** Contato (e-mails) preenchido automaticamente a partir dos autores. */
  onChange: (authors: string, contact: string) => void;
  invalid?: boolean;
  id?: string;
};

/**
 * Seleção de autores a partir do cadastro de usuários (admin, autor, consultor).
 * O contato é preenchido automaticamente com os e-mails dos autores marcados.
 */
export function AuthorPicker({ authors, onChange, invalid, id }: Props) {
  const authReady = useAuthReady();
  const options = useQuery({
    queryKey: ["author-options"],
    queryFn: () => listAuthorOptions(),
    retry: false,
    enabled: authReady,
  });

  const list = authors
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div
      id={id}
      className={`max-h-40 space-y-1 overflow-auto rounded-md border p-2 text-sm font-normal ${
        invalid ? "border-destructive bg-destructive/5" : "border-input bg-background"
      }`}
    >
      {(options.data ?? []).length === 0 && (
        <p className="text-xs text-muted-foreground">
          {options.isLoading
            ? "Carregando…"
            : "Nenhum usuário com papel de administrador, autor ou consultor."}
        </p>
      )}
      {(options.data ?? []).map((a) => (
        <label key={a.userId} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={list.includes(a.name)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...list, a.name]
                : list.filter((n) => n !== a.name);
              const emails = (options.data ?? [])
                .filter((o) => next.includes(o.name) && o.email)
                .map((o) => o.email);
              onChange(next.join(", "), emails.join(", "));
            }}
          />
          {a.name}
        </label>
      ))}
    </div>
  );
}
