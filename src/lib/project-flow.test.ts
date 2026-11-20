import { describe, expect, it } from "vitest";
import { nextProjectFlow, type ProjectFlow } from "./project-flow";

describe("project stage handoff", () => {
  it("keeps the client, scope, diagnostic and exact quote through every stage", () => {
    let flow: ProjectFlow = { clientName: "LHS", serviceSlug: "crm-sob-medida", scopeId: "scope-lhs", diagId: "diag-lhs", quoteId: "quote-lhs" };
    for (const stage of [1, 2, 3, 4, 5, 6] as const) flow = nextProjectFlow(flow, {}, stage, { value: stage });
    expect(flow.clientName).toBe("LHS");
    expect(flow.quoteId).toBe("quote-lhs");
    expect(flow.scopeId).toBe("scope-lhs");
    expect(flow.diagId).toBe("diag-lhs");
    expect(flow.drafts?.[3]).toEqual({ value: 3 });
  });
  it("retains unsaved pricing and scenarios on forward and backward navigation", () => {
    const pricing = { clientName: "LHS", days: 1000, scenarios: [{ reducePct: 73.03, price: 700 }] };
    const flow = nextProjectFlow(nextProjectFlow({}, { clientName: "LHS" }, 3, pricing), {}, 4, { name: "LHS" });
    expect(flow.drafts?.[3]).toEqual(pricing);
  });
  it("does not carry another client's quotes or stage drafts", () => {
    const next = nextProjectFlow({ clientName: "LHS", quoteId: "old-quote", drafts: { 4: { name: "LHS" } } }, { clientName: "Tiki" }, 1, { company: "Tiki" });
    expect(next.quoteId).toBeUndefined();
    expect(next.drafts?.[4]).toBeUndefined();
  });
});