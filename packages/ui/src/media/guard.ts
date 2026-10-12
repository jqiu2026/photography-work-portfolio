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
export type Trigger = { kind: "screenshot" | "save" | "print" | "source" | "devtools"; combo: string };

const digit = (e: KeyLike) => (e.code?.startsWith("Digit") ? e.code.slice(5) : e.key);
const letter = (e: KeyLike) => (e.code?.startsWith("Key") ? e.code.slice(3).toLowerCase() : e.key.toLowerCase());

/** Returns what a key press looks like, or null when it is an ordinary key. */
export function detectTrigger(e: KeyLike): Trigger | null {
  const mod = Boolean(e.ctrlKey || e.metaKey);
  if (e.key === "PrintScreen" || e.code === "PrintScreen") return { kind: "screenshot", combo: "PrintScreen" };
  // macOS: Cmd+Shift+3 / 4 / 5 / 6 (the page often sees the keydown before the OS takes over)
  if (e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey && ["3", "4", "5", "6"].includes(digit(e)))
    return { kind: "screenshot", combo: `Cmd+Shift+${digit(e)}` };
  // Windows: Win+Shift+S (Snipping Tool)
  if (e.metaKey && e.shiftKey && letter(e) === "s") return { kind: "screenshot", combo: "Win+Shift+S" };
  if (e.key === "F12") return { kind: "devtools", combo: "F12" };
  // Chrome/Edge/Firefox devtools: Ctrl+Shift+I/J/C ; Safari/Chrome on macOS: Cmd+Opt+I/J/C
  if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(letter(e)))
    return { kind: "devtools", combo: `Ctrl+Shift+${letter(e).toUpperCase()}` };
  if (e.metaKey && e.altKey && ["i", "j", "c"].includes(letter(e)))
    return { kind: "devtools", combo: `Cmd+Opt+${letter(e).toUpperCase()}` };
  if (mod && !e.shiftKey && !e.altKey) {
    const l = letter(e);
    if (l === "s") return { kind: "save", combo: `${e.metaKey ? "Cmd" : "Ctrl"}+S` };
    if (l === "p") return { kind: "print", combo: `${e.metaKey ? "Cmd" : "Ctrl"}+P` };
    if (l === "u") return { kind: "source", combo: `${e.metaKey ? "Cmd" : "Ctrl"}+U` };
  }
  return null;
}

/** Honest copy, shown in the dialog and mirrored in the admin help text. */
export const guardCopy = {
  title: "Please don't capture these photographs",
  body: "Screenshots and saving are discouraged to protect the photographer's work. If you'd like to use an image, please get in touch for a licence.",
  note: "This is a courtesy reminder, not a lock: it can't detect every way of capturing a screen.",
  action: "OK, I understand",
} as const;
