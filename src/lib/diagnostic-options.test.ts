import { expect, it } from "vitest";
import { parseDiagnosticOptions } from "./diagnostic-options";

it("accepts semicolon-separated answer alternatives", () => {
  expect(parseDiagnosticOptions("Sim; Não")).toEqual(["Sim", "Não"]);
});

it("preserves words within an answer alternative", () => {
  expect(parseDiagnosticOptions("Ainda não sabemos")).toEqual(["Ainda não sabemos"]);
});

it("omits unfinished empty alternatives from saved questions", () => {
  expect(parseDiagnosticOptions(" Sim; ; Não; ")).toEqual(["Sim", "Não"]);
  expect(parseDiagnosticOptions("")).toEqual([]);
});