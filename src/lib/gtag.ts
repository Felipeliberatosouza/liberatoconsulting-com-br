declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = "G-44WQ42SD3T";

export function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...a: unknown[]) {
      window.dataLayer!.push(a);
    };
  window.gtag(...args);
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const clean = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined),
  );
  gtag("event", name, clean);
}

export function trackPageView(path: string) {
  gtag("event", "page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    send_to: GA_MEASUREMENT_ID,
  });
}
