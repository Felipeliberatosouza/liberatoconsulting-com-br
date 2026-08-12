import { useEffect } from "react";

/** Bloqueia cópia, recorte, arrasto e menu de contexto no site público. */
export function CopyProtection() {
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const node = el as HTMLElement | null;
      if (!node || typeof node.closest !== "function") return false;
      return !!node.closest("input, textarea, select, [contenteditable='true'], [data-allow-copy]");
    };

    const block = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.body.classList.add("no-copy");

    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.body.classList.remove("no-copy");
    };
  }, []);

  return null;
}
