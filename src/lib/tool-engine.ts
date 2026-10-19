/**
 * Motor de cálculo determinístico das ferramentas de gestão.
 * A IA só escreve as fórmulas; todas as contas são feitas aqui, em código,
 * sem eval e sem nenhuma dependência de modelo de linguagem.
 */

export type ToolInput = { id: string; label: string; unit: string; help: string; min: number | null; max: number | null };
export type ToolContextField = { id: string; label: string };
export type OutputFormat = "currency" | "number" | "integer" | "percent";
export type ToolOutput = { id: string; label: string; unit: string; formula: string; format: OutputFormat; explanation: string };
export type ToolChart = {
  type: "line" | "none";
  title: string;
  x_input: string | null;
  x_label: string;
  x_max_formula: string | null;
  series: Array<{ label: string; formula: string }>;
};
export type ToolRecommendation = { condition: string; text: string };
export type ToolTestCase = { inputs: Array<{ id: string; value: number }>; expected: Array<{ id: string; value: number }> };
export type ToolSpec = {
  title: string;
  summary: string;
  category: string;
  methodology: string;
  context_fields: ToolContextField[];
  inputs: ToolInput[];
  outputs: ToolOutput[];
  chart: ToolChart;
  recommendations: ToolRecommendation[];
  test_cases: ToolTestCase[];
};

type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

const FUNCS: Record<string, (...a: number[]) => number> = {
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  abs: (a) => Math.abs(a),
  round: (a, d = 0) => { const f = 10 ** d; return Math.round((a + Number.EPSILON) * f) / f; },
  ceil: (a) => Math.ceil(a - 1e-9),
  floor: (a) => Math.floor(a + 1e-9),
  sqrt: (a) => { if (a < 0) throw new CalcError("Raiz de número negativo."); return Math.sqrt(a); },
  if: (c, a, b) => (c ? a : b),
};

export class CalcError extends Error {}

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j]!)) j++;
      const v = Number(src.slice(i, j)); if (!Number.isFinite(v)) throw new CalcError(`Número inválido: ${src.slice(i, j)}`);
      out.push({ t: "num", v }); i = j; continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < src.length && /[A-Za-z0-9_]/.test(src[j]!)) j++;
      out.push({ t: "id", v: src.slice(i, j) }); i = j; continue;
    }
    const two = src.slice(i, i + 2);
    if ([">=", "<=", "==", "!="].includes(two)) { out.push({ t: "op", v: two }); i += 2; continue; }
    if ("+-*/^(),<>".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    throw new CalcError(`Caractere não permitido na fórmula: ${c}`);
  }
  return out;
}

type Node =
  | { k: "num"; v: number }
  | { k: "var"; v: string }
  | { k: "un"; op: string; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "call"; f: string; args: Node[] };

function parse(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => { const t = peek(); return t?.t === "op" && t.v === v; };
  const expect = (v: string) => { if (!isOp(v)) throw new CalcError(`Esperado "${v}" na fórmula.`); p++; };
  function cmp(): Node {
    let a = add();
    while (peek()?.t === "op" && [">", "<", ">=", "<=", "==", "!="].includes((peek() as { v: string }).v)) { const op = (toks[p++] as { v: string }).v; a = { k: "bin", op, a, b: add() }; }
    return a;
  }
  function add(): Node {
    let a = mul();
    while (isOp("+") || isOp("-")) { const op = (toks[p++] as { v: string }).v; a = { k: "bin", op, a, b: mul() }; }
    return a;
  }
  function mul(): Node {
    let a = unary();
    while (isOp("*") || isOp("/")) { const op = (toks[p++] as { v: string }).v; a = { k: "bin", op, a, b: unary() }; }
    return a;
  }
  function unary(): Node {
    if (isOp("-")) { p++; return { k: "un", op: "-", a: unary() }; }
    if (isOp("+")) { p++; return unary(); }
    return pow();
  }
  function pow(): Node {
    const a = atom();
    if (isOp("^")) { p++; return { k: "bin", op: "^", a, b: unary() }; }
    return a;
  }
  function atom(): Node {
    const t = toks[p++];
    if (!t) throw new CalcError("Fórmula incompleta.");
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "id") {
      if (isOp("(")) {
        p++;
        const f = t.v.toLowerCase();
        if (!FUNCS[f]) throw new CalcError(`Função não permitida: ${t.v}`);
        const args: Node[] = [];
        if (!isOp(")")) { args.push(cmp()); while (isOp(",")) { p++; args.push(cmp()); } }
        expect(")");
        return { k: "call", f, args };
      }
      return { k: "var", v: t.v };
    }
    if (t.v === "(") { const e = cmp(); expect(")"); return e; }
    throw new CalcError(`Símbolo inesperado: ${t.v}`);
  }
  const node = cmp();
  if (p !== toks.length) throw new CalcError("Fórmula com sobra de símbolos.");
  return node;
}

function evalNode(n: Node, vars: Record<string, number>): number {
  switch (n.k) {
    case "num": return n.v;
    case "var": {
      if (!(n.v in vars)) throw new CalcError(`Variável desconhecida: ${n.v}`);
      return vars[n.v]!;
    }
    case "un": return -evalNode(n.a, vars);
    case "call": {
      if (n.f === "if") { if (n.args.length !== 3) throw new CalcError("if precisa de 3 argumentos."); return evalNode(n.args[0]!, vars) ? evalNode(n.args[1]!, vars) : evalNode(n.args[2]!, vars); }
      return FUNCS[n.f]!(...n.args.map((a) => evalNode(a, vars)));
    }
    case "bin": {
      const a = evalNode(n.a, vars), b = evalNode(n.b, vars);
      switch (n.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": if (Math.abs(b) < 1e-12) throw new CalcError("Divisão por zero."); return a / b;
        case "^": return a ** b;
        case ">": return a > b ? 1 : 0;
        case "<": return a < b ? 1 : 0;
        case ">=": return a >= b ? 1 : 0;
        case "<=": return a <= b ? 1 : 0;
        case "==": return Math.abs(a - b) < 1e-9 ? 1 : 0;
        case "!=": return Math.abs(a - b) >= 1e-9 ? 1 : 0;
      }
    }
  }
  throw new CalcError("Expressão inválida.");
}

/** Calcula uma fórmula isolada com as variáveis informadas. */
export function evaluate(formula: string, vars: Record<string, number>): number {
  const v = evalNode(parse(formula), vars);
  if (!Number.isFinite(v)) throw new CalcError("Resultado não é um número finito.");
  return v;
}

export function variablesOf(formula: string): string[] {
  return tokenize(formula).filter((t, i, all) => t.t === "id" && !(all[i + 1]?.t === "op" && (all[i + 1] as { v: string }).v === "(")).map((t) => t.v as string);
}

export type RunResult =
  | { ok: true; values: Record<string, number>; recommendations: string[]; chart: Array<Record<string, number>> | null }
  | { ok: false; error: string };

/** Executa a ferramenta inteira: valida entradas, calcula saídas em ordem e monta o gráfico. */
export function runTool(spec: ToolSpec, inputs: Record<string, number>): RunResult {
  try {
    const vars: Record<string, number> = {};
    for (const inp of spec.inputs) {
      const v = inputs[inp.id];
      if (v === undefined || !Number.isFinite(v)) return { ok: false, error: `Informe "${inp.label}".` };
      if (inp.min !== null && v < inp.min) return { ok: false, error: `"${inp.label}" deve ser no mínimo ${inp.min}.` };
      if (inp.max !== null && v > inp.max) return { ok: false, error: `"${inp.label}" deve ser no máximo ${inp.max}.` };
      vars[inp.id] = v;
    }
    for (const out of spec.outputs) vars[out.id] = evaluate(out.formula, vars);
    const recommendations = spec.recommendations.filter((r) => { try { return evaluate(r.condition, vars) !== 0; } catch { return false; } }).map((r) => r.text);
    let chart: Array<Record<string, number>> | null = null;
    const c = spec.chart;
    if (c.type === "line" && c.x_input && c.x_max_formula && c.series.length) {
      const xMax = evaluate(c.x_max_formula, vars);
      if (xMax > 0) {
        chart = [];
        for (let i = 0; i <= 20; i++) {
          const x = (xMax * i) / 20;
          const point: Record<string, number> = { x };
          const local = { ...vars, [c.x_input]: x };
          c.series.forEach((s, idx) => { point[`s${idx}`] = evaluate(s.formula, local); });
          chart.push(point);
        }
      }
    }
    return { ok: true, values: vars, recommendations, chart };
  } catch (err) {
    return { ok: false, error: err instanceof CalcError ? `Não foi possível calcular: ${err.message}` : "Não foi possível calcular com esses dados." };
  }
}

/** Checa a estrutura da ferramenta e roda todos os casos de teste. Devolve a lista de problemas. */
export function verifySpec(spec: ToolSpec): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  const idRe = /^[a-z][a-z0-9_]{0,40}$/;
  if (!spec.inputs.length) issues.push("A ferramenta não tem campos de entrada.");
  if (!spec.outputs.length) issues.push("A ferramenta não tem resultados.");
  for (const x of [...spec.inputs, ...spec.outputs]) {
    if (!idRe.test(x.id)) issues.push(`Identificador inválido: ${x.id}`);
    if (ids.has(x.id)) issues.push(`Identificador repetido: ${x.id}`);
    if (FUNCS[x.id]) issues.push(`Identificador reservado: ${x.id}`);
    ids.add(x.id);
  }
  const known = new Set(spec.inputs.map((i) => i.id));
  for (const out of spec.outputs) {
    try { for (const v of variablesOf(out.formula)) if (!known.has(v)) issues.push(`"${out.label}" usa "${v}", que não existe antes dele.`); parse(out.formula); }
    catch (e) { issues.push(`Fórmula de "${out.label}" inválida: ${(e as Error).message}`); }
    known.add(out.id);
  }
  if (spec.chart.type === "line") {
    if (!spec.chart.x_input || !spec.inputs.some((i) => i.id === spec.chart.x_input)) issues.push("O gráfico precisa variar um campo de entrada existente.");
    for (const s of spec.chart.series) { try { parse(s.formula); } catch (e) { issues.push(`Série "${s.label}" inválida: ${(e as Error).message}`); } }
  }
  if (spec.test_cases.length < 2) issues.push("São necessários pelo menos 2 casos de teste.");
  spec.test_cases.forEach((tc, n) => {
    const inputs = Object.fromEntries(tc.inputs.map((i) => [i.id, i.value]));
    const r = runTool(spec, inputs);
    if (!r.ok) { issues.push(`Caso de teste ${n + 1}: ${r.error}`); return; }
    for (const e of tc.expected) {
      const got = r.values[e.id];
      if (got === undefined) { issues.push(`Caso ${n + 1}: resultado "${e.id}" não existe.`); continue; }
      const tol = Math.max(0.01, Math.abs(e.value) * 0.001);
      if (Math.abs(got - e.value) > tol) issues.push(`Caso ${n + 1}: "${e.id}" deu ${got}, esperado ${e.value}.`);
    }
  });
  return issues;
}

export function formatValue(v: number, format: OutputFormat, unit = ""): string {
  if (format === "currency") return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (format === "percent") return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
  if (format === "integer") return `${Math.ceil(v - 1e-9).toLocaleString("pt-BR")}${unit ? ` ${unit}` : ""}`;
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}

/** Preço de venda = custo de IA × (1 + markup%), arredondado para cima em centavos. */
export function priceFromCost(costBrl: number, markupPct: number): number {
  return Math.ceil(costBrl * (1 + markupPct / 100) * 100 - 1e-9) / 100;
}
