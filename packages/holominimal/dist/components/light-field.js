"use client";
import { useLightField, useReveal } from "../interaction/hooks.js";
import { jsx } from "react/jsx-runtime";
import { useRef } from "react";
//#region src/components/light-field.tsx
/**
* Feeds pointer position to every lit or holo surface inside it (and to an Atmosphere). One listener for the whole
* region; children stay server components.
*/
function LightField({ selector, tilt, track, ease, ref, ...rest }) {
	const own = useRef(null);
	useLightField(own, {
		selector,
		tilt,
		track,
		ease
	});
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref: mergeInto(own, ref)
	});
}
/**
* Reveals `[data-hm-reveal]` descendants (and itself, if marked) as they scroll into view. Stagger siblings with
* `style={{ "--hm-i": n }}`.
*/
function Reveal({ selector, rootMargin, once, ref, ...rest }) {
	const own = useRef(null);
	useReveal(own, {
		selector,
		rootMargin,
		once
	});
	return /* @__PURE__ */ jsx("div", {
		...rest,
		ref: mergeInto(own, ref)
	});
}
function mergeInto(own, ref) {
	return (node) => {
		own.current = node;
		if (typeof ref === "function") return ref(node);
		if (ref) ref.current = node;
	};
}
//#endregion
export { LightField, Reveal };

//# sourceMappingURL=light-field.js.map