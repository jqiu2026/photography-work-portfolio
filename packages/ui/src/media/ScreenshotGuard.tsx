"use client";

import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { guardCopy, type GuardLevel, detectTrigger } from "./guard";

type Ctx = { level: GuardLevel; setScopeLevel: (l: GuardLevel | null) => void };
const GuardContext = createContext<Ctx>({ level: "off", setScopeLevel: () => {} });

/** The protection level currently in force (so images know whether to use the strict path). */
export const useGuardLevel = () => useContext(GuardContext).level;

/** Put inside a page to raise or lower the level for just that page (e.g. a strict gallery). */
export function GuardScope({ level }: { level: GuardLevel }) {
  const { setScopeLevel } = useContext(GuardContext);
  useEffect(() => {
    setScopeLevel(level);
    return () => setScopeLevel(null);
  }, [level, setScopeLevel]);
  return null;
}

const PROTECTED = ".ph-img, [data-protected]";

/**
 * Deterrent against casual copying (never a lock):
 *  - light: no right-click menu or drag-to-desktop on images, no text selection on them.
 *  - strict: also reacts to screenshot, save, print, view-source and devtools shortcuts by hiding protected media and
 *    showing a short, polite dialog; hides media while the tab or window loses focus (capture tools steal focus);
 *    clears the clipboard after PrintScreen (best effort). Print output hides protected media (CSS).
 * It cannot see OS-level screenshots taken without the browser noticing, phone screenshot gestures, cameras or screen
 * recorders, and it is switched off by disabling JavaScript. Alt text and keyboard use are never affected.
 */
export function ScreenshotGuard({ level = "light", children }: { level?: GuardLevel; children: ReactNode }) {
  const [scope, setScope] = useState<GuardLevel | null>(null);
  const effective = scope ?? level;
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ok = useRef<HTMLButtonElement>(null);
  const dialogOpen = useRef(false);

  const hide = useCallback((on: boolean) => {
    document.documentElement.classList.toggle("ph-guard-hide", on);
  }, []);

  const trigger = useCallback(
    (combo: string) => {
      hide(true);
      dialogOpen.current = true;
      setOpen(combo);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        dialogOpen.current = false;
        setOpen(null);
        hide(false);
      }, 3000);
    },
    [hide],
  );

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    dialogOpen.current = false;
    setOpen(null);
    hide(false);
  }, [hide]);

  useEffect(() => {
    const root = document.documentElement;
    if (effective === "off") {
      root.removeAttribute("data-guard");
      return;
    }
    root.setAttribute("data-guard", effective);
    const onMenu = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(PROTECTED)) e.preventDefault();
    };
    document.addEventListener("contextmenu", onMenu);
    document.addEventListener("dragstart", onMenu);
    if (effective !== "strict") {
      return () => {
        document.removeEventListener("contextmenu", onMenu);
        document.removeEventListener("dragstart", onMenu);
        root.removeAttribute("data-guard");
      };
    }
    const onKey = (e: KeyboardEvent) => {
      const t = detectTrigger(e);
      if (!t) return;
      if (t.kind === "save" || t.kind === "print") e.preventDefault();
      trigger(t.combo);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard?.writeText("").catch(() => {});
        trigger("PrintScreen");
      }
    };
    let restore: ReturnType<typeof setTimeout> | undefined;
    const onLeave = () => hide(true);
    const onReturn = () => {
      clearTimeout(restore);
      restore = setTimeout(() => dialogOpen.current || hide(false), 300);
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? onLeave() : onReturn());
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onLeave);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("contextmenu", onMenu);
      document.removeEventListener("dragstart", onMenu);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(restore);
      hide(false);
      root.removeAttribute("data-guard");
    };
  }, [effective, hide, trigger]);

  useEffect(() => {
    if (open) ok.current?.focus();
  }, [open]);

  const ctx = useMemo(() => ({ level: effective, setScopeLevel: setScope }), [effective]);
  return (
    <GuardContext.Provider value={ctx}>
      {children}
      {open ? (
        <div className="ph-guard" role="presentation">
          <div
            className="ph-guard__box"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ph-guard-title"
            aria-describedby="ph-guard-body"
            onKeyDown={(e) => e.key === "Escape" && dismiss()}
          >
            <h2 id="ph-guard-title">{guardCopy.title}</h2>
            <p id="ph-guard-body">{guardCopy.body}</p>
            <p className="ph-guard__note">{guardCopy.note}</p>
            <button ref={ok} type="button" className="ph-btn ph-btn--solid" onClick={dismiss}>
              {guardCopy.action}
            </button>
          </div>
        </div>
      ) : null}
    </GuardContext.Provider>
  );
}
