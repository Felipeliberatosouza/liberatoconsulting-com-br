import { describe, expect, it } from "vitest";
import { collectSitemapRows } from "./sitemap-pagination";

describe("sitemap public content pagination", () => {
  it("includes every row beyond a single page", async () => {
    const rows = Array.from({ length: 1101 }, (_, id) => ({ id }));
    const result = await collectSitemapRows(async (from, to) => ({ data: rows.slice(from, to + 1), error: null }));
    expect(result).toHaveLength(1101);
    expect(result[1100]?.id).toBe(1100);
  });
  it("rejects a later query failure rather than returning partial content", async () => {
    await expect(collectSitemapRows(async (from) => from === 0
      ? { data: Array.from({ length: 500 }, (_, id) => id), error: null }
      : { data: null, error: { message: "Access denied" } },
    )).rejects.toThrow("Access denied");
  });
});