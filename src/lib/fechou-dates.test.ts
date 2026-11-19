import { describe, expect, it } from "vitest";
import { emptyDeal, upcomingDates, type Deal } from "./fechou";
const deal = (x: Partial<Deal>) => ({ ...emptyDeal("s", "u"), id: "d", company: "Acme", ...x }) as Deal;
describe("upcomingDates", () => {
  it("lists birthdays within the window, soonest first, wrapping the year", () => {
    const r = upcomingDates([deal({ birth_date: "1990-01-05", founded_on: "2001-12-25" })], new Date("2026-12-20T12:00:00Z"));
    expect(r.map((x) => [x.kind, x.inDays])).toEqual([["empresa", 5], ["contato", 16]]);
  });
  it("ignores dates beyond the window", () => {
    expect(upcomingDates([deal({ birth_date: "1990-06-01" })], new Date("2026-01-01T00:00:00Z"))).toEqual([]);
  });
});
