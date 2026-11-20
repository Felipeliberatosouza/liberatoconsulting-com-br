import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { QuoteOptions, QuoteResult, QuoteScenario } from "./pricing-catalog";

export type ProjectStage = 1 | 2 | 3 | 4 | 5 | 6;
export type ProjectFlow = {
  clientName?: string;
  serviceSlug?: string;
  scopeId?: string;
  diagId?: string;
  quoteId?: string;
  presentationId?: string;
  quoteDraft?: { slug: string; title: string; clientName: string; quote: QuoteResult; options: QuoteOptions; notes: string; scenarios: QuoteScenario[] };
  drafts?: Partial<Record<ProjectStage, unknown>>;
};

/** Changing the client/scope starts a different project, never reuses its descendants. */
export function nextProjectFlow<T>(previous: ProjectFlow, patch: ProjectFlow, stage: ProjectStage, draft: T): ProjectFlow {
  const changed = (patch.scopeId && previous.scopeId && patch.scopeId !== previous.scopeId) ||
    (patch.clientName && previous.clientName && patch.clientName.trim().toLowerCase() !== previous.clientName.trim().toLowerCase());
  const base = changed ? {} : previous;
  return { ...base, ...patch, drafts: { ...base.drafts, [stage]: draft } };
}

/** Drafts stay in this browser's query cache, scoped to the verified account, not in URLs. */
export function useProjectFlow<T>(stage: ProjectStage, draft: T, restore: (draft: T) => void) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const session = useQuery<{ userId: string }>({ queryKey: ["panel-session"], enabled: false });
  const userId = session.data?.userId;
  const key = ["project-flow", userId];
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  useEffect(() => {
    if (!userId) return;
    const saved = qc.getQueryData<ProjectFlow>(["project-flow", userId])?.drafts?.[stage];
    if (saved) restoreRef.current(saved as T);
  }, [qc, stage, userId]);
  function context(): ProjectFlow { return userId ? qc.getQueryData<ProjectFlow>(key) ?? {} : {}; }
  function remember(patch: ProjectFlow = {}, draftPatch?: Partial<T>) {
    const next = nextProjectFlow(context(), patch, stage, draftPatch ? { ...draft, ...draftPatch } : draft);
    if (userId) qc.setQueryData(key, next);
    return next;
  }
  function go(target: { n: ProjectStage; to: string }, patch: ProjectFlow = {}, draftPatch?: Partial<T>) {
    const next = remember(patch, draftPatch);
    const search = target.n === 2 && next.scopeId ? { escopo: next.scopeId } :
      target.n === 3 ? { aba: "quote", ...(next.diagId ? { diag: next.diagId } : {}) } :
      target.n === 5 && next.clientName ? { cliente: next.clientName } : {};
    void navigate({ to: target.to as never, search: search as never });
  }
  return { context, remember, go, userId };
}