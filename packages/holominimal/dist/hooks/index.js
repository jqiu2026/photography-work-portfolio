"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
//#region src/hooks/index.ts
/** `useLayoutEffect` in the browser, `useEffect` on the server (no warning during server rendering). */
var useIsomorphicLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;
/** Fixed breakpoints (min-width, px). They match the library's responsive CSS: phone below `sm`, sidebar strip below `md`. */
var breakpoints = {
	sm: 640,
	md: 860,
	lg: 1100,
	xl: 1400
};
/**
* Whether a media query matches. `false` on the server and during hydration, then the live value, so server and client
* markup agree.
*/
function useMediaQuery(query) {
	const subscribe = useCallback((notify) => {
		if (typeof matchMedia !== "function") return () => {};
		const list = matchMedia(query);
		list.addEventListener("change", notify);
		return () => list.removeEventListener("change", notify);
	}, [query]);
	return useSyncExternalStore(subscribe, () => typeof matchMedia === "function" ? matchMedia(query).matches : false, () => false);
}
/** Whether the viewport is at least a breakpoint wide: `useBreakpoint("md")`. */
function useBreakpoint(name) {
	return useMediaQuery(`(min-width: ${breakpoints[name]}px)`);
}
/** The OS reduced-motion preference. Components that animate in JS should skip or shorten motion when it is `true`. */
function useReducedMotion() {
	return useMediaQuery("(prefers-reduced-motion: reduce)");
}
/** A mouse or trackpad (hover-capable, precise pointer). */
function useFinePointer() {
	return useMediaQuery("(hover: hover) and (pointer: fine)");
}
/** Calls `handler` for a pointer press outside `ref` (and any `also` refs, such as a trigger). */
function useClickOutside(ref, handler, options = {}) {
	const latest = useRef(handler);
	latest.current = handler;
	const { enabled = true, also } = options;
	useEffect(() => {
		if (!enabled) return;
		const onDown = (event) => {
			const target = event.target;
			if (!target) return;
			if (ref.current?.contains(target)) return;
			if (also?.some((r) => r.current?.contains(target))) return;
			latest.current(event);
		};
		document.addEventListener("pointerdown", onDown);
		return () => document.removeEventListener("pointerdown", onDown);
	}, [
		ref,
		enabled,
		also
	]);
}
/**
* State that is controlled when `value` is passed and uncontrolled otherwise: the pattern behind every input here.
* Returns the current value and a setter that calls `onChange` and updates internal state when uncontrolled.
*/
function useControllableState({ value, defaultValue, onChange }) {
	const [inner, setInner] = useState(defaultValue);
	const controlled = value !== void 0;
	const current = controlled ? value : inner;
	const currentRef = useRef(current);
	currentRef.current = current;
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	return [current, useCallback((next) => {
		const resolved = typeof next === "function" ? next(currentRef.current) : next;
		if (Object.is(resolved, currentRef.current)) return;
		if (!controlled) setInner(resolved);
		onChangeRef.current?.(resolved);
	}, [controlled])];
}
/** A value that follows `value` after it has stopped changing for `delay` ms. */
function useDebounce(value, delay = 250) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}
/** A stable function that runs `callback` once calls have paused for `delay` ms. Has `cancel` and `flush`. */
function useDebouncedCallback(callback, delay = 250) {
	const latest = useRef(callback);
	latest.current = callback;
	const timer = useRef(void 0);
	const pending = useRef(void 0);
	const cancel = useCallback(() => {
		clearTimeout(timer.current);
		pending.current = void 0;
	}, []);
	const fn = useCallback((...args) => {
		pending.current = args;
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			const a = pending.current;
			pending.current = void 0;
			if (a) latest.current(...a);
		}, delay);
	}, [delay]);
	const flush = useCallback(() => {
		clearTimeout(timer.current);
		const a = pending.current;
		pending.current = void 0;
		if (a) latest.current(...a);
	}, []);
	useEffect(() => cancel, [cancel]);
	return Object.assign(fn, {
		cancel,
		flush
	});
}
/**
* Runs `handler` for a key combination such as `"mod+k"` (mod is Cmd on Apple platforms, Ctrl elsewhere), `"shift+/"`
* or `"escape"`. Single chords only. Ignored while typing in a field unless `allowInInput`.
*/
function useKeyboardShortcut(combo, handler, options = {}) {
	const latest = useRef(handler);
	latest.current = handler;
	const { enabled = true, allowInInput = false, preventDefault = true } = options;
	useEffect(() => {
		if (!enabled) return;
		const parts = combo.toLowerCase().split("+").map((p) => p.trim());
		const key = parts[parts.length - 1] ?? "";
		const want = new Set(parts.slice(0, -1));
		const apple = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent);
		const codes = {
			"/": "Slash",
			".": "Period",
			",": "Comma",
			";": "Semicolon",
			"'": "Quote",
			"[": "BracketLeft",
			"]": "BracketRight",
			"-": "Minus",
			"=": "Equal",
			"`": "Backquote",
			"\\": "Backslash"
		};
		const symbol = key.length === 1 && !/[a-z0-9]/.test(key);
		const onKey = (event) => {
			const typed = event.key.toLowerCase() === key;
			const physical = symbol && codes[key] !== void 0 && event.code === codes[key];
			if (!typed && !physical) return;
			const mod = want.has("mod") ? apple ? event.metaKey : event.ctrlKey : false;
			if (want.has("mod") !== mod) return;
			if (want.has("ctrl") !== event.ctrlKey && !want.has("mod")) return;
			if (want.has("meta") !== event.metaKey && !want.has("mod")) return;
			if (want.has("alt") !== event.altKey) return;
			if (!symbol && want.has("shift") !== event.shiftKey) return;
			if (symbol && want.has("shift") && !event.shiftKey) return;
			if (!allowInInput) {
				const t = event.target;
				if (t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName))) return;
			}
			if (preventDefault) event.preventDefault();
			latest.current(event);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [
		combo,
		enabled,
		allowInInput,
		preventDefault
	]);
}
function useEventListener(type, handler, target) {
	const latest = useRef(handler);
	latest.current = handler;
	useEffect(() => {
		const el = target ? target.current : window;
		if (!el) return;
		const fn = (e) => latest.current(e);
		el.addEventListener(type, fn);
		return () => el.removeEventListener(type, fn);
	}, [type, target]);
}
/** A boolean with `on`, `off` and `toggle`. */
function useToggle(initial = false) {
	const [value, setValue] = useState(initial);
	return [value, useRef({
		on: () => setValue(true),
		off: () => setValue(false),
		toggle: () => setValue((v) => !v)
	}).current];
}
/** The value from the previous render. */
function usePrevious(value) {
	const ref = useRef(void 0);
	useEffect(() => {
		ref.current = value;
	}, [value]);
	return ref.current;
}
/** Copies text to the clipboard. `copied` is true for `resetAfter` ms afterwards. */
function useCopyToClipboard(resetAfter = 1600) {
	const [copied, setCopied] = useState(false);
	const timer = useRef(void 0);
	useEffect(() => () => clearTimeout(timer.current), []);
	return {
		copy: useCallback(async (text) => {
			try {
				await navigator.clipboard.writeText(text);
			} catch {
				return false;
			}
			setCopied(true);
			clearTimeout(timer.current);
			timer.current = setTimeout(() => setCopied(false), resetAfter);
			return true;
		}, [resetAfter]),
		copied
	};
}
/** Whether the pointer is over `ref`. */
function useHover(ref) {
	const [hovered, setHovered] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const on = () => setHovered(true);
		const off = () => setHovered(false);
		el.addEventListener("pointerenter", on);
		el.addEventListener("pointerleave", off);
		return () => {
			el.removeEventListener("pointerenter", on);
			el.removeEventListener("pointerleave", off);
		};
	}, [ref]);
	return hovered;
}
/** Whether `ref` is (at least `threshold` of it) in the viewport. With `once`, stays true after the first time. */
function useInView(ref, options = {}) {
	const { threshold = .15, once = false } = options;
	const [inView, setInView] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el || typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(([entry]) => {
			if (!entry) return;
			if (entry.isIntersecting) {
				setInView(true);
				if (once) io.disconnect();
			} else if (!once) setInView(false);
		}, { threshold });
		io.observe(el);
		return () => io.disconnect();
	}, [
		ref,
		threshold,
		once
	]);
	return inView;
}
/** Keeps a value in `localStorage` (when available) and in state. Falls back to plain state if storage throws. */
function useLocalStorage(key, initial) {
	const [value, setValue] = useState(initial);
	useEffect(() => {
		try {
			const raw = localStorage.getItem(key);
			if (raw !== null) setValue(JSON.parse(raw));
		} catch {}
	}, [key]);
	return [value, useCallback((next) => {
		setValue(next);
		try {
			localStorage.setItem(key, JSON.stringify(next));
		} catch {}
	}, [key])];
}
//#endregion
export { breakpoints, useBreakpoint, useClickOutside, useControllableState, useCopyToClipboard, useDebounce, useDebouncedCallback, useEventListener, useFinePointer, useHover, useInView, useIsomorphicLayoutEffect, useKeyboardShortcut, useLocalStorage, useMediaQuery, usePrevious, useReducedMotion, useToggle };

//# sourceMappingURL=index.js.map