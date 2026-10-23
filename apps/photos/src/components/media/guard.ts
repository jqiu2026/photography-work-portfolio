/**
 * Capture and save detection for ScreenshotGuard. Pure functions so every combination is unit-tested.
 *
 * Honest scope (docs/project/05-security-and-image-protection.md): a web page can only see keys the browser receives.
 * OS-level screenshot shortcuts, phone gestures, cameras and screen recorders are invisible to it. This is a deterrent.
 */
export type KeyLike = {
  key: string;
  code?: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export type GuardLevel = "off" | "light" | "strict";
/** What the guard noticed. `capture` is a page calling the screen-capture API; `devtools-open` is the docked-devtools size heuristic. */
export type GuardEventKind = Trigger["kind"] | "capture" | "devtools-open";
export type GuardEvent = { kind: GuardEventKind; combo: string };
/** Per-use settings. Every field defaults to the strict behavior described on ScreenshotGuard. */
export type GuardOptions = {
  /** Hide protected media while the tab or window is not focused (capture tools take focus). Default true. */
  blurOnLeave?: boolean;
  /** No text selection on the page (form fields excepted). Default true. */
  blockSelection?: boolean;
  /** No right-click menu or drag on protected media. Default true. */
  blockContextMenu?: boolean;
  /** Cancel Ctrl/Cmd+S and +P. Default true. */
  blockPrint?: boolean;
  /** Treat a docked devtools panel (a large gap between outer and inner window size) as a trigger. Default true. */
  detectDevtools?: boolean;
  /** Protected media stays blurred until the pointer or Shift is held down. Default false. */
  holdToView?: boolean;
  /** Your own wording for the reminder dialog (the heading and the message). */
  title?: string;
  message?: string;
  /** On touch screens, half of each photograph stays blurred; pressing and holding moves the blur away. Default false. */
  mobileHalfBlur?: boolean;
  /** Show the reminder dialog on a trigger. Default true. */
  showDialog?: boolean;
  /** Called for every trigger (the app can log it or lock the session). */
  onEvent?: (e: GuardEvent) => void;
};

/** True when the window looks like it has a docked devtools panel. Pure, so it is unit-tested. */
export function devtoolsDocked(
  w: { outerWidth: number; innerWidth: number; outerHeight: number; innerHeight: number },
  gap = 200,
) {
  return w.outerWidth - w.innerWidth > gap || w.outerHeight - w.innerHeight > gap;
}
export type Trigger = { kind: "screenshot" | "save" | "print" | "source" | "devtools"; combo: string };

const digit = (e: KeyLike) => (e.code?.startsWith("Digit") ? e.code.slice(5) : e.key);
const letter = (e: KeyLike) => (e.code?.startsWith("Key") ? e.code.slice(3).toLowerCase() : e.key.toLowerCase());
const MODIFIER_KEYS = new Set(["Shift", "Alt", "AltGraph", "Control", "Meta", "OS", "Fn", "FnLock", "CapsLock"]);
/** True for a key that is only a modifier (Shift, Option, Command...). */
export const isModifierKey = (e: KeyLike) => MODIFIER_KEYS.has(e.key);

/** Which of Command/Win, Control, Option/Alt and Shift are down. */
export function heldModifiers(e: KeyLike) {
  const held: string[] = [];
  if (e.metaKey) held.push("Cmd");
  if (e.ctrlKey) held.push("Ctrl");
  if (e.altKey) held.push("Opt");
  if (e.shiftKey) held.push("Shift");
  return held;
}

/**
 * How the modifier keys alone should be treated while a photograph is on screen:
 *  - "hide": Shift or Option/Alt on its own (capture tools are driven by them). Command and Control alone stay free so
 *    people can still copy a link or a line of text.
 *  - "combo": two or more modifiers together, which is how nearly every screenshot, recording and devtools shortcut
 *    starts, including the ones the browser never receives the last key of.
 *  - null: nothing worth reacting to.
 */
export function modifierState(e: KeyLike): "hide" | "combo" | null {
  const held = heldModifiers(e);
  if (held.length >= 2) return "combo";
  if (held.length === 1 && (e.shiftKey || e.altKey)) return "hide";
  return null;
}

const FUNCTION_SCREEN = /^(PrintScreen|Print|Snapshot)$/;

/** Returns what a key press looks like, or null when it is an ordinary key. */
export function detectTrigger(e: KeyLike): Trigger | null {
  const mod = Boolean(e.ctrlKey || e.metaKey);
  const l = letter(e);
  const d = digit(e);
  if (FUNCTION_SCREEN.test(e.key) || FUNCTION_SCREEN.test(e.code ?? ""))
    return {
      kind: "screenshot",
      combo: [...heldModifiers(e), "PrintScreen"].join("+"),
    };
  // macOS: Cmd+Shift+3 / 4 / 5 / 6 / 7 / 8 / 9, with or without Control (copy to clipboard) and Option
  if (e.metaKey && e.shiftKey && ["3", "4", "5", "6", "7", "8", "9"].includes(d))
    return { kind: "screenshot", combo: `${heldModifiers(e).join("+")}+${d}` };
  // Windows: Win+Shift+S (Snipping Tool), Win+Alt+R (Game Bar record), Win+Alt+PrtScn
  if (e.metaKey && e.shiftKey && l === "s") return { kind: "screenshot", combo: "Win+Shift+S" };
  if (e.metaKey && e.altKey && ["r", "g"].includes(l))
    return { kind: "screenshot", combo: `Win+Alt+${l.toUpperCase()}` };
  // Firefox built-in screenshot tool
  if (e.ctrlKey && e.shiftKey && !e.metaKey && l === "s") return { kind: "screenshot", combo: "Ctrl+Shift+S" };
  // Chromebook: Ctrl+Show windows, Ctrl+Shift+Show windows
  if (e.ctrlKey && (e.key === "F5" || e.code === "F5")) return { kind: "screenshot", combo: "Ctrl+F5" };
  if (e.key === "F12") return { kind: "devtools", combo: "F12" };
  // Chrome/Edge/Firefox devtools: Ctrl+Shift+I/J/C/K/E/M/P ; Safari/Chrome on macOS: Cmd+Opt+I/J/C/U/E
  if (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k", "e", "m"].includes(l))
    return { kind: "devtools", combo: `Ctrl+Shift+${l.toUpperCase()}` };
  if (e.metaKey && e.shiftKey && !e.altKey && l === "c") return { kind: "devtools", combo: "Cmd+Shift+C" };
  if (e.metaKey && e.altKey && ["i", "j", "c", "k", "e"].includes(l))
    return { kind: "devtools", combo: `Cmd+Opt+${l.toUpperCase()}` };
  if (e.metaKey && e.altKey && l === "u") return { kind: "source", combo: "Cmd+Opt+U" };
  if (mod && !e.shiftKey && !e.altKey) {
    const who = e.metaKey ? "Cmd" : "Ctrl";
    if (l === "s") return { kind: "save", combo: `${who}+S` };
    if (l === "p") return { kind: "print", combo: `${who}+P` };
    if (l === "u") return { kind: "source", combo: `${who}+U` };
  }
  return null;
}

/** Honest copy, shown in the dialog and mirrored in the admin help text. */
export const guardCopy = {
  title: "Please don't capture these photographs",
  body: "Screenshots and saving are discouraged to protect the photographer's work. If you'd like to use an image, please get in touch for a license.",
  action: "OK, I understand",
} as const;
