import { type RefObject } from "react";
import { type FloatingOptions } from "./floating";
/** Positions `content` against `anchor` while `open`. The content element must render only while open. */
export declare function useFloating(open: boolean, anchor: RefObject<Element | null>, content: RefObject<HTMLElement | null>, { side, align, offset, padding }?: FloatingOptions): void;
/**
 * Light dismissal for non-modal overlays: Escape and a pointer press outside both the content and the anchor.
 * `onEscape` runs only for Escape so the caller can return focus to the trigger.
 */
export declare function useDismiss(open: boolean, anchor: RefObject<Element | null>, content: RefObject<Element | null>, onDismiss: () => void, onEscape?: () => void): void;
/**
 * Keeps an element mounted while it plays its exit animation. `present` is whether to render it; `state` is the
 * `data-state` to put on it (`open` or `closed`), which the CSS keys its enter and exit animations on. `exitMs` must be
 * at least the exit animation's length.
 */
export declare function usePresence(open: boolean, exitMs?: number): {
    present: boolean;
    state: "open" | "closed";
};
