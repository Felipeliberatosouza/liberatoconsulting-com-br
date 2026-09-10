/** Validações compartilhadas entre o formulário do painel e o servidor. */

export function onlyDigits(value: string) {
  return (value ?? "").replace(/\D+/g, "");
}

/* ------------------------------- celular ------------------------------- */

export const PHONE_PLACEHOLDER = "+55 (11) 99999-9999";
export const PHONE_ERROR =
  "Informe um número internacional válido com DDI. Para o Brasil, use +55 (11) 99999-9999.";

/**
 * Máscara progressiva internacional. O +55 é apenas a sugestão inicial:
 * quando o valor começa com outro DDI, ele é preservado e continua editável.
 */
export function formatPhone(value: string) {
  const trimmed = (value ?? "").trim();
  const digits = onlyDigits(trimmed).slice(0, 15);
  if (!digits) return trimmed.startsWith("+") ? "+" : "";

  const explicitInternational = trimmed.startsWith("+");
  const normalized = explicitInternational || digits.startsWith("55") ? digits : `55${digits}`;

  if (normalized.startsWith("55")) {
    const national = normalized.slice(2, 13);
    if (!national.length) return "+55";
    if (national.length <= 2) return `+55 (${national}`;
    if (national.length <= 7) return `+55 (${national.slice(0, 2)}) ${national.slice(2)}`;
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }

  // Outros países permanecem em formato E.164 legível e sem DDI fixo.
  return `+${normalized}`;
}

export function isValidPhone(value: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed.startsWith("+")) return false;
  const digits = onlyDigits(trimmed);

  if (digits.startsWith("55")) {
    const national = digits.slice(2);
    return /^[1-9][0-9]9[0-9]{8}$/.test(national);
  }

  // E.164: DDI não iniciado em zero e entre 8 e 15 dígitos no total.
  return /^[1-9][0-9]{7,14}$/.test(digits);
}

/* --------------------------------- CPF --------------------------------- */

export function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

export function isValidCpf(value: string) {
  const d = onlyDigits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i += 1) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}

/* --------------------------- CNPJ e inscrições --------------------------- */

/** CNPJ: 00.000.000/0000-00 */
export function formatCnpj(value: string) {
  const d = onlyDigits(value).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12, 14)}`;
  return out;
}

export function isValidCnpj(value: string) {
  return onlyDigits(value).length === 14;
}

/** Inscrição estadual: 000.000.000.000 */
export function formatStateRegistration(value: string) {
  const d = onlyDigits(value).slice(0, 12);
  return (d.match(/.{1,3}/g) ?? []).join(".");
}

/** Inscrição municipal (CCM): 0.000.000-0 */
export function formatMunicipalRegistration(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  let out = d.slice(0, 1);
  if (d.length > 1) out += `.${d.slice(1, 4)}`;
  if (d.length > 4) out += `.${d.slice(4, 7)}`;
  if (d.length > 7) out += `-${d.slice(7, 8)}`;
  return out;
}

/* --------------------------------- CEP --------------------------------- */

export function formatCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function isValidCep(value: string) {
  return onlyDigits(value).length === 8;
}

/* -------------------------------- e-mail -------------------------------- */

export function isValidEmail(value: string) {
  const v = (value ?? "").trim();
  if (v.length < 6 || v.length > 255) return false;
  if (/\s/.test(v) || v.includes("..")) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v);
}

/* --------------------------------- senha -------------------------------- */

export type PasswordRule = { id: string; label: string; ok: boolean };

export function passwordRules(
  password: string,
  context: { fullName?: string; birthDate?: string; email?: string; cpf?: string } = {},
): PasswordRule[] {
  const pwd = password ?? "";
  const lower = pwd.toLowerCase();

  const parts = [
    ...(context.fullName ?? "").split(/\s+/),
    (context.email ?? "").split("@")[0] ?? "",
  ]
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length >= 3);

  const birth = onlyDigits(context.birthDate ?? "");
  const cpf = onlyDigits(context.cpf ?? "");
  const birthPieces = birth
    ? [birth, birth.slice(0, 4), birth.slice(4), birth.slice(2), `${birth.slice(6)}${birth.slice(4, 6)}${birth.slice(0, 4)}`]
    : [];
  const common = ["senha", "password", "123456", "12345678", "qwerty", "liberato", "admin"];

  const hasPersonal =
    parts.some((p) => lower.includes(p)) ||
    birthPieces.filter((b) => b && b.length >= 4).some((b) => onlyDigits(pwd).includes(b)) ||
    (cpf.length === 11 && pwd.includes(cpf)) ||
    common.some((c) => lower.includes(c));

  return [
    { id: "len", label: "Mínimo de 8 caracteres", ok: pwd.length >= 8 },
    { id: "upper", label: "Pelo menos 1 letra maiúscula", ok: /[A-Z]/.test(pwd) },
    { id: "number", label: "Pelo menos 1 número", ok: /\d/.test(pwd) },
    {
      id: "special",
      label: "Pelo menos 1 caractere especial (!@#$…)",
      ok: /[^A-Za-z0-9]/.test(pwd),
    },
    {
      id: "personal",
      label: "Sem dados pessoais óbvios (nome, e-mail, aniversário, CPF)",
      ok: pwd.length > 0 && !hasPersonal,
    },
  ];
}

export function isStrongPassword(
  password: string,
  context?: Parameters<typeof passwordRules>[1],
) {
  return passwordRules(password, context).every((r) => r.ok);
}
