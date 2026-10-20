import { z } from "zod";
import type { ToolSpec, ToolInput, ToolContextField } from "./tool-engine";

export function completedMonths(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")?.value);
  const month = Number(parts.find(p => p.type === "month")?.value);
  return Array.from({ length: 36 }, (_, i) => {
    const date = new Date(Date.UTC(year, month - 2 - i, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function contextKind(f: ToolContextField) {
  if (/mes_referencia|mês de referência/i.test(`${f.id} ${f.label}`)) return "month";
  if (/criterio_rateio|critério de rateio/i.test(`${f.id} ${f.label}`)) return "allocation";
  return "text";
}

export function prefillCompany(fields: ToolContextField[], context: Record<string, string>, company: string | null | undefined): Record<string, string> {
  const filled = { ...context };
  if (!company?.trim()) return filled;
  for (const field of fields) {
    if (/^(empresa|company|company_name|nome_empresa|nome_da_empresa)$/.test(field.id) || /^(nome da empresa|company name|nombre de la empresa|公司名称)(\s|$)/i.test(field.label)) {
      if (filled[field.id] === undefined) filled[field.id] = company.trim();
    }
  }
  return filled;
}

export function inputKind(i: ToolInput): "currency" | "percent" | "integer" | "decimal" {
  if (/R\$/.test(i.unit)) return "currency";
  if (/%/.test(i.unit)) return "percent";
  if (/unidades|quantidade/i.test(`${i.unit} ${i.label}`)) return "integer";
  return "decimal";
}

export function parseBrazilianNumber(value: string) {
  const clean = value.replace(/R\$|%|\s/g, "");
  if (!/^-?\d+(?:\.\d{3})*(?:,\d{1,2})?$/.test(clean)) return NaN;
  return Number(clean.replace(/\./g, "").replace(",", "."));
}

export function formatInput(value: string, kind: ReturnType<typeof inputKind>) {
  const number = parseBrazilianNumber(value);
  if (!Number.isFinite(number)) return value;
  if (kind === "currency") return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (kind === "percent") return `${number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  return number.toLocaleString("pt-BR", { maximumFractionDigits: kind === "integer" ? 0 : 2 });
}

export const ALLOCATION_OPTIONS = [
  "Atribuição integral — único produto ou serviço (100%)",
  "Receita de vendas / faturamento",
  "Volume de unidades vendidas ou produzidas",
  "Horas de mão de obra / tempo de atendimento",
  "Horas de máquina / utilização de equipamentos",
  "Área ocupada (m²)",
  "Capacidade utilizada / capacidade normal",
  "Custos diretos do item",
  "Custo de mão de obra direta",
  "Consumo de materiais",
  "Número de pessoas / funcionários",
  "Consumo medido de energia ou outros recursos",
  "Pedidos, lotes, setups ou entregas",
  "Clientes, usuários ou contatos atendidos",
  "Peso, distância ou ocupação de armazenagem",
  "Atividades (ABC) — pedidos, lotes, setups, atendimentos",
  "Tempo das atividades (TDABC)",
  "Critérios combinados por centro de custo",
  "Divisão igual entre itens comparáveis",
  "Percentual acordado com justificativa",
  "Outro critério justificado",
] as const;

export function validateIntake(spec: ToolSpec, context: Record<string, string>, inputs: Record<string, number>, now = new Date()): string | null {
  for (const f of spec.context_fields) {
    const value = context[f.id];
    if (!z.string().trim().min(1).max(200).safeParse(value).success) return `Preencha "${f.label}".`;
    if (contextKind(f) === "month" && !completedMonths(now).includes(value ?? "")) return "Selecione um mês completo dos últimos 36 meses.";
    if (contextKind(f) === "allocation") {
      const selected = ALLOCATION_OPTIONS.find(option => value === option || value?.startsWith(`${option}: `));
      if (!selected) return "Selecione um critério de rateio válido.";
      if (selected === "Outro critério justificado" && (!value?.startsWith(`${selected}: `) || value.slice(selected.length + 2).trim().length < 3)) return "Descreva o outro critério de rateio.";
    }
  }
  for (const i of spec.inputs) {
    if (!z.number().finite().safeParse(inputs[i.id]).success) return `Informe "${i.label}".`;
    if (inputKind(i) === "integer" && !Number.isInteger(inputs[i.id])) return `"${i.label}" deve ser um número inteiro.`;
  }
  return null;
}