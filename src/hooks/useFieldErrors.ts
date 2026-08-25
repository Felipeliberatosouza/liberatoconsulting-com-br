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
    return hasError(key, value) ? " border-destructive ring-1 ring-destructive" : "";
  }

  /**
   * Classe completa do input: remove a cor de borda padrão quando há erro,
   * para que o vermelho realmente apareça (evita conflito com `border-input`).
   */
  function inputClass(base: string, key: string, value?: unknown) {
    if (!hasError(key, value)) return base;
    const cleaned = base
      .split(/\s+/)
      .filter((c) => c !== "border-input" && !c.startsWith("focus:border-"))
      .join(" ");
    return `${cleaned} border-destructive ring-1 ring-destructive`;
  }

  /** Atributos de acessibilidade do campo inválido. */
  function a11yProps(key: string, value?: unknown) {
    const invalid = hasError(key, value);
    return invalid
      ? ({ "aria-invalid": true, "aria-describedby": `${key}-error` } as const)
      : ({ "aria-invalid": undefined, "aria-describedby": undefined } as const);
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

  return {
    errors,
    setErrors,
    validate,
    hasError,
    errorClass,
    inputClass,
    a11yProps,
    clearError,
    fieldProps,
    clearErrors,
  };
}
