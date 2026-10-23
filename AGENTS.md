<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Interactive management tools: AI only writes a JSON spec with formulas; all math runs in `src/lib/tool-engine.ts` (no eval) and every spec must pass its own test cases plus an AI audit before publishing — prevents calculation errors from the model.
- Tool payments go through Asaas (`interactive-tools.server.ts`, webhook `/api/public/asaas-webhook`); card data is only typed on Asaas' hosted page, never stored here — keeps the app out of PCI scope.
- Propaganda and tool marketing share AdEditor in components (never import components from route modules, which are code-split); promotion uses existing published-tool lists and a separate browser canvas composer so it cannot change formulas or access rules.
- Tool intake uses shared field classification and validation on client and server, preserving spec formulas and storing canonical month periods and numeric values to prevent formatting from changing calculations.
- Tool company defaults use the authenticated tools account and shared intake helper; explicit user edits take precedence, including empty values, so late account loading never overwrites input.

- Every generated public URL slug uses `shortSlug`/`uniqueShortSlug` from src/lib/short-slug.ts (max 2 meaningful words, -2/-3 only on collision, no random/timestamp suffixes) — links must be short and memorable.
- Prospect email kit (banner PNG + 3-slide summary PPTX/PDF) is built in the browser from current admin data (src/lib/prospect-kit*.ts), stored in the presentations bucket under prospect-kit/, and attached server-side (banner inline via CID) — keeps the HTML small for deliverability and reflects admin edits.
- Commercial presentation rules live in a shared browser-safe module and both exporters use the same drawing board; logo background decisions are scoped by logo role, while pixel contrast, resource ranking and size-selected duration are deterministic, not AI decisions, to keep PDF/PPT consistent.
- Quotes opened from a diagnostic convert its modules via `src/lib/diagnostic-quote.ts` with a rate/markup override in `buildQuote`, so the quote total always equals the diagnostic price.
- Company size everywhere uses Sebrae portes from `src/lib/company-size.ts` (`normalizePorte` maps legacy pme/corporacao); project client pickers list one entry per client name (`buildProjectClients`).
