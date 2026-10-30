"use client";

import { useEffect } from "react";

/**
 * Discourages copying: no context menu, drag, selection, copy/cut, save/print/view-source shortcuts.
 * This cannot stop a determined person (a screenshot or the browser's network tab still works); it only makes
 * casual saving of the pictures a deliberate act.
 */
export function Protect() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const inMail = (e: Event) => e.target instanceof Element && !!e.target.closest(".mail");
    const select = (e: Event) => {
      if (!inMail(e)) e.preventDefault();
    };
    const hide = () => {
      document.documentElement.style.display = "none";
    };
    const show = () => {
      document.documentElement.style.display = "";
    };
    const key = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["s", "p", "u", "a", "c", "x"].includes(k)) return stop(e);
      if (mod && e.shiftKey && ["i", "j", "c", "s"].includes(k)) return stop(e);
      if (k === "f12" || k === "printscreen") {
        stop(e);
        navigator.clipboard?.writeText("").catch(() => {});
      }
    };
    document.addEventListener("contextmenu", stop);
    document.addEventListener("dragstart", stop);
    document.addEventListener("copy", stop);
    document.addEventListener("cut", stop);
    document.addEventListener("selectstart", select);
    document.addEventListener("keydown", key);
    window.addEventListener("beforeprint", hide);
    window.addEventListener("afterprint", show);
    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("dragstart", stop);
      document.removeEventListener("copy", stop);
      document.removeEventListener("cut", stop);
      document.removeEventListener("selectstart", select);
      document.removeEventListener("keydown", key);
      window.removeEventListener("beforeprint", hide);
      window.removeEventListener("afterprint", show);
    };
  }, []);
  return null;
}
