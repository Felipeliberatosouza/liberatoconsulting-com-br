import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

import { trackSiteEvent } from "@/lib/crm-track.functions";

const KEY = "lc_visitor_id";

/** Identificador aleatório do visitante, guardado só no navegador dele. */
export function visitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function kindFor(path: string): "page" | "service" | "brasil" | "content" {
  if (path.startsWith("/services")) return "service";
  if (path.startsWith("/brasil")) return "brasil";
  if (path.startsWith("/content")) return "content";
  return "page";
}

/** Registra as áreas do site navegadas, para o histórico do CRM. */
export function CrmTracker() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    const id = visitorId();
    if (!id) return;
    const timer = window.setTimeout(() => {
      void trackSiteEvent({
        data: {
          visitorId: id,
          kind: kindFor(pathname),
          path: pathname,
          label: document.title.slice(0, 200),
          lang: document.documentElement.lang || "pt",
          referrer: document.referrer.slice(0, 300),
        },
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
