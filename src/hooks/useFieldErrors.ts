import { useState } from "react";
import { toast } from "sonner";

export const MISSING_FIELDS_MESSAGE =
  "Informações ausentes. Preencha todos os campos obrigatórios destacados em vermelho.";

function isEmpty(value: unknown) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "boolean") return value === false;
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Validação padrão de campos obrigatórios: marca em vermelho os campos vazios
 * quando o usuário envia o formulário e bloqueia o envio até o preenchimento.
 */
export function useFieldErrors() {
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  /** Valida os campos obrigatórios. Retorna true quando tudo está preenchido. */
  function validate(fields: Record<string, unknown>, message = MISSING_FIELDS_MESSAGE) {
    const next: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (isEmpty(value)) next[key] = true;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(message);
      return false;
    }
    return true;
  }

  /** true quando o campo foi marcado como ausente e continua vazio. */
  function hasError(key: string, value?: unknown) {
    if (!errors[key]) return false;
    return value === undefined ? true : isEmpty(value);
  }

  /** Classe de borda vermelha para aplicar no input. */
  function errorClass(key: string, value?: unknown) {
    return hasError(key, value) ? " border-destructive" : "";
  }

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  /** Props para inputs não controlados: limpa o erro ao digitar. */
  function fieldProps(key: string, baseClass: string) {
    return {
      onInput: () => clearError(key),
      onChange: () => clearError(key),
      className: `${baseClass}${errorClass(key)}`,
    };
  }

  function clearErrors() {
    setErrors({});
  }

  return { errors, setErrors, validate, hasError, errorClass, clearError, fieldProps, clearErrors };
}
