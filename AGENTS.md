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
