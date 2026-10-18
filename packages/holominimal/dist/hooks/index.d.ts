import { type RefObject, useEffect } from "react";
/** `useLayoutEffect` in the browser, `useEffect` on the server (no warning during server rendering). */
export declare const useIsomorphicLayoutEffect: typeof useEffect;
/** Fixed breakpoints (min-width, px). They match the library's responsive CSS: phone below `sm`, sidebar strip below `md`. */
export declare const breakpoints: {
    readonly sm: 640;
    readonly md: 860;
    readonly lg: 1100;
    readonly xl: 1400;
};
export type Breakpoint = keyof typeof breakpoints;
/**
 * Whether a media query matches. `false` on the server and during hydration, then the live value, so server and client
 * markup agree.
 */
export declare function useMediaQuery(query: string): boolean;
/** Whether the viewport is at least a breakpoint wide: `useBreakpoint("md")`. */
export declare function useBreakpoint(name: Breakpoint): boolean;
/** The OS reduced-motion preference. Components that animate in JS should skip or shorten motion when it is `true`. */
export declare function useReducedMotion(): boolean;
/** A mouse or trackpad (hover-capable, precise pointer). */
export declare function useFinePointer(): boolean;
/** Calls `handler` for a pointer press outside `ref` (and any `also` refs, such as a trigger). */
export declare function useClickOutside(ref: RefObject<Element | null>, handler: (event: PointerEvent) => void, options?: {
    enabled?: boolean;
    also?: RefObject<Element | null>[];
}): void;
/**
 * State that is controlled when `value` is passed and uncontrolled otherwise: the pattern behind every input here.
 * Returns the current value and a setter that calls `onChange` and updates internal state when uncontrolled.
 */
export declare function useControllableState<T>({ value, defaultValue, onChange, }: {
    value?: T;
    defaultValue: T;
    onChange?: (value: T) => void;
}): [T, (next: T | ((prev: T) => T)) => void];
/** A value that follows `value` after it has stopped changing for `delay` ms. */
export declare function useDebounce<T>(value: T, delay?: number): T;
/** A stable function that runs `callback` once calls have paused for `delay` ms. Has `cancel` and `flush`. */
export declare function useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delay?: number): ((...args: A) => void) & {
    cancel: () => void;
    flush: () => void;
};
/**
 * Runs `handler` for a key combination such as `"mod+k"` (mod is Cmd on Apple platforms, Ctrl elsewhere), `"shift+/"`
 * or `"escape"`. Single chords only. Ignored while typing in a field unless `allowInInput`.
 */
export declare function useKeyboardShortcut(combo: string, handler: (event: KeyboardEvent) => void, options?: {
    enabled?: boolean;
    allowInInput?: boolean;
    preventDefault?: boolean;
}): void;
/** Adds a listener to `window` (default), `document` or an element ref, and removes it on cleanup. */
export declare function useEventListener<K extends keyof WindowEventMap>(type: K, handler: (event: WindowEventMap[K]) => void, target?: undefined): void;
export declare function useEventListener<K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void, target: RefObject<HTMLElement | null>): void;
/** A boolean with `on`, `off` and `toggle`. */
export declare function useToggle(initial?: boolean): [boolean, {
    on: () => void;
    off: () => void;
    toggle: () => void;
}];
/** The value from the previous render. */
export declare function usePrevious<T>(value: T): T | undefined;
/** Copies text to the clipboard. `copied` is true for `resetAfter` ms afterwards. */
export declare function useCopyToClipboard(resetAfter?: number): {
    copy: (text: string) => Promise<boolean>;
    copied: boolean;
};
/** Whether the pointer is over `ref`. */
export declare function useHover(ref: RefObject<Element | null>): boolean;
/** Whether `ref` is (at least `threshold` of it) in the viewport. With `once`, stays true after the first time. */
export declare function useInView(ref: RefObject<Element | null>, options?: {
    threshold?: number;
    once?: boolean;
}): boolean;
/** Keeps a value in `localStorage` (when available) and in state. Falls back to plain state if storage throws. */
export declare function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void];
