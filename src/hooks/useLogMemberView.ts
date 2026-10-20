import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import { logMemberActivity } from "@/lib/activity.functions";

/** Registra a leitura de uma página apenas quando o visitante está logado. */
export function useLogMemberView(kind: "newsletter" | "article", refId: string, label: string) {
  useEffect(() => {
    if (!refId) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      void logMemberActivity({ data: { kind, refId, label, path: window.location.pathname } }).catch(() => {});
    });
  }, [kind, refId, label]);
}
