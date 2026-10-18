"use client";
import { cx } from "../utils/cx.js";
import { createCursor } from "../interaction/cursor.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
//#region src/components/cursor.tsx
/**
* A custom cursor. It follows the pointer with an exponential ease (so it glides), changes with what is under it
* (links, text fields, `data-hm-cursor` attributes), and can take any shape: a dot and a trailing ring, a crosshair,
* or your own icon. Options add a magnetic pull and a ring that morphs to the shape of the button under it, squash and
* an icon that turns to face where it is going, a spotlight, a trail and press ripples. It lives in
* the top layer, above dialogs, hides the system cursor, and only runs for a mouse or pen: touch screens keep their
* normal behavior. Decorative (hidden from assistive technology). Use `CursorArea` to keep it inside one region.
*/
function Cursor({ shape = "dot", icon, icons, size = 8, ringSize = 38, color, blend = "normal", spotlight = false, trail = 0, scope, className, smoothing, ringSmoothing, magnetic, morph, rotate, iconPoints, iconAnchors, trailWidth, hideNative, ripple, rippleSize, onStateChange }) {
	const root = useRef(null);
	const change = useRef(onStateChange);
	change.current = onStateChange;
	useEffect(() => {
		const el = root.current;
		if (!el) return;
		let top = false;
		try {
			el.showPopover();
			top = true;
		} catch {
			el.removeAttribute("popover");
		}
		const handle = createCursor(el, {
			scope: scope?.current ?? null,
			smoothing,
			ringSmoothing,
			magnetic,
			morph,
			rotate,
			iconPoints,
			hideNative,
			ripple,
			rippleSize,
			onStateChange: (s) => change.current?.(s)
		});
		return () => {
			handle.destroy();
			if (top) try {
				el.hidePopover();
			} catch {}
		};
	}, [
		scope,
		shape,
		Boolean(spotlight),
		smoothing,
		ringSmoothing,
		magnetic,
		morph,
		rotate,
		iconPoints,
		hideNative,
		ripple,
		rippleSize,
		trail
	]);
	const style = {
		"--hm-cursor-dot": `${size}px`,
		"--hm-cursor-ring": `${ringSize}px`,
		"--hm-cursor-spot": typeof spotlight === "number" ? `${spotlight}px` : void 0,
		"--hm-cursor-color": color
	};
	const showDot = shape === "dot" || shape === "dot-ring" || shape === "crosshair";
	const showRing = shape === "ring" || shape === "dot-ring";
	return /* @__PURE__ */ jsxs("div", {
		ref: root,
		popover: "manual",
		"aria-hidden": "true",
		className: cx("hm-cursor", className),
		"data-shape": shape,
		"data-blend": blend === "difference" ? "difference" : void 0,
		style,
		children: [
			spotlight ? /* @__PURE__ */ jsx("span", { "data-part": "spot" }) : null,
			trail > 0 ? /* @__PURE__ */ jsx("svg", {
				"data-part": "trail",
				"data-ms": 60 + Math.min(8, trail) * 50,
				"data-w": trailWidth ?? defaultTrailWidth(shape, size, ringSize),
				"aria-hidden": "true",
				focusable: "false",
				children: /* @__PURE__ */ jsx("path", {})
			}) : null,
			showRing ? /* @__PURE__ */ jsx("span", {
				"data-part": "ring",
				children: /* @__PURE__ */ jsx("span", { "data-part": "label" })
			}) : null,
			showDot ? /* @__PURE__ */ jsx("span", { "data-part": "dot" }) : null,
			shape === "icon" ? /* @__PURE__ */ jsxs("span", {
				"data-part": "icon",
				children: [
					/* @__PURE__ */ jsx("span", {
						"data-for": "default",
						style: anchor(iconAnchors?.default),
						children: icon
					}),
					icons?.link ? /* @__PURE__ */ jsx("span", {
						"data-for": "link",
						style: anchor(iconAnchors?.link ?? iconAnchors?.default),
						children: icons.link
					}) : null,
					icons?.text ? /* @__PURE__ */ jsx("span", {
						"data-for": "text",
						style: anchor(iconAnchors?.text ?? iconAnchors?.default),
						children: icons.text
					}) : null,
					/* @__PURE__ */ jsx("span", { "data-part": "label" })
				]
			}) : null
		]
	});
}
/** The cursor's own width: a dot is as wide as the dot, a crosshair or ring is a thin line, an icon a medium stroke. */
function defaultTrailWidth(shape, size, ringSize) {
	if (shape === "crosshair") return 2;
	if (shape === "ring") return Math.max(2, Math.round(ringSize * .1));
	if (shape === "icon") return 5;
	return size;
}
var anchor = (a) => a ? {
	"--ax": a[0],
	"--ay": a[1]
} : void 0;
/** A region with its own cursor: the custom cursor shows (and the system cursor hides) only inside it. */
function CursorArea({ children, className, shape, icon, icons, size, ringSize, color, blend, spotlight, trail, smoothing, ringSmoothing, magnetic, morph, rotate, iconPoints, iconAnchors, trailWidth, hideNative, ripple, rippleSize, onStateChange, ...rest }) {
	const area = useRef(null);
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		ref: area,
		className: cx("hm-cursor-area", className),
		children: [/* @__PURE__ */ jsx(Cursor, {
			scope: area,
			shape,
			icon,
			icons,
			size,
			ringSize,
			color,
			blend,
			spotlight,
			trail,
			smoothing,
			ringSmoothing,
			magnetic,
			morph,
			rotate,
			iconPoints,
			iconAnchors,
			trailWidth,
			hideNative,
			ripple,
			rippleSize,
			onStateChange
		}), children]
	});
}
//#endregion
export { Cursor, CursorArea };

//# sourceMappingURL=cursor.js.map