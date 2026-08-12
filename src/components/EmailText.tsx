import type { ReactNode } from "react";

const EMAIL_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/gi;

/** Converte e-mails presentes em um texto em links mailto clicáveis. */
export function linkifyEmails(text: string): ReactNode[] {
  const parts = text.split(EMAIL_RE);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={`mailto:${part}`}
        data-allow-copy
        className="font-medium text-accent underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function EmailText({ children }: { children: string }) {
  return <>{linkifyEmails(children)}</>;
}
