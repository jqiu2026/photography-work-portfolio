"use client";

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, Text } from "@holominimal/ui";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  type GuardEventKind,
  type GuardLevel,
  type GuardOptions,
  detectTrigger,
  devtoolsDocked,
  guardCopy,
  heldModifiers,
  isModifierKey,
  modifierState,
} from "./guard";

type Ctx = {
  level: GuardLevel;
  setScopeLevel: (l: GuardLevel | null, options?: GuardOptions) => void;
  claim: () => () => void;
};
const GuardContext = createContext<Ctx>({ level: "off", setScopeLevel: () => {}, claim: () => () => {} });

/** The protection level currently in force (so images know whether to use the strict path). */
export const useGuardLevel = () => useContext(GuardContext).level;

/**
 * A protected photograph calls this while mounted: the guard runs at the strict level for as long as any photograph is
 * on the page (and drops back to the provider default when the last one goes), so text-only pages stay unrestricted.
 */
export function useGuardClaim() {
  const { claim } = useContext(GuardContext);
  useEffect(() => claim(), [claim]);
}

/** Put inside a page to raise or lower the level (and tune the options) for just that page, e.g. a strict gallery. */
export function GuardScope({ level, options }: { level: GuardLevel; options?: GuardOptions }) {
  const { setScopeLevel } = useContext(GuardContext);
  const opts = useRef(options);
  opts.current = options;
  useEffect(() => {
    setScopeLevel(level, opts.current);
    return () => setScopeLevel(null);
  }, [level, setScopeLevel]);
  return null;
}

const PROTECTED = ".pm-img, [data-protected]";

/**
 * Deterrent against casual copying (never a lock):
 *  - light: no right-click menu or drag-to-desktop on images, no text selection on them.
 *  - strict: also reacts to screenshot, save, print, view-source and devtools shortcuts by hiding protected media and
 *    showing a short, polite Holominimal alert dialog; hides media while the tab or window loses focus (capture tools
 *    steal focus); clears the clipboard after PrintScreen (best effort). Print output hides protected media (CSS).
 * It cannot see OS-level screenshots taken without the browser noticing, phone screenshot gestures, cameras or screen
 * recorders, and it is switched off by disabling JavaScript. Alt text and keyboard use are never affected.
 * The state classes on <html> (pm-guard-hide, pm-guard-conceal, pm-guard-reveal, pm-guard-half) are styled in
 * app/protection.css.
 */
export function ScreenshotGuard({ level = "light", children }: { level?: GuardLevel; children: ReactNode }) {
  const [scope, setScopeState] = useState<GuardLevel | null>(null);
  const optsRef = useRef<GuardOptions>({});
  const setScope = useCallback((l: GuardLevel | null, options?: GuardOptions) => {
    optsRef.current = l === null ? {} : (options ?? {});
    setScopeState(l);
  }, []);
  const [claims, setClaims] = useState(0);
  const effective = scope ?? (claims > 0 ? "strict" : level);
  const claim = useCallback(() => {
    setClaims((n) => n + 1);
    return () => setClaims((n) => Math.max(0, n - 1));
  }, []);
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogOpen = useRef(false);

  /**
   * Fade the photographs away (or back). `snap` skips the fade for the moment a capture shortcut is pressed, because a
   * photograph that is still fading out when the screen is grabbed has not been hidden.
   */
  const hide = useCallback((on: boolean, snap = false) => {
    const root = document.documentElement;
    if (on && snap) root.classList.add("pm-guard-snap");
    root.classList.toggle("pm-guard-hide", on);
    if (!on) setTimeout(() => root.classList.remove("pm-guard-snap"), 50);
  }, []);

  const trigger = useCallback(
    (combo: string, kind: GuardEventKind = "screenshot") => {
      optsRef.current.onEvent?.({ kind, combo });
      hide(true, true);
      if (optsRef.current.showDialog === false) {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => hide(false), 1500);
        return;
      }
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
    const o = optsRef.current;
    if (effective === "strict" && o.blockSelection !== false) root.setAttribute("data-guard-noselect", "");
    const onMenu = (e: Event) => {
      if (o.blockContextMenu === false && effective === "strict") return;
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
    let restore: ReturnType<typeof setTimeout> | undefined;
    // Shift or Option alone, or any two modifiers together, hide the photographs for as long as they are held (capture
    // tools start with them, and the browser often never sees the last key). Command or Control alone are left free.
    const editable = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    const inStudio = location.pathname.startsWith("/studio");
    let modifierHidden = false;
    let promptTimer: ReturnType<typeof setTimeout> | undefined;
    let promptShown = false;
    const syncModifiers = (e: KeyboardEvent) => {
      const state = modifierState(e);
      const want = state === "combo" || (state === "hide" && !editable(e.target) && !inStudio);
      if (want && !modifierHidden) {
        modifierHidden = true;
        hide(true, state === "combo");
        const combo = state === "combo" ? heldModifiers(e).join("+") : (heldModifiers(e)[0] ?? "Shift");
        optsRef.current.onEvent?.({ kind: "screenshot", combo: `${combo} held` });
        // the same reminder a capture shortcut shows, once the key has been held for a moment (a quick tap of Shift to
        // type a capital letter only fades the photographs, it does not raise a dialog)
        if (optsRef.current.showDialog !== false) {
          clearTimeout(promptTimer);
          promptTimer = setTimeout(
            () => {
              promptShown = true;
              dialogOpen.current = true;
              setOpen(`${combo} held`);
            },
            state === "combo" ? 0 : 250,
          );
        }
      } else if (!want && modifierHidden) {
        modifierHidden = false;
        clearTimeout(promptTimer);
        clearTimeout(restore);
        if (promptShown) {
          promptShown = false;
          restore = setTimeout(() => {
            dialogOpen.current = false;
            setOpen(null);
            if (document.hasFocus()) hide(false);
          }, 500);
        } else restore = setTimeout(() => dialogOpen.current || !document.hasFocus() || hide(false), 250);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      const t = detectTrigger(e);
      if (!t) {
        if (isModifierKey(e) || e.metaKey || e.ctrlKey || e.altKey) syncModifiers(e);
        return;
      }
      if ((t.kind === "save" || t.kind === "print") && o.blockPrint !== false) e.preventDefault();
      trigger(t.combo, t.kind);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (/^(PrintScreen|Print|Snapshot)$/.test(e.key)) {
        navigator.clipboard?.writeText("").catch(() => {});
        trigger("PrintScreen", "screenshot");
        return;
      }
      syncModifiers(e);
    };
    const onLeave = () => o.blurOnLeave !== false && hide(true);
    const onReturn = () => {
      clearTimeout(restore);
      restore = setTimeout(() => dialogOpen.current || hide(false), 200);
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? onLeave() : onReturn());
    // a page asking to record or share the screen is a capture attempt (it cannot see other tabs or other apps)
    const media = navigator.mediaDevices as
      | (MediaDevices & { getDisplayMedia?: MediaDevices["getDisplayMedia"] })
      | undefined;
    const originalCapture = media?.getDisplayMedia?.bind(media);
    if (media && originalCapture) {
      media.getDisplayMedia = () => {
        trigger("Screen capture API", "capture");
        return Promise.reject(new DOMException("Screen capture is not allowed on this page.", "NotAllowedError"));
      };
    }
    // docked devtools (best effort, off unless asked for): once per time it opens
    let devtoolsOpen = false;
    const devtoolsTimer = o.detectDevtools
      ? setInterval(() => {
          const docked = devtoolsDocked(window);
          if (docked && !devtoolsOpen) trigger("DevTools open", "devtools-open");
          devtoolsOpen = docked;
        }, 1000)
      : undefined;
    // hold to view: media is blurred until the pointer (or Shift) is held down
    let releaseHold: (() => void) | undefined;
    if (o.holdToView) {
      root.classList.add("pm-guard-conceal");
      const reveal = () => root.classList.add("pm-guard-reveal");
      const conceal = () => root.classList.remove("pm-guard-reveal");
      const keyDown = (e: KeyboardEvent) => e.key === "Shift" && reveal();
      const keyUp = (e: KeyboardEvent) => e.key === "Shift" && conceal();
      document.addEventListener("pointerdown", reveal);
      document.addEventListener("pointerup", conceal);
      document.addEventListener("pointercancel", conceal);
      document.addEventListener("keydown", keyDown);
      document.addEventListener("keyup", keyUp);
      window.addEventListener("blur", conceal);
      releaseHold = () => {
        document.removeEventListener("pointerdown", reveal);
        document.removeEventListener("pointerup", conceal);
        document.removeEventListener("pointercancel", conceal);
        document.removeEventListener("keydown", keyDown);
        document.removeEventListener("keyup", keyUp);
        window.removeEventListener("blur", conceal);
        root.classList.remove("pm-guard-conceal", "pm-guard-reveal");
      };
    }
    // touch screens: half of every photograph stays blurred; pressing and holding moves the blur away
    let releaseHalf: (() => void) | undefined;
    if (o.mobileHalfBlur && matchMedia("(pointer: coarse)").matches) {
      root.classList.add("pm-guard-half");
      const on = () => root.classList.add("pm-guard-half-off");
      const off = () => root.classList.remove("pm-guard-half-off");
      document.addEventListener("pointerdown", on);
      document.addEventListener("pointerup", off);
      document.addEventListener("pointercancel", off);
      releaseHalf = () => {
        document.removeEventListener("pointerdown", on);
        document.removeEventListener("pointerup", off);
        document.removeEventListener("pointercancel", off);
        root.classList.remove("pm-guard-half", "pm-guard-half-off");
      };
    }
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
      clearTimeout(promptTimer);
      clearInterval(devtoolsTimer);
      if (media && originalCapture) media.getDisplayMedia = originalCapture;
      releaseHold?.();
      releaseHalf?.();
      hide(false);
      root.removeAttribute("data-guard");
      root.removeAttribute("data-guard-noselect");
    };
  }, [effective, hide, trigger]);

  const ctx = useMemo(() => ({ level: effective, setScopeLevel: setScope, claim }), [effective, claim, setScope]);
  return (
    <GuardContext.Provider value={ctx}>
      {children}
      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && dismiss()}>
        <DialogContent size="sm" role="alertdialog" className="pm-guard" data-guard-dialog="">
          <DialogTitle>{optsRef.current.title || guardCopy.title}</DialogTitle>
          <DialogDescription>{optsRef.current.message || guardCopy.body}</DialogDescription>
          <Text size="sm" tone="muted">
            {guardCopy.note}
          </Text>
          <DialogFooter>
            <Button onClick={dismiss} autoFocus>
              {guardCopy.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GuardContext.Provider>
  );
}
