import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { HelpTip } from "@/components/ProjectFlowGuide";
import { fieldHelpText } from "@/lib/field-help";

const SELECTOR = "label, th, h2, h3, legend, [data-slot=card-title]";

const CONTROLS = "input, select, textarea";

function ownText(el: HTMLElement): string {
  let t = "";
  el.childNodes.forEach((n) => {
    if (n instanceof HTMLElement && (n.matches(CONTROLS) || n.dataset["autoHelp"] || n.querySelector(CONTROLS))) return;
    t += n.textContent ?? "";
  });
  return t.replace(/\s+/g, " ").trim();
}

/**
 * Adds a "?" explanation next to every field label and box title inside the
 * scope element. Texts come from the shared field-help dictionary.
 */
export function AutoFieldHelp({ scope, parent }: { scope: RefObject<HTMLElement | null>; parent?: boolean }) {
  const [targets, setTargets] = useState<Array<{ host: HTMLElement; text: string }>>([]);

  useEffect(() => {
    let root: HTMLElement | null | undefined = parent ? scope.current?.parentElement : scope.current;
    while (parent && root?.parentElement && root.childElementCount === 1) root = root.parentElement;
    if (!root) return;
    const scan = () => {
      const found: Array<{ host: HTMLElement; text: string }> = [];
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (el.closest("[data-no-auto-help], [role=dialog]:not([data-auto-help-ok])")) return;
        let host = el.querySelector<HTMLElement>("[data-auto-help]");
        const label = ownText(el);
        if (!label || label.length > 90) return;
        if (!host && el.querySelector("button[aria-label], [aria-haspopup]")) return;
        const text = fieldHelpText(label);
        if (!text) return;
        if (!host) {
          host = document.createElement("span");
          host.dataset["autoHelp"] = "1";
          host.className = "ml-1 inline-flex align-middle normal-case";
          const lead = el.firstElementChild;
          const control = Array.from(el.children).find((c) => c.matches(CONTROLS) || c.querySelector(CONTROLS));
          if (lead && lead.tagName === "SPAN" && lead !== control && !lead.querySelector(CONTROLS)) lead.appendChild(host);
          else if (control && control !== el.firstElementChild) el.insertBefore(host, control);
          else el.appendChild(host);
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
  }, [scope, parent]);

  return <>{targets.map((t, i) => createPortal(<HelpTip text={t.text} label="O que é este campo" />, t.host, `h${i}`))}</>;
}
