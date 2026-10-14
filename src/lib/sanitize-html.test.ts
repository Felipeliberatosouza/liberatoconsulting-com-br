import { describe, it, expect } from "vitest";
import { sanitizeEmailHtml } from "./sanitize-html";
describe("sanitizeEmailHtml", () => {
  it("removes scripts", () => expect(sanitizeEmailHtml('<p>a</p><script>alert(1)</script>')).toBe("<p>a</p>"));
  it("removes event handlers", () => expect(sanitizeEmailHtml('<img src="x.png" onerror="alert(1)">')).toBe('<img src="x.png">'));
  it("neutralizes javascript links", () => expect(sanitizeEmailHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a href="#">x</a>'));
  it("keeps tables", () => expect(sanitizeEmailHtml('<table><tr><td>1</td></tr></table>')).toBe('<table><tr><td>1</td></tr></table>'));
});
