import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/**
 * Indica se a sessão do Supabase já foi carregada no navegador.
 * Serve para atrasar chamadas a server functions protegidas até que o
 * token de acesso exista — caso contrário a requisição sai sem o header
 * `Authorization` e o servidor responde "Unauthorized".
 */
export function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setReady(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return ready;
}
