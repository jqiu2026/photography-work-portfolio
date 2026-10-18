"use client";
import { attachFloating } from "./floating.js";
import { useEffect, useLayoutEffect, useState } from "react";
//#region src/interaction/use-floating.ts
/** Positions `content` against `anchor` while `open`. The content element must render only while open. */
function useFloating(open, anchor, content, { side, align, offset, padding } = {}) {
	useLayoutEffect(() => {
		if (!open || !anchor.current || !content.current) return;
		return attachFloating(anchor.current, content.current, {
			side,
			align,
			offset,
			padding
		});
	}, [
		open,
		anchor,
		content,
		side,
		align,
		offset,
		padding
	]);
}
/**
* Light dismissal for non-modal overlays: Escape and a pointer press outside both the content and the anchor.
* `onEscape` runs only for Escape so the caller can return focus to the trigger.
*/
function useDismiss(open, anchor, content, onDismiss, onEscape) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			onDismiss();
			onEscape?.();
		};
		const onPress = (e) => {
			const t = e.target;
			if (content.current?.contains(t) || anchor.current?.contains(t)) return;
			onDismiss();
		};
		document.addEventListener("keydown", onKey);
		document.addEventListener("pointerdown", onPress);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("pointerdown", onPress);
		};
	}, [
		open,
		anchor,
		content,
		onDismiss,
		onEscape
	]);
}
/**
* Keeps an element mounted while it plays its exit animation. `present` is whether to render it; `state` is the
* `data-state` to put on it (`open` or `closed`), which the CSS keys its enter and exit animations on. `exitMs` must be
* at least the exit animation's length.
*/
function usePresence(open, exitMs = 200) {
	const [mounted, setMounted] = useState(open);
	useLayoutEffect(() => {
		if (open) setMounted(true);
	}, [open]);
	useEffect(() => {
		if (open || !mounted) return;
		const t = setTimeout(() => setMounted(false), exitMs);
		return () => clearTimeout(t);
	}, [
		open,
		mounted,
		exitMs
	]);
	return {
		present: open || mounted,
		state: open ? "open" : "closed"
	};
}
//#endregion
export { useDismiss, useFloating, usePresence };

//# sourceMappingURL=use-floating.js.map