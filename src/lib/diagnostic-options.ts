/** Normalize stored choices without changing the editor's raw text. */
export function parseDiagnosticOptions(text: string): string[] {
  return text.split(";").map(option => option.trim()).filter(Boolean);
}