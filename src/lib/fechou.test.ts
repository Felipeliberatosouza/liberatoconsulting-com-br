import { expect, it } from "vitest";
import { demoDeals, demoStages, importDeal, managed, metrics, urgency } from "./fechou";
it("marca como vencida após os três dias da prospecção e não alerta vendas encerradas", () => {
  expect(urgency(demoStages[0], "2026-11-16T00:00:00Z", Date.parse("2026-11-19T00:00:00Z"))).toBe(
    "late",
  );
  expect(urgency(demoStages[4], "2026-11-16T00:00:00Z", Date.parse("2026-11-19T00:00:00Z"))).toBe(
    "closed",
  );
});
it("calcula vendas ganhas e conversão apenas sobre oportunidades encerradas", () => {
  const result = metrics(demoDeals(), demoStages);
  expect(result.revenue).toBe(29500);
  expect(result.conversion).toBeCloseTo(66.67);
});
it("aceita valor brasileiro e mantém a etapa informada na planilha", () => {
  expect(
    importDeal({ empresa: "Ipê", etapa: "Proposta", valor: "1.200,50" }, demoStages, "ana"),
  ).toMatchObject({ amount: 1200.5, stage_id: "2", owner_id: "ana" });
  expect(() => importDeal({ empresa: "Ipê", etapa: "Inexistente" }, demoStages, "ana")).toThrow();
});
it("permite gerenciar prazos e metas apenas a gestores e administradores", () => {
  expect([managed("seller"), managed("manager"), managed("admin")]).toEqual([false, true, true]);
});

it("imports updates by exact ID without reassigning the responsible seller", () => {
  const rows = demoDeals();
  const d = rows[0];
  if (!d) throw new Error("Demo sample missing");
  expect(
    importDeal(
      { id: d.id, empresa: "Aurora Nova", valor: "20", fundacao: "2020-11-19" },
      demoStages,
      "other",
      rows,
    ),
  ).toMatchObject({ id: d.id, owner_id: d.owner_id, founded_on: "2020-11-19" });
  expect(importDeal({ id: d.id, valor: "32" }, demoStages, "other", rows)).toMatchObject({
    company: d.company,
    contact: d.contact,
    amount: 32,
  });
  expect(() =>
    importDeal({ id: "missing", empresa: "Aurora" }, demoStages, "other", rows),
  ).toThrow();
});
