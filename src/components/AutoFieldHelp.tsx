import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { HelpTip } from "@/components/ProjectFlowGuide";
import { fieldHelpText } from "@/lib/field-help";

const SELECTOR = "label, th, h2, h3, legend, [data-slot=card-title]";

/**
 * Adds a "?" explanation next to every field label and box title inside the
 * scope element. Texts come from the shared field-help dictionary.
 */
export function AutoFieldHelp({ scope }: { scope: RefObject<HTMLElement | null> }) {
  const [targets, setTargets] = useState<Array<{ host: HTMLElement; text: string }>>([]);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const scan = () => {
      const found: Array<{ host: HTMLElement; text: string }> = [];
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.closest("[data-no-auto-help], [role=dialog]:not([data-auto-help-ok])")) return;
        let host = el.querySelector<HTMLElement>(":scope > [data-auto-help]");
        const label = (el.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!label || label.length > 90) return;
        if (!host && el.querySelector("button[aria-label], [aria-haspopup]")) return;
        const text = fieldHelpText(label);
        if (!text) return;
        if (!host) {
          host = document.createElement("span");
          host.dataset.autoHelp = "1";
          host.className = "ml-1 inline-flex align-middle normal-case";
          el.appendChild(host);
        }
        found.push({ host, text });
      });
      setTargets((prev) =>
        prev.length === found.length && prev.every((p, i) => p.host === found[i]!.host && p.text === found[i]!.text) ? prev : found,
      );
    };
    scan();
    const obs = new MutationObserver(() => requestAnimationFrame(scan));
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [scope]);

  return <>{targets.map((t, i) => createPortal(<HelpTip text={t.text} label="O que é este campo" />, t.host, `h${i}`))}</>;
}
