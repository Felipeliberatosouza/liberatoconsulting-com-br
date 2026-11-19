import { expect, it } from 'vitest';
import { demoDeals, demoStages, importDeal, managed, metrics, urgency } from './fechou';
it('marca como vencida após os três dias da prospecção e não alerta vendas encerradas', () => {
  expect(urgency(demoStages[0], '2026-11-16T00:00:00Z', Date.parse('2026-11-19T00:00:00Z'))).toBe('late');
  expect(urgency(demoStages[4], '2026-11-16T00:00:00Z', Date.parse('2026-11-19T00:00:00Z'))).toBe('closed');
});
it('calcula vendas ganhas e conversão apenas sobre oportunidades encerradas', () => {
  const result = metrics(demoDeals(),demoStages);
  expect(result.revenue).toBe(29500);
  expect(result.conversion).toBeCloseTo(66.67);
});
it('aceita valor brasileiro e mantém a etapa informada na planilha', () => {
  expect(importDeal({empresa:'Ipê', etapa:'Proposta', valor:'1.200,50'}, demoStages, 'ana')).toMatchObject({amount:1200.5,stage_id:'2',owner_id:'ana'});
  expect(() => importDeal({empresa:'Ipê',etapa:'Inexistente'}, demoStages,'ana')).toThrow();
});
it('permite gerenciar prazos e metas apenas a gestores e administradores', () => {
  expect([managed('seller'),managed('manager'),managed('admin')]).toEqual([false,true,true]);
});
